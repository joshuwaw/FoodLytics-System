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

router = APIRouter()


# ─────────────────────────────────────────────────────────────────────────────
# ENDPOINT 1: Trigger BERTopic analysis (fires as a background task)
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/topics/run/{premise_id}")
async def trigger_topic_analysis(premise_id: int, background_tasks: BackgroundTasks):
    """
    Triggers a BERTopic analysis run for the given premise as a background task.
    This prevents the server from hanging during the heavy AI processing.
    """
    def run_analysis_task():
        try:
            from services.topic_modeling import run_topic_analysis
            result = run_topic_analysis(premise_id, supabase)
            print(f"[Analytics] Background Topic run complete for premise {premise_id}: {result}")
        except Exception as e:
            print(f"[Analytics] Background Topic pipeline failed: {e}")

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
        feedback_res = supabase.table("tbl_maklumbalas") \
            .select("id_maklum_balas") \
            .eq("id_premis", premise_id) \
            .execute()
        feedback_ids = [r["id_maklum_balas"] for r in (feedback_res.data or [])]

        if not feedback_ids:
            return {"premise_id": premise_id, "topics": []}

        # Get AI log IDs for these feedbacks
        enjin_res = supabase.table("tbl_enjin_ai") \
            .select("id_log_proses, id_maklum_balas") \
            .in_("id_maklum_balas", feedback_ids) \
            .execute()

        log_to_feedback = {r["id_log_proses"]: r["id_maklum_balas"] for r in (enjin_res.data or [])}
        log_ids = list(log_to_feedback.keys())

        if not log_ids:
            return {"premise_id": premise_id, "topics": []}

        # Get all topic records
        topik_res = supabase.table("tbl_topik") \
            .select("id_log_proses, label_topik, skor_topik") \
            .in_("id_log_proses", log_ids) \
            .execute()
        topik_records = topik_res.data or []

        if not topik_records:
            return {
                "premise_id": premise_id,
                "topics": [],
                "message": "No topics yet. Trigger /topics/run/{premise_id} first."
            }

        # Get sentiments for drill-down enrichment
        feedback_ids_with_logs = list(log_to_feedback.values())
        sentimen_res = supabase.table("tbl_sentimen") \
            .select("id_maklum_balas, label_sentimen") \
            .in_("id_maklum_balas", feedback_ids_with_logs) \
            .execute()
        sentimen_map = {s["id_maklum_balas"]: s["label_sentimen"] for s in (sentimen_res.data or [])}

        # Aggregate by label_topik
        aggregated: dict[str, dict] = {}
        for record in topik_records:
            label = record["label_topik"]
            log_id = record["id_log_proses"]
            skor = record.get("skor_topik") or 0.5
            fb_id = log_to_feedback.get(log_id)
            sentimen = sentimen_map.get(fb_id, "Neutral") if fb_id else "Neutral"

            if label not in aggregated:
                aggregated[label] = {
                    "label_topik": label,
                    "kekerapan": 0,
                    "skor_total": 0.0,
                    "sentimen_counts": {"Positif": 0, "Neutral": 0, "Negatif": 0}
                }
            aggregated[label]["kekerapan"] += 1
            aggregated[label]["skor_total"] += skor
            if sentimen in aggregated[label]["sentimen_counts"]:
                aggregated[label]["sentimen_counts"][sentimen] += 1

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
            .select("id_maklum_balas, ulasan_teks, bilangan_bintang, rating_makanan, rating_layanan, rating_suasana, tarikh_terima") \
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

        # Get topic records matching the requested label
        topik_res = supabase.table("tbl_topik") \
            .select("id_log_proses, label_topik, skor_topik") \
            .eq("label_topik", topic) \
            .in_("id_log_proses", list(log_to_feedback.keys())) \
            .execute()
        matched_logs = topik_res.data or []

        if not matched_logs:
            return {"topic": topic, "ulasan": [], "message": "No feedback found for this topic."}

        # Get sentiment labels for enrichment
        matched_fb_ids = [log_to_feedback[r["id_log_proses"]] for r in matched_logs if r["id_log_proses"] in log_to_feedback]
        sentimen_res = supabase.table("tbl_sentimen") \
            .select("id_maklum_balas, label_sentimen, skor_ketepatan") \
            .in_("id_maklum_balas", matched_fb_ids) \
            .execute()
        sentimen_map = {s["id_maklum_balas"]: s for s in (sentimen_res.data or [])}

        # Assemble drill-down results
        results = []
        for log_record in matched_logs:
            fb_id = log_to_feedback.get(log_record["id_log_proses"])
            if not fb_id or fb_id not in feedbacks:
                continue
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
