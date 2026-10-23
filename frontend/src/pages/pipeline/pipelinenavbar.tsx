import React from 'react'
import { Search } from 'lucide-react'

export const PipelineNavbar: React.FC = () => {
  return (
    <div className="flex justify-center pt-4 pb-2 px-4">
      <header className="flex items-center justify-between bg-white/90 backdrop-blur-md px-6 py-2 rounded-full shadow-sm border border-slate-200/80 w-full max-w-5xl text-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-[10px]">
            J
          </div>
          <span className="font-bold text-xs text-slate-900 tracking-tight">Jiwasku</span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-[11px] font-semibold text-slate-600">
          <a href="/" className="hover:text-slate-900 transition">Home</a>
          <a href="/pipeline" className="text-amber-500 border-b-2 border-amber-500 pb-0.5">Pipeline</a>
          <a href="/status/sample" className="hover:text-slate-900 transition">Status Analisis</a>
          <a href="/result/sample" className="hover:text-slate-900 transition">Riwayat Analisis</a>
        </nav>

        <button className="bg-amber-400 hover:bg-amber-500 text-slate-900 text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1 transition cursor-pointer">
          <Search className="w-3 h-3" />
          <span>Cek Riwayat</span>
        </button>
      </header>
    </div>
  )
}