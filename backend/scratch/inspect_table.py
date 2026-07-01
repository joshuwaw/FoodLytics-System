import sys
import os
sys.path.append(os.getcwd())
from database import supabase

def inspect_table():
    try:
        res = supabase.table('tbl_cadangan_ai').select('*').limit(1).execute()
        if res.data:
            print("Columns in tbl_cadangan_ai:")
            print(res.data[0].keys())
        else:
            print("Table tbl_cadangan_ai is empty, but query succeeded.")
            print(res.data)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_table()
