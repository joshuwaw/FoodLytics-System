import sys
import os
sys.path.append(os.getcwd())
from database import supabase

def test_get_topics(premise_id: int):
    print(f"Testing for premise {premise_id}")
    try:
        # This is the logic inside the GET /topics/{premise_id} endpoint
        res = supabase.table("tbl_maklumbalas") \
            .select("id_maklum_balas") \
            .eq("id_premis", premise_id) \
            .execute()
        fb_ids = [f["id_maklum_balas"] for f in (res.data or [])]
        print(f"Found {len(fb_ids)} feedbacks")
        
        # Get AI log IDs
        enjin_res = supabase.table("tbl_enjin_ai") \
            .select("id_log_proses") \
            .in_("id_maklum_balas", fb_ids) \
            .execute()
        log_ids = [r["id_log_proses"] for r in (enjin_res.data or [])]
        print(f"Found {len(log_ids)} AI logs")
        
        # Get topics
        topic_res = supabase.table("tbl_topik") \
            .select("label_topik, skor_topik, id_log_proses") \
            .in_("id_log_proses", log_ids) \
            .execute()
        print(f"Found {len(topic_res.data or [])} topic records")
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_get_topics(1)
