import os
import glob
import subprocess
import pandas as pd  
from fastapi import HTTPException

def run_association_test(qc_prefix: str, matched_csv_path: str, eigenvec_path: str, job_dir: str) -> list[str]:
    out_prefix = os.path.join(job_dir, "gwas_assoc")

    # Konversi matched_phenotype.csv -> format PLINK2 (tab-delimited, header #IID)
    pheno_df = pd.read_csv(matched_csv_path)
    pheno_df.insert(0, "#FID", pheno_df["Sample_ID"])        # FID = IID, sama seperti .fam (--double-id)
    pheno_df = pheno_df.rename(columns={"Sample_ID": "IID"})
    plink_pheno_path = os.path.join(job_dir, "plink_pheno.tsv")
    pheno_df.to_csv(plink_pheno_path, sep="\t", index=False, na_rep="NA", lineterminator="\n")

    cmd = [
        "plink2",
        "--bfile", qc_prefix,
        "--pheno", plink_pheno_path,
        "--covar", eigenvec_path,
        "--glm", "hide-covar", "allow-no-covars",
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