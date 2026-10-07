import os
import uuid
import shutil
from fastapi import UploadFile, HTTPException

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "storage/uploads")
MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", 700))
MAX_BYTES = MAX_UPLOAD_MB * 1024 * 1024

def save_pipeline_files(vcf_file: UploadFile, csv_file: UploadFile, result_id: str):
    job_dir = os.path.join(UPLOAD_DIR, result_id)
    os.makedirs(job_dir, exist_ok=True)

    # Validasi Ekstensi Ketat
    if not (vcf_file.filename.endswith('.vcf') or vcf_file.filename.endswith('.vcf.gz')):
        raise HTTPException(status_code=400, detail="File genotipe harus berformat .vcf atau .vcf.gz")
    if not csv_file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File fenotipe harus berformat .csv")

    def _save_file(file_obj: UploadFile, target_filename: str) -> str:
        target_path = os.path.join(job_dir, target_filename)
        size = 0
        with open(target_path, "wb") as buffer:
            while chunk := file_obj.file.read(8192):
                size += len(chunk)
                if size > MAX_BYTES:
                    os.remove(target_path)
                    raise HTTPException(status_code=400, detail=f"Ukuran file {file_obj.filename} melebihi batas {MAX_UPLOAD_MB}MB")
                buffer.write(chunk)
        return target_path

    vcf_saved = _save_file(vcf_file, "genotype" + (".vcf.gz" if vcf_file.filename.endswith(".vcf.gz") else ".vcf"))
    csv_saved = _save_file(csv_file, "phenotype.csv")

    return vcf_saved, csv_saved