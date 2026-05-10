import sys
import os
sys.path.append(os.getcwd())
try:
    from services.topic_modeling import run_topic_analysis
    print("Import successful")
except Exception as e:
    import traceback
    traceback.print_exc()
