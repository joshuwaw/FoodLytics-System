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
# HIGH-FIDELITY SIMULATION (MOCK)
# ==========================================

REVIEWS_DEMO_POOL = [
    # Layanan Staf (Negative)
    ("Pelayan cafe ni sangat lambat buat kerja, muka sombong nak mati.", 1, "Google Reviews", "Ahmad Faiz"),
    ("Juruwang biadap gila, orang tanya elok-elok dia jawab acuh tak acuh.", 1, "Google Reviews", "Sarah Tan"),
    ("Staff dia kerek sangat, tak senyum langsung dekat customer.", 1, "Google Reviews", "Mohd Rizal"),
    ("Servis lembap! Barista lebih sibuk berborak sesama sendiri dari buat kopi.", 1, "Google Reviews", "Siti Nurhaliza"),
    ("Order kopi je pun sampai 30 minit baru siap. Staff tidak mesra langsung.", 1, "Google Reviews", "Wong Wei"),
    ("Pekerja dia langsung tiada adab. Layanan sangat teruk dan kasar.", 1, "Google Reviews", "Kumar"),
    ("Snobby staff, ignored us completely when we wanted to order food.", 1, "Google Reviews", "Azman Hashim"),
    ("Cashier was extremely rude when I asked for receipt. Worst customer service.", 1, "Google Reviews", "Nurul Huda"),
    ("Layanan staff cafe ni out gila, panggil order pun buat tak tahu je. Lembap giler wey.", None, "X (Twitter)", "@jalan2makan"),
    ("Snobby staff, ignored us completely when we wanted to order food. Worst customer service.", None, "X (Twitter)", "@lapargila"),
    ("Terpaling lembap servis kat sini. Order kopi je pun sampai 30 minit baru siap.", None, "X (Twitter)", "@kakimakan99"),
    ("Staff muka ketat macam nak ajak gaduh, tak mesra langsung.", None, "TikTok", "@reviewjujur"),
    ("Foreign waiters are not well-trained, they keep mixing up table numbers and orders. Unprofessional.", 2, "Google Reviews", "Michael Koh"),
    ("Waiters are snobby and ignored us when we raised hand for bill. Service quality needs improvement.", 2, "Google Reviews", "Farah Hani"),
    ("They forgot my order! Waited for 30 minutes, when I asked they said they lost the order ticket.", 1, "Google Reviews", "Taufiq"),
    ("Staff tak helpful langsung masa tanya pasal menu rekomendasi. Muka boring.", 2, "Google Reviews", "Shahrul"),
    ("Juruwang layan nak tak nak je, macam kita minta makanan free pula.", 1, "Google Reviews", "Amirul"),
    ("Staff main phone kat kaunter time customer beratur panjang. Sangat unprofessional.", None, "Instagram", "@lapargila"),
    
    # Layanan Staf (Positive)
    ("Staff sangat mesra dan membantu! Senyuman manis dari masuk pintu lagi.", 5, "Google Reviews", "Liyana"),
    ("Barista rajin terangkan pasal biji kopi. Servis tiptop!", 5, "Google Reviews", "Danny Lau"),
    ("Attentive baristas, great manual brew options. Love their service standard.", 5, "Google Reviews", "Melissa"),
    ("Friendly vibes, staff sangat baik layan anak-anak kecil.", 5, "Google Reviews", "Zulkifli"),
    ("Layanan pantas dan pekerja sangat sopan santun. Highly recommended!", 5, "Google Reviews", "Syed"),
    ("Pekerja kaunter sangat cekap, beratur panjang pun sat je setel.", 5, "Google Reviews", "Yati"),
    ("Friendly waiters, always checking if we need anything else. Good job!", 5, "Google Reviews", "Rajesh"),
    
    # Kebersihan Kedai (Negative)
    ("Tandas sangat kotor dan bau busuk gila weh!", 1, "Google Reviews", "Aizat"),
    ("Lalat banyak giler terbang dekat meja makan, rasa kotor.", 1, "Google Reviews", "Nisha"),
    ("Tandas tersumbat dan berbau busuk melampau.", 1, "Google Reviews", "Zaki"),
    ("Kebersihan tandas cafe ni out gila, bau busuk.", 1, "Google Reviews", "Suhaimi"),
    ("Lantai tandas basah, berlendir dan busuk giler.", 1, "Google Reviews", "Kamal"),
    ("Tandas berbau hancing dan tiada sabun cuci tangan.", 1, "Google Reviews", "Fakhrul"),
    ("Banyak lalat hurung makanan sebab tong sampah terbuka.", 1, "Google Reviews", "Hasnah"),
    ("Tandas kotor n tak berbasuh langsung, bau busuk.", 1, "Google Reviews", "Imran"),
    ("Meja berhabuk n kerusi kotor tak berlap langsung. Geli nak duduk.", None, "Instagram", "@aestheticcafe"),
    ("Tandas kotor n tak berbasuh langsung, bau busuk melampau cafe ni.", None, "X (Twitter)", "@lapargila"),
    ("Banyak gila lalat terbang dekat meja makan belah luar, tolong lap meja bersih sikit.", None, "Instagram", "@kakimakan99"),
    ("Tables are dusty and sticky, staff cleared the plates but didn't wipe the table properly.", 1, "Google Reviews", "Aswad"),
    ("Plates are chipped at the corners, looks dangerous and unhygienic. Change the tableware.", 2, "Google Reviews", "Hanim"),
    ("Habuk tebal kat kipas siling, rasa macam habuk nak jatuh dalam makanan.", 2, "Google Reviews", "Razi"),
    ("Lantai melekit gila, rasa tak selesa nak jalan dalam cafe.", 1, "Google Reviews", "Hasmadi"),
    ("Fly inside my drinks! Geli gila weh. Hygiene standard is very low here.", 1, "Google Reviews", "Syafiq"),
    ("Sinki basuh tangan tersumbat dan berlumut hitam. Sangat menjijikkan.", 1, "Google Reviews", "Junaidi"),
    
    # Kebersihan Kedai (Positive)
    ("Kedai sangat bersih dan kemas. Meja sentiasa dilap bersih sebaik pelanggan bangun.", 5, "Google Reviews", "Fauzi"),
    ("Toilet bersih wangi, siap ada hand sanitizer disediakan.", 5, "Google Reviews", "Ain"),
    ("Very clean and hygienic environment. Cutlery is well-sanitized.", 5, "Google Reviews", "Rachel"),
    
    # Masa Menunggu (Negative)
    ("Order beratur panjang gila, nak bayar dekat kaunter pun ambil masa 20 minit.", 1, "Google Reviews", "Yunus"),
    ("Makanan lambat gila sampai, meja sebelah yang datang lambat dapat dulu.", 1, "Google Reviews", "Azlan"),
    ("Saya terpaksa menunggu lebih 40 minit hanya untuk secawan espresso. Lembap!", 1, "Google Reviews", "Firdaus"),
    ("Sistem layan diri lembap, mesin tempahan layan diri selalu lag dan stuck.", 2, "Google Reviews", "Mokhtar"),
    ("Waited for an hour just for a simple chicken chop. Fast food is faster than this.", 1, "Google Reviews", "Zarina"),
    ("Masa menunggu sangat tidak munasabah. Dah nak habis air baru makanan sampai.", 1, "Google Reviews", "Wong"),
    ("Penyediaan makanan lambat sangat, kitchen staff macam tak cukup orang.", 2, "Google Reviews", "Suresh"),
    ("Lembap gila! Kitchen slow gila siapkan order take away.", 1, "Google Reviews", "Chong"),
    ("Terpaksa tunggu meja kosong sejam, sistem waiting list berterabur.", None, "Instagram", "@jalan2makan"),
    
    # Masa Menunggu (Positive)
    ("Servis cepat gila! Baru order 5 minit dah sampai makanan panas-panas.", 5, "Google Reviews", "Faizal"),
    ("Makanan sampai dengan pantas walaupun cafe penuh hujung minggu.", 5, "Google Reviews", "Nabilah"),
    ("Very fast prep time. Recommended for quick lunch.", 5, "Google Reviews", "Jack"),
    
    # Nilai & Harga (Negative)
    ("Harga makanan terlampau mahal gila, portion kecil nak mampus.", 2, "Google Reviews", "Tarmizi"),
    ("RM35 untuk pasta kecil rasa hambar? Memang tak berbaloi langsung.", 2, "Google Reviews", "Basir"),
    ("Harga yahudi betul cafe ni, air tin biasa cas RM8.", 1, "Google Reviews", "Halim"),
    ("Makan sikit je dah cecah RM100. Caj mahal tapi kualiti hauk.", 1, "Google Reviews", "Zaidi"),
    ("Terlalu mahal, harga cekik darah untuk kedai hipster.", 2, "Google Reviews", "Rosman"),
    ("Portion sikit gila berbanding harga yang mahal nak mati.", 2, "Google Reviews", "Sabri"),
    ("Sangat tidak berbaloi, harga nasi goreng kosong sampai RM25.", 1, "Google Reviews", "Khairul"),
    ("Portion makanan tersangat sikit berbanding harga premium yang dikenakan.", 2, "Google Reviews", "Syakir"),
    ("Air kosong biasa dicaj RM5 segelas, ini harga peras ugut pelanggan.", 1, "Google Reviews", "Latif"),
    ("Harga melampau mahal untuk kedai tepi jalan, tidak berbaloi langsung.", 1, "Google Reviews", "Nordin"),
    ("Dah la mahal, portion macam nak bagi kucing makan. Tak berbaloi langsung.", None, "X (Twitter)", "@kakimakan99"),
    ("Excessive pricing for standard quality fusion food. Double charge on service tax.", 2, "Google Reviews", "Lim"),
    ("Caj tersembunyi banyak sangat, harga kat menu tak sama dengan resit.", 1, "Google Reviews", "Safuan"),
    
    # Nilai & Harga (Positive)
    ("Harga berbaloi dengan portion yang besar! Kualiti makanan pun tiptop.", 5, "Google Reviews", "Syawal"),
    ("Nasi ayam berempah dia murah dan sedap gila. Value for money!", 5, "Google Reviews", "Safri"),
    ("Affordable prices for a premium cafe vibes. Will come again.", 5, "Google Reviews", "Iqbal"),
    
    # Suasana & Keselesaan (Negative)
    ("Pendingin hawa bocor dan air menitis atas meja makan pelanggan.", 1, "Google Reviews", "Nizam"),
    ("Bising nak mampos, muzik yang dipasang terlalu kuat sampai sakit telinga.", 2, "Google Reviews", "Salmah"),
    ("Ruang makan terlalu sempit dan kerusi kayu keras sangat tidak selesa.", 2, "Google Reviews", "Rashid"),
    ("Kedai sangat panas, kipas angin berpusing lambat macam nak rosak.", 2, "Google Reviews", "Ghazali"),
    ("Aircond rosak kot, makan kat dalam pun berpeluh macam kat mamak luar.", 1, "Google Reviews", "Daud"),
    ("Tables are too close to each other, absolutely no privacy. Very noisy.", 2, "Google Reviews", "Cheah"),
    ("Bau asap rokok dari luar masuk ke dalam cafe sebab pintu tak rapat.", 2, "Google Reviews", "Rosnah"),
    ("Lighting malap sangat sampai tak nampak makanan. Mata sakit.", 2, "Google Reviews", "Hanif"),
    
    # Suasana & Keselesaan (Positive)
    ("Aesthetic pastel interior! Sangat cozy dan sesuai untuk tangkap gambar.", None, "Instagram", "@aestheticcafe"),
    ("Soft acoustic background music, very relaxing and comfortable environment.", 5, "Google Reviews", "Suhaimi"),
    ("Air conditioning is cold and environment is super cozy. Love it!", 5, "Google Reviews", "Akmal"),
    
    # Kualiti Makanan (Negative)
    ("Ayam goreng dia sejuk n keras gila, macam ayam semalam.", 1, "Google Reviews", "Khairuddin"),
    ("Spaghetti carbonara dia muak n hanyir gila, tak boleh go.", 1, "Google Reviews", "Rafiq"),
    ("Fries soggy and cold. Rasa macam dah goreng awal-awal pastu biar je.", 1, "Google Reviews", "Shafiq"),
    ("Spaghetti Carbonara too greasy and had a weird cheese smell.", 1, "Google Reviews", "Zul"),
    ("Nasi lemak dia sejuk, sambal rasa tawar tak cukup masak.", 2, "Google Reviews", "Nazri"),
    ("Kek coklat kering gila, rasa macam dah simpan dalam peti ais seminggu.", 1, "Google Reviews", "Fauziah"),
    ("Daging kambing liat macam getah tayar, penat nak mengunyah.", 1, "Google Reviews", "Sidi"),
    ("Soup was served cold and tastes like instant canned soup.", 2, "Google Reviews", "Hamid"),
    
    # Kualiti Makanan (Positive)
    ("Mee kari dia padu gila, kuah pekat dan banyak seafood. Sedap!", 5, "Google Reviews", "Syukri"),
    ("The salted egg pasta was creamy and rich. Perfect taste!", 5, "Google Reviews", "Alex"),
    ("Chocolate muffin was warm and moist, loaded with chocolate chips.", 5, "Google Reviews", "Farhan"),
    ("Robust freshly brewed coffee standard. Excellent bean selection.", 5, "Google Reviews", "Yunus"),
    
    # Kemudahan Asas (Negative)
    ("Tempat ok tapi parking susah gila nak mampos.", 2, "Google Reviews", "Badrul"),
    ("Parking space is very limited, had to double park and block others.", 2, "Google Reviews", "Shukor"),
    ("Tandas cafe ni rosak, terpasa tumpang tandas stesen minyak sebelah.", 1, "Google Reviews", "Hisham"),
    ("No wheelchair ramp access, hard for disabled customers.", 2, "Google Reviews", "Razif"),
    ("Wifi signal is very weak, couldn't connect at all to do work.", 2, "Google Reviews", "Hafiz")
]

def _mock_google_reviews(count: int) -> list[dict]:
    # Filter the pool to only include Google Reviews
    pool = [r for r in REVIEWS_DEMO_POOL if r[2] == "Google Reviews"]
    sampled = random.sample(pool, min(count, len(pool)))
    
    reviews = []
    now = datetime.now()
    for i, (text, rating, platform, name) in enumerate(sampled):
        # Generate dynamic timestamps near current time
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
    # Filter the pool to include X, IG, TikTok
    pool = [r for r in REVIEWS_DEMO_POOL if r[2] != "Google Reviews"]
    sampled = random.sample(pool, min(count, len(pool)))
    
    mentions = []
    now = datetime.now()
    for i, (text, rating, platform, username) in enumerate(sampled):
        date_str = (now - timedelta(minutes=(i+7)*2)).isoformat()
        mentions.append({
            "platform": platform,
            "teks_ulasan": text,
            "bintang": rating,
            "tarikh": date_str,
            "nama_pengguna": username
        })
    return mentions
