import os
import shutil
from fastapi import UploadFile, HTTPException

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "storage/uploads")

# Pastikan folder penyimpanan tersedia
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".vcf", ".gz", ".csv"}

def save_uploaded_file(file: UploadFile) -> str:
    """Memvalidasi dan menyimpan file VCF/CSV yang diunggah ke storage lokal."""
    filename = file.filename
    ext = os.path.splitext(filename)[1].lower()
    
    # Cek ekstensi file sederhana
    if ext not in ALLOWED_EXTENSIONS and not filename.endswith(".vcf.gz"):
        raise HTTPException(
            status_code=400, 
            detail=f"Format file '{ext}' tidak didukung. Harap unggah file .vcf, .vcf.gz, atau .csv"
        )
    
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    # Simpan file ke direktori storage
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal menyimpan file: {str(e)}")
        
    return file_path