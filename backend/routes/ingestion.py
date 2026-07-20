import asyncio
import datetime
import random
from fastapi import APIRouter, HTTPException, BackgroundTasks
from database import supabase
from models import ExternalReviewItem, ExternalFeedbackCreate, IngestionResponse, IngestionSourceStatus
from services.external_data import fetch_google_reviews, fetch_social_mentions, fetch_tripadvisor_reviews, fetch_yelp_reviews, fetch_trustpilot_reviews
from services.sentiment import analyse_sentiment

router = APIRouter()

def process_ingestion_background(premise_id: int, external_reviews: list[dict]):
    """Background task to insert external reviews and trigger sentiment analysis."""
    print(f"[Ingestion] Background processing started for {len(external_reviews)} reviews.")
    
    # Pre-fetch existing review texts for this premise to enable dedup
    try:
        existing_res = supabase.table("tbl_maklumbalas") \
            .select("ulasan_teks, sumber_platform") \
            .eq("id_premis", premise_id) \
            .execute()
        existing_set = set()
        for r in (existing_res.data or []):
            key = (r.get("ulasan_teks", "").strip().lower(), r.get("sumber_platform", ""))
            existing_set.add(key)
    except Exception as e:
        print(f"[Ingestion] Warning: Dedup pre-fetch failed: {e}. Proceeding without dedup.")
        existing_set = set()
    
    inserted = 0
    skipped = 0
    
    try:
        # Loop over reviews and insert
        for review in external_reviews:
            # Dedup check: skip if identical text + platform already exists
            dedup_key = (review["teks_ulasan"].strip().lower(), review["platform"])
            if dedup_key in existing_set:
                skipped += 1
                continue
            
            # Prepare feedback data
            bintang = review.get("bintang")
            
            base_rating = bintang
            
            fb_data = {
                "id_premis": premise_id,
                "bilangan_bintang": base_rating,
                "rating_makanan": base_rating,
                "rating_layanan": base_rating,
                "rating_suasana": base_rating,
                "ulasan_teks": review["teks_ulasan"],
                "sumber_platform": review["platform"],
                "tarikh_terima": review["tarikh"] or datetime.datetime.now().isoformat()
            }
            
            # Step 1: Insert into tbl_maklumbalas
            fb_res = supabase.table("tbl_maklumbalas").insert(fb_data).execute()
            
            if fb_res.data:
                id_maklum_balas = fb_res.data[0]["id_maklum_balas"]
                
                # Step 2: Log AI processing -> tbl_enjin_ai
                enjin_data = {
                    "id_maklum_balas": id_maklum_balas,
                    "waktu_proses": datetime.datetime.now().isoformat(),
                }
                enjin_res = supabase.table("tbl_enjin_ai").insert(enjin_data).execute()
                
                if enjin_res.data:
                    id_log_proses = enjin_res.data[0]["id_log_proses"]
                    
                    # Step 3: Run sentiment analysis -> tbl_sentimen
                    sentiment_result = analyse_sentiment(
                        ulasan_teks=fb_data["ulasan_teks"],
                        bilangan_bintang=fb_data["bilangan_bintang"],
                        makanan=fb_data["rating_makanan"],
                        layanan=fb_data["rating_layanan"],
                        suasana=fb_data["rating_suasana"],
                    )
                    
                    sentimen_data = {
                        "id_log_proses": id_log_proses,
                        "id_maklum_balas": id_maklum_balas,
                        "label_sentimen": sentiment_result["sentimen"],
                        "skor_ketepatan": sentiment_result["skor"],
                    }
                    supabase.table("tbl_sentimen").insert(sentimen_data).execute()
                
                # Track this as inserted + add to dedup set
                inserted += 1
                existing_set.add(dedup_key)
        
        print(f"[Ingestion] Completed for premise {premise_id}: {inserted} inserted, {skipped} duplicates skipped.")
    except Exception as e:
        print(f"[Ingestion] Error during background processing: {e}")

@router.post("/fetch/{premise_id}", response_model=IngestionResponse)
def trigger_ingestion(premise_id: int, background_tasks: BackgroundTasks):
    """
    Triggers fetching of external data (Google Reviews, Social Media) for a premise.
    The analysis runs in the background.
    """
    try:
        # Get premise info to check config (like gmaps_url)
        premis_res = supabase.table("tbl_premis").select("pautan_gmaps, pautan_medsos").eq("id_premis", premise_id).execute()
        
        if not premis_res.data:
            raise HTTPException(status_code=404, detail="Premise not found")
            
        premis_data = premis_res.data[0]
        
        # 1. Fetch Mock Data
        # Fetch using URLs configured for the premise
        gmaps_url = premis_data.get("pautan_gmaps")
        medsos_raw = premis_data.get("pautan_medsos")
        
        # Convert medsos string/list into array
        medsos_urls = []
        if medsos_raw:
            if isinstance(medsos_raw, list):
                medsos_urls = medsos_raw
            elif isinstance(medsos_raw, str):
                medsos_urls = [url.strip() for url in medsos_raw.split(",") if url.strip()]

        # Separate specific platforms from social media links
        tripadvisor_urls = [url for url in medsos_urls if "tripadvisor.com" in url]
        yelp_urls = [url for url in medsos_urls if "yelp.com" in url]
        trustpilot_urls = [url for url in medsos_urls if "trustpilot.com" in url]
        other_medsos_urls = [
            url for url in medsos_urls 
            if "tripadvisor.com" not in url and "yelp.com" not in url and "trustpilot.com" not in url
        ]

        google_reviews = fetch_google_reviews(premise_id, gmaps_url=gmaps_url, count=random.randint(3, 8))
        
        tripadvisor_reviews = []
        if tripadvisor_urls:
            tripadvisor_reviews = fetch_tripadvisor_reviews(premise_id, tripadvisor_urls[0], count=random.randint(3, 6))
            
        yelp_reviews = []
        if yelp_urls:
            yelp_reviews = fetch_yelp_reviews(premise_id, yelp_urls[0], count=random.randint(3, 6))
            
        trustpilot_reviews = []
        if trustpilot_urls:
            trustpilot_reviews = fetch_trustpilot_reviews(premise_id, trustpilot_urls[0], count=random.randint(3, 6))
            
        social_mentions = fetch_social_mentions(premise_id, medsos_urls=other_medsos_urls, count=random.randint(2, 6))
        
        all_reviews = google_reviews + tripadvisor_reviews + yelp_reviews + trustpilot_reviews + social_mentions
        
        if not all_reviews:
            return IngestionResponse(
                message="No new external data found.",
                status="success",
                premise_id=premise_id,
                jumlah_diimport=0
            )
            
        # 2. Add to background tasks
        background_tasks.add_task(process_ingestion_background, premise_id, all_reviews)
        
        # Calculate breakdown for response
        platforms = [r["platform"] for r in all_reviews]
        breakdown = {plat: platforms.count(plat) for plat in set(platforms)}
        
        return IngestionResponse(
            message="Data ingestion started successfully. AI is processing the reviews in the background.",
            status="processing",
            premise_id=premise_id,
            jumlah_diimport=len(all_reviews),
            pecahan_sumber=breakdown
        )
        
    except Exception as e:
        print(f"Error in /fetch/{premise_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch external data: {e}")

@router.get("/sources/{premise_id}", response_model=list[IngestionSourceStatus])
def get_ingestion_sources(premise_id: int):
    """
    Returns the dynamic status of actual external sources stored for a premise.
    """
    try:
        print(f"[Ingestion] Fetching dynamic sources for premise {premise_id}")
        # Get counts and latest tarikh_terima grouped by source from tbl_maklumbalas
        fb_res = supabase.table("tbl_maklumbalas")\
            .select("sumber_platform, tarikh_terima")\
            .eq("id_premis", premise_id)\
            .execute()
        records = fb_res.data or []
        
        stats = {}
        for r in records:
            src = r.get("sumber_platform") or "Portal QR"
            tarikh = r.get("tarikh_terima")
            
            if src not in stats:
                stats[src] = {"count": 0, "latest": None}
            stats[src]["count"] += 1
            
            if tarikh:
                if stats[src]["latest"] is None or tarikh > stats[src]["latest"]:
                    stats[src]["latest"] = tarikh
                    
        # Always ensure Portal QR is shown as it is our internal platform
        if "Portal QR" not in stats:
            stats["Portal QR"] = {"count": 0, "latest": None}
            
        sources = []
        for platform, info in stats.items():
            connected = True  # In real app, check if source configuration exists
            if platform == "Portal QR":
                last_sync = "Live"
            elif info["latest"]:
                last_sync = info["latest"]
            else:
                last_sync = "Never"
                
            sources.append(
                IngestionSourceStatus(
                    platform=platform,
                    connected=connected,
                    last_sync=last_sync,
                    jumlah_ulasan=info["count"]
                )
            )
            
        # Sort sources: Portal QR first, then by count descending
        sources.sort(key=lambda x: (x.platform != "Portal QR", -x.jumlah_ulasan, x.platform))
        return sources
        
    except Exception as e:
        print(f"[Ingestion] Error fetching sources: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
