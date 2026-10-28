import { Search } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { DnaBackground3D } from '../../components/layout/DnaBackground3D'

export const HeroSection = () => {
  const location = useLocation()
  const isActive = (path: string) => location.pathname === path

  return (
    <section className="relative w-full min-h-[600px] bg-slate-950 text-white overflow-hidden flex flex-col justify-between select-none">
      {/* 
        1. Background Dasar & Overlay Gelap 
        (Ditaruh di z-0 supaya berada di lapisan paling bawah)
      */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sky-900/35 via-slate-950 to-slate-950">
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-slate-950/80 pointer-events-none" />
      </div>

      {/* 
        2. Kanvas 3D DNA 
        (Dinaikkan ke z-10 atau z-20 supaya posisinya BERADA DI ATAS overlay gelap)
      */}
      <div className="absolute inset-0 z-10 pointer-events-auto">
        <DnaBackground3D isPipelinePage={false} />
      </div>

      {/* Floating Header Navigation (z-30 agar berada di atas 3D DNA) */}
      <div className="relative z-30 flex justify-center pt-6 px-4 pointer-events-none animate-fade-in-up">
        <header className="pointer-events-auto flex items-center justify-between bg-white/90 backdrop-blur-md px-6 py-2.5 rounded-full shadow-lg border border-white/50 w-full max-w-4xl text-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-sky-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md">
              J
            </div>
            <span className="font-bold text-base text-slate-900 tracking-tight">Jiwasku</span>
          </div>

          {/* Nav Links dengan efek sorot pill aktif */}
          <nav className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <Link 
              to="/" 
              className={`px-3.5 py-1.5 rounded-full transition-all ${
                isActive('/') 
                  ? 'bg-amber-500/50 text-slate-900 shadow-sm font-bold border border-amber-500/50' 
                  : 'hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Home
            </Link>
            <Link 
              to="/pipeline" 
              className={`px-3.5 py-1.5 rounded-full transition-all ${
                isActive('/pipeline') 
                  ? 'bg-amber-500/15 text-cyan-700 shadow-sm font-bold border border-amber-500/30' 
                  : 'hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Pipeline
            </Link>
            <Link 
              to="/status/sample" 
              className={`px-3.5 py-1.5 rounded-full transition-all ${
                isActive('/status/sample') 
                  ? 'bg-amber-500/15 text-cyan-700 shadow-sm font-bold border border-cyan-500/30' 
                  : 'hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Status Analisis
            </Link>
            <Link 
              to="/result/sample" 
              className={`px-3.5 py-1.5 rounded-full transition-all ${
                isActive('/result/sample') 
                  ? 'bg-cyan-500/15 text-cyan-700 shadow-sm font-bold border border-cyan-500/30' 
                  : 'hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Riwayat Analisis
            </Link>
          </nav>

          {/* Tombol Cek Riwayat dengan Gradasi Cyan-Amber & Animasi Berjalan */}
          <button className="bg-gradient-to-r from-amber-400 via-sky-500 to-cyan-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-full flex items-center gap-1.5 shadow-md animate-gradient-btn cursor-pointer">
            <Search className="w-3.5 h-3.5" />
            <span>Cek Riwayat</span>
          </button>
        </header>
      </div>

      {/* Hero Content (z-30 agar berada di atas 3D DNA) */}
      <div className="relative z-30 max-w-4xl mx-auto px-6 text-center mt-12 mb-16 pointer-events-none animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <h1 className="text-4xl md:text-5xl font-serif text-white leading-tight font-medium tracking-wide drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
          Jiwasku
        </h1>
        <h2 className="text-2xl md:text-3xl font-sans font-bold text-white mt-1 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
          Pipeline Analisis GWAS Terintegrasi End-to-End
        </h2>
        <p className="text-slate-200 text-xs md:text-sm mt-4 max-w-2xl mx-auto leading-relaxed font-normal drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
          Platform komputasi genomik presisi untuk pemetaan variasi genetik, uji asosiasi statistik genomik, dan identifikasi penanda sifat biologis secara end to end dan terstandarisasi.
        </p>

        <div className="mt-8">
          {/* Tombol Utama dengan Gradasi Cyan-Amber & Animasi Berjalan */}
          <Link 
            to="/pipeline" 
            className="pointer-events-auto inline-block bg-gradient-to-r from-amber-400 via-sky-500 to-cyan-400 border border-slate-800/50 text-slate-950 font-bold text-xs md:text-sm px-8 py-3.5 rounded-full shadow-[0_0_25px_rgba(6,182,212,0.4)] animate-gradient-btn transition-all transform hover:scale-105 hover:-translate-y-0.5 cursor-pointer"
          >
            Mulai Analisis GWAS
          </Link>
        </div>
      </div>
    </section>
  )
}