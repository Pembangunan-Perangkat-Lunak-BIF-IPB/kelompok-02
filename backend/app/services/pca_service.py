import os
import subprocess
from fastapi import HTTPException

PLINK = os.getenv("PLINK2_PATH", "plink2")


def _run(cmd: list[str], label: str):
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Executabel 'plink2' tidak ditemukan.")
    if result.returncode != 0:
        raise HTTPException(status_code=422, detail=f"{label}: {result.stderr or result.stdout}")


def run_pca_computation(qc_prefix: str, job_dir: str, n_pcs: int = 10) -> tuple[str, str]:
    pca_prefix = os.path.join(job_dir, "pca_covariates")
    freq_prefix = os.path.join(job_dir, "qc_freq")

    # Hitung jumlah sampel dari .fam, jumlah PC harus lebih kecil dari jumlah sampel
    with open(f"{qc_prefix}.fam") as f:
        n_samples = sum(1 for _ in f)
    n_pcs = max(1, min(n_pcs, n_samples - 1))

    # Langkah 1: hitung frekuensi alel (.afreq)
    _run([PLINK, "--bfile", qc_prefix, "--freq", "--out", freq_prefix], "Hitung frekuensi alel")

    # Langkah 2: PCA dengan frekuensi tersebut
    _run([PLINK, "--bfile", qc_prefix, "--read-freq", f"{freq_prefix}.afreq",
          "--pca", str(n_pcs), "--out", pca_prefix], "Komputasi PCA")

    eigenvec_path = f"{pca_prefix}.eigenvec"
    eigenval_path = f"{pca_prefix}.eigenval"
    if not os.path.exists(eigenvec_path):
        raise HTTPException(status_code=500, detail="Gagal menghasilkan berkas kovariat PCA (.eigenvec)")
    return eigenvec_path, eigenval_path