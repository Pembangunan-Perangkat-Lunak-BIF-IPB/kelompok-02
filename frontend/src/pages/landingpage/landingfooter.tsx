import React from 'react'

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-100 py-6 px-6 max-w-6xl mx-auto text-slate-400 text-[11px]">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-[10px]">
            J
          </div>
          <span className="font-bold text-slate-800 text-xs">Jiwasku</span>
          <span className="text-slate-300">|</span>
          <p>© 2026 Jiwasku Pipeline GWAS Terintegrasi. Hak Cipta Dilindungi Undang-Undang.</p>
        </div>
        <div>
          <p>Program Studi Bioinformatika IPB University</p>
        </div>
      </div>
    </footer>
  )
}