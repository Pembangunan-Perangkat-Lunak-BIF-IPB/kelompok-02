import os
import subprocess
from fastapi import HTTPException
from dotenv import load_dotenv

load_dotenv()
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
        raise HTTPException(
            status_code=500,
            detail=f"Executabel PLINK ('{PLINK}') tidak ditemukan. Atur env PLINK2_PATH atau letakkan plink2 di PATH."
        )
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
