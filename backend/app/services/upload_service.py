import os
import shutil
import gzip
from fastapi import UploadFile, HTTPException

def validate_and_save_files(vcf_file: UploadFile, csv_file: UploadFile, job_dir: str) -> tuple[str, str]:
    """
    Task 1: Validasi format dasar, cek integritas berkas, dan simpan raw input ke file storage.
    """
    os.makedirs(job_dir, exist_ok=True)
    
    # 1. Validasi Ekstensi File Genotipe
    vcf_filename = vcf_file.filename
    if not (vcf_filename.endswith(".vcf") or vcf_filename.endswith(".vcf.gz")):
        raise HTTPException(status_code=400, detail="File genotipe harus berformat .vcf atau .vcf.gz")
    
    # 2. Validasi Ekstensi File Fenotipe
    if not csv_file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File fenotipe harus berformat .csv")
    
    vcf_path = os.path.join(job_dir, vcf_filename)
    csv_path = os.path.join(job_dir, csv_file.filename)
    
    # Simpan File ke Storage
    with open(vcf_path, "wb") as buffer:
        shutil.copyfileobj(vcf_file.file, buffer)
        
    with open(csv_path, "wb") as buffer:
        shutil.copyfileobj(csv_file.file, buffer)
        
    # Cek Validitas Header VCF Sederhana
    is_gz = vcf_path.endswith(".vcf.gz")
    open_func = gzip.open if is_gz else open
    
    try:
        with open_func(vcf_path, "rt", errors="ignore") as f:
            first_line = f.readline()
            if not first_line.startswith("##fileformat=VCF"):
                raise HTTPException(status_code=400, detail="Header berkas VCF tidak valid (harus diawali ##fileformat=VCF)")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Gagal membaca file VCF: {str(e)}")

    return vcf_path, csv_path