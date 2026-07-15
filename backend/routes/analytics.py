"""
Analytics Router — Increment 3: AI Deep Dive (Diagnostic Analytics)

Endpoints:
  POST /api/analytics/topics/run/{premise_id}
    -> Triggers BERTopic analysis for a given premise (background task).

  GET /api/analytics/topics/{premise_id}
    -> Returns aggregated topic list with frequency, avg sentiment, and label.

  GET /api/analytics/topics/drilldown/{premise_id}
    -> Returns the raw ulasan associated with a specific topic label.
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from database import supabase
import datetime
import time

router = APIRouter()

def safe_execute(query_builder, retries=3, delay=0.5):
    """
    Executes a Supabase/PostgREST query with retries to handle transient HTTP/connection dropouts.
    """
    for i in range(retries):
        try:
            return query_builder.execute()
        except Exception as e:
            if i == retries - 1:
                print(f"[DB Error] Executing query failed after {retries} attempts: {e}")
                raise e
            time.sleep(delay)

@router.get("/status/{premise_id}")
def get_analysis_status(premise_id: int):
    # Fetch status from database instead of in-memory set
    premis_res = safe_execute(supabase.table("tbl_premis").select("status_analisis").eq("id_premis", premise_id))
    status_val = "idle"
    if premis_res.data:
        status_val = premis_res.data[0].get("status_analisis") or "idle"
        
    is_running = status_val.startswith("running:")
    
    # Auto-expire locks older than 5 minutes (300 seconds)
    if is_running:
        try:
            start_time = int(status_val.split(":")[1])
            if int(time.time()) - start_time >= 300:
                is_running = False
                # Revert expired status in DB
                safe_execute(supabase.table("tbl_premis").update({"status_analisis": "idle"}).eq("id_premis", premise_id))
        except Exception:
            pass
            
    return {"status": "running" if is_running else "idle"}


# ─────────────────────────────────────────────────────────────────────────────
# ENDPOINT 1: Trigger BERTopic analysis (fires as a background task)
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/topics/run/{premise_id}")
async def trigger_topic_analysis(premise_id: int, background_tasks: BackgroundTasks):
    """
    Triggers a BERTopic analysis run for the given premise as a background task.
    This prevents the server from hanging during the heavy AI processing.
    """
    # Fetch current status to check rate limit lock
    premis_res = safe_execute(supabase.table("tbl_premis").select("status_analisis").eq("id_premis", premise_id))
    status_val = "idle"
    if premis_res.data:
        status_val = premis_res.data[0].get("status_analisis") or "idle"
        
    now = int(time.time())
    
    # Lock checks
    if status_val.startswith("running:"):
        try:
            start_time = int(status_val.split(":")[1])
            elapsed = now - start_time
            if elapsed < 300: # 5 minutes lock
                remaining = 300 - elapsed
                return {
                    "message": f"Analisis AI sedang berjalan. Sila tunggu {remaining} saat sebelum memulakan analisis baru.",
                    "status": "processing"
                }
        except Exception:
            pass

    # Acquire lock in DB
    safe_execute(supabase.table("tbl_premis").update({"status_analisis": f"running:{now}"}).eq("id_premis", premise_id))

    def run_analysis_task():
        try:
            from services.topic_modeling import run_topic_analysis
            from services.prescriptive_generator import generate_prescriptive_drafts
            result = run_topic_analysis(premise_id, supabase)
            print(f"[Analytics] Background Topic run complete for premise {premise_id}: {result}")
            
            # 5th Increment: Prescriptive generation right after topic modeling
            pres_result = generate_prescriptive_drafts(premise_id, supabase)
            print(f"[Analytics] Background Prescriptive run complete: {pres_result}")
            
        except Exception as e:
            print(f"[Analytics] Background Topic/Prescriptive pipeline failed: {e}")
        finally:
            # Revert to idle in DB upon completion or failure
            safe_execute(supabase.table("tbl_premis").update({"status_analisis": "idle"}).eq("id_premis", premise_id))

    background_tasks.add_task(run_analysis_task)
    
    return {
        "message": "Analisis AI telah dimulakan di latar belakang. Sila tunggu sebentar.",
        "status": "processing"
    }


# ─────────────────────────────────────────────────────────────────────────────
# ENDPOINT 2: Get aggregated topic list for the dashboard
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/topics/{premise_id}")
def get_topics(premise_id: int):
    """
    Returns a ranked list of topics for a premise, including:
      - label_topik: The human-readable topic name (e.g., "Servis Lambat")
      - kekerapan: Number of feedback entries tagged with this topic
      - purata_skor: Average AI confidence score for this topic cluster
      - sentimen_dominan: The most common sentiment among this topic's feedback
    """
    try:
        # Get all feedback IDs for this premise
        feedback_res = safe_execute(
            supabase.table("tbl_maklumbalas")
            .select("id_maklum_balas, sumber_platform")
            .eq("id_premis", premise_id)
        )
        feedbacks_map = {r["id_maklum_balas"]: (r.get("sumber_platform") or "Portal QR") for r in (feedback_res.data or [])}
        feedback_ids = list(feedbacks_map.keys())

        if not feedback_ids:
            return {"premise_id": premise_id, "topics": []}

        # Get AI log IDs for these feedbacks
        enjin_res = safe_execute(
            supabase.table("tbl_enjin_ai")
            .select("id_log_proses, id_maklum_balas")
            .in_("id_maklum_balas", feedback_ids)
        )

        log_to_feedback = {r["id_log_proses"]: r["id_maklum_balas"] for r in (enjin_res.data or [])}
        log_ids = list(log_to_feedback.keys())

        if not log_ids:
            return {"premise_id": premise_id, "topics": []}

        # Get all topic records
        topik_res = safe_execute(
            supabase.table("tbl_topik")
            .select("id_log_proses, label_topik, skor_topik")
            .in_("id_log_proses", log_ids)
        )
        topik_records = topik_res.data or []

        if not topik_records:
            return {
                "premise_id": premise_id,
                "topics": [],
                "message": "No topics yet. Trigger /topics/run/{premise_id} first."
            }

        # Get sentiments for drill-down enrichment
        feedback_ids_with_logs = list(log_to_feedback.values())
        sentimen_res = safe_execute(
            supabase.table("tbl_sentimen")
            .select("id_maklum_balas, label_sentimen")
            .in_("id_maklum_balas", feedback_ids_with_logs)
        )
        sentimen_map = {s["id_maklum_balas"]: s["label_sentimen"] for s in (sentimen_res.data or [])}

        # Aggregate by label_topik (cleaning the sentiment suffix like "(Negatif)", "(Positif)", "(Neutral)")
        aggregated: dict[str, dict] = {}
        for record in topik_records:
            raw_label = record["label_topik"]
            label = raw_label.replace(" (Negatif)", "").replace(" (Positif)", "").replace(" (Neutral)", "")
            log_id = record["id_log_proses"]
            skor = record.get("skor_topik") or 0.5
            fb_id = log_to_feedback.get(log_id)
            sentimen = sentimen_map.get(fb_id, "Neutral") if fb_id else "Neutral"
            platform = feedbacks_map.get(fb_id, "Portal QR") if fb_id else "Portal QR"

            if label not in aggregated:
                aggregated[label] = {
                    "label_topik": label,
                    "kekerapan": 0,
                    "skor_total": 0.0,
                    "sentimen_counts": {"Positif": 0, "Neutral": 0, "Negatif": 0},
                    "platform_counts": {}
                }
            aggregated[label]["kekerapan"] += 1
            aggregated[label]["skor_total"] += skor
            if sentimen in aggregated[label]["sentimen_counts"]:
                aggregated[label]["sentimen_counts"][sentimen] += 1
            if platform not in aggregated[label]["platform_counts"]:
                aggregated[label]["platform_counts"][platform] = 0
            aggregated[label]["platform_counts"][platform] += 1

        # Build final response, sorted by frequency desc
        topics = []
        for label, data in aggregated.items():
            freq = data["kekerapan"]
            avg_skor = round(data["skor_total"] / freq, 3) if freq > 0 else 0.0
            counts = data["sentimen_counts"]
            
            # Penentuan sentimen dominan yang lebih pintar (Abaikan Neutral dalam perbandingan)
            # Jika ulasan Negatif melebihi Positif, ia adalah Isu Kritikal
            if counts["Negatif"] > counts["Positif"]:
                dominant = "Negatif"
            # Jika Positif melebihi Negatif, ia adalah Kekuatan
            elif counts["Positif"] > counts["Negatif"]:
                dominant = "Positif"
            # Jika jumlah sama, maka ia bercampur/Neutral
            else:
                dominant = "Neutral"
                
            topics.append({
                "label_topik": label,
                "kekerapan": freq,
                "purata_skor": avg_skor,
                "sentimen_dominan": dominant,
                "sentimen_breakdown": counts,
                "platform_breakdown": data["platform_counts"]
            })

        topics.sort(key=lambda x: x["kekerapan"], reverse=True)

        return {
            "premise_id": premise_id,
            "topics": topics,
            "jumlah_topik": len(topics),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch topics: {e}")


# ─────────────────────────────────────────────────────────────────────────────
# ENDPOINT 3: Drill-down — raw ulasan for a specific topic
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/topics/drilldown/{premise_id}")
def get_topic_drilldown(premise_id: int, topic: str):
    """
    Returns the raw ulasan (feedback text), star ratings, and date
    for all feedback assigned to a specific topic label.

    Query param: ?topic=Servis+Lambat
    """
    try:
        # Get all feedback IDs for this premise
        feedback_res = supabase.table("tbl_maklumbalas") \
            .select("id_maklum_balas, ulasan_teks, bilangan_bintang, rating_makanan, rating_layanan, rating_suasana, tarikh_terima, sumber_platform") \
            .eq("id_premis", premise_id) \
            .execute()
        feedbacks = {r["id_maklum_balas"]: r for r in (feedback_res.data or [])}

        if not feedbacks:
            return {"topic": topic, "ulasan": []}

        # Get AI log IDs for these feedbacks
        enjin_res = supabase.table("tbl_enjin_ai") \
            .select("id_log_proses, id_maklum_balas") \
            .in_("id_maklum_balas", list(feedbacks.keys())) \
            .execute()
        log_to_feedback = {r["id_log_proses"]: r["id_maklum_balas"] for r in (enjin_res.data or [])}

        # Get topic records matching the requested label (ignoring the sentiment suffix)
        topik_res = supabase.table("tbl_topik") \
            .select("id_log_proses, label_topik, skor_topik") \
            .in_("id_log_proses", list(log_to_feedback.keys())) \
            .execute()
        
        matched_logs = []
        for r in (topik_res.data or []):
            clean_label = r["label_topik"].replace(" (Negatif)", "").replace(" (Positif)", "").replace(" (Neutral)", "")
            if clean_label == topic:
                matched_logs.append(r)

        if not matched_logs:
            return {"topic": topic, "ulasan": [], "message": "No feedback found for this topic."}

        # Get sentiment labels for enrichment
        matched_fb_ids = [log_to_feedback[r["id_log_proses"]] for r in matched_logs if r["id_log_proses"] in log_to_feedback]
        sentimen_res = supabase.table("tbl_sentimen") \
            .select("id_maklum_balas, label_sentimen, skor_ketepatan") \
            .in_("id_maklum_balas", matched_fb_ids) \
            .execute()
        sentimen_map = {s["id_maklum_balas"]: s for s in (sentimen_res.data or [])}

        # Assemble drill-down results (deduplicated by id_maklum_balas)
        results = []
        seen_fb_ids = set()
        for log_record in matched_logs:
            fb_id = log_to_feedback.get(log_record["id_log_proses"])
            if not fb_id or fb_id not in feedbacks or fb_id in seen_fb_ids:
                continue
            seen_fb_ids.add(fb_id)
            fb = feedbacks[fb_id]
            sent = sentimen_map.get(fb_id, {})
            results.append({
                "id_maklum_balas": fb_id,
                "ulasan_teks": fb.get("ulasan_teks"),
                "bilangan_bintang": fb.get("bilangan_bintang"),
                "rating_makanan": fb.get("rating_makanan"),
                "rating_layanan": fb.get("rating_layanan"),
                "rating_suasana": fb.get("rating_suasana"),
                "tarikh_terima": fb.get("tarikh_terima"),
                "label_sentimen": sent.get("label_sentimen", "Processing..."),
                "skor_sentimen": sent.get("skor_ketepatan", 0.0),
                "skor_topik": log_record.get("skor_topik", 0.5),
                "sumber_platform": fb.get("sumber_platform", "Tidak Diketahui"),
            })

        # Sort by date desc (most recent first)
        results.sort(key=lambda x: x["tarikh_terima"] or "", reverse=True)

        return {
            "topic": topic,
            "kekerapan": len(results),
            "ulasan": results,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Drilldown failed: {e}")

from pydantic import BaseModel
from typing import Optional

class PesaingCreate(BaseModel):
    id_premis: int
    nama_pesaing: str
    pautan_gmaps: str

@router.get("/pesaing/{premise_id}")
def get_pesaing(premise_id: int):
    try:
        res = supabase.table("tbl_pesaing").select("*").eq("id_premis", premise_id).execute()
        return res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/pesaing")
def add_pesaing(request: PesaingCreate):
    try:
        res = supabase.table("tbl_pesaing").insert({
            "id_premis": request.id_premis,
            "nama_pesaing": request.nama_pesaing,
            "pautan_gmaps": request.pautan_gmaps
        }).execute()
        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to add competitor")
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/pesaing/{id_pesaing}")
def delete_pesaing(id_pesaing: int):
    try:
        res = supabase.table("tbl_pesaing").delete().eq("id_pesaing", id_pesaing).execute()
        return {"status": "success", "message": "Competitor deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/competitors/{premise_id}")
def get_competitor_trends(premise_id: int):
    try:
        premis_res = supabase.table("tbl_premis").select("id_pengurus").eq("id_premis", premise_id).execute()
        id_pengurus = None
        if premis_res.data:
            id_pengurus = premis_res.data[0].get("id_pengurus")
            
        trends = []
        if id_pengurus:
            trends_res = supabase.table("tbl_trend_industri").select("*").eq("id_pengurus", id_pengurus).execute()
            trends = trends_res.data or []
            
        if not trends:
            pesaing_res = supabase.table("tbl_pesaing").select("id_pesaing").eq("id_premis", premise_id).execute()
            if pesaing_res.data:
                from services.competitor_scraper import scrape_and_analyze_competitors
                scrape_and_analyze_competitors(premise_id)
                trends_res = supabase.table("tbl_trend_industri").select("*").eq("id_pengurus", id_pengurus).execute()
                trends = trends_res.data or []
                
        return trends
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/competitors/scrape/{premise_id}")
def trigger_competitor_scrape(premise_id: int):
    try:
        from services.competitor_scraper import scrape_and_analyze_competitors
        result = scrape_and_analyze_competitors(premise_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
