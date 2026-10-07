from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
import uuid
import os

from app.database import get_db
from app.models.analysis import Analysis, AnalysisStage, AnalysisStatus
from app.services.upload_service import save_pipeline_files
from app.services.qc_service import run_sample_matching_and_qc  # Import service baru

router = APIRouter(prefix="/api/v1", tags=["GWAS Pipeline"])

@router.post("/upload")
async def upload_and_start_analysis(
    vcf_file: UploadFile = File(...),
    pheno_file: UploadFile = File(...),
    maf: float = Form(0.05),
    call_rate: float = Form(0.95),
    num_pcs: int = Form(5),
    db: Session = Depends(get_db)
):
    """MODUL 1, 2, & 3: Upload, Sample Matching, & Quality Control (FR-01, FR-02, FR-03)"""
    result_id = f"GWAS-2026-IDN-{uuid.uuid4().hex[:6].upper()}"
    job_dir = os.path.join("storage/uploads", result_id)
    
    # 1. Simpan file fisik
    vcf_path, csv_path = save_pipeline_files(vcf_file, pheno_file, result_id)

    # 2. Catat Job ke Database
    analysis = Analysis(
        result_id=result_id,
        status=AnalysisStatus.RUNNING,
        progress=20,
        parameters={"maf": maf, "call_rate": call_rate, "num_pcs": num_pcs},
        vcf_path=vcf_path,
        csv_path=csv_path
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    # 3. Inisialisasi 5 Stage Pipeline
    stage_names = ["Validation & Sample Matching", "Quality Control", "PCA Analysis", "Association Test", "Visualization"]
    stage_objects = {}
    for name in stage_names:
        stage = AnalysisStage(analysis_id=analysis.id, stage_name=name, status=AnalysisStatus.QUEUED)
        db.add(stage)
        stage_objects[name] = stage
    db.commit()

    # 4. Eksekusi MODUL 2 & 3 (Sample Matching & QC Filtering via PLINK 2.0)
    try:
        # Update stage 1 & 2 ke RUNNING
        stage_objects["Validation & Sample Matching"].status = AnalysisStatus.RUNNING
        stage_objects["Quality Control"].status = AnalysisStatus.RUNNING
        db.commit()

        # Jalankan eksekusi PLINK QC
        qc_result = run_sample_matching_and_qc(vcf_path, csv_path, job_dir, maf, call_rate)

        # Update stage 1 & 2 ke SUCCESS
        stage_objects["Validation & Sample Matching"].status = AnalysisStatus.SUCCESS
        stage_objects["Quality Control"].status = AnalysisStatus.SUCCESS
        analysis.progress = 40
        db.commit()

    except Exception as e:
        # Jika QC gagal, tandai status FAILED di DB
        stage_objects["Quality Control"].status = AnalysisStatus.FAILED
        analysis.status = AnalysisStatus.FAILED
        analysis.error_message = str(e)
        db.commit()
        raise HTTPException(status_code=400, detail=f"Proses QC Gagal: {str(e)}")

    return {
        "status": "success",
        "result_id": result_id,
        "message": "File berhasil diunggah dan lolos Quality Control (QC) PLINK 2.0.",
        "qc_files": qc_result
    }

@router.get("/jobs/{result_id}/status")
def get_job_status(result_id: str, db: Session = Depends(get_db)):
    """Monitoring Status Progress Analisis"""
    analysis = db.query(Analysis).filter(Analysis.result_id == result_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Job ID tidak ditemukan")

    stages = db.query(AnalysisStage).filter(AnalysisStage.analysis_id == analysis.id).all()

    return {
        "result_id": analysis.result_id,
        "status": analysis.status,
        "progress": analysis.progress,
        "parameters": analysis.parameters,
        "created_at": analysis.created_at,
        "error_message": analysis.error_message,
        "stages": [{"stage_name": s.stage_name, "status": s.status} for s in stages]
    }