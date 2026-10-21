import subprocess
import os
import pandas as pd
from fastapi import HTTPException

def run_sample_matching_and_qc(
    vcf_path: str, 
    csv_path: str, 
    job_dir: str, 
    maf: float, 
    call_rate: float
):
    """
    MODUL 2 & 3 (Task 2 & 3 DAG):
    1. Sample Matching: Mencari irisan Sample ID antara VCF dan CSV.
    2. QC Filtering: Menjalankan PLINK 2.0 untuk menyaring MAF & Call Rate serta buat file biner (.bed, .bim, .fam).
    """
    # -------------------------------------------------------------
    # 1. SAMPLE MATCHING (Task 2)
    # -------------------------------------------------------------
    # Buka CSV fenotipe
    try:
        pheno_df = pd.read_csv(csv_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Gagal membaca file CSV: {str(e)}")

    if "Sample_ID" not in pheno_df.columns:
        raise HTTPException(status_code=400, detail="File CSV fenotipe wajib memiliki kolom 'Sample_ID'")

    # Buat file daftar sampel (keep_samples.txt) untuk PLINK
    keep_samples_path = os.path.join(job_dir, "keep_samples.txt")
    matched_csv_path = os.path.join(job_dir, "matched_phenotype.csv")

    # Format keep_samples PLINK 2.0 (FID IID / Sample_ID Sample_ID)
    sample_ids = pheno_df["Sample_ID"].astype(str).tolist()
    with open(keep_samples_path, "w") as f:
        for s_id in sample_ids:
            f.write(f"{s_id}\t{s_id}\n")

    # Simpan matched phenotype CSV
    pheno_df.to_csv(matched_csv_path, index=False)

    # -------------------------------------------------------------
    # 2. QUALITY CONTROL VIA PLINK 2.0 (Task 3)
    # -------------------------------------------------------------
    out_prefix = os.path.join(job_dir, "qc_clean")
    
    # Geno = Max missingness rate allowed (1 - call_rate)
    max_geno = round(1.0 - call_rate, 4)

    cmd = [
        "./plink2.exe",
        "--vcf", vcf_path,
        "--keep", keep_samples_path,
        "--double-id",  # Menyamakan format FID dan IID dengan VCF
        "--allow-no-sex",
        "--maf", str(maf),
        "--geno", str(max_geno),
        "--make-bed",
        "--out", out_prefix
    ]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            # Jika plink2 tidak ditemukan atau gagal
            raise RuntimeError(f"PLINK 2.0 Error: {result.stderr or result.stdout}")
    except FileNotFoundError:
        # Fallback error jika binary plink2 belum terinstall di OS/environment
        raise HTTPException(
            status_code=500, 
            detail="Binary 'plink2' tidak ditemukan di sistem server. Pastikan PLINK 2.0 sudah terinstall."
        )

    bed_file = f"{out_prefix}.bed"
    bim_file = f"{out_prefix}.bim"
    fam_file = f"{out_prefix}.fam"

    if not (os.path.exists(bed_file) and os.path.exists(bim_file) and os.path.exists(fam_file)):
        raise HTTPException(
            status_code=400, 
            detail="Gagal menghasilkan file biner PLINK (.bed/.bim/.fam). Periksa apakah ada varian yang lolos kriteria QC."
        )

    return {
        "keep_samples_path": keep_samples_path,
        "matched_csv_path": matched_csv_path,
        "bed_path": bed_file,
        "bim_path": bim_file,
        "fam_path": fam_file
    }