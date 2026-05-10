from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_KEY

def get_supabase() -> Client:
    # We initialize the client inside a function so it can be injected as a dependency
    # or just imported, allowing easier testing.
    return create_client(SUPABASE_URL, SUPABASE_KEY)

supabase = get_supabase()
