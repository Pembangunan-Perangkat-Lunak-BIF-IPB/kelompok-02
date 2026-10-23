import React from 'react'
import { Search } from 'lucide-react'

export const HeroSection: React.FC = () => {
  return (
    <section className="relative w-full min-h-[580px] bg-slate-900 text-white overflow-hidden flex flex-col justify-between">
      {/* Background Hero / Visual DNA 3D */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/40 via-slate-900 to-slate-950">
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-slate-900/60" />
      </div>

      {/* Floating Header Navigation */}
      <div className="relative z-10 flex justify-center pt-6 px-4">
        <header className="flex items-center justify-between bg-white/90 backdrop-blur-md px-6 py-2.5 rounded-full shadow-lg border border-white/50 w-full max-w-4xl text-slate-800">
          {/* Brand Logo */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
              J
            </div>
            <span className="font-bold text-base text-slate-900 tracking-tight">Jiwasku</span>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
            <a href="/" className="text-amber-500 border-b-2 border-amber-500 pb-0.5">Home</a>
            <a href="/pipeline" className="hover:text-slate-900 transition">Pipeline</a>
            <a href="/status/sample" className="hover:text-slate-900 transition">Status Analisis</a>
            <a href="/result/sample" className="hover:text-slate-900 transition">Riwayat Analisis</a>
          </nav>

          {/* Nav CTA */}
          <button className="bg-amber-400 hover:bg-amber-500 text-slate-900 text-xs font-bold px-4 py-2 rounded-full flex items-center gap-1.5 transition shadow-sm cursor-pointer">
            <Search className="w-3.5 h-3.5" />
            <span>Cek Riwayat</span>
          </button>
        </header>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center mt-12 mb-16">
        <h1 className="text-4xl md:text-5xl font-serif text-white leading-tight font-medium tracking-wide">
          Jiwasku
        </h1>
        <h2 className="text-2xl md:text-3xl font-sans font-bold text-white mt-1">
          Pipeline Analisis GWAS Terintegrasi End-to-End
        </h2>
        <p className="text-slate-200 text-xs md:text-sm mt-4 max-w-2xl mx-auto leading-relaxed font-normal">
          Platform komputasi genomik presisi untuk pemetaan variasi genetik, uji asosiasi statistik genomik, dan identifikasi penanda sifat biologis secara end to end dan terstandarisasi.
        </p>

        {/* Hero CTA Button */}
        <div className="mt-8">
          <a 
            href="/pipeline" 
            className="inline-block bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold text-xs md:text-sm px-8 py-3 rounded-full shadow-lg transition-all transform hover:-translate-y-0.5"
          >
            Mulai Analisis GWAS
          </a>
        </div>
      </div>
    </section>
  )
}