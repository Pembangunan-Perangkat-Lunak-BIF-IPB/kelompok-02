import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Search } from 'lucide-react'

export const PipelineNavbar: React.FC = () => {
  const location = useLocation()
  const isActive = (path: string) => location.pathname === path

  return (
    <div className="flex justify-center pt-6 pb-2 px-4">
      <header className="flex items-center justify-between bg-white/90 backdrop-blur-md px-6 py-2.5 rounded-full shadow-lg border border-white/50 w-full max-w-4xl text-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md">
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
                ? 'bg-cyan-500/15 text-cyan-700 shadow-sm font-bold border border-cyan-500/30' 
                : 'hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Home
          </Link>
          <Link 
            to="/pipeline" 
            className={`px-3.5 py-1.5 rounded-full transition-all ${
              isActive('/pipeline') 
                ? 'bg-cyan-500/15 text-cyan-700 shadow-sm font-bold border border-cyan-500/30' 
                : 'hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Pipeline
          </Link>
          <Link 
            to="/status/sample" 
            className={`px-3.5 py-1.5 rounded-full transition-all ${
              isActive('/status/sample') 
                ? 'bg-cyan-500/15 text-cyan-700 shadow-sm font-bold border border-cyan-500/30' 
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

        {/* Tombol Gradasi Berjalan */}
        <button className="bg-gradient-to-r from-cyan-600 via-sky-500 to-amber-500 text-white text-xs font-bold px-4 py-2 rounded-full flex items-center gap-1.5 shadow-md animate-gradient-btn cursor-pointer">
          <Search className="w-3.5 h-3.5" />
          <span>Cek Riwayat</span>
        </button>
      </header>
    </div>
  )
}