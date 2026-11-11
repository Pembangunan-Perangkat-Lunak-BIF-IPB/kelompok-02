import React, { useState } from 'react';
import { Copy, Check, Info } from 'lucide-react';

interface ResultIdCardProps {
  resultId: string;
  progressPercent: number;
  currentPhaseName: string;
  isFailed?: boolean;
  hasJob?: boolean;
  phenoName?: string | null;
}

export const ResultIdCard: React.FC<ResultIdCardProps> = ({
  resultId,
  progressPercent,
  currentPhaseName,
  isFailed = false,
  hasJob = true,
  phenoName,
}) => {
  const [copied, setCopied] = useState(false);

  const formattedId = resultId.startsWith('#') ? resultId : `#${resultId}`;

  const handleCopy = () => {
    if (!hasJob || !resultId) return;
    navigator.clipboard.writeText(formattedId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-6 shadow-xs transition-all ${
        !hasJob
          ? 'border-slate-200 bg-slate-50/80 opacity-90'
          : isFailed
          ? 'border-red-200 bg-gradient-to-br from-red-50/40 via-white to-amber-50/40'
          : 'border-slate-100 bg-gradient-to-br from-amber-50/30 via-white to-sky-50/50'
      }`}
    >
      {/* Top Row: Result ID & Overall Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            RESULT ID
          </span>
          <div className="flex items-center gap-2">
            <div
              className={`rounded-xl border px-4 py-1.5 font-mono text-sm sm:text-base font-bold tracking-tight ${
                !hasJob
                  ? 'border-slate-200 bg-slate-100 text-slate-500 font-sans'
                  : isFailed
                  ? 'border-red-200 bg-red-100/70 text-red-950'
                  : 'border-sky-200 bg-sky-100/70 text-slate-900'
              }`}
            >
              {hasJob && resultId ? formattedId : 'Belum Ada Analisis'}
            </div>

            {hasJob && resultId && (
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition-all hover:bg-white active:scale-95 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Salin ID</span>
                  </>
                )}
              </button>
            )}

            {hasJob && phenoName && (
              <span className="inline-flex items-center gap-1 rounded-xl bg-cyan-50/90 px-3 py-1.5 text-xs font-semibold text-cyan-800 border border-cyan-200">
                <span className="text-cyan-500 font-normal">Fenotipe:</span>
                <span className="font-bold">{phenoName}</span>
              </span>
            )}
          </div>
        </div>

        <div className="text-left sm:text-right">
          <span className="block text-xs font-medium text-slate-500 mb-0.5">
            Status Kemajuan
          </span>
          <div className="flex items-baseline sm:justify-end gap-1">
            <span
              className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
                !hasJob
                  ? 'text-slate-400'
                  : isFailed
                  ? 'text-red-600'
                  : 'text-cyan-600'
              }`}
            >
              {hasJob ? progressPercent : 0}%
            </span>
            <span className="text-xs font-medium text-slate-500">
              {!hasJob ? 'Inaktif' : isFailed ? 'Terhenti' : 'Selesai'}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar & Current Phase */}
      <div className="mt-5">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-600 mb-2">
          <span
            className={`w-2 h-2 rounded-full inline-block ${
              !hasJob
                ? 'bg-slate-300'
                : isFailed
                ? 'bg-red-500'
                : 'bg-cyan-500 animate-pulse'
            }`}
          />
          <span
            className={
              !hasJob
                ? 'text-slate-400'
                : isFailed
                ? 'text-red-700 font-semibold'
                : ''
            }
          >
            {hasJob
              ? currentPhaseName
              : 'Menunggu inisialisasi analisis dan pemilihan parameter di Pipeline'}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              !hasJob
                ? 'bg-slate-200'
                : isFailed
                ? 'bg-red-500'
                : 'bg-gradient-to-r from-cyan-400 to-sky-500'
            }`}
            style={{ width: `${hasJob ? progressPercent : 0}%` }}
          />
        </div>
      </div>

      {/* Info Callout Banner */}
      <div
        className={`mt-5 flex items-start sm:items-center gap-3 rounded-2xl border p-3 sm:px-4 text-xs ${
          !hasJob
            ? 'border-slate-200 bg-white/70 text-slate-500'
            : isFailed
            ? 'border-red-200 bg-red-50/70 text-red-800'
            : 'border-sky-100 bg-sky-50/70 text-slate-600'
        }`}
      >
        <Info
          className={`w-4 h-4 shrink-0 mt-0.5 sm:mt-0 ${
            !hasJob
              ? 'text-slate-400'
              : isFailed
              ? 'text-red-600'
              : 'text-cyan-600'
          }`}
        />
        <p className="leading-relaxed">
          {!hasJob
            ? 'Belum ada analisis yang aktif. Silakan menuju ke halaman Pipeline untuk mengunggah dataset dan menentukan parameter analisis GWAS Anda.'
            : isFailed
            ? 'Analisis gagal dijalankan oleh backend. Silakan periksa format berkas atau ulangi proses analisis dari halaman Pipeline.'
            : 'Simpan Result ID ini untuk mengakses kembali riwayat analisis Anda kapan saja dari menu utama tanpa perlu mempertahankan peramban tetap terbuka.'}
        </p>
      </div>
    </div>
  );
};
