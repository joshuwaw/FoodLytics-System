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
    bilangan_bintang: Optional[int] = None # Purata Keseluruhan
    rating_makanan: Optional[int] = None
    rating_layanan: Optional[int] = None
    rating_suasana: Optional[int] = None
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

# ─── Increment 4: External Data Ingestion Models ────────────────────────────

class ExternalReviewItem(BaseModel):
    """Normalized schema for a single review from any external source."""
    platform: str                           # e.g., "Google Reviews", "X (Twitter)", "Instagram"
    teks_ulasan: str
    bintang: Optional[int] = None           # Nullable for social media
    tarikh: Optional[str] = None
    nama_pengguna: Optional[str] = None

class ExternalFeedbackCreate(BaseModel):
    """Variant of FeedbackCreate where star ratings are optional (social media)."""
    id_premis: int
    bilangan_bintang: Optional[int] = None
    rating_makanan: Optional[int] = None
    rating_layanan: Optional[int] = None
    rating_suasana: Optional[int] = None
    ulasan_teks: str
    kategori_aduan: Optional[str] = None
    sumber_platform: str = "Google Reviews"

class IngestionResponse(BaseModel):
    """Response after triggering an ingestion job."""
    message: str
    status: str
    premise_id: int
    jumlah_diimport: int = 0
    pecahan_sumber: Optional[dict] = None

class IngestionSourceStatus(BaseModel):
    """Per-source sync status for a premise."""
    platform: str
    connected: bool = False
    last_sync: Optional[str] = None
    jumlah_ulasan: int = 0

# ─── Increment 5: Prescriptive AI Models ────────────────────────────

class CadanganResponse(BaseModel):
    id_cadangan: int
    id_premis: int
    id_topik: Optional[int] = None
    id_log_proses: Optional[int] = None
    jenis_tindakan: str
    analisis_punca: str
    saranan_strategik: str
    skor_keyakinan: int
    status_kelulusan: str
    status_pelaksanaan: str
    created_at: Optional[datetime] = None
    tarikh_jana: Optional[datetime] = None

class CadanganUpdate(BaseModel):
    status_kelulusan: Optional[str] = None
    status_pelaksanaan: Optional[str] = None
    saranan_strategik: Optional[str] = None
    id_pengurus_lulus: Optional[int] = None
