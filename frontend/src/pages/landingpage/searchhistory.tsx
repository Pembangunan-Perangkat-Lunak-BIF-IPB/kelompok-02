import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Fingerprint, RotateCcw } from 'lucide-react'

export const SearchHistory: React.FC = () => {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const lastJobId = (localStorage.getItem('last_gwas_result_id') || '').trim().replace(/^#/, '')

  const handleSearch = (targetQuery?: string) => {
    const q = (targetQuery ?? query).trim().replace(/^#/, '')
    if (!q) return
    navigate(`/status/${q}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }

  return (
    <section 
      className="relative z-20 -mt-12 max-w-3xl mx-auto px-4 animate-pop-out" 
      style={{ animationDelay: '680ms' }}
    >
      <div className="bg-white/70 backdrop-blur-sm border border-white/80 rounded-3xl p-7 sm:p-9 shadow-[0_16px_40px_-8px_rgba(15,23,42,0.07)] hover:shadow-[0_20px_50px_-6px_rgba(15,23,42,0.1)] transition-all duration-300 text-center">
        {/* Top Icon */}
        <div className="w-11 h-11 bg-amber-50/80 border border-amber-200/70 rounded-2xl flex items-center justify-center mx-auto mb-3.5 text-amber-600 shadow-2xs">
          <RotateCcw className="w-5 h-5" />
        </div>

        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Akses Riwayat Analisis
        </h3>
        <p className="text-slate-600 text-xs sm:text-sm mt-1.5 max-w-lg mx-auto leading-relaxed font-medium">
          Lacak status antrean atau muat kembali hasil analisis GWAS Anda sebelumnya menggunakan kode unik Result ID.
        </p>

        {/* Search Bar Input dengan Glassmorphic Sub-layer */}
        <div className="mt-6 flex items-center bg-white/60 backdrop-blur-xs rounded-2xl p-1.5 shadow-2xs border border-white/80 max-w-lg mx-auto focus-within:bg-white/90 focus-within:border-cyan-500 focus-within:ring-4 focus-within:ring-cyan-500/15 transition-all duration-200">
          <div className="pl-3 text-slate-400">
            <Fingerprint className="w-5 h-5" />
          </div>
          <input 
            type="text" 
            placeholder="Masukkan Result ID (misal GWAS-20261104-...)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent border-none text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none px-3 font-medium"
          />
          {/* Tombol Cari dengan Gradasi Cyan-Amber & Animasi Berjalan */}
          <button 
            type="button"
            onClick={() => handleSearch()}
            className="bg-gradient-to-r from-amber-400 via-sky-500 to-cyan-400 text-slate-950 text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm hover:shadow-md hover:scale-102 active:scale-95 animate-gradient-btn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 cursor-pointer transition-all duration-200 shrink-0"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Cari</span>
          </button>
        </div>

        {/* Recent / Sample Code Badges */}
        {lastJobId && (
          <div className="flex flex-wrap items-center justify-center gap-2 mt-5 text-[11px] text-slate-600 font-medium">
            <span>Analisis Terakhir Anda:</span>
            <button
              type="button"
              onClick={() => handleSearch(lastJobId)}
              className="inline-flex items-center gap-1 bg-sky-50/80 border border-sky-200/70 px-3 py-1 rounded-lg font-mono text-cyan-900 font-bold hover:bg-sky-100 hover:border-sky-300 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer shadow-2xs"
            >
              <span>#{lastJobId}</span>
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
