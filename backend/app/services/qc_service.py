import os
import glob
import subprocess
import pandas as pd
from fastapi import HTTPException

PLINK = os.getenv("PLINK2_PATH", "plink2")

def run_quality_control(vcf_path: str, keep_samples_path: str, job_dir: str,
                        maf: float = 0.05, call_rate: float = 0.95) -> dict:
    """
    Memfilter varian (MAF & Call Rate) dan mengonversi VCF ke biner PLINK (.bed, .bim, .fam).
    """
    out_prefix = os.path.join(job_dir, "qc_clean")
    max_geno = round(1.0 - call_rate, 4)
 
    cmd = [
        PLINK,
        "--vcf", vcf_path,
        "--keep", keep_samples_path,
        "--double-id",
        "--maf", str(maf),
        "--geno", str(max_geno),
        "--make-bed",
        "--out", out_prefix,
    ]
 
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Executabel 'plink2' tidak ditemukan. Atur env PLINK2_PATH atau letakkan plink2 di PATH.")
    if result.returncode != 0:
        raise HTTPException(status_code=422, detail=f"Error pada QC PLINK: {result.stderr or result.stdout}")
 
    bed_file = f"{out_prefix}.bed"
    bim_file = f"{out_prefix}.bim"
    fam_file = f"{out_prefix}.fam"
 
    if not (os.path.exists(bed_file) and os.path.exists(bim_file) and os.path.exists(fam_file)):
        raise HTTPException(status_code=500, detail="Gagal menghasilkan set berkas biner genotipe (.bed/.bim/.fam)")
 
    with open(bim_file) as f:
        passed_snps = sum(1 for _ in f)
 
    return {
        "bed_path": bed_file,
        "bim_path": bim_file,
        "fam_path": fam_file,
        "prefix": out_prefix,
        "passed_snps": passed_snps,
    }

def run_association_test(qc_prefix: str, matched_csv_path: str, eigenvec_path: str, job_dir: str) -> list[str]:
    out_prefix = os.path.join(job_dir, "gwas_assoc")

    # matched_phenotype.csv -> format PLINK2 (tab, header #FID IID, FID = IID seperti .fam)
    pheno_df = pd.read_csv(matched_csv_path)
    pheno_df.insert(0, "#FID", pheno_df["Sample_ID"])
    pheno_df = pheno_df.rename(columns={"Sample_ID": "IID"})
    plink_pheno_path = os.path.join(job_dir, "plink_pheno.tsv")
    pheno_df.to_csv(plink_pheno_path, sep="\t", index=False, na_rep="NA", lineterminator="\n")

    cmd = [
        PLINK,
        "--bfile", qc_prefix,
        "--pheno", plink_pheno_path,
        "--covar", eigenvec_path,
        "--glm", "hide-covar", "allow-no-covars",
        "--out", out_prefix
    ]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Executabel 'plink2' tidak ditemukan.")
    if result.returncode != 0:
        raise HTTPException(status_code=422, detail=f"Error pada Uji Asosiasi PLINK: {result.stderr or result.stdout}")

    glm_files = glob.glob(f"{out_prefix}.*.glm.*")
    if not glm_files:
        raise HTTPException(status_code=500, detail="Uji Asosiasi selesai tetapi tidak ada file luaran .glm yang ditemukan.")
    return glm_files