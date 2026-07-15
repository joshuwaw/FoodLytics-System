import random
import httpx
import json
import re
from config import HUGGINGFACE_API_KEY

def _get_department_routing(topic_label: str) -> str:
    """Enterprise feature: Routes topics to specific departments"""
    label = topic_label.lower()
    if "staf" in label or "layanan" in label or "tunggu" in label or "masa" in label:
        return "[Front-of-House]"
    if "makanan" in label or "kualiti" in label or "pembungkusan" in label:
        return "[Dapur]"
    if "kebersihan" in label or "suasana" in label:
        return "[Penyelenggaraan]"
    if "harga" in label or "nilai" in label:
        return "[Pengurusan]"
    return "[Umum]"

def _process_single_topic_worker(label: str, count: int, rep_topic: dict, texts_list: list, HUGGINGFACE_API_KEY: str) -> dict:
    """
    Worker function to process a single topic concurrently.
    Makes the Hugging Face API call with retries and a tight 8.0s timeout.
    Returns the formatted draft payload, or None if the request fails/times out.
    """
    if not HUGGINGFACE_API_KEY:
        print(f"[Prescriptive] Skipping {label} because HUGGINGFACE_API_KEY is missing.")
        return None

    dept = _get_department_routing(label)
    clean_label = label.replace(" (Negatif)", "")
    texts_formatted = "\n- ".join(texts_list) if texts_list else "(Tiada teks spesifik dikesan)"
    
    prompt = f"""Sebagai Penganalisis Operasi Restoran Gred-Enterpris, jalankan analisis ke atas aduan pelanggan mengenai '{clean_label}' dalam Bahasa Melayu Malaysia (Standard Malay).

Ulasan Pelanggan:
- {texts_formatted}

Sila berikan jawapan anda dalam format JSON yang sah (valid JSON) dengan kunci berikut SAHAJA. JANGAN letak sebarang teks penjelasan di luar JSON. Tulis keseluruhan kandungan di dalam Bahasa Melayu Malaysia.

SYARAT BAHASA & PRESTASI (PENTING):
1. JANGAN salin tampal (copy-paste) bulat-bulat ulasan pelanggan dalam bahasa Inggeris/slang. Anda MESTILAH menterjemah dan menghuraikan semula (paraphrase) bukti tersebut ke dalam Bahasa Melayu Malaysia yang kemas dan profesional.
2. Patuhi kamus terjemahan istilah berikut untuk mengelakkan perkataan Indonesia / salah guna bahasa:
   - JANGAN guna 'antrian' / 'antrean' -> Guna 'barisan' atau 'sistem giliran'.
   - JANGAN guna 'karyawan' -> Guna 'staf', 'pekerja' atau 'kru'.
   - JANGAN guna 'pelayanan' -> Guna 'perkhidmatan' or 'layanan'.
   - JANGAN guna 'toilet' -> Guna 'tandas'.
   - JANGAN guna 'air conditioner' / 'ac' -> Guna 'pendingin hawa'.
   - JANGAN guna 'kebisingan' -> Guna 'keadaan bising' atau 'suasana bising'.
   - JANGAN guna 'pemesanan' -> Guna 'pesanan'.
   - JANGAN guna 'kasir' -> Guna 'juruwang'.
   - JANGAN guna 'rekomendasi' -> Guna 'cadangan'.
   - JANGAN guna 'umpan balik' / 'balas balik' -> Guna 'maklum balas'.
   - JANGAN guna 'evaluasi' -> Guna 'penilaian' atau 'audit'.
   - JANGAN guna 'pelatihan' -> Guna 'latihan' atau 'taklimat'.
   - JANGAN guna 'performa' -> Guna 'prestasi' atau 'kualiti kerja'.
   - JANGAN guna 'mengecek' -> Guna 'memeriksa', 'menyemak' atau 'memantau'.
   - JANGAN guna 'himbau' / 'dihimbau' -> Guna 'disarankan', 'digalakkan' atau 'diminta'.
   - JANGAN guna 'antre' -> Guna 'beratur'.
   - JANGAN guna 'sore' -> Guna 'petang'.
   - JANGAN guna 'akhir pekan' -> Guna 'hujung minggu'.
   - JANGAN guna 'nyaman' (untuk tempat/tempat duduk) -> Guna 'selesa'.
   - JANGAN guna 'parkir' -> Guna 'tempat letak kereta' atau 'kawasan parkir'.
   - JANGAN guna 'kontinu' / 'terus menerus' -> Guna 'berterusan' atau 'secara berkala'.
   - JANGAN guna 'manajer' -> Guna 'pengurus'.
3. Tajuk isu ("problem") MESTILAH menggunakan tatabahasa Melayu yang betul dan bermakna logik.
   - JANGAN terjemah 'Basic Facilities' / 'Kemudahan Asas' kepada istilah pelik seperti 'Kurang Berasas' atau 'Kurang Berkemudahan'.
   - JANGAN terjemah secara literal 'No Taste' atau 'Bland' kepada 'Tidak Rasa' atau 'Rasa Rendah'. Gunakan istilah bahasa Melayu standard seperti **'Makanan Tawar / Hambar'** atau **'Makanan Kurang Sedap'**.
   - JANGAN terjemah 'High Price, Low Value' secara literal kepada 'Harga Meningkat & Rasa Rendah'. Gunakan istilah standard seperti **'Harga Tidak Sepadan Kualiti'** atau **'Harga Menu Terlalu Mahal'**.
   - Gunakan nama isu sebenar yang ringkas seperti 'Masalah Tandas & Parkir', 'Tandas Kotor', 'Tempat Letak Kereta Terhad', 'Kualiti Makanan Merosot', atau 'Layanan Staf Lambat'.

Format Jawapan:
{{
  "problem": "Satu tajuk isu yang sangat pendek, logik, dan menggunakan BM standard (maksimum 4-5 perkataan, e.g., 'Tandas Kotor & Bau' atau 'Masa Menunggu Lama'). JANGAN letak kurungan [Department] atau [[Department]] di sini.",
  "evidence": [
    "Huraian bukti ringkas 1 diterjemah dalam BM standard (e.g., 'Pelanggan terpaksa beratur selama 45 minit pada hujung minggu.')",
    "Huraian bukti ringkas 2 diterjemah dalam BM standard (e.g., 'Kawasan tempat letak kereta sangat terhad semasa waktu puncak.')",
    "Huraian bukti ringkas 3 diterjemah dalam BM standard (jika ada, maksimum 12 perkataan)"
  ],
  "tindakan_staf": "Tindakan praktikal untuk staf operasi dalam BM standard (1 kalimat).",
  "tindakan_pengurus": "Tindakan praktikal untuk pengurus cawangan dalam BM standard (1 kalimat)."
}}

Sila jana jawapan untuk aduan '{clean_label}' sekarang:"""

    API_URL = "https://router.huggingface.co/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {HUGGINGFACE_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "Qwen/Qwen2.5-7B-Instruct",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 800,
        "temperature": 0.3
    }

    attempts = 3
    for attempt in range(attempts):
        try:
            print(f"[Prescriptive] Calling HF API for {label} ({count} issues) - Attempt {attempt+1}/{attempts}...")
            # Reduced timeout to 8.0s per request to avoid blocking
            hf_res = httpx.post(API_URL, headers=headers, json=payload, timeout=8.0)
            
            if hf_res.status_code == 200:
                data = hf_res.json()
                content = data["choices"][0]["message"]["content"]
                json_str = re.search(r'\{[\s\S]*\}', content)
                if json_str:
                    cleaned_json = re.sub(r'[\r\n\t]+', ' ', json_str.group())
                    ai_out = json.loads(cleaned_json)
                    normalized_ai_out = {k.lower().replace(" ", "_"): v for k, v in ai_out.items()}
                    
                    if "problem" in normalized_ai_out and "evidence" in normalized_ai_out:
                        problem_val = normalized_ai_out.get("problem", "").strip()
                        evidence_data = normalized_ai_out.get("evidence", [])
                        tindakan_staf_val = normalized_ai_out.get("tindakan_staf", "")
                        tindakan_pengurus_val = normalized_ai_out.get("tindakan_pengurus", "")
                        
                        if isinstance(evidence_data, list):
                            evidence_val = "\n".join([f"- {str(e).strip()}" for e in evidence_data if str(e).strip()])
                        else:
                            evidence_val = f"- {str(evidence_data).strip()}"
                        
                        punca = f"{problem_val} [{dept}]|||{evidence_val}"
                        saranan = json.dumps({
                            "tindakan_staf": tindakan_staf_val,
                            "tindakan_pengurus": tindakan_pengurus_val
                        })
                        
                        confidence = min(75 + (count * 5), 98)
                        return {
                            "id_premis": rep_topic["id_premis"],
                            "id_topik": rep_topic["id_topik"],
                            "id_log_proses": rep_topic["id_log_proses"],
                            "jenis_tindakan": "Isu",
                            "analisis_punca": punca,
                            "saranan_strategik": saranan,
                            "skor_keyakinan": confidence,
                            "status_kelulusan": "Draf",
                            "status_pelaksanaan": "Baru"
                        }
            elif hf_res.status_code in [429, 503]:
                print(f"[Prescriptive] HF API busy ({hf_res.status_code}) for {label}. Retrying...")
                time.sleep(2)
            else:
                print(f"[Prescriptive] HF API non-200 for {label}: {hf_res.text}")
                break
        except Exception as e:
            print(f"[Prescriptive] HF API error for {label} (Attempt {attempt+1}): {e}")
            time.sleep(1)

    print(f"[Prescriptive] HF API request for {label} failed or timed out. Skipping suggestion (no local template fallback).")
    return None

def generate_prescriptive_drafts(premise_id: int, supabase_client) -> dict:
    """
    Enterprise-Grade Prescriptive Analytics (Increment 5).
    Runs parallel LLM queries using ThreadPoolExecutor and bypasses local fallback on failure.
    """
    print(f"[Prescriptive] Generating drafts for premise {premise_id}...")

    try:
        # Load existing process log IDs that already have recommendations
        existing_res = supabase_client.table("tbl_cadangan_ai")\
            .select("id_log_proses")\
            .eq("id_premis", premise_id)\
            .execute()
        existing_log_ids = {r["id_log_proses"] for r in existing_res.data or [] if r.get("id_log_proses") is not None}

        # 1. Fetch topics directly from this premise that are negative
        fb_res = supabase_client.table("tbl_maklumbalas").select("id_maklum_balas, ulasan_teks").eq("id_premis", premise_id).execute()
        fb_ids = [f["id_maklum_balas"] for f in fb_res.data or []]
        fb_map = {f["id_maklum_balas"]: f.get("ulasan_teks", "") for f in fb_res.data or []}
        
        if not fb_ids:
            return {"drafts_generated": 0, "error": "No feedback found"}

        # Get the AI logs for these feedbacks
        enjin_res = supabase_client.table("tbl_enjin_ai")\
            .select("id_log_proses, id_maklum_balas")\
            .in_("id_maklum_balas", fb_ids)\
            .execute()
            
        log_process_ids = [e["id_log_proses"] for e in enjin_res.data or []]
        log_process_map = {e["id_log_proses"]: e["id_maklum_balas"] for e in enjin_res.data or []}

        if not log_process_ids:
            return {"drafts_generated": 0, "error": "No AI logs found."}

        # Filter only log IDs that have Negatif sentiment
        sentimen_res = supabase_client.table("tbl_sentimen")\
            .select("id_log_proses")\
            .in_("id_log_proses", log_process_ids)\
            .eq("label_sentimen", "Negatif")\
            .execute()
            
        negative_log_ids = [s["id_log_proses"] for s in sentimen_res.data or []]
        
        if not negative_log_ids:
            return {"drafts_generated": 0, "error": "No negative aspects detected to prescribe actions for."}

        # Fetch topics for those negative logs
        topics_res = supabase_client.table("tbl_topik")\
            .select("id_topik, id_log_proses, label_topik")\
            .in_("id_log_proses", negative_log_ids)\
            .execute()
            
        topics = topics_res.data or []
        if not topics:
            return {"drafts_generated": 0, "error": "No negative aspects detected to prescribe actions for."}
        
        # 2. Group by label_topik to prioritize the most pressing issues
        topic_counts = {}
        topic_examples = {}
        topic_examples_text = {}
        
        for t in topics:
            label = t["label_topik"]
            log_id = t["id_log_proses"]
            fb_id = log_process_map.get(log_id)
            text = fb_map.get(fb_id, "") if fb_id else ""
            
            if label not in topic_counts:
                topic_counts[label] = 0
                topic_examples[label] = []
                topic_examples_text[label] = []
            topic_counts[label] += 1
            topic_examples[label].append(t)
            if text:
                topic_examples_text[label].append(text)

        drafts_to_insert = []
        MIN_REVIEW_THRESHOLD = 5
        
        # Prepare list of tasks for parallel workers
        workers_tasks = []
        for label, count in topic_counts.items():
            if "Lain-lain" in label:
                continue
                
            if count < MIN_REVIEW_THRESHOLD:
                print(f"[Prescriptive] Topic '{label}' only has {count} reviews (Threshold: {MIN_REVIEW_THRESHOLD}). Skipping.")
                continue
                
            rep_topic = topic_examples[label][0]
            if rep_topic["id_log_proses"] in existing_log_ids:
                print(f"[Prescriptive] Log ID {rep_topic['id_log_proses']} ('{label}') already has a recommendation. Skipping.")
                continue
            
            # Pack parameters
            texts_list = topic_examples_text[label][:5]
            workers_tasks.append((label, count, rep_topic, texts_list))

        # 3. Parallel execution using ThreadPoolExecutor
        if workers_tasks:
            # Run up to 4 parallel workers concurrently
            max_workers = min(len(workers_tasks), 4)
            print(f"[Prescriptive] Triggering {len(workers_tasks)} LLM generation tasks in parallel (max_workers={max_workers})...")
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                futures = [
                    executor.submit(
                        _process_single_topic_worker,
                        label, count, rep_topic, texts_list,
                        HUGGINGFACE_API_KEY
                    )
                    for label, count, rep_topic, texts_list in workers_tasks
                ]
                
                for fut in futures:
                    draft = fut.result()
                    if draft:
                        drafts_to_insert.append(draft)

        # 4. Insert successfully generated drafts into DB
        if drafts_to_insert:
            supabase_client.table("tbl_cadangan_ai").insert(drafts_to_insert).execute()
            
        print(f"[Prescriptive] Generated {len(drafts_to_insert)} enterprise drafts.")
        return {"drafts_generated": len(drafts_to_insert), "error": None}

    except Exception as e:
        print(f"[Prescriptive] Error: {e}")
        return {"drafts_generated": 0, "error": str(e)}

if __name__ == "__main__":
    import dotenv, os, sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    dotenv.load_dotenv()
    
    # Simple test for department routing
    print("Masa Menunggu ->", _get_department_routing("Masa Menunggu"))
    print("Kualiti Makanan ->", _get_department_routing("Kualiti Makanan"))
