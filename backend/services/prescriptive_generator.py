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

def generate_prescriptive_drafts(premise_id: int, supabase_client) -> dict:
    """
    Enterprise-Grade Prescriptive Analytics (Increment 5).
    Features:
    1. Direct filtering of Aspect-Based negative topics.
    2. Statistical Impact/Severity estimation (heuristic-based).
    3. Root Cause Analysis (5 Whys) via Qwen LLM.
    4. Department Routing.
    """
    print(f"[Prescriptive] Generating drafts for premise {premise_id}...")

    try:
        # Clear old drafts that haven't been approved yet so frontend polling doesn't stop early
        supabase_client.table("tbl_cadangan_ai").delete().eq("id_premis", premise_id).eq("status_kelulusan", "Draf").execute()

        # 1. Fetch topics directly from this premise that are negative
        # We need to join tbl_topik -> tbl_enjin_ai -> tbl_maklumbalas to filter by premise
        # For simplicity, we fetch all feedbacks for this premise first.
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
        
        API_URL = "https://router.huggingface.co/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {HUGGINGFACE_API_KEY}",
            "Content-Type": "application/json"
        }
        
        for label, count in topic_counts.items():
            if "Lain-lain" in label:
                continue
                
            rep_topic = topic_examples[label][0]
            dept = _get_department_routing(label)
            clean_label = label.replace(" (Negatif)", "")
            
            # Formulate texts for prompt
            texts_list = topic_examples_text[label][:5]
            texts_formatted = "\n- ".join(texts_list) if texts_list else "(Tiada teks spesifik dikesan)"
            
            # Enterprise 5-Whys Prompt
            prompt = f"""Sebagai Penganalisis Operasi Restoran Gred-Enterpris, jalankan analisis punca akar (Root Cause Analysis - 5 Whys) ke atas {count} aduan pelanggan mengenai '{clean_label}':
Ulasan:
- {texts_formatted}

Sila berikan jawapan dalam format JSON yang mengandungi kunci berikut SAHAJA:
{{"isu_pendek": "Frasa 3-5 perkataan masalah utama. Cth: 'Pelayan Kasar' atau 'Makanan Mentah'", "isu_panjang": "Penjelasan punca akar (Root Cause) menggunakan kaedah 5 Whys. Terangkan kenapa masalah ini berlaku secara sistematik.", "saranan_strategik": "Satu tindakan penyelesaian kekal (Permanent Corrective Action) berserta KPI untuk dipantau oleh pengurus."}}"""

            payload = {
                "model": "meta-llama/Meta-Llama-3-8B-Instruct",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 300,
                "temperature": 0.3
            }
            
            punca = f"{clean_label} {dept}|||Isu dikesan daripada {count} aduan. Menjalankan analisis manual..."
            saranan = f"{dept} Siasat punca dan lakukan tindakan pembetulan."
            
            try:
                print(f"[Prescriptive] Calling HF API for {label} ({count} issues)...")
                hf_res = httpx.post(API_URL, headers=headers, json=payload, timeout=25.0)
                if hf_res.status_code == 200:
                    data = hf_res.json()
                    content = data["choices"][0]["message"]["content"]
                    json_str = re.search(r'\{[\s\S]*\}', content)
                    if json_str:
                        ai_out = json.loads(json_str.group())
                        if "isu_pendek" in ai_out and "isu_panjang" in ai_out and "saranan_strategik" in ai_out:
                            punca = f"{ai_out['isu_pendek']} {dept}|||{ai_out['isu_panjang']}"
                            saranan = ai_out["saranan_strategik"]
                else:
                    print(f"[Prescriptive] HF API non-200: {hf_res.text}")
            except Exception as e:
                print(f"[Prescriptive] HF API error for {label}: {e}")
                
                # Smart Local Fallback based on topic
                l = clean_label.lower()
                if "layanan" in l or "pekerja" in l or "pelayan" in l:
                    punca = f"Isu SOP Layanan {dept}|||Pekerja mungkin keletihan atau kurang latihan (SOP tidak jelas). Kegagalan mematuhi standard perkhidmatan pelanggan ketika waktu puncak."
                    saranan = "Adakan sesi latihan semula 'Hospitality 101' dan wujudkan sistem pusingan rehat yang lebih baik untuk pekerja barisan hadapan."
                elif "makanan" in l or "rasa" in l or "kualiti" in l:
                    punca = f"Kualiti Resepi Bervariasi {dept}|||Ketidakpatuhan kepada resipi standard di dapur. Kekurangan kawalan kualiti (QC) sebelum makanan dihidangkan."
                    saranan = "Kuatkuasakan penggunaan kad resipi standard dan wajibkan ketua cef merasa sampel (spot check) secara rawak setiap hari."
                elif "masa" in l or "lambat" in l or "menunggu" in l:
                    punca = f"Kesesakan Stesen Dapur {dept}|||Aliran kerja dapur tidak dioptimumkan untuk pesanan yang tinggi. Proses penyediaan (prep-work) yang tidak mencukupi sebelum waktu puncak."
                    saranan = "Semak semula sistem aliran tiket (KDS) dan tambahkan masa 'prep' wajib untuk bahan-bahan kritikal sejam sebelum waktu puncak bermula."
                elif "harga" in l or "mahal" in l:
                    punca = f"Ketidaksepadanan Nilai {dept}|||Pelanggan merasakan saiz hidangan tidak berbaloi dengan harga yang dibayar berikutan kos bahan mentah yang meningkat."
                    saranan = "Nilai semula persembahan hidangan (plating) supaya kelihatan lebih premium atau tawarkan set kombo untuk menonjolkan 'value for money'."
                elif "bersih" in l or "kotor" in l or "suasana" in l:
                    punca = f"Pengabaian Rutin Sanitasi {dept}|||Jadual pembersihan berkala tidak ditandatangani atau diabaikan oleh pekerja semasa operasi sibuk."
                    saranan = "Laksanakan senarai semak pembersihan sejam sekali (Hourly Cleaning Checklist) di meja dan tandas yang disahkan oleh pengurus."
                else:
                    punca = f"Ketidakcekapan Operasi ({clean_label}) {dept}|||Proses semasa untuk menangani isu ini tiada pemantauan yang konsisten."
                    saranan = "Lantik seorang penyelia khusus untuk memantau proses ini dan wujudkan satu KPI baharu untuk dinilai pada akhir bulan."

            # Impact scoring heuristic (Severity based on volume)
            confidence = min(75 + (count * 5), 98) # Scales with frequency

            drafts_to_insert.append({
                "id_premis": premise_id,
                "id_topik": rep_topic["id_topik"],
                "id_log_proses": rep_topic["id_log_proses"],
                "jenis_tindakan": "Isu",
                "analisis_punca": punca,
                "saranan_strategik": saranan,
                "skor_keyakinan": confidence,
                "status_kelulusan": "Draf",
                "status_pelaksanaan": "Baru"
            })

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
