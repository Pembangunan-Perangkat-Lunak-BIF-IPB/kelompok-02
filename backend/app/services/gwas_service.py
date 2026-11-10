from typing import Optional
import os
import time
import logging
import traceback
from sqlalchemy.orm import Session
from app.models.analysis import Analysis, AnalysisStage, AnalysisStatus
from app.services.matching_service import run_sample_matching
from app.services.qc_service import run_quality_control
from app.services.pca_service import run_pca_computation
from app.services.association_service import run_association_test
from app.services.rendering_service import run_parsing_and_rendering, generate_pdf_report
from app.services.status_service import update_stage_progress
from app.services.db_store_service import store_analysis_results
from app.services.job_logger import log_job

logger = logging.getLogger(__name__)

def execute_gwas_pipeline(
    result_id: str,
    vcf_path: str,
    csv_path: str,
    maf: float,
    call_rate: float,
    num_pcs: int,
    db: Session,
    pheno_name: Optional[str] = None
):
    job_dir = os.path.dirname(vcf_path)
    current_stage = "upload_validasi"
    stage_start_time = time.time()

    log_job(job_dir, f"=== MEMULAI PIPELINE GWAS [{result_id}] ===")
    log_job(job_dir, f"Parameter: MAF={maf}, CallRate={call_rate}, PCs={num_pcs}, Fenotipe Target={pheno_name or 'Semua Kolom'}")

    try:
        # 1. Validasi & Matching
        current_stage = "upload_validasi"
        stage_start_time = time.time()
        update_stage_progress(result_id, "upload_validasi", AnalysisStatus.RUNNING, 0, "Matching sampel...", 5, db)
        keep_samples, matched_csv = run_sample_matching(vcf_path, csv_path, job_dir)
        update_stage_progress(result_id, "upload_validasi", AnalysisStatus.SUCCESS, int(time.time() - stage_start_time), "Validasi & Matching selesai", 20, db)

        # 2. QC Filtering PLINK
        current_stage = "qc"
        stage_start_time = time.time()
        update_stage_progress(result_id, "qc", AnalysisStatus.RUNNING, 0, "Filtering PLINK QC...", 25, db)
        qc_res = run_quality_control(vcf_path, keep_samples, job_dir, maf=maf, call_rate=call_rate)
        update_stage_progress(result_id, "qc", AnalysisStatus.SUCCESS, int(time.time() - stage_start_time), "QC selesai", 40, db)

        # 3. PCA PLINK
        current_stage = "pca"
        stage_start_time = time.time()
        update_stage_progress(result_id, "pca", AnalysisStatus.RUNNING, 0, "Komputasi PCA...", 45, db)
        eigenvec_path, _ = run_pca_computation(qc_res["prefix"], job_dir, n_pcs=num_pcs)
        update_stage_progress(result_id, "pca", AnalysisStatus.SUCCESS, int(time.time() - stage_start_time), "PCA selesai", 60, db)

        # 4. Asosiasi PLINK
        current_stage = "asosiasi"
        stage_start_time = time.time()
        detail_msg = f"Uji Asosiasi ({pheno_name})..." if pheno_name else "Uji Asosiasi..."
        update_stage_progress(result_id, "asosiasi", AnalysisStatus.RUNNING, 0, detail_msg, 65, db)
        glm_files = run_association_test(qc_res["prefix"], matched_csv, eigenvec_path, job_dir, pheno_name=pheno_name)

        # Simpan hasil ke PostgreSQL
        analysis = db.query(Analysis).filter_by(result_id=result_id).first()
        try:
            n = store_analysis_results(db, analysis.id, matched_csv, glm_files, pheno_name=pheno_name)
            detail = f"Uji selesai, {n} hasil SNP tersimpan di database"
            log_job(job_dir, f"Penyimpanan DB berhasil: {n} record SNP tersimpan.")
        except Exception as db_err:
            logger.exception("Gagal menyimpan hasil asosiasi ke database")
            log_job(job_dir, f"Peringatan penyimpanan DB: {str(db_err)}", "WARN")
            detail = "Uji selesai (penyimpanan ke database gagal, lihat log)"

        update_stage_progress(result_id, "asosiasi", AnalysisStatus.SUCCESS, int(time.time() - stage_start_time), detail, 80, db)

        # 5. Visualisasi Plot
        current_stage = "visualisasi"
        stage_start_time = time.time()
        update_stage_progress(result_id, "visualisasi", AnalysisStatus.RUNNING, 0, "Membuat plot...", 85, db)
        run_parsing_and_rendering(glm_files, job_dir)
        try:
            generate_pdf_report(
                result_id=result_id,
                job_dir=job_dir,
                params={
                    "maf": maf,
                    "call_rate": call_rate,
                    "num_pcs": num_pcs,
                    "pheno_name": pheno_name
                }
            )
        except Exception as pdf_err:
            log_job(job_dir, f"Peringatan pembuatan PDF: {str(pdf_err)}", "WARN")
        update_stage_progress(result_id, "visualisasi", AnalysisStatus.SUCCESS, int(time.time() - stage_start_time), "Visualisasi selesai", 100, db)

        log_job(job_dir, f"=== PIPELINE GWAS [{result_id}] SELESAI DENGAN SUKSES ===")

    except Exception as e:
        error_msg = str(getattr(e, 'detail', str(e)))
        duration = int(time.time() - stage_start_time)
        log_job(job_dir, f"ERROR pada tahapan '{current_stage}': {error_msg}", "ERROR")
        log_job(job_dir, f"Traceback:\n{traceback.format_exc()}", "ERROR")

        try:
            db.rollback()
            analysis = db.query(Analysis).filter_by(result_id=result_id).first()
            if analysis:
                analysis.status = AnalysisStatus.FAILED
                analysis.error_message = error_msg
                
                # Tandai stage yang sedang berjalan sebagai FAILED
                failed_stage = db.query(AnalysisStage).filter_by(analysis_id=analysis.id, stage_key=current_stage).first()
                if failed_stage:
                    failed_stage.status = AnalysisStatus.FAILED
                    failed_stage.detail_text = f"Gagal: {error_msg}"
                    failed_stage.duration_seconds = duration

                db.commit()
        except Exception as db_exc:
            logger.exception(f"Gagal memperbarui status kegagalan ke database: {db_exc}")

        raise e