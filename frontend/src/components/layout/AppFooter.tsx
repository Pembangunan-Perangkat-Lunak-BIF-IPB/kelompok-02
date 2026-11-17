import React from 'react'

export const AppFooter: React.FC = () => {
  return (
    <footer className="border-t border-slate-200/80 bg-white/40 backdrop-blur-xs py-8 px-6 text-slate-500 text-xs">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-2.5">
          <img 
            src="/logo.png" 
            alt="Logo Jiwasku" 
            className="w-5 h-5 object-contain rounded-full shadow-2xs" 
          />
          <span className="font-bold text-slate-900 text-xs">Jiwasku</span>
          <span className="text-slate-300">|</span>
          <p>© 2026 Jiwasku Pipeline GWAS Terintegrasi. Hak Cipta Dilindungi Undang-Undang.</p>
        </div>
        <div>
          <p className="text-slate-600 font-medium">Program Studi Bioinformatika IPB University</p>
        </div>
      </div>
    </footer>
  )
}

export default AppFooter
