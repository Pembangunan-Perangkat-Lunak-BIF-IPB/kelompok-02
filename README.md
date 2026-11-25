# JIWASKU — Pipeline GWAS Terintegrasi

Platform web terintegrasi untuk menjalankan alur **Genome-Wide Association Study (GWAS)** secara otomatis berbasis **PLINK 2.0**, **FastAPI**, **PostgreSQL**, dan **React + TypeScript**.

---

## 1. Struktur Monorepo

```text
JiwaskuProject/
├── backend/         # REST API FastAPI, migrasi Alembic (PostgreSQL), & engine PLINK 2.0
├── frontend/        # Antarmuka web React 19, Vite, Tailwind CSS v4, GSAP, & Three.js
├── sample_data/     # Direktori dataset uji
├── tests/           # Direktori pengujian
├── .vscode/         # Pengaturan editor (python.terminal.useEnvFile: true)
└── README.md        # Dokumentasi utama monorepo
```

---

## 2. Prasyarat Lingkungan (Global)

Pastikan seluruh dependensi sistem berikut telah terpasang sebelum memulai:

1. **Python** `3.13` / `3.14` (teruji pada `Python 3.14.0`)
2. **Node.js** `>= 20` (teruji pada `v24.16.0`) dan **npm** (`11.13.0`)
3. **PostgreSQL** `>= 14` (database bernama `jiwasku`)
4. **PLINK 2.0** (`plink2` di `PATH` atau executable `C:\plink2\plink2.exe` di Windows)

> [!TIP]
> Berkas [`.vscode/settings.json`](.vscode/settings.json) mengaktifkan `"python.terminal.useEnvFile": true` agar VS Code otomatis memuat variabel `.env` di terminal Python.

---

## 3. Panduan Cepat Menjalankan Sistem (Reproducible)

Ikuti panduan detail di masing-masing folder untuk konfigurasi package, `.env`, dan troubleshooting:
* 📘 **Dokumentasi Backend:** [`backend/README.md`](backend/README.md) & [`backend/requirements.txt`](backend/requirements.txt)
* 📗 **Dokumentasi Frontend:** [`frontend/README.md`](frontend/README.md) & [`frontend/package.json`](frontend/package.json)

### Ringkasan Eksekusi

**Terminal 1 — Backend (`http://localhost:8000`):**
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env      # sesuaikan DATABASE_URL & PLINK2_PATH
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 — Frontend (`http://localhost:5173`):**
```powershell
cd frontend
npm ci
# Pastikan frontend/.env berisi: VITE_API_BASE_URL=http://localhost:8000
npm run dev
```

Setelah kedua server berjalan, buka peramban pada **`http://localhost:5173`**.
