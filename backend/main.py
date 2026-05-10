from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import admin, customer, analytics

app = FastAPI(title="FoodLytics API", version="1.0.0")

# Configure CORS
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    # Add production frontend URL here when deploying
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(customer.router, prefix="/api/customer", tags=["customer"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])

@app.get("/")
def read_root():
    return {"message": "FoodLytics API is running"}
