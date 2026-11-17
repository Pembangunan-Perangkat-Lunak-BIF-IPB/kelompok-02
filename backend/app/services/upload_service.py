import os
import shutil
import gzip
from typing import Optional
from fastapi import UploadFile, HTTPException

def validate_and_save_files(
    csv_file: UploadFile,
    job_dir: str,
    vcf_file: Optional[UploadFile] = None,
    bed_file: Optional[UploadFile] = None,
    bim_file: Optional[UploadFile] = None,
    fam_file: Optional[UploadFile] = None,
) -> dict:
    """
    Validasi format input genotipe (VCF atau PLINK triplet .bed/.bim/.fam)
    dan berkas fenotipe (.csv), lalu simpan ke folder job_dir.
    """
    os.makedirs(job_dir, exist_ok=True)

    # 1. Validasi Fenotipe CSV
    if not csv_file or not csv_file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Berkas fenotipe harus berupa file berekstensi .csv")

    csv_path = os.path.join(job_dir, csv_file.filename)
    with open(csv_path, "wb") as buffer:
        shutil.copyfileobj(csv_file.file, buffer)

    # 2. Cek apakah input berupa PLINK biner (.bed, .bim, .fam)
    has_plink_triplet = bool(bed_file and bim_file and fam_file)
    has_vcf = bool(vcf_file and (vcf_file.filename.endswith(".vcf") or vcf_file.filename.endswith(".vcf.gz")))

    if not has_vcf and not has_plink_triplet:
        raise HTTPException(
            status_code=400,
            detail="Berkas genotipe harus berupa berkas .vcf / .vcf.gz ATAU paket 3 berkas PLINK biner (.bed, .bim, .fam)"
        )

    if has_plink_triplet:
        # Validasi ekstensi
        if not bed_file.filename.endswith(".bed"):
            raise HTTPException(status_code=400, detail="Berkas bed harus berakhiran .bed")
        if not bim_file.filename.endswith(".bim"):
            raise HTTPException(status_code=400, detail="Berkas bim harus berakhiran .bim")
        if not fam_file.filename.endswith(".fam"):
            raise HTTPException(status_code=400, detail="Berkas fam harus berakhiran .fam")

        bed_path = os.path.join(job_dir, bed_file.filename)
        bim_path = os.path.join(job_dir, bim_file.filename)
        fam_path = os.path.join(job_dir, fam_file.filename)

        with open(bed_path, "wb") as buf:
            shutil.copyfileobj(bed_file.file, buf)
        with open(bim_path, "wb") as buf:
            shutil.copyfileobj(bim_file.file, buf)
        with open(fam_path, "wb") as buf:
            shutil.copyfileobj(fam_file.file, buf)

        # Prefix dasar PLINK biner (misal genotype_data)
        base_prefix = os.path.splitext(bed_path)[0]

        return {
            "genotype_type": "plink_bed",
            "genotype_path": bed_path,
            "bfile_prefix": base_prefix,
            "bed_path": bed_path,
            "bim_path": bim_path,
            "fam_path": fam_path,
            "csv_path": csv_path
        }

    # Jika input berupa VCF
    vcf_filename = vcf_file.filename
    vcf_path = os.path.join(job_dir, vcf_filename)
    with open(vcf_path, "wb") as buffer:
        shutil.copyfileobj(vcf_file.file, buffer)

    is_gz = vcf_path.endswith(".vcf.gz")
    open_func = gzip.open if is_gz else open
    try:
        with open_func(vcf_path, "rt", errors="ignore") as f:
            first_line = f.readline()
            if not first_line.startswith("##fileformat=VCF"):
                raise HTTPException(status_code=400, detail="Header berkas VCF tidak valid (harus diawali ##fileformat=VCF)")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Gagal membaca berkas VCF: {str(e)}")

    return {
        "genotype_type": "vcf",
        "genotype_path": vcf_path,
        "csv_path": csv_path
    }