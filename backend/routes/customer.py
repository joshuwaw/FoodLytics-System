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
def get_sentiment_stats(premise_id: int):
    """
    Returns live sentiment breakdown for the Pengurus dashboard donut chart.
    Joins: tbl_maklumbalas → tbl_enjin_ai → tbl_sentimen
    """
    try:
        # Get all feedback IDs for this premise
        feedback_res = supabase.table("tbl_maklumbalas") \
            .select("id_maklum_balas, bilangan_bintang, rating_makanan, rating_layanan, rating_suasana") \
            .eq("id_premis", premise_id) \
            .execute()

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

        total_stars = sum(r.get("bilangan_bintang") or 0 for r in records)
        
        def calculate_avg(key):
            vals = [r.get(key) for r in records if r.get(key) is not None]
            return sum(vals) / len(vals) if vals else 0

        avg_makanan = calculate_avg("rating_makanan")
        avg_layanan = calculate_avg("rating_layanan")
        avg_suasana = calculate_avg("rating_suasana")

        return {
            "total": total,
            "sentimen": [
                {"name": "Positif",  "value": round(counts["Positif"]  / denom * 100, 1)},
                {"name": "Neutral",  "value": round(counts["Neutral"]  / denom * 100, 1)},
                {"name": "Negatif",  "value": round(counts["Negatif"]  / denom * 100, 1)},
            ],
            "purata_bintang": round(total_stars / total, 1),
            "pecahan_rating": {
                "makanan": round(avg_makanan, 1),
                "layanan": round(avg_layanan, 1),
                "suasana": round(avg_suasana, 1),
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/recent-feedback/{premise_id}")
def get_recent_feedback(premise_id: int, limit: int = 5):
    """
    Returns recent feedback for a premise, including the sentiment label.
    """
    try:
        # Get recent feedback
        feedback_res = supabase.table("tbl_maklumbalas") \
            .select("id_maklum_balas, ulasan_teks, bilangan_bintang, rating_makanan, rating_layanan, rating_suasana, tarikh_terima") \
            .eq("id_premis", premise_id) \
            .order("tarikh_terima", desc=True) \
            .limit(limit) \
            .execute()
            
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
def get_weekly_stats(premise_id: int):
    """
    Returns weekly aggregated volume and sentiment scores.
    """
    try:
        # Get date 7 days ago
        seven_days_ago = (datetime.datetime.now() - datetime.timedelta(days=7)).isoformat()
        
        # Get feedback from last 7 days
        feedback_res = supabase.table("tbl_maklumbalas") \
            .select("id_maklum_balas, tarikh_terima") \
            .eq("id_premis", premise_id) \
            .gte("tarikh_terima", seven_days_ago) \
            .execute()
            
        records = feedback_res.data or []
        
        # Initialize days
        days_map = {0: "Isnin", 1: "Selasa", 2: "Rabu", 3: "Khamis", 4: "Jumaat", 5: "Sabtu", 6: "Ahad"}
        
        # Build base dictionary for last 7 days to ensure ordered and complete days
        today = datetime.datetime.now()
        weekly_data = []
        for i in range(6, -1, -1):
            d = today - datetime.timedelta(days=i)
            day_name = days_map[d.weekday()]
            weekly_data.append({
                "hari": day_name,
                "date_str": d.strftime("%Y-%m-%d"),
                "volume": 0,
                "sentiment_scores": []
            })
            
        if not records:
            # Return empty structure
            return [{"hari": d["hari"], "volume": 0, "sentimen": 50} for d in weekly_data]

        # Get sentiments
        feedback_ids = [r["id_maklum_balas"] for r in records]
        sentimen_res = supabase.table("tbl_sentimen") \
            .select("id_maklum_balas, label_sentimen") \
            .in_("id_maklum_balas", feedback_ids) \
            .execute()
            
        sentimen_map = {s["id_maklum_balas"]: s["label_sentimen"] for s in (sentimen_res.data or [])}
        
        # Score mapping: Positif=100, Neutral=50, Negatif=0
        score_val = {"Positif": 100, "Neutral": 50, "Negatif": 0}
        
        # Aggregate
        for r in records:
            try:
                date_obj = datetime.datetime.fromisoformat(r["tarikh_terima"])
                date_str = date_obj.strftime("%Y-%m-%d")
                
                label = sentimen_map.get(r["id_maklum_balas"], "Neutral")
                score = score_val.get(label, 50)
                
                # Find the bucket
                for bucket in weekly_data:
                    if bucket["date_str"] == date_str:
                        bucket["volume"] += 1
                        bucket["sentiment_scores"].append(score)
                        break
            except:
                pass
                
        # Final formatting
        result = []
        for bucket in weekly_data:
            avg_sent = 50
            if bucket["sentiment_scores"]:
                avg_sent = sum(bucket["sentiment_scores"]) / len(bucket["sentiment_scores"])
            
            result.append({
                "hari": bucket["hari"],
                "volume": bucket["volume"],
                "sentimen": round(avg_sent)
            })
            
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
