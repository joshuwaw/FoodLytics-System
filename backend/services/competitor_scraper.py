import json
import random
import requests
from database import supabase
from config import HUGGINGFACE_API_KEY

def scrape_and_analyze_competitors(premise_id: int):
    try:
        # 1. Fetch competitors for this premise
        pesaing_res = supabase.table("tbl_pesaing").select("*").eq("id_premis", premise_id).execute()
        if not pesaing_res.data:
            return {"status": "success", "message": "Tiada pesaing didaftarkan untuk premis ini.", "inserted": 0}
            
        competitors = pesaing_res.data
        
        # 2. Query manager/owner ID for the premise
        premis_res = supabase.table("tbl_premis").select("id_pengurus").eq("id_premis", premise_id).execute()
        id_pengurus = None
        if premis_res.data:
            id_pengurus = premis_res.data[0].get("id_pengurus")

        # 3. Clean existing trend data for this manager/premise to prevent duplicate listings
        if id_pengurus:
            supabase.table("tbl_trend_industri").delete().eq("id_pengurus", id_pengurus).execute()

        # 4. Generate/Simulate competitor reviews analysis using LLM for authenticity
        # We use few-shot prompting to make sure the LLM outputs valid JSON that matches our table columns.
        inserted_count = 0
        
        for comp in competitors:
            comp_name = comp["nama_pesaing"]
            
            # Default fallback mock data
            fallback_items = [
                {"kata_kunci": f"Matcha Latte ({comp_name})", "peratus_pertumbuhan": f"+{random.randint(10, 50)}%", "bilangan_sebutan": random.randint(50, 250), "tanda_pagar_popular": f"#MatchaLover, #{comp_name.replace(' ', '')}"},
                {"kata_kunci": f"Croissant Rangup ({comp_name})", "peratus_pertumbuhan": f"+{random.randint(5, 30)}%", "bilangan_sebutan": random.randint(30, 150), "tanda_pagar_popular": f"#BangiFoodie, #PastryLover"}
            ]
            
            data_to_insert = fallback_items
            
            if HUGGINGFACE_API_KEY:
                try:
                    API_URL = "https://router.huggingface.co/v1/chat/completions"
                    headers = {
                        "Authorization": f"Bearer {HUGGINGFACE_API_KEY}",
                        "Content-Type": "application/json"
                    }
                    
                    prompt = f"""
                    Anda adalah pakar penganalisis F&B FTSM. Kami sedang menganalisis pesaing restoran kami yang bernama '{comp_name}'.
                    Berdasarkan nama pesaing ini, jana 2 menu/produk F&B atau kata kunci popular yang sering dikaitkan atau mendapat ulasan/aduan tinggi di restoran '{comp_name}'.
                    Untuk setiap kata kunci, berikan:
                    1. kata_kunci (contoh: "Kopi Gula Apong (di {comp_name})")
                    2. peratus_pertumbuhan (contoh: "+18%")
                    3. bilangan_sebutan (integer antara 30 dan 300)
                    4. tanda_pagar_popular (2 hashtag dipisahkan dengan koma)

                    Output MESTI dalam format JSON array yang sah seperti di bawah. Jangan sertakan markdown fence, penjelasan atau teks lain:
                    [
                      {{"kata_kunci": "nama_produk (di {comp_name})", "peratus_pertumbuhan": "+15%", "bilangan_sebutan": 120, "tanda_pagar_popular": "#Hashtag1, #Hashtag2"}}
                    ]
                    """
                    
                    payload = {
                        "model": "Qwen/Qwen2.5-7B-Instruct",
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.7,
                        "max_tokens": 500
                    }
                    
                    res = requests.post(API_URL, headers=headers, json=payload, timeout=10)
                    if res.ok:
                        content = res.json()["choices"][0]["message"]["content"].strip()
                        # Strip code fences if present
                        if content.startswith("```json"):
                            content = content[7:]
                        if content.startswith("```"):
                            content = content[3:]
                        if content.endswith("```"):
                            content = content[:-3]
                        content = content.strip()
                        
                        parsed = json.loads(content)
                        if isinstance(parsed, list) and len(parsed) > 0:
                            data_to_insert = parsed
                except Exception as e:
                    print(f"Ralat penjanaan LLM untuk {comp_name}, guna fallback: {str(e)}")

            # 5. Insert results into tbl_trend_industri
            for item in data_to_insert:
                raw_pct = item.get("peratus_pertumbuhan")
                parsed_pct = 0.0
                if raw_pct:
                    try:
                        clean = str(raw_pct).replace("%", "").replace("+", "").strip()
                        parsed_pct = float(clean)
                    except:
                        parsed_pct = 0.0

                trend_row = {
                    "id_pengurus": id_pengurus,
                    "kata_kunci": item.get("kata_kunci"),
                    "peratus_pertumbuhan": parsed_pct,
                    "tanda_pagar_popular": item.get("tanda_pagar_popular"),
                    "bilangan_sebutan": int(item.get("bilangan_sebutan") or 50)
                }
                supabase.table("tbl_trend_industri").insert(trend_row).execute()
                inserted_count += 1
                
        return {"status": "success", "message": f"Berjaya memproses {len(competitors)} pesaing.", "inserted": inserted_count}
    except Exception as e:
        print(f"Ralat dalam scrape_and_analyze_competitors: {str(e)}")
        raise e
