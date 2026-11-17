import React from 'react';
import { RefreshCw, ArrowRight, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ActionBarProps {
  isCompleted: boolean;
  resultId: string;
  isFailed?: boolean;
  hasJob?: boolean;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  isCompleted,
  resultId,
  isFailed = false,
  hasJob = true,
}) => {
  const navigate = useNavigate();

  const handleGoToResult = () => {
    const cleanId = resultId.replace('#', '');
    navigate(`/result/${cleanId}`);
  };

  const handleGoToPipeline = () => {
    navigate('/pipeline');
  };

  return (
    <div className="mt-6 flex items-center justify-end rounded-2xl border border-slate-100 bg-white p-3.5 sm:p-4 shadow-xs">
      {!hasJob ? (
        <button
          type="button"
          onClick={handleGoToPipeline}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-sky-500 to-cyan-400 px-6 py-3 text-xs sm:text-sm font-bold text-slate-950 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer animate-gradient-btn"
        >
          <ArrowRight className="h-4 w-4" />
          <span>Mulai Analisis di Pipeline</span>
        </button>
      ) : isFailed ? (
        <button
          type="button"
          onClick={handleGoToPipeline}
          className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-red-700 active:scale-[0.98] transition-all cursor-pointer"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Analisis Terhenti — Ulangi di Pipeline</span>
        </button>
      ) : !isCompleted ? (
        <button
          type="button"
          disabled
          className="flex items-center gap-2.5 rounded-xl border border-slate-700/80 bg-slate-900 px-6 py-3 text-xs sm:text-sm font-semibold text-slate-200 shadow-sm cursor-not-allowed transition-all"
        >
          <RefreshCw className="h-4 w-4 animate-spin text-amber-400" />
          <span>Menunggu Hasil Analisis...</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleGoToResult}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 px-8 py-3 text-xs sm:text-sm font-extrabold text-slate-950 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          <span>Lihat Hasil Analisis</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
