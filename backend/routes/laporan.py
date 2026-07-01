from fastapi import APIRouter, HTTPException, Depends

from database import supabase
from datetime import datetime
from .customer import get_sentiment_stats, get_recent_feedback, get_feedback_by_source

router = APIRouter()

@router.get("/generate/{id_premis}")
def generate_laporan_data(id_premis: int, bulan: str = None):
    try:
        # Fetch Premise Details
        premis_res = supabase.table("tbl_premis").select("*").eq("id_premis", id_premis).execute()
        if not premis_res.data:
            raise HTTPException(status_code=404, detail="Premis tidak dijumpai")
        premis = premis_res.data[0]

        if not bulan:
            bulan = datetime.now().strftime("%Y-%m")
            
        # Fetch Real Data
        stats = get_sentiment_stats(id_premis)
        source_stats = get_feedback_by_source(id_premis)
        recent = get_recent_feedback(id_premis, limit=20)
        
        return {
            "premis": premis,
            "bulan": bulan,
            "stats": stats,
            "source_stats": source_stats,
            "recent": recent
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch report data: {str(e)}")
