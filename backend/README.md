# Jiwasku Backend — FastAPI & PLINK 2.0 GWAS Engine

Backend REST API dan mesin eksekusi pipeline **Genome-Wide Association Study (GWAS)** untuk platform **Jiwasku**, dibangun menggunakan **FastAPI**, **SQLAlchemy + Alembic (PostgreSQL)**, serta **PLINK 2.0**.

---

## 1. Prasyarat Sistem & Dependensi Eksternal

Sebelum memasang dependensi Python, pastikan perangkat lunak berikut tersedia di mesin Anda:

| Komponen | Versi / Catatan | Fungsi |
| :--- | :--- | :--- |
| **Python** | `3.13` atau `3.14` (teruji pada `Python 3.14.0`) | Runtime aplikasi FastAPI & service Python |
| **PostgreSQL** | `>= 14` | Database utama (wajib PostgreSQL karena `db_store_service.py` menggunakan `sqlalchemy.dialects.postgresql.insert`) |
| **PLINK 2.0** | Binary `plink2` / `plink2.exe` | Engine komputasi QC, LD pruning, PCA, dan `--glm` association |

> [!IMPORTANT]
> Pastikan binary `plink2` dapat dieksekusi di OS target (misalnya `C:\plink2\plink2.exe` pada Windows, atau terpasang di `PATH` pada Linux/WSL2/macOS).

---

## 2. Daftar Package Python (`requirements.txt`)

Seluruh package beserta versi persis (*pinned versions*) dicatat di [requirements.txt](requirements.txt). Ringkasan package inti yang digunakan langsung oleh aplikasi:

* **API & ASGI Server:** `fastapi==0.141.1`, `uvicorn==0.54.0`, `starlette==1.7.0`, `python-multipart==0.0.32` (penanganan upload file multipart VCF/PLINK/CSV).
* **Database & Migrasi:** `SQLAlchemy==2.1.1`, `alembic==1.20.0`, `psycopg==3.3.6`, `psycopg-binary==3.3.6`.
* **Validasi & Konfigurasi:** `pydantic==2.13.5`, `pydantic-settings==2.15.0`, `python-dotenv==1.2.3`, `PyYAML==6.0.3`.
* **Pengolahan Data, Visualisasi & Laporan:** `pandas==3.1.0`, `numpy==2.5.4`, `matplotlib==3.11.2` (mode headless `Agg`), `pillow==13.0.0`, `reportlab==5.1.0`.

---

## 3. Konfigurasi Environment & Pengaturan Aplikasi

### A. Berkas `.env`
Salin template [`.env.example`](.env.example) menjadi `backend/.env`:

```env
# Database Configuration
DATABASE_URL=postgresql+psycopg://jiwasku:jiwasku@localhost:5432/jiwasku

# Storage & Upload Limits
UPLOAD_DIR=storage/uploads
RESULT_DIR=storage/results
MAX_UPLOAD_MB=700

# Executables
PLINK2_PATH=C:\plink2\plink2.exe
```

Penjelasan variabel:
* `DATABASE_URL`: String koneksi PostgreSQL untuk SQLAlchemy (`app/database.py`) dan Alembic (`alembic/env.py`). Jika tidak disetel di environment, `app/database.py` memakai fallback `postgresql://postgres:postgres@localhost:5432/jiwasku`.
* `PLINK2_PATH`: Path absolut ke executable PLINK 2.0 (dibaca oleh `qc_service.py`, `pca_service.py`, dan `association_service.py`). Jika tidak disetel, fallback ke `"plink2"` dari `PATH` sistem.
* `UPLOAD_DIR`, `RESULT_DIR`, `MAX_UPLOAD_MB`: Konfigurasi direktori penyimpanan dan batas unggahan (secara runtime router `pipeline.py` menyimpan berkas kerja terisolasi pada `storage/uploads/<result_id>/` relatif terhadap direktori kerja `backend/`).

### B. Konfigurasi CORS (`app/main.py`)
Backend mengizinkan akses CORS dari origin frontend Vite lokal:
* `http://localhost:5173`
* `http://127.0.0.1:5173`

### C. Konfigurasi Alembic (`alembic.ini` & `alembic/env.py`)
`alembic/env.py` otomatis memuat `.env` melalui `load_dotenv()` dan menimpa `sqlalchemy.url` menggunakan `DATABASE_URL` jika tersedia.

---

## 4. Panduan Instalasi & Menjalankan (Reproducible)

Seluruh perintah dijalankan dari direktori `backend/`:

```powershell
# 1. Masuk ke folder backend
cd backend

# 2. Buat & aktifkan virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1        # Windows PowerShell
# source .venv/bin/activate         # Linux / macOS / WSL2

# 3. Install seluruh dependensi dengan versi terkunci
pip install --upgrade pip
pip install -r requirements.txt

# 4. Salin dan sesuaikan file environment
Copy-Item .env.example .env         # Windows PowerShell
# cp .env.example .env              # Linux / macOS / WSL2

# 5. Pastikan database PostgreSQL 'jiwasku' sudah dibuat, lalu jalankan migrasi skema
# (Wajib dijalankan karena app/main.py tidak memanggil create_all otomatis)
alembic upgrade head

# 6. Jalankan server FastAPI
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Verifikasi server berjalan:
* API Root / Swagger Docs: `http://localhost:8000/docs`
* ReDoc: `http://localhost:8000/redoc`

---

## 5. Struktur Direktori Backend

```text
backend/
├── alembic/                 # Skrip & versi migrasi skema PostgreSQL
│   └── versions/
├── app/
│   ├── main.py              # Entrypoint FastAPI & konfigurasi CORS
│   ├── database.py          # Engine SQLAlchemy & SessionLocal
│   ├── models/              # Model ORM (Analysis, AnalysisStage, Accession, SNPGenotype, dll.)
│   ├── routers/             # Endpoint REST (/api/v1/upload, status, log, results, download)
│   ├── schemas/             # Skema Pydantic
│   └── services/            # Pipeline service (upload, matching, qc, pca, association, rendering, logger)
├── storage/                 # Direktori scratch terisolasi per result_id (diabaikan git)
├── .env.example             # Template konfigurasi environment
├── alembic.ini              # Konfigurasi Alembic
├── requirements.txt         # Daftar dependensi Python terkunci
└── README.md                # Dokumentasi ini
```
