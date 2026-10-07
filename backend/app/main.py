from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
import app.models.gwas  # Mandatory: Import model agar SQLAlchemy mengenali semua tabel GWAS
from app.routers import upload

# Membuang/membuat skema tabel awal
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Jiwasku GWAS Pipeline API")

# Konfigurasi CORS agar frontend (React/Vite) bisa berkomunikasi dengan backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrasi Router Upload
app.include_router(upload.router)

@app.get("/health", tags=["System"])
def health():
    return {"status": "ok"}