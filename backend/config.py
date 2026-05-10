import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY") or os.getenv("HF_TOKEN")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
USE_GPU = os.getenv("USE_GPU", "true")  # Set to "false" on CPU-only hosting

