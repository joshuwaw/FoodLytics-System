from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import admin, customer, analytics, ingestion, prescriptive, laporan

app = FastAPI(title="FoodLytics API", version="1.0.0")

# Configure CORS
origins = [
    "http://localhost:3000",
    "https://foodlytics-system.vercel.app",
    "https://www.foodlytics-system.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(laporan.router, prefix="/api/laporan", tags=["laporan"])
app.include_router(customer.router, prefix="/api/customer", tags=["customer"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(ingestion.router, prefix="/api/ingestion", tags=["ingestion"])
app.include_router(prescriptive.router, prefix="/api/prescriptive", tags=["prescriptive"])

# Robustness fallback: include routers without /api prefix to handle misconfigured frontend env vars
app.include_router(admin.router, prefix="/admin", tags=["admin"])
app.include_router(customer.router, prefix="/customer", tags=["customer"])
app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
app.include_router(ingestion.router, prefix="/ingestion", tags=["ingestion"])
app.include_router(prescriptive.router, prefix="/prescriptive", tags=["prescriptive"])


@app.get("/")
def read_root():
    return {"message": "FoodLytics API is running"}

@app.get("/api/debug-cors")
def debug_cors():
    return {
        "status": "active",
        "allowed_origins": origins,
        "version": "1.0.1"
    }

