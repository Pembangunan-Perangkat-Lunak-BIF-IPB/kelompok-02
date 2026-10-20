from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.pipeline_service import create_and_run_pipeline, get_job_status_from_db

router = APIRouter(prefix="/api/v1", tags=["GWAS Pipeline"])

@router.post("/upload")
async def upload_and_start_analysis(
    vcf_file: UploadFile = File(...),
    pheno_file: UploadFile = File(...),
    maf: float = Form(0.05),
    call_rate: float = Form(0.95),
    num_pcs: int = Form(10),
    db: Session = Depends(get_db)
):
    """MODUL 1, 2, & 3: Unggah Data, Konfigurasi Parameter QC & PC, dan Inisialisasi Job"""
    result = create_and_run_pipeline(vcf_file, pheno_file, maf, call_rate, num_pcs, db)
    return {
        "status": "success",
        "result_id": result["result_id"],
        "message": "File berhasil diunggah dan lolos Quality Control (QC) PLINK 2.0.",
        "qc_files": result["qc_files"]
    }

@router.get("/jobs/{result_id}/status")
def get_job_status(result_id: str, db: Session = Depends(get_db)):
    """Monitoring Status Progress Analisis"""
    return get_job_status_from_db(result_id, db)