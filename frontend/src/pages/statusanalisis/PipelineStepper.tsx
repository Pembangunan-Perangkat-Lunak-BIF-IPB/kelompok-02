import React from 'react';
import { Check, Clock, RefreshCw, X } from 'lucide-react';
import type { PipelineStep } from './types';

interface PipelineStepperProps {
  steps: PipelineStep[];
  syncIntervalSeconds?: number;
  isSyncing?: boolean;
  hasJob?: boolean;
}

export const PipelineStepper: React.FC<PipelineStepperProps> = ({
  steps,
  syncIntervalSeconds = 3,
  isSyncing = false,
  hasJob = true,
}) => {
  return (
    <div
      className={`mt-6 rounded-2xl border bg-white p-6 sm:p-8 shadow-xs transition-opacity ${
        !hasJob ? 'border-slate-200/80 opacity-60' : 'border-slate-100'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-6 border-b border-slate-100">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Tahapan Pipeline GWAS
          </h2>
          {!hasJob && (
            <p className="text-xs text-slate-400 mt-0.5">
              Tahapan akan otomatis aktif setelah Anda menekan tombol Mulai Analisis di Pipeline
            </p>
          )}
        </div>
        {hasJob ? (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 w-fit">
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sinkronisasi Otomatis Tiap {syncIntervalSeconds} Detik</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 w-fit">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Belum Berjalan</span>
          </div>
        )}
      </div>

      {/* Stepper Timeline */}
      <div className="relative mt-6 space-y-6">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const isRunning = hasJob && step.status === 'running';
          const isCompleted = hasJob && step.status === 'completed';
          const isFailed = hasJob && step.status === 'failed';
          const isQueued = !hasJob || step.status === 'queued';

          return (
            <div key={step.id} className="relative flex items-start gap-4">
              {/* Vertical Connecting Line */}
              {!isLast && (
                <div
                  className={`absolute left-4 top-9 -bottom-6 w-0.5 -translate-x-1/2 transition-colors duration-500 ${
                    isFailed
                      ? 'bg-red-300'
                      : isCompleted
                      ? 'bg-emerald-300'
                      : isRunning
                      ? 'bg-sky-200'
                      : 'bg-slate-200'
                  }`}
                />
              )}

              {/* Step Node Icon */}
              <div className="relative z-10 shrink-0">
                {isCompleted && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xs transition-transform">
                    <Check className="h-4 w-4 stroke-[2.5]" />
                  </div>
                )}
                {isRunning && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 text-white shadow-xs">
                    <svg
                      className="h-4 w-4 animate-spin text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3.5"
                      />
                      <path
                        className="opacity-90"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                  </div>
                )}
                {isFailed && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-xs">
                    <X className="h-4 w-4 stroke-[2.5]" />
                  </div>
                )}
                {isQueued && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400">
                    <Clock className="h-4 w-4" />
                  </div>
                )}
              </div>

              {/* Step Content */}
              <div className="min-w-0 flex-1">
                {isRunning ? (
                  /* Running Card Highlight */
                  <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-4 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {step.title}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-ping inline-block" />
                          Sedang Berjalan
                        </span>
                      </div>
                      {step.iteration && (
                        <span className="font-mono text-xs font-semibold text-sky-700">
                          {step.iteration}
                        </span>
                      )}
                    </div>

                    {/* Inner Progress Bar */}
                    <div className="mt-3 flex items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white border border-sky-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-sky-500 transition-all duration-500"
                          style={{ width: `${step.progressPercent ?? 50}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-600 font-mono">
                        {step.progressPercent ?? 50}%
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Standard Row for Completed, Queued, & Failed */
                  <div className="pt-0.5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-bold ${
                            !hasJob
                              ? 'text-slate-500'
                              : isCompleted
                              ? 'text-slate-900'
                              : isFailed
                              ? 'text-red-700'
                              : 'text-slate-700'
                          }`}
                        >
                          {step.title}
                        </span>
                        {isCompleted && (
                          <span className="rounded-full bg-emerald-100/80 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                            Selesai
                          </span>
                        )}
                        {isFailed && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                            Gagal
                          </span>
                        )}
                        {isQueued && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                            Dalam Antrean
                          </span>
                        )}
                      </div>
                      <div>
                        {isCompleted && step.duration && (
                          <span className="font-mono text-xs text-slate-400">
                            Durasi: {step.duration}
                          </span>
                        )}
                        {isQueued && (
                          <span className="text-xs font-medium text-slate-400">
                            Menunggu
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Details text */}
                    {isCompleted && step.details && (
                      <p className="mt-1 text-xs text-slate-500 leading-relaxed font-sans">
                        {step.details}
                      </p>
                    )}
                    {isFailed && step.details && (
                      <p className="mt-1 text-xs text-red-600 leading-relaxed font-sans">
                        {step.details}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
