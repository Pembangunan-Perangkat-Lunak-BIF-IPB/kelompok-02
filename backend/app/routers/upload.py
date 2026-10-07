from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.upload_service import save_uploaded_file

router = APIRouter(
    prefix="/upload",  
    tags=["GWAS Pipeline"]
)

@router.post("")
async def upload_files(
    vcf_file: UploadFile = File(..., description="File Genotipe (.vcf / .vcf.gz)"),
    pheno_file: UploadFile = File(..., description="File Fenotipe (.csv)")
):
    """
    Endpoint untuk mengunggah pasangan file VCF (Genotipe) dan CSV (Fenotipe).
    """
    vcf_path = save_uploaded_file(vcf_file)
    pheno_path = save_uploaded_file(pheno_file)
    
    return {
        "message": "File berhasil diunggah!",
        "vcf_file": {
            "filename": vcf_file.filename,
            "saved_path": vcf_path
        },
        "phenotype_file": {
            "filename": pheno_file.filename,
            "saved_path": pheno_path
        }
    }