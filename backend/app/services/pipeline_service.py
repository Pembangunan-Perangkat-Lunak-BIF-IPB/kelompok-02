from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException
import uuid, os

from app.services.upload_service import save_pipeline_files
from app.services.qc_service import run_sample_matching_and_qc
from app.models.analysis import Analysis, AnalysisStage, AnalysisStatus

def create_and_run_pipeline(
    vcf_file: UploadFile,
    pheno_file: UploadFile,
    maf: float,
    call_rate: float,
    num_pcs: int,
    db: Session
):
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

    # 3. Inisialisasi Stages
    stage_names = ["Validation & Sample Matching", "Quality Control", "PCA Analysis", "Association Test", "Visualization"]
    stage_objects = {}
    for name in stage_names:
        stage = AnalysisStage(analysis_id=analysis.id, stage_name=name, status=AnalysisStatus.QUEUED)
        db.add(stage)
        stage_objects[name] = stage
    db.commit()

    # 4. Eksekusi QC
    try:
        stage_objects["Validation & Sample Matching"].status = AnalysisStatus.RUNNING
        stage_objects["Quality Control"].status = AnalysisStatus.RUNNING
        db.commit()

        qc_result = run_sample_matching_and_qc(vcf_path, csv_path, job_dir, maf, call_rate)

        stage_objects["Validation & Sample Matching"].status = AnalysisStatus.SUCCESS
        stage_objects["Quality Control"].status = AnalysisStatus.SUCCESS
        analysis.progress = 40
        db.commit()

        return {"result_id": result_id, "qc_files": qc_result}

    except Exception as e:
        stage_objects["Quality Control"].status = AnalysisStatus.FAILED
        analysis.status = AnalysisStatus.FAILED
        analysis.error_message = str(e)
        db.commit()
        raise HTTPException(status_code=400, detail=f"Proses QC Gagal: {str(e)}")

def get_job_status_from_db(result_id: str, db: Session):
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