import React from 'react'
import { Search, Fingerprint, RotateCcw } from 'lucide-react'

export const SearchHistory: React.FC = () => {
  return (
    <section className="relative z-20 -mt-12 max-w-3xl mx-auto px-4 animate-pop-in" style={{ animationDelay: '0.4s' }}>
      <div className="bg-gradient-to-b from-cyan-50/90 to-blue-50/90 backdrop-blur-md border border-cyan-100 rounded-3xl p-8 shadow-xl text-center">
        {/* Top Icon */}
        <div className="w-10 h-10 bg-amber-100/80 rounded-full flex items-center justify-center mx-auto mb-3 text-amber-600">
          <RotateCcw className="w-5 h-5" />
        </div>

        <h3 className="text-xl font-bold text-slate-900">Akses Riwayat Analisis</h3>
        <p className="text-slate-500 text-xs mt-1">
          Lacak status antrean atau muat kembali hasil analisis GWAS Anda sebelumnya menggunakan kode unik.
        </p>

        {/* Search Bar Input */}
        <div className="mt-6 flex items-center bg-white rounded-full p-2 shadow-sm border border-slate-200 max-w-lg mx-auto">
          <div className="pl-3 text-slate-400">
            <Fingerprint className="w-5 h-5" />
          </div>
          <input 
            type="text" 
            placeholder="Masukkan kode unik..."
            className="w-full bg-transparent border-none text-xs text-slate-800 placeholder-slate-400 focus:outline-none px-3"
          />
          {/* Tombol Cari dengan Gradasi Cyan-Amber & Animasi Berjalan */}
          <button 
            type="button"
            className="bg-gradient-to-r from-amber-400 via-sky-500 to-cyan-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-full flex items-center gap-1.5 shadow-md animate-gradient-btn cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Cari</span>
          </button>
        </div>

        {/* Sample Code Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-[10px] text-slate-400 font-medium">
          <span>Contoh:</span>
          <span className="bg-white/80 border border-slate-200 px-2 py-0.5 rounded-md text-slate-600">#GWAS-7821</span>
          <span className="bg-white/80 border border-slate-200 px-2 py-0.5 rounded-md text-slate-600">#GWAS-9932</span>
          <span className="bg-white/80 border border-slate-200 px-2 py-0.5 rounded-md text-slate-600">#GWAS-2024-8891</span>
        </div>
      </div>
    </section>
  )
}