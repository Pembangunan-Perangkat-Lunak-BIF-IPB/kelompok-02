import os
import subprocess
from fastapi import HTTPException
from dotenv import load_dotenv
from app.services.job_logger import log_job

load_dotenv()
PLINK = os.getenv("PLINK2_PATH", "plink2")


def _run(cmd: list[str], label: str, job_dir: str = None):
    cmd_str = " ".join(cmd)
    if job_dir:
        log_job(job_dir, f"Menjalankan perintah: {cmd_str}")
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
    except FileNotFoundError:
        msg = f"Executabel PLINK ('{PLINK}') tidak ditemukan. Atur env PLINK2_PATH atau letakkan plink2 di PATH."
        if job_dir:
            log_job(job_dir, msg, "ERROR")
        raise HTTPException(status_code=500, detail=msg)

    if result.stdout and job_dir:
        # Tulis sebagian cuplikan stdout jika relevan
        log_job(job_dir, f"[{label}] Output:\n{result.stdout.strip()}")

    if result.returncode != 0:
        err_detail = f"{label}: {result.stderr.strip() or result.stdout.strip()}"
        if job_dir:
            log_job(job_dir, f"Gagal mengeksekusi PLINK: {err_detail}", "ERROR")
        raise HTTPException(status_code=422, detail=err_detail)


def run_pca_computation(qc_prefix: str, job_dir: str, n_pcs: int = 10) -> tuple[str, str]:
    pca_prefix = os.path.join(job_dir, "pca_covariates")
    freq_prefix = os.path.join(job_dir, "qc_freq")

    fam_file = f"{qc_prefix}.fam"
    if not os.path.exists(fam_file):
        raise HTTPException(status_code=500, detail="Berkas .fam hasil QC tidak ditemukan.")

    with open(fam_file) as f:
        n_samples = sum(1 for _ in f)

    log_job(job_dir, f"Memulai Komputasi PCA. Jumlah sampel terverifikasi: {n_samples}")

    if n_samples < 4:
        err = f"Jumlah sampel yang cocok ({n_samples}) terlalu sedikit untuk analisis GWAS dengan kovariat PCA. Minimal dibutuhkan setidaknya 4 sampel."
        log_job(job_dir, err, "ERROR")
        raise HTTPException(status_code=400, detail=err)

    # Batas aman PC:
    # Di PLINK --glm, jumlah kolom prediktor = 1 (Intercept) + 1 (SNP) + k (kovariat PC).
    # PLINK mewajibkan: n_samples > jumlah kolom prediktor (n_samples > k + 2).
    # Maka jumlah PC maksimal agar derajat kebebasan df > 0 adalah: k <= (n_samples - 3).
    max_safe_pcs = max(1, n_samples - 3)

    if n_pcs > max_safe_pcs:
        msg = (
            f"Jumlah PC diminta ({n_pcs}) melebihi batas aman untuk {n_samples} sampel. "
            f"Disesuaikan otomatis menjadi {max_safe_pcs} PC agar jumlah sampel ({n_samples}) > prediktor ({max_safe_pcs + 2}) pada uji asosiasi GLM."
        )
        log_job(job_dir, msg, "WARN")
        n_pcs = max_safe_pcs
    else:
        log_job(job_dir, f"Menggunakan {n_pcs} Principal Components sebagai kovariat stratifikasi populasi.")

    # Langkah 1: hitung frekuensi alel (.afreq)
    _run([PLINK, "--bfile", qc_prefix, "--freq", "--out", freq_prefix], "Hitung frekuensi alel", job_dir)

    # Langkah 2: PCA dengan frekuensi tersebut
    _run([
        PLINK, "--bfile", qc_prefix, 
        "--read-freq", f"{freq_prefix}.afreq",
        "--pca", str(n_pcs), 
        "--out", pca_prefix
    ], "Komputasi PCA", job_dir)

    eigenvec_path = f"{pca_prefix}.eigenvec"
    eigenval_path = f"{pca_prefix}.eigenval"
    if not os.path.exists(eigenvec_path):
        err = "Gagal menghasilkan berkas kovariat PCA (.eigenvec)"
        log_job(job_dir, err, "ERROR")
        raise HTTPException(status_code=500, detail=err)

    log_job(job_dir, f"PCA selesai. Berkas kovariat dihasilkan: {os.path.basename(eigenvec_path)}")
    return eigenvec_path, eigenval_path
