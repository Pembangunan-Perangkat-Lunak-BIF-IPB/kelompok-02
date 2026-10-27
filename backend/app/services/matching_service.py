import os
import gzip
import pandas as pd
from fastapi import HTTPException

def run_sample_matching(vcf_path: str, csv_path: str, job_dir: str) -> tuple[str, str]:
    """
    Task 2: Mengekstrak Sample ID dari VCF dan CSV, mencocokkan irisan ID,
    serta menghasilkan file perantara `keep_samples.txt` dan `matched_phenotype.csv`.
    """
    # 1. Baca Header VCF untuk Ekstraksi Sample ID
    is_gz = vcf_path.endswith(".vcf.gz")
    open_func = gzip.open if is_gz else open
    
    vcf_samples = []
    with open_func(vcf_path, "rt", errors="ignore") as f:
        for line in f:
            if line.startswith("#CHROM"):
                parts = line.strip().split("\t")
                if len(parts) > 9:
                    vcf_samples = parts[9:]  # ID sampel dimulai dari kolom ke-10
                break
                
    if not vcf_samples:
        raise HTTPException(status_code=400, detail="Tidak dapat menemukan kolom header ID sampel di berkas VCF")

    # 2. Baca Fenotipe CSV
    try:
        pheno_df = pd.read_csv(csv_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Gagal membaca berkas CSV fenotipe: {str(e)}")
        
    if "Sample_ID" not in pheno_df.columns:
        raise HTTPException(status_code=400, detail="Berkas CSV fenotipe wajib memiliki kolom 'Sample_ID'")
        
    csv_samples = pheno_df["Sample_ID"].astype(str).tolist()

    # 3. Cari Irisan (Matching) ID Sampel
    matched_ids = [s for s in vcf_samples if str(s) in csv_samples]
    
    if not matched_ids:
        raise HTTPException(
            status_code=400, 
            detail="Pencocokan gagal: Tidak ada satu pun Sample ID yang cocok antara berkas VCF dan CSV"
        )

    # 4. Buat File Perantara `keep_samples.txt` (format PLINK: FID IID)
    keep_samples_path = os.path.join(job_dir, "keep_samples.txt")
    with open(keep_samples_path, "w") as f:
        for s_id in matched_ids:
            f.write(f"{s_id}\t{s_id}\n")

    # 5. Filter & Simpan `matched_phenotype.csv`
    matched_df = pheno_df[pheno_df["Sample_ID"].astype(str).isin(matched_ids)]
    matched_csv_path = os.path.join(job_dir, "matched_phenotype.csv")
    matched_df.to_csv(matched_csv_path, index=False)

    return keep_samples_path, matched_csv_path