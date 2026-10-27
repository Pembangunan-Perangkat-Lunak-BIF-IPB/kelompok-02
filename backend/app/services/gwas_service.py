import os
import time
from sqlalchemy.orm import Session
from app.models.analysis import Analysis, AnalysisStatus
from app.services.matching_service import run_sample_matching
from app.services.qc_service import run_quality_control
from app.services.pca_service import run_pca_computation
from app.services.association_service import run_association_test
from app.services.rendering_service import run_parsing_and_rendering
from app.services.status_service import update_stage_progress

def execute_gwas_pipeline(
    result_id: str,
    vcf_path: str,
    csv_path: str,
    maf: float,
    call_rate: float,
    num_pcs: int,
    db: Session
):
    job_dir = os.path.dirname(vcf_path)

    try:
        # 1. Validasi & Matching
        t0 = time.time()
        update_stage_progress(result_id, "upload_validasi", AnalysisStatus.RUNNING, 0, "Matching sampel...", 5, db)
        keep_samples, matched_csv = run_sample_matching(vcf_path, csv_path, job_dir)
        update_stage_progress(result_id, "upload_validasi", AnalysisStatus.SUCCESS, int(time.time() - t0), "Validasi & Matching selesai", 20, db)

        # 2. QC Filtering PLINK
        t0 = time.time()
        update_stage_progress(result_id, "qc", AnalysisStatus.RUNNING, 0, "Filtering PLINK QC...", 25, db)
        qc_res = run_quality_control(vcf_path, keep_samples, job_dir, maf=maf, call_rate=call_rate)
        update_stage_progress(result_id, "qc", AnalysisStatus.SUCCESS, int(time.time() - t0), "QC selesai", 40, db)

        # 3. PCA PLINK
        t0 = time.time()
        update_stage_progress(result_id, "pca", AnalysisStatus.RUNNING, 0, "Komputasi PCA...", 45, db)
        eigenvec_path, _ = run_pca_computation(qc_res["prefix"], job_dir, n_pcs=num_pcs)
        update_stage_progress(result_id, "pca", AnalysisStatus.SUCCESS, int(time.time() - t0), "PCA selesai", 60, db)

        # 4. Asosiasi PLINK (Opsi B: Semua Kolom Fenotipe)
        t0 = time.time()
        update_stage_progress(result_id, "asosiasi", AnalysisStatus.RUNNING, 0, "Uji Asosiasi...", 65, db)
        glm_files = run_association_test(qc_res["prefix"], matched_csv, eigenvec_path, job_dir)
        update_stage_progress(result_id, "asosiasi", AnalysisStatus.SUCCESS, int(time.time() - t0), "Uji selesai", 80, db)

        # 5. Visualisasi Plot
        t0 = time.time()
        update_stage_progress(result_id, "visualisasi", AnalysisStatus.RUNNING, 0, "Membuat plot...", 85, db)
        run_parsing_and_rendering(glm_files, job_dir)
        update_stage_progress(result_id, "visualisasi", AnalysisStatus.SUCCESS, int(time.time() - t0), "Visualisasi selesai", 100, db)

    except Exception as e:
        analysis = db.query(Analysis).filter_by(result_id=result_id).first()
        if analysis:
            analysis.status = AnalysisStatus.FAILED
            analysis.error_message = str(e)
            db.commit()
        raise e