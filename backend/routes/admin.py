from fastapi import APIRouter, HTTPException
from typing import List, Any
from database import supabase
from models import AccountRegisterRequest, PremiseResponse, LoginRequest, LoginResponse

router = APIRouter()

@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest):
    try:
        # Look up user in tbl_pengguna by email and password
        res = supabase.table("tbl_pengguna").select("*").eq("emel", request.emel).eq("kata_laluan", request.kata_laluan).execute()
        if not res.data:
            raise HTTPException(status_code=401, detail="E-mel atau kata laluan tidak sah.")
        
        user = res.data[0]
        id_pengguna = user["id_pengguna"]
        peranan = user["peranan"]
        if peranan == "Staf":
            peranan = "Staf Operasi"
        
        # Get id_premis from the role-specific table
        id_premis = None
        if peranan == "Pengurus":
            premis_res = supabase.table("tbl_premis").select("id_premis").eq("id_pengurus", id_pengguna).execute()
            if premis_res.data:
                id_premis = premis_res.data[0]["id_premis"]
        elif peranan == "Staf Operasi":
            staf_res = supabase.table("tbl_staf_operasi").select("id_premis").eq("id_pengguna", id_pengguna).execute()
            if staf_res.data:
                id_premis = staf_res.data[0].get("id_premis")
        
        return LoginResponse(
            id_pengguna=id_pengguna,
            nama=user["nama"],
            emel=user["emel"],
            peranan=peranan,
            id_premis=id_premis
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.get("/premises", response_model=List[PremiseResponse])
def get_premises():
    try:
        response = supabase.table("tbl_premis").select("*").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.post("/premises", response_model=Any)
def register_premise(request: AccountRegisterRequest):
    try:
        import json
        import uuid
        
        user_table = "tbl_pengurus" if request.peranan == "Pengurus" else "tbl_staf_operasi"
        
        # Determine Premise ID or Generate Code based on Role
        id_premis = None
        new_kod_perniagaan = None
        
        if request.peranan == "Staf Operasi":
            if not request.kod_perniagaan:
                raise HTTPException(status_code=400, detail="Kod Perniagaan diperlukan untuk Staf Operasi.")
                
            # Verify Kod Perniagaan exists
            premise_check = supabase.table("tbl_premis").select("id_premis").eq("kod_perniagaan", request.kod_perniagaan).execute()
            if not premise_check.data:
                raise HTTPException(status_code=404, detail="Kod Perniagaan tidak sah atau tidak dijumpai.")
            id_premis = premise_check.data[0]["id_premis"]
        else:
            # Generate a 6-character unique code for Pengurus
            new_kod_perniagaan = str(uuid.uuid4()).split("-")[0].upper()

        # 1. Insert Base User Profile into tbl_pengguna
        pengguna_data = {
            "nama": request.nama_penuh,
            "emel": request.emel,
            "kata_laluan": request.kata_laluan, # In production, this MUST be hashed!
            "peranan": "Staf" if request.peranan == "Staf Operasi" else request.peranan
        }
        pengguna_response = supabase.table("tbl_pengguna").insert(pengguna_data).execute()
        
        if not pengguna_response.data:
            raise HTTPException(status_code=400, detail="Failed to register base user")
            
        user_id = pengguna_response.data[0]["id_pengguna"]

        # 2. Insert into Role-Specific Table
        role_data = {
            "id_pengguna": user_id
        }
        
        if request.no_telefon:
            role_data["no_telefon"] = request.no_telefon
            
        if request.peranan == "Staf Operasi":
            role_data["id_premis"] = id_premis
            
        user_response = supabase.table(user_table).insert(role_data).execute()
        
        if not user_response.data:
            raise HTTPException(status_code=400, detail=f"Failed to register user to {user_table}")

        # 2. Insert Premise if Pengurus
        premise_response_data = None
        if request.peranan == "Pengurus":
            medsos_json = json.dumps([m.model_dump() for m in request.pautan_medsos]) if request.pautan_medsos else None
            
            premise_data = {
                "id_pengurus": user_id, 
                "nama_premis": request.nama_premis,
                "alamat_premis": request.alamat_premis,
                "pautan_gmaps": request.pautan_gmaps,
                "pautan_medsos": medsos_json,
                "kod_perniagaan": new_kod_perniagaan
            }
            
            premise_response = supabase.table("tbl_premis").insert(premise_data).execute()
            
            if not premise_response.data:
                raise HTTPException(status_code=400, detail="Failed to register premise")
            premise_response_data = premise_response.data[0]
            
        return {
            "user": user_response.data[0],
            "premise": premise_response_data,
            "kod_perniagaan": new_kod_perniagaan
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/profile/{id_pengguna}")
def get_user_profile(id_pengguna: int):
    try:
        user_res = supabase.table("tbl_pengguna").select("nama, emel, peranan").eq("id_pengguna", id_pengguna).execute()
        if not user_res.data:
            raise HTTPException(status_code=404, detail="User not found")
            
        user = user_res.data[0]
        peranan = user.get("peranan")
        if peranan == "Staf":
            peranan = "Staf Operasi"
            
        no_telefon = ""
        premis = None
        
        if peranan == "Pengurus":
            role_res = supabase.table("tbl_pengurus").select("no_telefon").eq("id_pengguna", id_pengguna).execute()
            if role_res.data:
                no_telefon = role_res.data[0].get("no_telefon") or ""
                
            premis_res = supabase.table("tbl_premis").select("nama_premis, alamat_premis, id_premis, kod_perniagaan").eq("id_pengurus", id_pengguna).execute()
            if premis_res.data:
                premis = premis_res.data[0]
                
        elif peranan == "Staf Operasi":
            role_res = supabase.table("tbl_staf_operasi").select("no_telefon, id_premis").eq("id_pengguna", id_pengguna).execute()
            if role_res.data:
                no_telefon = role_res.data[0].get("no_telefon") or ""
                id_premis = role_res.data[0].get("id_premis")
                
                if id_premis:
                    premis_res = supabase.table("tbl_premis").select("nama_premis, alamat_premis, id_premis, kod_perniagaan").eq("id_premis", id_premis).execute()
                    if premis_res.data:
                        premis = premis_res.data[0]
                        
        return {
            "nama": user.get("nama"),
            "emel": user.get("emel"),
            "peranan": peranan,
            "no_telefon": no_telefon,
            "premis": premis
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

from pydantic import BaseModel
class ProfilUpdate(BaseModel):
    nama: str = None
    emel: str = None
    no_telefon: str = None
    premis: dict = None

@router.put("/profile/{id_pengguna}")
def update_user_profile(id_pengguna: int, payload: ProfilUpdate):
    try:
        user_res = supabase.table("tbl_pengguna").select("peranan").eq("id_pengguna", id_pengguna).execute()
        if not user_res.data:
            raise HTTPException(status_code=404, detail="User not found")
            
        peranan = user_res.data[0].get("peranan")
        
        base_update = {}
        if payload.nama: base_update["nama"] = payload.nama
        if payload.emel: base_update["emel"] = payload.emel
        
        if base_update:
            supabase.table("tbl_pengguna").update(base_update).eq("id_pengguna", id_pengguna).execute()
            
        if payload.no_telefon:
            table_name = "tbl_pengurus" if peranan == "Pengurus" else "tbl_staf_operasi"
            supabase.table(table_name).update({"no_telefon": payload.no_telefon}).eq("id_pengguna", id_pengguna).execute()
            
        if peranan == "Pengurus" and payload.premis and "id_premis" in payload.premis:
            premis_id = payload.premis["id_premis"]
            premis_update = {}
            if "nama_premis" in payload.premis: premis_update["nama_premis"] = payload.premis["nama_premis"]
            if "alamat_premis" in payload.premis: premis_update["alamat_premis"] = payload.premis["alamat_premis"]
            if premis_update:
                supabase.table("tbl_premis").update(premis_update).eq("id_premis", premis_id).execute()
            
        return {"message": "Profile updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
