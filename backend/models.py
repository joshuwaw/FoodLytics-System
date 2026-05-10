from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime

class PremiseCreate(BaseModel):
    id_pengurus: int
    nama_premis: str
    alamat_premis: str
    pautan_gmaps: Optional[str] = None
    pautan_medsos: Optional[List[str]] = None

class PremiseResponse(BaseModel):
    id_premis: int
    id_pengurus: Optional[int] = None
    nama_premis: str
    alamat_premis: str
    pautan_gmaps: Optional[str] = None
    pautan_medsos: Optional[Any] = None
    kod_perniagaan: Optional[str] = None
    created_at: Optional[datetime] = None

class FeedbackCreate(BaseModel):
    id_premis: int
    bilangan_bintang: int # Purata Keseluruhan
    rating_makanan: int
    rating_layanan: int
    rating_suasana: int
    ulasan_teks: str
    kategori_aduan: Optional[str] = None
    sumber_platform: str = "Portal QR"

class MedsosItem(BaseModel):
    platform: str
    url: str

class LoginRequest(BaseModel):
    emel: str
    kata_laluan: str

class LoginResponse(BaseModel):
    id_pengguna: int
    nama: str
    emel: str
    peranan: str
    id_premis: Optional[int] = None

class AccountRegisterRequest(BaseModel):
    # User fields
    peranan: str
    nama_penuh: str
    emel: str
    kata_laluan: str
    no_telefon: Optional[str] = None
    
    # Premise fields (Optional for Staf)
    nama_premis: Optional[str] = None
    alamat_premis: Optional[str] = None
    pautan_gmaps: Optional[str] = None
    pautan_medsos: Optional[List[MedsosItem]] = None

    # Staf fields
    kod_perniagaan: Optional[str] = None
