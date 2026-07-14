from fastapi import APIRouter, HTTPException
from typing import List, Any
from database import supabase
from models import CadanganResponse, CadanganUpdate
from datetime import datetime

router = APIRouter()

@router.get("/{premise_id}/drafts", response_model=List[CadanganResponse])
def get_drafts(premise_id: int):
    try:
        res = supabase.table("tbl_cadangan_ai")\
            .select("*")\
            .eq("id_premis", premise_id)\
            .in_("status_kelulusan", ["Draf", "Simpan", "Lulus", "Tolak"])\
            .order("id_cadangan", desc=True)\
            .execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.put("/approve/{cadangan_id}", response_model=CadanganResponse)
def approve_draft(cadangan_id: int, update: CadanganUpdate):
    try:
        # Require id_pengurus_lulus
        if not update.id_pengurus_lulus:
            raise HTTPException(status_code=400, detail="ID Pengurus is required to approve.")

        # Update the draft to Lulus and set tarikh_lulus to now
        res = supabase.table("tbl_cadangan_ai").update({
            "status_kelulusan": "Lulus",
            "id_pengurus_lulus": update.id_pengurus_lulus,
            "tarikh_lulus": datetime.utcnow().isoformat()
        }).eq("id_cadangan", cadangan_id).execute()

        if not res.data:
            raise HTTPException(status_code=404, detail="Cadangan not found.")
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.put("/reject/{cadangan_id}", response_model=CadanganResponse)
def reject_draft(cadangan_id: int, update: CadanganUpdate):
    try:
        if not update.id_pengurus_lulus:
            raise HTTPException(status_code=400, detail="ID Pengurus is required to reject.")

        res = supabase.table("tbl_cadangan_ai").update({
            "status_kelulusan": "Tolak",
            "id_pengurus_lulus": update.id_pengurus_lulus,
            "tarikh_lulus": datetime.utcnow().isoformat()
        }).eq("id_cadangan", cadangan_id).execute()

        if not res.data:
            raise HTTPException(status_code=404, detail="Cadangan not found.")
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.put("/save/{cadangan_id}", response_model=CadanganResponse)
def save_draft(cadangan_id: int, update: CadanganUpdate):
    try:
        if not update.id_pengurus_lulus:
            raise HTTPException(status_code=400, detail="ID Pengurus is required to save.")

        res = supabase.table("tbl_cadangan_ai").update({
            "status_kelulusan": "Simpan",
            "id_pengurus_lulus": update.id_pengurus_lulus,
            "tarikh_lulus": datetime.utcnow().isoformat()
        }).eq("id_cadangan", cadangan_id).execute()

        if not res.data:
            raise HTTPException(status_code=404, detail="Cadangan not found.")
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/{premise_id}/work-orders", response_model=List[CadanganResponse])
def get_work_orders(premise_id: int):
    try:
        # Get all Lulus recommendations
        res = supabase.table("tbl_cadangan_ai").select("*").eq("id_premis", premise_id).eq("status_kelulusan", "Lulus").execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.put("/work-order/{cadangan_id}/status", response_model=CadanganResponse)
def update_work_order_status(cadangan_id: int, update: CadanganUpdate):
    try:
        if update.status_pelaksanaan not in ["Baru", "Dalam Proses", "Selesai"]:
            raise HTTPException(status_code=400, detail="Invalid status_pelaksanaan.")

        res = supabase.table("tbl_cadangan_ai").update({
            "status_pelaksanaan": update.status_pelaksanaan
        }).eq("id_cadangan", cadangan_id).execute()

        if not res.data:
            raise HTTPException(status_code=404, detail="Cadangan not found.")
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
