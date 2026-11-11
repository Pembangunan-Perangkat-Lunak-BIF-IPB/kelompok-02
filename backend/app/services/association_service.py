import os
import glob
import subprocess
from typing import Optional
import pandas as pd  
from fastapi import HTTPException
from dotenv import load_dotenv
from app.services.job_logger import log_job

load_dotenv()
PLINK = os.getenv("PLINK2_PATH", "plink2")

def run_association_test(
    qc_prefix: str, 
    matched_csv_path: str, 
    eigenvec_path: str, 
    job_dir: str,
    pheno_name: Optional[str] = None
) -> list[str]:
    out_prefix = os.path.join(job_dir, "gwas_assoc")

    # Konversi matched_phenotype.csv -> format PLINK2 (tab-delimited, header #FID IID)
    pheno_df = pd.read_csv(matched_csv_path)
    pheno_df.insert(0, "#FID", pheno_df["Sample_ID"])        # FID = IID, sama seperti .fam (--double-id)
    pheno_df = pheno_df.rename(columns={"Sample_ID": "IID"})
    
    if pheno_name:
        if pheno_name not in pheno_df.columns:
            err = f"Kolom fenotipe '{pheno_name}' tidak ditemukan dalam berkas fenotipe CSV. Kolom yang tersedia: {list(pheno_df.columns[2:])}"
            log_job(job_dir, err, "ERROR")
            raise HTTPException(status_code=400, detail=err)
        log_job(job_dir, f"Uji asosiasi difokuskan hanya untuk kolom fenotipe: '{pheno_name}'")
    else:
        log_job(job_dir, "Tidak ada kolom fenotipe spesifik yang dipilih. PLINK akan menganalisis semua kolom kuantitatif yang ada.")

    plink_pheno_path = os.path.join(job_dir, "plink_pheno.tsv")
    pheno_df.to_csv(plink_pheno_path, sep="\t", index=False, na_rep="NA", lineterminator="\n")

    cmd = [
        PLINK,
        "--bfile", qc_prefix,
        "--pheno", plink_pheno_path,
    ]

    # Beri tahu PLINK untuk menganalisis hanya fenotipe terpilih
    if pheno_name:
        cmd.extend(["--pheno-name", str(pheno_name)])

    cmd.extend([
        "--covar", eigenvec_path,
        "--glm", "hide-covar", "allow-no-covars", "cols=+a1freq",
        "--out", out_prefix
    ])

    log_job(job_dir, f"Menjalankan perintah PLINK GLM: {' '.join(cmd)}")
    
    try:
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    except FileNotFoundError:
        err = f"Executabel PLINK ('{PLINK}') tidak ditemukan. Pastikan PLINK2_PATH diatur dengan benar."
        log_job(job_dir, err, "ERROR")
        raise HTTPException(status_code=500, detail=err)

    if result.stdout:
        log_job(job_dir, f"[PLINK GLM Output]:\n{result.stdout.strip()}")

    if result.returncode != 0:
        err = f"Error pada Uji Asosiasi PLINK: {result.stderr.strip() or result.stdout.strip()}"
        log_job(job_dir, err, "ERROR")
        raise HTTPException(status_code=500, detail=err)
    
    # Cari semua file hasil regresi (baik linier maupun logistik)
    glm_files = glob.glob(f"{out_prefix}.*.glm.*")
    if not glm_files:
        err = "Uji Asosiasi selesai tetapi tidak ada file luaran .glm yang ditemukan oleh PLINK."
        log_job(job_dir, err, "ERROR")
        raise HTTPException(status_code=500, detail=err)
        
    log_job(job_dir, f"Uji Asosiasi berhasil. Berkas GLM ditemukan: {[os.path.basename(f) for f in glm_files]}")
    return glm_files
