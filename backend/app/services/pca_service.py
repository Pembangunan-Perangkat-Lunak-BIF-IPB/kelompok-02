import os
import subprocess
from fastapi import HTTPException

def run_pca_computation(qc_prefix: str, job_dir: str, n_pcs: int = 10) -> tuple[str, str]:
    """
    Task 4: Mengkalkulasi Principal Component Analysis (PCA) menggunakan PLINK 2.0
    untuk mengontrol stratifikasi populasi.
    """
    pca_prefix = os.path.join(job_dir, "pca_covariates")
    
    cmd = [
        "plink2",
        "--bfile", qc_prefix,
        "--pca", str(n_pcs),
        "--out", pca_prefix
    ]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise RuntimeError(f"PCA Computation Error: {result.stderr or result.stdout}")
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Executabel 'plink2' tidak ditemukan.")

    eigenvec_path = f"{pca_prefix}.eigenvec"
    eigenval_path = f"{pca_prefix}.eigenval"

    if not os.path.exists(eigenvec_path):
        raise HTTPException(status_code=500, detail="Gagal menghasilkan berkas kovariat PCA (.eigenvec)")

    return eigenvec_path, eigenval_path