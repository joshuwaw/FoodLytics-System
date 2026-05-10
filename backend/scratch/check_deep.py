import sys
import os
sys.path.append(os.getcwd())
from database import supabase

def check_deep():
    try:
        # Premise 1
        pid = 1
        
        # Feedbacks
        fb_res = supabase.table('tbl_maklumbalas').select('id_maklum_balas').eq('id_premis', pid).execute()
        fb_ids = [r['id_maklum_balas'] for r in fb_res.data]
        print(f"Premise {pid} Feedbacks: {len(fb_ids)}")
        
        # AI Logs
        ai_res = supabase.table('tbl_enjin_ai').select('id_log_proses', 'id_maklum_balas').in_('id_maklum_balas', fb_ids).execute()
        ai_logs = ai_res.data or []
        log_ids = [r['id_log_proses'] for r in ai_logs]
        print(f"Premise {pid} AI Logs: {len(ai_logs)}")
        
        # Topics
        topik_res = supabase.table('tbl_topik').select('id_log_proses', 'label_topik').in_('id_log_proses', log_ids).execute()
        topics = topik_res.data or []
        print(f"Premise {pid} Topics: {len(topics)}")
        
        if topics:
            print(f"Sample Topic: {topics[0]}")
        else:
            # Check if topics exist at all without filtering
            all_t = supabase.table('tbl_topik').select('id_log_proses').limit(5).execute()
            print(f"All Topics (first 5): {all_t.data}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_deep()
