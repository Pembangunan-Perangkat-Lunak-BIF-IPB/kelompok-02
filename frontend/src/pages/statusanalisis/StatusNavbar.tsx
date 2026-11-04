import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Search } from 'lucide-react'

export const StatusNavbar: React.FC = () => {
  const location = useLocation()


  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    if (path === '/pipeline') return location.pathname === '/pipeline'
    if (path.startsWith('/status')) return location.pathname.startsWith('/status')
    if (path.startsWith('/result')) return location.pathname.startsWith('/result')
    return location.pathname === path
  }




  return (
    <div className="flex justify-center pt-6 pb-2 px-4">
      <header className="flex items-center justify-between bg-white/90 backdrop-blur-md px-6 py-2.5 rounded-full shadow-lg border border-white/50 w-full max-w-4xl text-slate-800">
        <Link to="/" className="flex items-center gap-2 group cursor-pointer">
          <div className="w-7 h-7 bg-sky-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md group-hover:scale-105 transition-transform">
            J
          </div>
          <span className="font-bold text-base text-slate-900 tracking-tight">Jiwasku</span>
        </Link>

        {/* Nav Links */}
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
                ? 'bg-amber-500/50 text-slate-900 shadow-sm font-bold border border-amber-500/50' 
                : 'hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Pipeline
          </Link>
          <Link 
            to="/status" 
            className={`px-3.5 py-1.5 rounded-full transition-all ${
              isActive('/status') 
                ? 'bg-amber-500/50 text-slate-900 shadow-sm font-bold border border-amber-500/50' 
                : 'hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Status Analisis
          </Link>
          <Link 
            to="/result" 
            className={`px-3.5 py-1.5 rounded-full transition-all ${
              isActive('/result') 
                ? 'bg-amber-500/50 text-slate-900 shadow-sm font-bold border border-amber-500/50' 
                : 'hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Riwayat Analisis
          </Link>
        </nav>

        {/* Tombol Cek Riwayat */}
        <button 
          type="button"
          onClick={() => {
            const id = prompt('Masukkan Result ID:')
            if (id) window.location.href = `/status/${id.replace('#', '')}`
          }}
          className="bg-gradient-to-r from-amber-400 via-sky-500 to-cyan-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-full flex items-center gap-1.5 shadow-md animate-gradient-btn cursor-pointer"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Cek Riwayat</span>
        </button>
      </header>
    </div>
  )
}
