from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Impor router pipeline/upload milikmu
from app.routers import pipeline  # sesuaikan jika nama filenya upload.py atau pipeline.py

app = FastAPI(
    title="Jiwasku GWAS Pipeline API",
    description="API Back-End untuk Pipeline Genome-Wide Association Study (GWAS) Terintegrasi",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pipeline.router)
