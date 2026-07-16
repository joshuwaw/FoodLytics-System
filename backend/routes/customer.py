from fastapi import APIRouter, HTTPException, BackgroundTasks
from database import supabase
from models import FeedbackCreate, PremiseResponse
from services.sentiment import analyse_sentiment
import datetime
import asyncio

router = APIRouter()


@router.get("/premises/{premise_id}", response_model=PremiseResponse)
def get_premise_details(premise_id: int):
    try:
        res = supabase.table("tbl_premis") \
            .select("id_premis, nama_premis, alamat_premis, pautan_gmaps, kod_perniagaan") \
            .eq("id_premis", premise_id) \
            .execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Premise not found")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


def process_feedback_pipeline(id_maklum_balas: int, ulasan_teks: str, bilangan_bintang: int, makanan: int, layanan: int, suasana: int):
    """
    Background task to log AI processing and run sentiment analysis.
    """
    try:
        # ── Step 2: Log the AI processing run → tbl_enjin_ai ─────────────
        enjin_data = {
            "id_maklum_balas": id_maklum_balas,
            "waktu_proses": datetime.datetime.now().isoformat(),
        }
        enjin_res = supabase.table("tbl_enjin_ai").insert(enjin_data).execute()
        if not enjin_res.data:
            print(f"[Background] Failed to log AI run for feedback {id_maklum_balas}")
            return

        id_log_proses = enjin_res.data[0]["id_log_proses"]

        # ── Step 3: Run sentiment analysis → tbl_sentimen ────────────────
        sentiment_result = analyse_sentiment(
            ulasan_teks=ulasan_teks,
            bilangan_bintang=bilangan_bintang,
            makanan=makanan,
            layanan=layanan,
            suasana=suasana,
        )

        sentimen_data = {
            "id_log_proses": id_log_proses,
            "id_maklum_balas": id_maklum_balas,
            "label_sentimen": sentiment_result["sentimen"],
            "skor_ketepatan": sentiment_result["skor"],
        }
        supabase.table("tbl_sentimen").insert(sentimen_data).execute()
        print(f"[Background] Sentiment processed for feedback {id_maklum_balas}: {sentiment_result['sentimen']}")

    except Exception as e:
        print(f"[Background] Error in pipeline for feedback {id_maklum_balas}: {e}")


@router.post("/feedback", status_code=201)
def submit_feedback(feedback: FeedbackCreate, background_tasks: BackgroundTasks):
    try:
        # ── Step 1: Save raw feedback → tbl_maklumbalas ───────────────────
        feedback_data = feedback.model_dump()
        feedback_data["tarikh_terima"] = datetime.datetime.now().isoformat()

        feedback_res = supabase.table("tbl_maklumbalas").insert(feedback_data).execute()
        if not feedback_res.data:
            raise HTTPException(status_code=400, detail="Failed to submit feedback")

        id_maklum_balas = feedback_res.data[0]["id_maklum_balas"]

        # ── Step 2/3: Trigger background processing ───────────────────────
        background_tasks.add_task(
            process_feedback_pipeline, 
            id_maklum_balas, 
            feedback.ulasan_teks, 
            feedback.bilangan_bintang,
            feedback.rating_makanan,
            feedback.rating_layanan,
            feedback.rating_suasana
        )

        return {
            "message": "Feedback submitted successfully. Analysis in progress.",
            "id_maklum_balas": id_maklum_balas
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.get("/sentiment-stats/{premise_id}")
def get_sentiment_stats(premise_id: int, sumber: str = None):
    """
    Returns live sentiment breakdown for the Pengurus dashboard donut chart.
    Joins: tbl_maklumbalas → tbl_enjin_ai → tbl_sentimen
    """
    try:
        # Base query
        query = supabase.table("tbl_maklumbalas").select("id_maklum_balas, bilangan_bintang, rating_makanan, rating_layanan, rating_suasana").eq("id_premis", premise_id)
        
        # Apply source filter if provided
        if sumber:
            query = query.eq("sumber_platform", sumber)
            
        feedback_res = query.execute()

        records = feedback_res.data or []
        total = len(records)

        if total == 0:
            return {
                "total": 0,
                "sentimen": [
                    {"name": "Positif",  "value": 0},
                    {"name": "Neutral",  "value": 0},
                    {"name": "Negatif",  "value": 0},
                ],
                "purata_bintang": 0,
            }

        # Get all sentiment labels for those feedback IDs directly
        counts = {"Positif": 0, "Neutral": 0, "Negatif": 0}
        feedback_ids = [r["id_maklum_balas"] for r in records]
        
        if feedback_ids:
            sentimen_res = supabase.table("tbl_sentimen") \
                .select("label_sentimen") \
                .in_("id_maklum_balas", feedback_ids) \
                .execute()

            for s in (sentimen_res.data or []):
                label = s.get("label_sentimen", "Neutral")
                if label in counts:
                    counts[label] += 1
                else:
                    counts["Neutral"] += 1

        labelled_total = sum(counts.values())
        denom = labelled_total if labelled_total > 0 else 1

        valid_stars = [r.get("bilangan_bintang") for r in records if r.get("bilangan_bintang") is not None]
        total_stars = sum(valid_stars)
        count_stars = len(valid_stars)
        
        def calculate_avg(key):
            vals = [r.get(key) for r in records if r.get(key) is not None]
            return sum(vals) / len(vals) if vals else 0

        avg_makanan = calculate_avg("rating_makanan")
        avg_layanan = calculate_avg("rating_layanan")
        avg_suasana = calculate_avg("rating_suasana")

        # Calculate month-over-month growth %
        # We need tarikh_terima for this, so fetch it
        date_res = supabase.table("tbl_maklumbalas") \
            .select("tarikh_terima") \
            .eq("id_premis", premise_id) \
            .execute()
        date_records = date_res.data or []
        
        now = datetime.datetime.now()
        thirty_days_ago = now - datetime.timedelta(days=30)
        sixty_days_ago = now - datetime.timedelta(days=60)
        
        current_period = 0
        previous_period = 0
        for dr in date_records:
            try:
                dt = datetime.datetime.fromisoformat(dr["tarikh_terima"])
                dt_naive = dt.replace(tzinfo=None)
                if dt_naive >= thirty_days_ago.replace(tzinfo=None):
                    current_period += 1
                elif dt_naive >= sixty_days_ago.replace(tzinfo=None):
                    previous_period += 1
            except Exception:
                pass
        
        if previous_period > 0:
            pertumbuhan = round(((current_period - previous_period) / previous_period) * 100, 1)
        elif current_period > 0:
            pertumbuhan = 100.0  # All new data, 100% growth
        else:
            pertumbuhan = 0.0

        return {
            "total": total,
            "sentimen": [
                {"name": "Positif",  "value": round(counts["Positif"]  / denom * 100, 1)},
                {"name": "Neutral",  "value": round(counts["Neutral"]  / denom * 100, 1)},
                {"name": "Negatif",  "value": round(counts["Negatif"]  / denom * 100, 1)},
            ],
            "purata_bintang": round(total_stars / count_stars, 1) if count_stars > 0 else 0.0,
            "pecahan_rating": {
                "makanan": round(avg_makanan, 1),
                "layanan": round(avg_layanan, 1),
                "suasana": round(avg_suasana, 1),
            },
            "pertumbuhan": pertumbuhan,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/recent-feedback/{premise_id}")
def get_recent_feedback(premise_id: int, limit: int = 5, sumber: str = None):
    """
    Returns recent feedback for a premise, including the sentiment label.
    """
    try:
        # Get recent feedback
        query = supabase.table("tbl_maklumbalas") \
            .select("id_maklum_balas, ulasan_teks, bilangan_bintang, rating_makanan, rating_layanan, rating_suasana, tarikh_terima, sumber_platform") \
            .eq("id_premis", premise_id)
            
        if sumber:
            query = query.eq("sumber_platform", sumber)
            
        feedback_res = query.order("tarikh_terima", desc=True).limit(limit).execute()
            
        records = feedback_res.data or []
        
        if not records:
            return []
            
        # Get sentiments for these feedbacks
        feedback_ids = [r["id_maklum_balas"] for r in records]
        sentimen_res = supabase.table("tbl_sentimen") \
            .select("id_maklum_balas, label_sentimen, skor_ketepatan") \
            .in_("id_maklum_balas", feedback_ids) \
            .execute()
            
        sentimen_map = {s["id_maklum_balas"]: s for s in (sentimen_res.data or [])}
        
        # Combine
        for r in records:
            s = sentimen_map.get(r["id_maklum_balas"])
            r["sentimen"] = s["label_sentimen"] if s else "Processing..."
            r["skor_sentimen"] = s["skor_ketepatan"] if s else 0.0
            
        return records
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/weekly-stats/{premise_id}")
def get_weekly_stats(premise_id: int, range_type: str = "7d"):
    """
    Returns aggregated volume and sentiment scores over different ranges:
    - 7d (7 days, daily)
    - 30d (30 days, daily)
    - 90d (90 days, weekly)
    """
    try:
        # Determine number of days based on range_type
        days_limit = 7
        if range_type == "30d":
            days_limit = 30
        elif range_type == "90d":
            days_limit = 90
            
        start_date = (datetime.datetime.now() - datetime.timedelta(days=days_limit)).isoformat()
        
        # Get feedback from range
        feedback_res = supabase.table("tbl_maklumbalas") \
            .select("id_maklum_balas, tarikh_terima") \
            .eq("id_premis", premise_id) \
            .gte("tarikh_terima", start_date) \
            .execute()
            
        records = feedback_res.data or []
        
        # Initialize buckets
        today = datetime.datetime.now()
        buckets = []
        
        if range_type in ["7d", "30d"]:
            days_map = {0: "Isnin", 1: "Selasa", 2: "Rabu", 3: "Khamis", 4: "Jumaat", 5: "Sabtu", 6: "Ahad"}
            for i in range(days_limit - 1, -1, -1):
                d = today - datetime.timedelta(days=i)
                if range_type == "7d":
                    label = days_map[d.weekday()]
                else:
                    # e.g., "12 Jul"
                    label = d.strftime("%d %b")
                    
                buckets.append({
                    "label": label,
                    "date_str": d.strftime("%Y-%m-%d"),
                    "volume": 0,
                    "sentiment_scores": []
                })
        else: # 90d (group into 13 weeks)
            # We construct 13 weekly buckets ending today
            for w in range(12, -1, -1):
                w_end = today - datetime.timedelta(weeks=w)
                w_start = w_end - datetime.timedelta(days=6)
                label = f"{w_start.strftime('%d %b')} - {w_end.strftime('%d %b')}"
                buckets.append({
                    "label": label,
                    "start_date": w_start.date(),
                    "end_date": w_end.date(),
                    "volume": 0,
                    "sentiment_scores": []
                })
                
        if not records:
            return [{"hari": b["label"], "volume": 0, "sentimen": 50} for b in buckets]
            
        # Get sentiments
        feedback_ids = [r["id_maklum_balas"] for r in records]
        sentimen_res = supabase.table("tbl_sentimen") \
            .select("id_maklum_balas, label_sentimen") \
            .in_("id_maklum_balas", feedback_ids) \
            .execute()
            
        sentimen_map = {s["id_maklum_balas"]: s["label_sentimen"] for s in (sentimen_res.data or [])}
        score_val = {"Positif": 100, "Neutral": 50, "Negatif": 0}
        
        # Aggregate records into buckets
        for r in records:
            try:
                date_obj = datetime.datetime.fromisoformat(r["tarikh_terima"])
                date_str = date_obj.strftime("%Y-%m-%d")
                date_only = date_obj.date()
                
                label = sentimen_map.get(r["id_maklum_balas"], "Neutral")
                score = score_val.get(label, 50)
                
                for b in buckets:
                    if range_type in ["7d", "30d"]:
                        if b["date_str"] == date_str:
                            b["volume"] += 1
                            b["sentiment_scores"].append(score)
                            break
                    else: # 90d
                        if b["start_date"] <= date_only <= b["end_date"]:
                            b["volume"] += 1
                            b["sentiment_scores"].append(score)
                            break
            except:
                pass
                
        # Format output
        result = []
        for b in buckets:
            avg_sent = 50
            if b["sentiment_scores"]:
                avg_sent = sum(b["sentiment_scores"]) / len(b["sentiment_scores"])
            
            result.append({
                "hari": b["label"],
                "volume": b["volume"],
                "sentimen": round(avg_sent)
            })
            
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/feedback-by-source/{premise_id}")
def get_feedback_by_source(premise_id: int):
    """
    Returns breakdown of feedback volume by platform source.
    Useful for the Tremor BarChart.
    """
    try:
        feedback_res = supabase.table("tbl_maklumbalas") \
            .select("sumber_platform") \
            .eq("id_premis", premise_id) \
            .execute()
            
        records = feedback_res.data or []
        
        # Group by platform
        counts = {}
        for r in records:
            src = r.get("sumber_platform") or "Portal QR"
            counts[src] = counts.get(src, 0) + 1
            
        # Format for Tremor BarChart
        result = []
        for src, count in counts.items():
            result.append({
                "sumber": src,
                "jumlah": count
            })
            
        # Sort by volume desc
        result.sort(key=lambda x: x["jumlah"], reverse=True)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/trend-data/{premise_id}")
def get_trend_data(premise_id: int, group_by: str = "weeks", year: int = None, month: int = None):
    """
    Returns platform-specific feedback trends aggregated by weeks or months.
    """
    try:
        now = datetime.datetime.now()
        target_year = year if year else now.year
        target_month = month if month else now.month
        
        if group_by == "months":
            # Fetch for the entire target year
            start_date = f"{target_year}-01-01T00:00:00"
            end_date = f"{target_year}-12-31T23:59:59"
        else: # weeks of a specific month
            import calendar
            last_day = calendar.monthrange(target_year, target_month)[1]
            start_date = f"{target_year}-{target_month:02d}-01T00:00:00"
            end_date = f"{target_year}-{target_month:02d}-{last_day:02d}T23:59:59"
            
        feedback_res = supabase.table("tbl_maklumbalas") \
            .select("id_maklum_balas, tarikh_terima, sumber_platform") \
            .eq("id_premis", premise_id) \
            .gte("tarikh_terima", start_date) \
            .lte("tarikh_terima", end_date) \
            .execute()
                
        records = feedback_res.data or []
        
        if group_by == "months":
            # Construct 12 monthly buckets for target year
            month_names = {
                1: "Jan", 2: "Feb", 3: "Mac", 4: "Apr", 5: "Mei", 6: "Jun",
                7: "Jul", 8: "Ogos", 9: "Sep", 10: "Okt", 11: "Nov", 12: "Dis"
            }
            
            buckets = []
            for m in range(1, 13):
                buckets.append({
                    "label": f"{month_names[m]} {target_year}",
                    "month": m,
                    "year": target_year
                })
                
            chart_data = {b["label"]: {"Minggu": b["label"]} for b in buckets}
            
            for r in records:
                try:
                    date_obj = datetime.datetime.fromisoformat(r["tarikh_terima"])
                    src = r.get("sumber_platform") or "Portal QR"
                    
                    for b in buckets:
                        if date_obj.month == b["month"] and date_obj.year == b["year"]:
                            m_label = b["label"]
                            if src not in chart_data[m_label]:
                                chart_data[m_label][src] = 0
                            chart_data[m_label][src] += 1
                            break
                except:
                    pass
            return list(chart_data.values())
            
        else: # weeks of a specific month
            import calendar
            last_day = calendar.monthrange(target_year, target_month)[1]
            buckets = [
                {"label": "Minggu 1", "start": 1, "end": 7},
                {"label": "Minggu 2", "start": 8, "end": 14},
                {"label": "Minggu 3", "start": 15, "end": 21},
                {"label": "Minggu 4", "start": 22, "end": 28}
            ]
            if last_day > 28:
                buckets.append({"label": "Minggu 5", "start": 29, "end": last_day})
                
            chart_data = {b["label"]: {"Minggu": b["label"]} for b in buckets}
            for r in records:
                try:
                    date_obj = datetime.datetime.fromisoformat(r["tarikh_terima"])
                    src = r.get("sumber_platform") or "Portal QR"
                    day_val = date_obj.day
                    for b in buckets:
                        if b["start"] <= day_val <= b["end"]:
                            week_label = b["label"]
                            if src not in chart_data[week_label]:
                                chart_data[week_label][src] = 0
                            chart_data[week_label][src] += 1
                            break
                except Exception:
                    pass
            return list(chart_data.values())
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/feedback/history/{premise_id}")
def search_feedback_history(premise_id: int, q: str = ""):
    """
    Search historical feedback by text.
    """
    try:
        query = supabase.table("tbl_maklumbalas") \
            .select("id_maklum_balas, ulasan_teks, bilangan_bintang, tarikh_terima, sumber_platform") \
            .eq("id_premis", premise_id)
            
        if q:
            query = query.ilike("ulasan_teks", f"%{q}%")
            
        res = query.order("tarikh_terima", desc=True).limit(50).execute()
        return res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
