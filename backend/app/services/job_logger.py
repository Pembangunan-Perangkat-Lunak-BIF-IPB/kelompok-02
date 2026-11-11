import os
from datetime import datetime

def log_job(job_dir: str, message: str, level: str = "INFO"):
    """
    Menulis pesan log berstempel waktu ke pipeline.log di dalam folder kerja job.
    """
    try:
        os.makedirs(job_dir, exist_ok=True)
        log_path = os.path.join(job_dir, "pipeline.log")
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        line = f"[{timestamp}] [{level.upper()}] {message}\n"
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(line)
    except Exception:
        pass

def get_job_log(job_dir: str) -> str:
    """
    Membaca isi berkas pipeline.log jika tersedia.
    """
    log_path = os.path.join(job_dir, "pipeline.log")
    if os.path.exists(log_path):
        with open(log_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    return "Belum ada catatan log untuk job ini."
