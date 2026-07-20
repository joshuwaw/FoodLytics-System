import os
import random
import httpx
from datetime import datetime, timedelta

APIFY_API_KEY = os.getenv("APIFY_API_KEY")

# Hard limits to protect the $5 free tier
MAX_REVIEWS_PER_CALL = 15 
MAX_MENTIONS_PER_CALL = 15

def generate_random_date_last_30_days() -> str:
    """Generate a random ISO timestamp within the last 30 days."""
    now = datetime.now()
    days_ago = random.randint(0, 30)
    hours_ago = random.randint(0, 23)
    minutes_ago = random.randint(0, 59)
    random_date = now - timedelta(days=days_ago, hours=hours_ago, minutes=minutes_ago)
    return random_date.isoformat()

def fetch_google_reviews(premise_id: int, gmaps_url: str = None, count: int = 5) -> list[dict]:
    """
    Fetches Google Business Profile reviews.
    Uses Apify if APIFY_API_KEY is present, otherwise falls back to mock data.
    """
    # Enforce strict limits
    safe_count = min(count, MAX_REVIEWS_PER_CALL)
    
    if APIFY_API_KEY and gmaps_url:
        print(f"[Apify] Fetching {safe_count} Google Reviews for {gmaps_url}")
        return _fetch_google_reviews_from_apify(gmaps_url, safe_count)
        
    print(f"[Mock] Fetching {safe_count} Google Reviews (API Key missing or no URL)")
    return _mock_google_reviews(safe_count)

def fetch_social_mentions(premise_id: int, medsos_urls: list = None, count: int = 5) -> list[dict]:
    """
    Fetches mentions from X/Twitter and Instagram.
    Uses Apify if APIFY_API_KEY is present, otherwise falls back to mock data.
    """
    safe_count = min(count, MAX_MENTIONS_PER_CALL)
    
    if APIFY_API_KEY and medsos_urls:
        print(f"[Apify] Fetching {safe_count} Social Mentions")
        return _fetch_social_mentions_from_apify(medsos_urls, safe_count)
        
    print(f"[Mock] Fetching {safe_count} Social Mentions (API Key missing or no URL)")
    return _mock_social_mentions(safe_count)


# ==========================================
# ACTUAL API INTEGRATION (APIFY)
# ==========================================

def _fetch_google_reviews_from_apify(gmaps_url: str, count: int) -> list[dict]:
    """
    Calls Apify's Google Maps Reviews Scraper Actor.
    Actor: compass/google-maps-reviews-scraper
    """
    actor_id = "compass~google-maps-reviews-scraper"
    url = f"https://api.apify.com/v2/acts/{actor_id}/run-sync-get-dataset-items?token={APIFY_API_KEY}"
    
    payload = {
        "startUrls": [{"url": gmaps_url}],
        "maxReviews": count,
        "language": "ms",
        "reviewsSort": "newest" # Get the most recent ones for trend tracking
    }
    
    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
            
            reviews = []
            for item in data:
                reviews.append({
                    "platform": "Google Reviews",
                    "teks_ulasan": item.get("text", ""),
                    "bintang": item.get("stars", 0),
                    "tarikh": item.get("publishedAtDate", datetime.now().isoformat()),
                    "nama_pengguna": item.get("name", "Pengguna Google")
                })
            
            if not reviews:
                print("[Apify] Returned no reviews, falling back to mock data.")
                return _mock_google_reviews(count)
                
            return reviews
            
    except Exception as e:
        print(f"[Apify Error] Failed to fetch Google Reviews: {e}")
        return _mock_google_reviews(count)

def _fetch_social_mentions_from_apify(medsos_urls: list, count: int) -> list[dict]:
    """
    Calls Apify's Instagram/X Scraper Actors.
    Actor: apify/instagram-scraper
    """
    actor_id = "apify~instagram-scraper"
    url = f"https://api.apify.com/v2/acts/{actor_id}/run-sync-get-dataset-items?token={APIFY_API_KEY}"
    
    payload = {
        "directUrls": medsos_urls,
        "resultsLimit": count,
    }
    
    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
            
            mentions = []
            for item in data:
                mentions.append({
                    "platform": "Instagram", # Simplifying for demo purposes
                    "teks_ulasan": item.get("caption", ""),
                    "bintang": None, 
                    "tarikh": item.get("timestamp", datetime.now().isoformat()),
                    "nama_pengguna": item.get("ownerUsername", "Pengguna IG")
                })
            
            if not mentions:
                print("[Apify] Returned no mentions, falling back to mock data.")
                return _mock_social_mentions(count)
                
            return mentions
            
    except Exception as e:
        print(f"[Apify Error] Failed to fetch Social Mentions: {e}")
        return _mock_social_mentions(count)


# ==========================================
# MOCK FALLBACKS
# ==========================================

def _mock_google_reviews(count: int) -> list[dict]:
    # Return a specific static list of reviews for demo storytelling
    curated = [
        ("Pelayan cafe sangat lambat dan kurang ajar, kita panggil dia buat bodoh je.", 1, "Ahmad Faiz"),
        ("Servis teruk! Barista lebih sibuk berborak sesama sendiri dari buat kopi pelanggan.", 1, "Siti Nurhaliza"),
        ("Tandas sangat kotor, berbau hancing dan tiada sabun cuci tangan.", 1, "Wong Wei"),
        ("Lantai tandas basah berlendir, tong sampah melimpah dan bau busuk gila.", 1, "Kumar"),
        ("Nasi lemak rendang daging dia empuk gila, sedap gila weh!", 5, "Nurul Huda"),
        ("Tempat sangat aesthetic dan selesa untuk buat kerja. Wifi laju.", 5, "Mohd Rizal"),
        ("Juruwang biadap gila, orang tanya elok-elok dia jawab kasar giler.", 1, "Sarah Tan")
    ]
    reviews = []
    now = datetime.now()
    for i, (text, rating, name) in enumerate(curated[:count]):
        date_str = (now - timedelta(minutes=i*2)).isoformat()
        reviews.append({
            "platform": "Google Reviews",
            "teks_ulasan": text,
            "bintang": rating,
            "tarikh": date_str,
            "nama_pengguna": name
        })
    return reviews

def _mock_social_mentions(count: int) -> list[dict]:
    curated = [
        ("Layanan staff cafe ni out gila, panggil order pun buat tak tahu je. Lembap giler wey.", "X (Twitter)", "@jalan2makan"),
        ("Snobby staff, ignored us completely when we wanted to order food. Worst customer service.", "X (Twitter)", "@lapargila"),
        ("Meja berhabuk n kerusi kotor tak berlap langsung. Geli nak duduk makan kat sini.", "Instagram", "@aestheticcafe"),
        ("Tandas kotor n tak berbasuh langsung, bau busuk melampau cafe ni.", "X (Twitter)", "@kakimakan99"),
        ("Banyak gila lalat terbang dekat meja makan belah luar, tolong lap meja bersih sikit.", "Instagram", "@reviewjujur"),
        ("Terpaling lembap servis kat sini. Order kopi je pun sampai 30 minit baru siap.", "X (Twitter)", "@makanje")
    ]
    mentions = []
    now = datetime.now()
    for i, (text, platform, username) in enumerate(curated[:count]):
        date_str = (now - timedelta(minutes=(i+7)*2)).isoformat()
        mentions.append({
            "platform": platform,
            "teks_ulasan": text,
            "bintang": None,
            "tarikh": date_str,
            "nama_pengguna": username
        })
    return mentions
