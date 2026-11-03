from datetime import datetime
from sqlalchemy.orm import Session
from app.models.analysis import Analysis, AnalysisStage, AnalysisStatus

STAGE_CONFIGS = [
    {"key": "upload_validasi", "name": "Upload & Validasi Format"},
    {"key": "qc", "name": "Kontrol Kualitas Genomik (QC)"},
    {"key": "pca", "name": "Komputasi PCA & Stratifikasi Populasi"},
    {"key": "asosiasi", "name": "Uji Asosiasi Genetik (Association Test)"},
    {"key": "visualisasi", "name": "Visualisasi & Ekspor Hasil"}
]

def init_analysis_job(result_id: str, vcf_path: str, csv_path: str, params: dict, db: Session) -> Analysis:
    """Inisialisasi Record Utama Analysis beserta 5 Stage-nya di PostgreSQL"""
    analysis = Analysis(
        result_id=result_id,
        status=AnalysisStatus.RUNNING,
        progress=0,
        vcf_path=vcf_path,
        csv_path=csv_path,
        parameters=params
    )
    db.add(analysis)
    db.flush() # Untuk mendapatkan analysis.id

    for cfg in STAGE_CONFIGS:
        stage = AnalysisStage(
            analysis_id=analysis.id,
            stage_key=cfg["key"],
            stage_name=cfg["name"],
            status=AnalysisStatus.QUEUED,
            detail_text="Menunggu antrean..."
        )
        db.add(stage)
        
    db.commit()
    db.refresh(analysis)
    return analysis

def update_stage_progress(
    result_id: str, 
    stage_key: str, 
    status: AnalysisStatus, 
    duration_sec: int, 
    detail_text: str, 
    overall_progress: int, 
    db: Session
):
    """Memperbarui status stage dan progress total job"""
    analysis = db.query(Analysis).filter_by(result_id=result_id).first()
    if not analysis:
        return

    stage = db.query(AnalysisStage).filter_by(analysis_id=analysis.id, stage_key=stage_key).first()
    if stage:
        stage.status = status
        stage.duration_seconds = duration_sec
        stage.detail_text = detail_text
        if status == AnalysisStatus.SUCCESS:
            stage.finished_at = datetime.utcnow()

    analysis.progress = overall_progress
    if overall_progress == 100:
        analysis.status = AnalysisStatus.SUCCESS
        analysis.finished_at = datetime.utcnow()

    db.commit()