import os
import glob
import subprocess
from fastapi import HTTPException

def run_association_test(qc_prefix: str, matched_csv_path: str, eigenvec_path: str, job_dir: str) -> list[str]:
    """
    Menjalankan uji asosiasi PLINK 2.0 untuk semua kolom fenotipe di CSV.
    Mengembalikan list path file luaran .glm.linear dan .glm.logistic.
    """
    out_prefix = os.path.join(job_dir, "gwas_assoc")
    
    cmd = [
        "plink2",
        "--bfile", qc_prefix,
        "--pheno", matched_csv_path,
        "--covar", eigenvec_path,
        "--allow-no-sex",
        "--glm", "allow-no-covars",
        "--out", out_prefix
    ]
    
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if result.returncode != 0:
        raise HTTPException(status_code=500, detail=f"Error pada Uji Asosiasi PLINK: {result.stderr}")
    
    # Cari semua file hasil regresi (baik linier maupun logistik)
    glm_files = glob.glob(f"{out_prefix}.*.glm.*")
    if not glm_files:
        raise HTTPException(status_code=500, detail="Uji Asosiasi selesai tetapi tidak ada file luaran .glm yang ditemukan.")
        
    return glm_files