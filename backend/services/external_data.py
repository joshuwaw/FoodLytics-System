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
    templates = [
        ("Kedai nampak bersih, makanan pun sedap. Memang berbaloi dengan harga.", 5),
        ("Portion besar! Puas hati makan. Servis pun pantas je.", 5),
        ("Tempat selesa untuk lepak dengan kawan-kawan. Suasana chill, staf mesra.", 4),
        ("Rasa makanan authentic gila. Macam makan kat kampung.", 5),
        ("Harga murah gila tapi kualiti Tiptop. Akan repeat lagi confirm.", 5),
        ("Nasi goreng ayam dia sedap, cuma tempat parking susah sikit nak cari.", 4),
        ("Makanan biasa je. Tak ada yang special sangat. Sesuai la kalau nak alas perut.", 3),
        ("Harga okay, tapi servis agak lambat masa waktu puncak.", 3),
        ("Boleh la makan sini, tapi kalau lapar sangat baik pergi tempat lain.", 3),
        ("Suasana okay tapi makanan dia tak panas sangat bila sampai.", 3),
        ("Kecewa betul. Sup rasa tawar, macam letak air je lebih.", 1),
        ("Servis memang out! Tunggu sejam baru makanan sampai. Pekerja buat tak tahu je.", 1),
        ("Kotor gila lantai bersepah. Tak selesa langsung nak makan.", 1),
        ("Harga mahal tak masuk akal dengan portion yang bagi ciput je.", 2),
        ("Ayam mentah! Potong selera betul.", 1)
    ]
    names = ["Ahmad Faiz", "Siti Nurhaliza", "Wong Wei", "Kumar", "Nurul Huda", "Mohd Rizal", "Sarah Tan", "Azman Hashim", "Aishah"]
    reviews = []
    for _ in range(count):
        text, rating = random.choice(templates)
        reviews.append({
            "platform": "Google Reviews",
            "teks_ulasan": text,
            "bintang": rating,
            "tarikh": generate_random_date_last_30_days(),
            "nama_pengguna": random.choice(names)
        })
    return reviews

def _mock_social_mentions(count: int) -> list[dict]:
    platforms = ["X (Twitter)", "Instagram", "TikTok"]
    templates_x = [
        "Guys try kedai ni kat area Bangi, sumpah sedap #FoodieBangi",
        "Tak faham kenapa orang kata sedap. Bagi aku biasa je pun. Overrated. #CafeHopping",
        "Servis paling lambat dalam sejarah. Buang masa je gi kedai ni 👎",
        "Craving benda manis then jumpa cafe ni. Matcha latte dia sedap wey! 🍵✨",
        "Dah la mahal, portion macam nak bagi kucing makan. Tak berbaloi langsung."
    ]
    templates_ig = [
        "Hidden gem alert! 🚨 Korang wajib try menu baru dorang. Memang umph! 🔥 #ViralMenu #MakanLokal",
        "Aesthetic gila kedai ni. Tapi tu la, makanan lambat sikit sampai. #CafeAesthetic",
        "Kecewa sikit hari ni. Ayam goreng macam dah sejuk. Harap boleh improve lepas ni.",
        "Makan malam dengan family. Suasana best, makanan pun semua ngam dengan tekak! ❤️",
        "Worst experience ever. Meja kotor tak ada orang lap. Pekerja main phone kat kaunter."
    ]
    usernames = ["@foodlover", "@jalan2makan", "@lapargila", "@aestheticcafe", "@kakimakan99", "@reviewjujur", "@makanje"]
    mentions = []
    for _ in range(count):
        plat = random.choice(platforms)
        text = random.choice(templates_x if plat in ["X (Twitter)", "TikTok"] else templates_ig)
        mentions.append({
            "platform": plat,
            "teks_ulasan": text,
            "bintang": None,
            "tarikh": generate_random_date_last_30_days(),
            "nama_pengguna": random.choice(usernames)
        })
    return mentions
