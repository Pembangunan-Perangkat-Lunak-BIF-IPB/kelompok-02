import os
import time
import uuid
from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.models.analysis import AnalysisStatus
from app.services.upload_service import validate_and_save_files
from app.services.matching_service import run_sample_matching
from app.services.qc_service import run_quality_control
from app.services.pca_service import run_pca_computation
from app.services.association_service import run_association_test
from app.services.rendering_service import run_parsing_and_rendering
from app.services.status_service import init_analysis_job, update_stage_progress

def execute_full_gwas_pipeline(
    vcf_file: UploadFile, 
    csv_file: UploadFile, 
    pheno_col: str,
    maf: float = 0.05, 
    call_rate: float = 0.95,
    num_pcs: int = 10,
    db: Session = None
) -> dict:
    # 1. Generate Unique Result ID dan Buat Folder Scratch
    result_id = f"GWAS-2026-IDN-{uuid.uuid4().hex[:6].upper()}"
    job_dir = os.path.join("storage", "uploads", result_id)
    os.makedirs(job_dir, exist_ok=True)

    # 2. Inisialisasi Record Utama Analysis & 5 Stage di PostgreSQL
    params = {
        "maf": maf,
        "call_rate": call_rate,
        "num_pcs": num_pcs,
        "pheno_col": pheno_col
    }
    
    # Memanggil init status di DB jika Session SQLAlchemy disertakan
    if db:
        init_analysis_job(
            result_id=result_id, 
            vcf_path=vcf_file.filename, 
            csv_path=csv_file.filename, 
            params=params, 
            db=db
        )

    try:
        # -------------------------------------------------------------
        # TAHAP 1: Upload & Validasi Format
        # -------------------------------------------------------------
        t0 = time.time()
        
        # Cek status Running untuk Stage 1
        if db:
            update_stage_progress(
                result_id=result_id, 
                stage_key="upload_validasi", 
                status=AnalysisStatus.RUNNING, 
                duration_sec=0, 
                detail_text="Sedang memvalidasi header VCF & CSV...", 
                overall_progress=5, 
                db=db
            )

        vcf_path, csv_path = validate_and_save_files(vcf_file, csv_file, job_dir)
        keep_samples, matched_csv = run_sample_matching(vcf_path, csv_path, job_dir)
        t1 = time.time()

        if db:
            update_stage_progress(
                result_id=result_id,
                stage_key="upload_validasi",
                status=AnalysisStatus.SUCCESS,
                detail_text=f"Genotype {vcf_file.filename} & Fenotipe {csv_file.filename} terverifikasi 100%.",
                duration_sec=int(t1 - t0),
                overall_progress=20,
                db=db
            )

        # -------------------------------------------------------------
        # TAHAP 2: Kontrol Kualitas Genomik (QC)
        # -------------------------------------------------------------
        t0 = time.time()
        if db:
            update_stage_progress(
                result_id=result_id, 
                stage_key="qc", 
                status=AnalysisStatus.RUNNING, 
                duration_sec=0, 
                detail_text="Menjalankan pemfilteran PLINK 2.0 (MAF & Call Rate)...", 
                overall_progress=25, 
                db=db
            )

        qc_res = run_quality_control(vcf_path, keep_samples, job_dir, maf=maf, call_rate=call_rate)
        t1 = time.time()

        passed_snps = qc_res.get("passed_snps", "Sejumlah")
        if db:
            update_stage_progress(
                result_id=result_id,
                stage_key="qc",
                status=AnalysisStatus.SUCCESS,
                detail_text=f"Filter MAF > {maf}, Call Rate {int(call_rate*100)}%. {passed_snps} varian lolos ambang batas.",
                duration_sec=int(t1 - t0),
                overall_progress=40,
                db=db
            )

        # -------------------------------------------------------------
        # TAHAP 3: Komputasi PCA & Stratifikasi Populasi
        # -------------------------------------------------------------
        t0 = time.time()
        if db:
            update_stage_progress(
                result_id=result_id, 
                stage_key="pca", 
                status=AnalysisStatus.RUNNING, 
                duration_sec=0, 
                detail_text="Menghitung vektor komponen utama (PCA)...", 
                overall_progress=45, 
                db=db
            )

        eigenvec_path, _ = run_pca_computation(qc_res["prefix"], job_dir, n_pcs=num_pcs)
        t1 = time.time()

        if db:
            update_stage_progress(
                result_id=result_id,
                stage_key="pca",
                status=AnalysisStatus.SUCCESS,
                detail_text=f"{num_pcs} Principal Components (PCs) berhasil dihitung & disertakan sebagai kovariat.",
                duration_sec=int(t1 - t0),
                overall_progress=60,
                db=db
            )

        # -------------------------------------------------------------
        # TAHAP 4: Uji Asosiasi Genetik
        # -------------------------------------------------------------
        t0 = time.time()
        if db:
            update_stage_progress(
                result_id=result_id, 
                stage_key="asosiasi", 
                status=AnalysisStatus.RUNNING, 
                duration_sec=0, 
                detail_text="Menjalankan regresi uji asosiasi GWAS...", 
                overall_progress=65, 
                db=db
            )

        raw_summary = run_association_test(qc_res["prefix"], matched_csv, eigenvec_path, job_dir, pheno_col)
        t1 = time.time()

        if db:
            update_stage_progress(
                result_id=result_id,
                stage_key="asosiasi",
                status=AnalysisStatus.SUCCESS,
                detail_text="Uji regresi linier/logistik selesai dieksekusi.",
                duration_sec=int(t1 - t0),
                overall_progress=80,
                db=db
            )

        # -------------------------------------------------------------
        # TAHAP 5: Visualisasi & Ekspor Hasil
        # -------------------------------------------------------------
        t0 = time.time()
        if db:
            update_stage_progress(
                result_id=result_id, 
                stage_key="visualisasi", 
                status=AnalysisStatus.RUNNING, 
                duration_sec=0, 
                detail_text="Membuat grafik Manhattan & QQ Plot...", 
                overall_progress=85, 
                db=db
            )

        render_res = run_parsing_and_rendering(raw_summary, job_dir)
        t1 = time.time()

        if db:
            update_stage_progress(
                result_id=result_id,
                stage_key="visualisasi",
                status=AnalysisStatus.SUCCESS,
                detail_text="Manhattan dan QQ plot berhasil dibuat. Lihat Riwayat Analisis untuk mengunduh plot.",
                duration_sec=int(t1 - t0),
                overall_progress=100,
                db=db
            )

        return {
            "job_id": result_id,
            "status": "COMPLETED",
            "results": render_res
        }

    except Exception as e:
        # Jika terjadi kegagalan di salah satu tahapan, catat error di DB
        if db:
            from app.models.analysis import Analysis
            analysis = db.query(Analysis).filter_by(result_id=result_id).first()
            if analysis:
                analysis.status = AnalysisStatus.FAILED
                analysis.error_message = str(e)
                db.commit()
        raise e