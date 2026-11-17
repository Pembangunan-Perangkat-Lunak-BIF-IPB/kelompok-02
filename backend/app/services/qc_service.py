import os
import subprocess
from fastapi import HTTPException
from dotenv import load_dotenv
from app.services.job_logger import log_job

load_dotenv()
PLINK = os.getenv("PLINK2_PATH", "plink2")

import os
import subprocess
from fastapi import HTTPException
from dotenv import load_dotenv
from app.services.job_logger import log_job

load_dotenv()
PLINK = os.getenv("PLINK2_PATH", "plink2")

def run_quality_control(
    genotype_input: str,
    keep_samples_path: str,
    job_dir: str,
    maf: float = 0.05,
    call_rate: float = 0.95,
    call_rate_ind: float = 0.90,
    genotype_type: str = "vcf"
) -> dict:
    """
    Memfilter varian & individu dengan PLINK 2:
    - MAF filtering (--maf)
    - Call rate SNP (--geno, max_geno = 1 - call_rate)
    - Call rate individu (--mind, max_mind = 1 - call_rate_ind)
    - Filter biallelik murni (--max-alleles 2 --min-alleles 2)
    - Kompatibilitas kromosom tumbuhan/non-standar (--allow-extra-chr)
    - Otomatisasi LD Pruning (--indep-pairwise 50 5 0.2) untuk mendapatkan m_eff
    """
    out_prefix = os.path.join(job_dir, "qc_clean")
    max_geno = round(1.0 - call_rate, 4)
    max_mind = round(1.0 - call_rate_ind, 4)

    log_job(
        job_dir,
        f"Memulai Kontrol Kualitas (QC): MAF={maf}, "
        f"Call Rate SNP={call_rate} (max_geno={max_geno}), "
        f"Call Rate Individu={call_rate_ind} (max_mind={max_mind}), "
        f"Biallelic filter: YES, Extra-chr: ALLOW"
    )

    cmd = [PLINK]

    # Cek apakah input berupa PLINK binary atau VCF
    if genotype_type == "plink_bed":
        bfile_prefix = genotype_input
        if bfile_prefix.endswith(".bed"):
            bfile_prefix = bfile_prefix[:-4]
        cmd.extend(["--bfile", bfile_prefix])
    else:
        cmd.extend(["--vcf", genotype_input, "--double-id"])

    cmd.extend([
        "--keep", keep_samples_path,
        "--allow-extra-chr",
        "--min-alleles", "2",
        "--max-alleles", "2",
        "--maf", str(maf),
        "--geno", str(max_geno),
        "--mind", str(max_mind),
        "--make-bed",
        "--out", out_prefix,
    ])

    log_job(job_dir, f"Menjalankan perintah PLINK QC: {' '.join(cmd)}")

    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
    except FileNotFoundError:
        err = f"Executabel PLINK ('{PLINK}') tidak ditemukan. Atur env PLINK2_PATH atau letakkan plink2 di PATH."
        log_job(job_dir, err, "ERROR")
        raise HTTPException(status_code=500, detail=err)

    if result.stdout:
        log_job(job_dir, f"[PLINK QC Output]:\n{result.stdout.strip()}")

    if result.returncode != 0:
        err = f"Error pada QC PLINK: {result.stderr.strip() or result.stdout.strip()}"
        log_job(job_dir, err, "ERROR")
        raise HTTPException(status_code=422, detail=err)

    bed_file = f"{out_prefix}.bed"
    bim_file = f"{out_prefix}.bim"
    fam_file = f"{out_prefix}.fam"

    if not (os.path.exists(bed_file) and os.path.exists(bim_file) and os.path.exists(fam_file)):
        err = "Gagal menghasilkan set berkas biner genotipe (.bed/.bim/.fam)"
        log_job(job_dir, err, "ERROR")
        raise HTTPException(status_code=500, detail=err)

    with open(bim_file) as f:
        passed_snps = sum(1 for _ in f)

    log_job(job_dir, f"QC Berhasil: {passed_snps} penanda SNP biallelik lolos ambang batas MAF & Call Rate.")

    # ----------------------------------------------------
    # LD Pruning Otomatis & Komputasi m_eff
    # ----------------------------------------------------
    prune_prefix = os.path.join(job_dir, "qc_pruned")
    prune_cmd = [
        PLINK,
        "--bfile", out_prefix,
        "--indep-pairwise", "50", "5", "0.2",
        "--allow-extra-chr",
        "--out", prune_prefix
    ]

    log_job(job_dir, f"Menjalankan LD Pruning: {' '.join(prune_cmd)}")
    try:
        prune_res = subprocess.run(prune_cmd, capture_output=True, text=True)
        if prune_res.stdout:
            log_job(job_dir, f"[PLINK LD Pruning Output]:\n{prune_res.stdout.strip()}")
    except Exception as e:
        log_job(job_dir, f"Peringatan LD Pruning: {str(e)}", "WARN")

    prune_in_file = f"{prune_prefix}.prune.in"
    m_eff = passed_snps  # default fallback ke total passed snps jika prune gagal
    if os.path.exists(prune_in_file):
        with open(prune_in_file) as pf:
            m_eff = sum(1 for line in pf if line.strip())
        log_job(job_dir, f"LD Pruning Berhasil: Dihitung m_eff = {m_eff} marker independen dari total {passed_snps} SNP.")
    else:
        log_job(job_dir, f"Berkas .prune.in tidak ditemukan, m_eff menggunakan total SNP lolos QC: {m_eff}", "WARN")

    return {
        "bed_path": bed_file,
        "bim_path": bim_file,
        "fam_path": fam_file,
        "prefix": out_prefix,
        "passed_snps": passed_snps,
        "m_eff": m_eff,
    }
