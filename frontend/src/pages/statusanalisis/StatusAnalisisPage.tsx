import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Clock, Play, Pause, ChevronRight, AlertCircle, Search } from 'lucide-react';
import { StatusNavbar } from './StatusNavbar';
import { ResultIdCard } from './ResultIdCard';
import { PipelineStepper } from './PipelineStepper';
import { ActionBar } from './ActionBar';
import { StatusFooter } from './StatusFooter';
import type { PipelineStep, StepStatus } from './types';
import apiClient from '../../api/client';

// Predefined states matching mockup for demo/sample mode
const STAGE_PRESETS: {
  name: string;
  overallProgress: number;
  currentPhaseName: string;
  isCompleted: boolean;
  steps: PipelineStep[];
}[] = [
  {
    name: '22% (QC)',
    overallProgress: 22,
    currentPhaseName: 'Kontrol Kualitas Genomik (QC)',
    isCompleted: false,
    steps: [
      {
        id: 1,
        title: 'Upload & Validasi Format',
        status: 'completed',
        duration: '14s',
        details: 'Genotipe cohort_indonesia_chr22.vcf.gz & Fenotipe lipid_pheno.csv terverifikasi 100%.',
      },
      {
        id: 2,
        title: 'Kontrol Kualitas Genomik (QC)',
        status: 'running',
        iteration: 'Iterasi 5/10',
        progressPercent: 52,
      },
      {
        id: 3,
        title: 'Komputasi PCA & Stratifikasi Populasi',
        status: 'queued',
      },
      {
        id: 4,
        title: 'Uji Asosiasi Genetik (Association Test)',
        status: 'queued',
      },
      {
        id: 5,
        title: 'Visualisasi & Ekspor Hasil',
        status: 'queued',
      },
    ],
  },
  {
    name: '48% (PCA)',
    overallProgress: 48,
    currentPhaseName: 'Komputasi PCA & Stratifikasi Populasi',
    isCompleted: false,
    steps: [
      {
        id: 1,
        title: 'Upload & Validasi Format',
        status: 'completed',
        duration: '14s',
        details: 'Genotipe cohort_indonesia_chr22.vcf.gz & Fenotipe lipid_pheno.csv terverifikasi 100%.',
      },
      {
        id: 2,
        title: 'Kontrol Kualitas Genomik (QC)',
        status: 'completed',
        duration: '48s',
        details: 'Filter MAF > 0.05, Call Rate 95%. Varian lolos ambang batas klinis.',
      },
      {
        id: 3,
        title: 'Komputasi PCA & Stratifikasi Populasi',
        status: 'running',
        iteration: 'Iterasi 7/10',
        progressPercent: 74,
      },
      {
        id: 4,
        title: 'Uji Asosiasi Genetik (Association Test)',
        status: 'queued',
      },
      {
        id: 5,
        title: 'Visualisasi & Ekspor Hasil',
        status: 'queued',
      },
    ],
  },
  {
    name: '89% (Visualisasi)',
    overallProgress: 89,
    currentPhaseName: 'Visualisasi & Ekspor Hasil',
    isCompleted: false,
    steps: [
      {
        id: 1,
        title: 'Upload & Validasi Format',
        status: 'completed',
        duration: '14s',
        details: 'Genotipe cohort_indonesia_chr22.vcf.gz & Fenotipe lipid_pheno.csv terverifikasi 100%.',
      },
      {
        id: 2,
        title: 'Kontrol Kualitas Genomik (QC)',
        status: 'completed',
        duration: '48s',
        details: 'Filter MAF > 0.05, Call Rate 95%. Varian lolos ambang batas klinis.',
      },
      {
        id: 3,
        title: 'Komputasi PCA & Stratifikasi Populasi',
        status: 'completed',
        duration: '186s',
        details: 'Principal Components (PCs) berhasil dihitung & disertakan sebagai kovariat.',
      },
      {
        id: 4,
        title: 'Uji Asosiasi Genetik (Association Test)',
        status: 'completed',
        duration: '48s',
        details: 'Uji regresi linear (GLM) selesai dilakukan.',
      },
      {
        id: 5,
        title: 'Visualisasi & Ekspor Hasil',
        status: 'running',
        iteration: 'Iterasi 9/10',
        progressPercent: 99,
      },
    ],
  },
  {
    name: '100% (Selesai)',
    overallProgress: 100,
    currentPhaseName: 'Semua Tahapan Analisis Berhasil Diselesaikan',
    isCompleted: true,
    steps: [
      {
        id: 1,
        title: 'Upload & Validasi Format',
        status: 'completed',
        duration: '14s',
        details: 'Genotipe cohort_indonesia_chr22.vcf.gz & Fenotipe lipid_pheno.csv terverifikasi 100%.',
      },
      {
        id: 2,
        title: 'Kontrol Kualitas Genomik (QC)',
        status: 'completed',
        duration: '48s',
        details: 'Filter MAF > 0.05, Call Rate 95%. Varian lolos ambang batas klinis.',
      },
      {
        id: 3,
        title: 'Komputasi PCA & Stratifikasi Populasi',
        status: 'completed',
        duration: '186s',
        details: 'Principal Components (PCs) berhasil dihitung & disertakan sebagai kovariat.',
      },
      {
        id: 4,
        title: 'Uji Asosiasi Genetik (Association Test)',
        status: 'completed',
        duration: '48s',
        details: 'Uji regresi linear (GLM) selesai dilakukan.',
      },
      {
        id: 5,
        title: 'Visualisasi & Ekspor Hasil',
        status: 'completed',
        duration: '49s',
        details: 'Manhattan dan QQ plot berhasil dibuat.',
      },
    ],
  },
];

const DEFAULT_STAGES: PipelineStep[] = [
  { id: 1, title: 'Upload & Validasi Format', status: 'queued' },
  { id: 2, title: 'Kontrol Kualitas Genomik (QC)', status: 'queued' },
  { id: 3, title: 'Komputasi PCA & Stratifikasi Populasi', status: 'queued' },
  { id: 4, title: 'Uji Asosiasi Genetik (Association Test)', status: 'queued' },
  { id: 5, title: 'Visualisasi & Ekspor Hasil', status: 'queued' },
];

export const StatusAnalisisPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  // Resolusi ID analisis: dari URL param, atau localStorage
  const rawId = (jobId || localStorage.getItem('last_gwas_result_id') || '').trim();
  const cleanJobId = rawId.replace(/^#/, '');
  const isMockMode = !cleanJobId || cleanJobId === 'sample';

  // Live Backend State
  const [liveSteps, setLiveSteps] = useState<PipelineStep[]>(DEFAULT_STAGES);
  const [overallProgress, setOverallProgress] = useState<number>(0);
  const [currentPhaseName, setCurrentPhaseName] = useState<string>('Menghubungkan ke server...');
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isFailed, setIsFailed] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [notFound, setNotFound] = useState<boolean>(false);

  // Search Bar State saat ID tidak ditemukan / ingin cari ID lain
  const [searchInput, setSearchInput] = useState<string>('');

  // Demo / Mockup Preset State (hanya jika mode demo)
  const [presetIndex, setPresetIndex] = useState<number>(1);
  const [isAutoSimulate, setIsAutoSimulate] = useState<boolean>(false);

  const activePreset = STAGE_PRESETS[presetIndex];

  // Ref untuk mengendalikan polling interval
  const pollTimerRef = useRef<number | null>(null);

  // 1. Fetch Status Real-time dari Backend
  useEffect(() => {
    if (isMockMode) return;

    let isSubscribed = true;

    const fetchStatus = async () => {
      setIsSyncing(true);
      try {
        const response = await apiClient.get(`/api/v1/jobs/${cleanJobId}/status`);
        if (!isSubscribed) return;

        const data = response.data;
        setNotFound(false);
        setOverallProgress(data.overall_progress ?? 0);

        const statusUpper = (data.overall_status || '').toUpperCase();
        const hasCompleted = statusUpper === 'SUCCESS';
        const hasFailed = statusUpper === 'FAILED';

        setIsCompleted(hasCompleted);
        setIsFailed(hasFailed);
        setErrorMessage(data.error_message || null);

        // Petakan array stages dari backend ke PipelineStep[]
        if (Array.isArray(data.stages) && data.stages.length > 0) {
          const mapped: PipelineStep[] = data.stages.map((st: any, idx: number) => {
            const stUpper = (st.status || '').toUpperCase();
            let status: StepStatus = 'queued';
            if (stUpper === 'SUCCESS') status = 'completed';
            else if (stUpper === 'RUNNING') status = 'running';
            else if (stUpper === 'FAILED') status = 'failed';

            return {
              id: idx + 1,
              title: st.label || st.key,
              status,
              duration: st.duration && st.duration !== '-' ? st.duration.replace('Durasi: ', '') : undefined,
              details: st.detail || undefined,
              progressPercent: status === 'running' ? (data.overall_progress || 50) : undefined,
            };
          });
          setLiveSteps(mapped);

          const runningStage = mapped.find((s) => s.status === 'running');
          if (hasCompleted) {
            setCurrentPhaseName('Semua Tahapan Analisis Berhasil Diselesaikan');
          } else if (hasFailed) {
            setCurrentPhaseName('Analisis Terhenti (Gagal)');
          } else if (runningStage) {
            setCurrentPhaseName(runningStage.title);
          } else {
            setCurrentPhaseName('Memproses Analisis...');
          }
        }

        // Jika belum selesai dan belum gagal, jadwalkan polling berikutnya dalam 3 detik
        if (!hasCompleted && !hasFailed && isSubscribed) {
          pollTimerRef.current = window.setTimeout(fetchStatus, 3000);
        }
      } catch (err: any) {
        if (!isSubscribed) return;
        if (err.response?.status === 404) {
          setNotFound(true);
          setErrorMessage(`Result ID #${cleanJobId} tidak ditemukan pada database backend.`);
        } else {
          setErrorMessage('Gagal menghubungi server Backend di port 8000.');
        }
      } finally {
        if (isSubscribed) setIsSyncing(false);
      }
    };

    fetchStatus();

    return () => {
      isSubscribed = false;
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
      }
    };
  }, [cleanJobId, isMockMode]);

  // 2. Demo Auto-Simulate (hanya jika isMockMode aktif)
  useEffect(() => {
    if (!isMockMode || !isAutoSimulate) return;

    const interval = setInterval(() => {
      setIsSyncing(true);
      setTimeout(() => {
        setIsSyncing(false);
        setPresetIndex((prev) => {
          if (prev < STAGE_PRESETS.length - 1) return prev + 1;
          return prev;
        });
      }, 700);
    }, 5000);

    return () => clearInterval(interval);
  }, [isMockMode, isAutoSimulate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    const clean = searchInput.trim().replace(/^#/, '');
    navigate(`/status/${clean}`);
  };

  const displayId = isMockMode ? 'GWAS-2024-IDN-CH22' : cleanJobId;
  const currentSteps = isMockMode ? activePreset.steps : liveSteps;
  const currentProgress = isMockMode ? activePreset.overallProgress : overallProgress;
  const currentPhase = isMockMode ? activePreset.currentPhaseName : currentPhaseName;
  const currentCompleted = isMockMode ? activePreset.isCompleted : isCompleted;

  return (
    <main className="min-h-screen bg-slate-50/60 font-sans flex flex-col justify-between">
      <div>
        {/* Floating Navbar */}
        <StatusNavbar />

        {/* Content Container */}
        <div className="mx-auto max-w-4xl px-4 mt-6">
          {/* Breadcrumb & Title Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Link to="/pipeline" className="hover:text-cyan-700 transition-colors">
                  Pipeline Komputasi
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-cyan-600 font-semibold">Status Analisis</span>
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Status Analisis GWAS
                </h1>
                {!isMockMode && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    Live Backend
                  </span>
                )}
              </div>
            </div>

            {/* Time Estimation Pill */}
            <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-3.5 py-1 text-xs shadow-2xs w-fit">
              <Clock className="w-3.5 h-3.5 text-cyan-500" />
              <span className="text-slate-500 font-medium">Est:</span>
              <span className="text-cyan-600 font-bold">~2 Menit</span>
            </div>
          </div>

          {/* Not Found / Error Banner */}
          {notFound && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <h3 className="font-bold text-sm">Result ID #{cleanJobId} Tidak Ditemukan</h3>
              </div>
              <p className="text-xs text-amber-700 mb-4">
                Sistem tidak menemukan riwayat analisis dengan Result ID tersebut. Silakan masukkan Result ID yang valid atau mulai analisis baru.
              </p>
              <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-md">
                <input
                  type="text"
                  placeholder="Masukkan Result ID valid..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="flex-1 rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-amber-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition-all cursor-pointer flex items-center gap-1"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Cari</span>
                </button>
              </form>
            </div>
          )}

          {/* Error Message Banner jika Analisis Gagal */}
          {isFailed && errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 shadow-xs">
              <div className="flex items-center gap-2 mb-1.5">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <h3 className="font-bold text-sm">Analisis GWAS Terhenti dengan Error</h3>
              </div>
              <p className="text-xs font-mono text-red-700 bg-white/70 p-3 rounded-xl border border-red-200/60 leading-relaxed overflow-x-auto">
                {errorMessage}
              </p>
            </div>
          )}

          {/* Top Result ID & Overall Progress Card */}
          <ResultIdCard
            resultId={displayId}
            progressPercent={currentProgress}
            currentPhaseName={currentPhase}
            isFailed={isFailed}
          />

          {/* Main GWAS Pipeline Stepper Card */}
          <PipelineStepper
            steps={currentSteps}
            syncIntervalSeconds={3}
            isSyncing={isSyncing}
          />

          {/* Bottom Action Bar (Waiting vs Ready vs Failed) */}
          <ActionBar
            isCompleted={currentCompleted}
            resultId={displayId}
            isFailed={isFailed}
          />

          {/* Mode Switcher / Mockup Controller */}
          <div className="mt-8 rounded-xl border border-dashed border-slate-200 bg-white/70 p-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600">
                {isMockMode ? 'Preset Desain (Mockup):' : 'Status Sinkronisasi:'}
              </span>
              {isMockMode ? (
                <div className="flex items-center gap-1 flex-wrap">
                  {STAGE_PRESETS.map((preset, idx) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        setPresetIndex(idx);
                        setIsAutoSimulate(false);
                      }}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                        presetIndex === idx
                          ? 'bg-cyan-600 text-white shadow-2xs font-bold'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-600">
                  Data live terhubung ke endpoint <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">/api/v1/jobs/{cleanJobId}/status</code>
                </span>
              )}
            </div>

            {isMockMode && (
              <button
                type="button"
                onClick={() => setIsAutoSimulate((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border font-semibold transition-all cursor-pointer ${
                  isAutoSimulate
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}
              >
                {isAutoSimulate ? (
                  <>
                    <Pause className="w-3 h-3" />
                    <span>Auto-Simulasi ON (5s)</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3" />
                    <span>Jalankan Auto-Simulasi</span>
                  </>
                )}
              </button>
            )}

            {!isMockMode && (
              <Link
                to="/status/sample"
                className="text-xs text-cyan-700 hover:text-cyan-900 underline font-medium"
              >
                Buka Mode Demo / Mockup
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <StatusFooter />
    </main>
  );
};

export default StatusAnalisisPage;
