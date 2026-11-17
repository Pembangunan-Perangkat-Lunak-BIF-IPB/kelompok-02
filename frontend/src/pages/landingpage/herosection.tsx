import { Link } from 'react-router-dom'
import { DnaBackground3D } from '../../components/layout/DnaBackground3D'
import { AppNavbar } from '../../components/layout/AppNavbar'

export const HeroSection = () => {
  return (
    <section className="relative w-full min-h-[600px] bg-slate-950 text-white overflow-hidden flex flex-col justify-between">
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
      <div className="relative z-30">
        <AppNavbar />
      </div>

      {/* Hero Content (z-30 agar berada di atas 3D DNA) */}
      <div className="relative z-30 max-w-4xl mx-auto px-6 text-center mt-12 mb-16 pointer-events-none">
        <h1 
          className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)] animate-pop-out"
          style={{ animationDelay: '120ms' }}
        >
          Jiwasku
        </h1>
        <h2 
          className="text-xl md:text-3xl font-bold text-slate-100 mt-2 tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)] animate-fade-in-up"
          style={{ animationDelay: '260ms' }}
        >
          Pipeline Analisis GWAS Terintegrasi End-to-End
        </h2>
        <p 
          className="text-slate-200/90 text-xs md:text-sm mt-4 max-w-2xl mx-auto leading-relaxed font-normal drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] animate-fade-in-up"
          style={{ animationDelay: '400ms' }}
        >
          Platform komputasi genomik presisi untuk pemetaan variasi genetik, uji asosiasi statistik genomik, dan identifikasi penanda sifat biologis secara end to end dan terstandarisasi.
        </p>

        <div 
          className="mt-8 animate-pop-out"
          style={{ animationDelay: '550ms' }}
        >
          {/* Tombol Utama dengan Gradasi Cyan-Amber, Animasi Shimmer & Pulsing Glow */}
          <Link 
            to="/pipeline" 
            className="pointer-events-auto inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 via-sky-500 to-cyan-400 text-slate-950 font-bold text-xs md:text-sm px-8 py-3.5 rounded-full animate-glow-pulse animate-gradient-btn transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cyan-400 cursor-pointer"
          >
            <span>Mulai Analisis GWAS</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
