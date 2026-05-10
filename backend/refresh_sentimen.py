import sys
import os
sys.path.append(os.getcwd())
from database import supabase
from services.sentiment import analyse_sentiment

def refresh_sentiment():
    print("Fetching feedbacks...")
    fb_res = supabase.table("tbl_maklumbalas").select("*").execute()
    feedbacks = fb_res.data or []
    
    print(f"Processing {len(feedbacks)} feedbacks...")
    updates = []
    for f in feedbacks:
        res = analyse_sentiment(
            f["ulasan_teks"],
            f["bilangan_bintang"],
            f["rating_makanan"],
            f["rating_layanan"],
            f["rating_suasana"]
        )
        
        # Find existing sentimen record
        sent_res = supabase.table("tbl_sentimen").select("id_sentimen").eq("id_maklum_balas", f["id_maklum_balas"]).execute()
        if sent_res.data:
            sid = sent_res.data[0]["id_sentimen"]
            supabase.table("tbl_sentimen").update({
                "label_sentimen": res["sentimen"],
                "skor_ketepatan": res["skor"]
            }).eq("id_sentimen", sid).execute()
            print(f"Updated FB {f['id_maklum_balas']}: {res['sentimen']}")

if __name__ == "__main__":
    refresh_sentiment()
