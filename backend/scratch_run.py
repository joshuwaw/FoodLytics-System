import sys
import os
sys.path.append(os.getcwd())
from database import supabase
from services.topic_modeling import run_topic_analysis

try:
    print("Running...")
    res = run_topic_analysis(1, supabase)
    print("Result:", res)
except Exception as e:
    import traceback
    traceback.print_exc()
