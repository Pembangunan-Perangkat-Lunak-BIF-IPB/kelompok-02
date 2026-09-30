from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
import app.models.gwas  # Mandatory: Import model agar SQLAlchemy mengenali semua tabel GWAS
from app.routers import upload, status

# Perintah ini yang membuat semua tabel di PostgreSQL secara otomatis jika belum ada
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Jiwasku GWAS Pipeline API",
    description="Backend API untuk platform analisis genomik Jiwasku",
    version="1.0.0"
)

# Konfigurasi CORS agar frontend (React/Vite) bisa berkomunikasi dengan backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/api/v1")
app.include_router(status.router, prefix="/api/v1")

@app.get("/health", tags=["System"])
def health():
    return {"status": "ok", "message": "Jiwasku Backend API is running smoothly"}