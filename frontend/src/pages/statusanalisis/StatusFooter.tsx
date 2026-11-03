import React from 'react';

export const StatusFooter: React.FC = () => {
  return (
    <footer className="mt-16 border-t border-slate-100 bg-white py-6 px-4 sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2.5 text-center sm:text-left">
          <div className="w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-[10px] shrink-0 shadow-xs">
            J
          </div>
          <span className="font-bold text-slate-900">Jiwasku</span>
          <span className="text-slate-300">|</span>
          <p className="leading-snug">
            © 2026 Jiwasku Pipeline GWAS Terintegrasi. Hak Cipta Dilindungi Undang-Undang.{' '}
            <span className="hidden md:inline text-slate-400">
              Komputasi GWAS Presisi & Analisis Statistik Poligenik.
            </span>
          </p>
        </div>
        <div className="shrink-0 text-slate-600 font-medium">
          <p>Program Studi Bioinformatika IPB University</p>
        </div>
      </div>
    </footer>
  );
};

