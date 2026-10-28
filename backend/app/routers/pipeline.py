import os
import uuid
from datetime import datetime
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db, SessionLocal
from app.models.analysis import Analysis, AnalysisStatus
from app.services.gwas_service import execute_gwas_pipeline
from app.services.upload_service import validate_and_save_files
from app.services.rendering_service import generate_pdf_report
from app.services.status_service import init_analysis_job

router = APIRouter(prefix="/api/v1", tags=["GWAS Pipeline"])

def _run_pipeline_background(result_id, vcf_path, csv_path, maf, call_rate, num_pcs):
    # Session milik request sudah ditutup setelah response terkirim, jadi buat session baru
    db = SessionLocal()
    try:
        execute_gwas_pipeline(
            result_id=result_id,
            vcf_path=vcf_path,
            csv_path=csv_path,
            maf=maf,
            call_rate=call_rate,
            num_pcs=num_pcs,
            db=db
        )
    except Exception:
        pass  # execute_gwas_pipeline sudah menandai job sebagai Gagal + error_message
    finally:
        db.close()


@router.post("/upload", summary="Inisialisasi Pipeline GWAS")
def upload_files_and_run_pipeline(
    background_tasks: BackgroundTasks,
    vcf_file: UploadFile = File(...),
    csv_file: UploadFile = File(...),
    maf: float = Form(0.05),
    call_rate: float = Form(0.95),
    num_pcs: int = Form(10),
    db: Session = Depends(get_db)  # Menjaga session DB bawaan FastAPI
):
    result_id = f"GWAS-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    
    # 1. Tentukan direktori penyimpanan
    job_dir = os.path.join("storage", "uploads", result_id)
    os.makedirs(job_dir, exist_ok=True)

    # 2. Simpan berkas fisik ke disk
    vcf_path, csv_path = validate_and_save_files(vcf_file, csv_file, job_dir)

    # 3. Inisialisasi Job di Database
    params = {"maf": maf, "call_rate": call_rate, "num_pcs": num_pcs}
    init_analysis_job(result_id, vcf_file.filename, csv_file.filename, params, db)

    # 4. Jalankan Pipeline di background, response langsung dikembalikan
    background_tasks.add_task(
        _run_pipeline_background,
        result_id, vcf_path, csv_path, maf, call_rate, num_pcs
    )

    return {
        "status": "queued",
        "message": "Pipeline GWAS dimulai.",
        "result_id": result_id
    }


@router.get("/jobs/{result_id}/status", summary="Cek Status Analisis GWAS")
def get_job_status(result_id: str, db: Session = Depends(get_db)):
    analysis = db.query(Analysis).filter_by(result_id=result_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Result ID tidak ditemukan")

    stages_data = [
        {
            "key": s.stage_key,
            "label": s.stage_name,
            "status": s.status.value,
            "duration": f"Durasi: {s.duration_seconds}s" if s.duration_seconds > 0 else "-",
            "detail": s.detail_text
        }
        for s in analysis.stages
    ]

    return {
        "result_id": analysis.result_id,
        "overall_progress": analysis.progress,
        "overall_status": analysis.status.value,
        "error_message": analysis.error_message,
        "stages": stages_data
    }


@router.get("/jobs/{result_id}/results", summary="Ambil Hasil Analisis GWAS")
def get_job_results(result_id: str, db: Session = Depends(get_db)):
    analysis = db.query(Analysis).filter_by(result_id=result_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Result ID tidak ditemukan")
    
    if analysis.status != AnalysisStatus.SUCCESS:
        raise HTTPException(status_code=400, detail=f"Analisis belum selesai. Status: {analysis.status.value}")

    job_dir = os.path.join("storage", "uploads", result_id)
    top_csv_path = os.path.join(job_dir, "gwas_summary.csv")

    top_snps = []
    if os.path.exists(top_csv_path):
        import pandas as pd
        top_snps = pd.read_csv(top_csv_path).to_dict(orient="records")

    return {
        "result_id": analysis.result_id,
        "status": analysis.status.value,
        "summary": {"top_snps": top_snps},
        "downloads": {
            "summary_csv": f"/api/v1/jobs/{result_id}/download/summary_csv",
            "raw_tsv": f"/api/v1/jobs/{result_id}/download/raw_tsv",
            "manhattan_png": f"/api/v1/jobs/{result_id}/download/manhattan_png",
            "qq_png": f"/api/v1/jobs/{result_id}/download/qq_png",
            "report_pdf": f"/api/v1/jobs/{result_id}/download/report_pdf"
        }
    }


@router.get("/jobs/{result_id}/download/{file_type}", summary="Unduh Berkas Hasil GWAS")
def download_job_file(result_id: str, file_type: str, db: Session = Depends(get_db)):
    analysis = db.query(Analysis).filter_by(result_id=result_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Result ID tidak ditemukan")
    if analysis.status != AnalysisStatus.SUCCESS:
        raise HTTPException(status_code=400, detail=f"Analisis belum selesai. Status: {analysis.status.value}")
    
    job_dir = os.path.join("storage", "uploads", result_id)
    
    file_map = {
        "summary_csv": ("gwas_summary.csv", "text/csv"),
        "raw_tsv": ("gwas_raw_summary.tsv", "text/tab-separated-values"),
        "manhattan_png": ("manhattan_plot.png", "image/png"),
        "qq_png": ("qq_plot.png", "image/png"),
        "report_pdf": (f"GWAS_Report_{result_id}.pdf", "application/pdf")
    }

    if file_type not in file_map:
        raise HTTPException(status_code=400, detail="Tipe file tidak valid")

    filename, media_type = file_map[file_type]
    file_path = os.path.join(job_dir, filename)

    if file_type == "report_pdf" and not os.path.exists(file_path):
        # Urutan argumen diperbaiki: (result_id, job_dir)
        file_path = generate_pdf_report(result_id, job_dir)

    import glob
    fallback_globs = {
        "manhattan_png": "manhattan_*.png",
        "qq_png": "qq_*.png",
        "raw_tsv": "gwas_assoc.*.glm.*",
    }
    if not os.path.exists(file_path) and file_type in fallback_globs:
        matches = sorted(glob.glob(os.path.join(job_dir, fallback_globs[file_type])))
        if matches:
            file_path = matches[0]
            filename = os.path.basename(file_path)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Berkas tidak ditemukan")

    return FileResponse(path=file_path, media_type=media_type, filename=filename)