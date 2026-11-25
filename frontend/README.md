# Jiwasku Frontend — React + TypeScript + Vite

Antarmuka web interaktif untuk platform **Jiwasku Pipeline GWAS Terintegrasi**, dibangun menggunakan **React 19**, **TypeScript**, **Vite**, dan **Tailwind CSS v4**.

---

## 1. Prasyarat Runtime & Tooling

| Komponen | Versi Teruji | Catatan |
| :--- | :--- | :--- |
| **Node.js** | `v24.16.0` | Disarankan Node.js LTS (`>= 20`) |
| **npm** | `11.13.0` | Menggunakan `package-lock.json` untuk instalasi deterministik |

---

## 2. Daftar Package & Dependensi (`package.json`)

### Dependencies (Produksi)
| Package | Versi (`package.json`) | Kegunaan di Aplikasi |
| :--- | :--- | :--- |
| `react` / `react-dom` | `^19.3.1` | Library inti UI React 19 |
| `react-router` / `react-router-dom` | `^8.4.0` / `^7.18.4` | Routing client-side (`/`, `/pipeline`, `/status/:jobId`, `/result/:jobId`) |
| `axios` | `^1.20.0` | HTTP client menuju backend API (`src/api/client.ts`) |
| `@tanstack/react-query` | `^5.104.4` | Provider query client pada `src/main.tsx` |
| `tailwindcss` / `@tailwindcss/vite` | `^4.3.3` | Styling utility-first Tailwind CSS v4 via plugin Vite |
| `lucide-react` | `^1.61.0` | Ikon UI konsisten di seluruh halaman |
| `gsap` | `^3.15.1` | Animasi transisi navbar, Status Analisis, dan Hasil Analisis |
| `three`, `@react-three/fiber`, `@react-three/drei`, `@types/three` | `^0.186.1` / `^9.8.2` / `^10.7.9` | Rendering model 3D DNA interaktif (`DnaBackground3D.tsx`) |

### DevDependencies (Pengembangan & Build)
* **Build & Bundler:** `vite` (`^8.3.4`), `@vitejs/plugin-react` (`^6.1.2`)
* **Type Checking:** `typescript` (`~6.0.3`), `@types/node` (`^24.19.2`), `@types/react` (`^19.3.0`), `@types/react-dom` (`^19.3.0`)
* **Linting:** `eslint` (`^10.13.0`), `@eslint/js` (`^10.0.1`), `typescript-eslint` (`^8.71.2`), `eslint-plugin-react-hooks` (`^7.1.1`), `eslint-plugin-react-refresh` (`^0.5.7`), `globals` (`^17.13.0`)

---

## 3. Konfigurasi Environment & Pengaturan Project

### A. Berkas `.env`
Buat berkas `frontend/.env` (lihat `src/api/client.ts`):

```env
VITE_API_BASE_URL=http://localhost:8000
```

> [!NOTE]
> Jika `VITE_API_BASE_URL` tidak diatur, aplikasi otomatis menggunakan fallback `http://localhost:8000`. Berkas `frontend/fe.env` yang ada di repositori merupakan placeholder kosong; Vite membaca konfigurasi standar dari `.env`.

### B. Pengaturan TypeScript, Vite & ESLint
* **TypeScript (`tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`):**
  * Target kompilasi `es2023`, `moduleResolution: "bundler"`, `jsx: "react-jsx"`.
  * Aturan ketat aktif: `verbatimModuleSyntax: true` (wajib memakai `import type` untuk tipe), `erasableSyntaxOnly: true`, `noUnusedLocals: true`, `noUnusedParameters: true`.
* **Vite (`vite.config.ts`):**
  * Mengaktifkan `@vitejs/plugin-react` dan `@tailwindcss/vite`.
  * Berjalan secara default di `http://localhost:5173` (harus cocok dengan `allow_origins` pada `backend/app/main.py`).
* **ESLint (`eslint.config.js`):**
  * Menggunakan flat config untuk `**/*.{ts,tsx}` dan mengabaikan direktori `dist/`.

### C. Aset Statis (`public/`)
Pastikan aset berikut tersedia di `frontend/public/`:
* `public/models/dna.glb` — Model 3D heliks DNA yang dimuat oleh `DnaBackground3D.tsx`.
* `public/logo.png`, `public/favicon.svg`, `public/icons.svg` — Ikon & identitas visual aplikasi.

---

## 4. Panduan Instalasi & Perintah (`scripts`)

Seluruh perintah dijalankan dari direktori `frontend/`:

```powershell
# 1. Masuk ke folder frontend
cd frontend

# 2. Install dependensi sesuai lockfile package-lock.json
npm ci          # disarankan untuk instalasi reproducible
# npm install   # alternatif jika menambah/mengubah package

# 3. Pastikan frontend/.env sudah terisi VITE_API_BASE_URL=http://localhost:8000

# 4. Jalankan server pengembangan (HMR) di http://localhost:5173
npm run dev
```

Daftar skrip `npm` yang tersedia:
* `npm run dev` — Menjalankan Vite dev server (`http://localhost:5173`).
* `npm run build` — Menjalankan pengecekan tipe TypeScript (`tsc -b`) dan mem-build bundle produksi (`vite build`) ke `frontend/dist/`.
* `npm run lint` — Menjalankan pengecekan kode dengan ESLint (`eslint .`).
* `npm run preview` — Menjalankan preview lokal dari hasil build `dist/`.
