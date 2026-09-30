from fastapi import APIRouter, HTTPException

router = APIRouter(
    prefix="/jobs",
    tags=["GWAS Pipeline"]
)

@router.get("/{result_id}/status", summary="Cek Status Analisis GWAS")
async def get_job_status(result_id: str):
    """
    Mengambil status komputasi GWAS real-time beserta progres 5 tahapan pipeline.
    """
    # Mengembalikan respons dummy sesuai spesifikasi SKPL & Figma
    return {
        "result_id": result_id,
        "status": "Running",
        "progress": 22,
        "stages": [
            {
                "key": "upload_validasi",
                "label": "Upload & Validasi Format",
                "status": "Success",
                "progress": 100
            },
            {
                "key": "qc",
                "label": "Kontrol Kualitas Genomik (QC)",
                "status": "Running",
                "progress": 40
            },
            {
                "key": "pca",
                "label": "Komputasi PCA & Stratifikasi Populasi",
                "status": "Queued",
                "progress": 0
            },
            {
                "key": "asosiasi",
                "label": "Uji Asosiasi Genetik",
                "status": "Queued",
                "progress": 0
            },
            {
                "key": "visualisasi",
                "label": "Visualisasi & Ekspor Hasil",
                "status": "Queued",
                "progress": 0
            }
        ]
    }