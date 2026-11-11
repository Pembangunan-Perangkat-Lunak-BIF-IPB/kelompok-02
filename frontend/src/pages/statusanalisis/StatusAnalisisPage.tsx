import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Clock, ChevronRight, AlertCircle, Search, Info, Terminal, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { StatusNavbar } from './StatusNavbar';
import { ResultIdCard } from './ResultIdCard';
import { PipelineStepper } from './PipelineStepper';
import { ActionBar } from './ActionBar';
import { StatusFooter } from './StatusFooter';
import type { PipelineStep, StepStatus } from './types';
import apiClient from '../../api/client';

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

  // Resolusi ID analisis: hanya dari URL param (tanpa param URL, tampilkan status belum ada analisis)
  const cleanJobId = (jobId || '').trim().replace(/^#/, '');
  const hasJob = Boolean(cleanJobId && cleanJobId !== 'sample');

  // Live Backend State
  const [liveSteps, setLiveSteps] = useState<PipelineStep[]>(DEFAULT_STAGES);
  const [overallProgress, setOverallProgress] = useState<number>(0);
  const [currentPhaseName, setCurrentPhaseName] = useState<string>('Memulai sinkronisasi status...');
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isFailed, setIsFailed] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [parameters, setParameters] = useState<{
    maf?: number;
    call_rate?: number;
    num_pcs?: number;
    pheno_name?: string | null;
  } | null>(null);
  const [jobLog, setJobLog] = useState<string>('');
  const [showLogConsole, setShowLogConsole] = useState<boolean>(false);

  // Search Bar State saat ID tidak ditemukan / ingin cari ID lain
  const [searchInput, setSearchInput] = useState<string>('');

  // Ref untuk mengendalikan polling interval
  const pollTimerRef = useRef<number | null>(null);

  // Fetch Status Real-time dari Backend saat ada job aktif
  useEffect(() => {
    if (!hasJob || !cleanJobId) return;

    let isSubscribed = true;

    const fetchStatus = async () => {
      setIsSyncing(true);
      try {
        const response = await apiClient.get(`/api/v1/jobs/${cleanJobId}/status`);
        if (!isSubscribed) return;

        const data = response.data;
        setNotFound(false);
        setOverallProgress(data.overall_progress ?? 0);
        if (data.parameters) {
          setParameters(data.parameters);
        }

        const statusUpper = (data.overall_status || '').toUpperCase();
        const hasCompleted = statusUpper === 'SUCCESS';
        const hasFailed = statusUpper === 'FAILED';

        setIsCompleted(hasCompleted);
        setIsFailed(hasFailed);
        setErrorMessage(data.error_message || null);

        // Ambil live job log dari backend untuk monitoring proses
        try {
          const logRes = await apiClient.get(`/api/v1/jobs/${cleanJobId}/log`, {
            responseType: 'text',
          });
          if (isSubscribed && logRes.data) {
            setJobLog(String(logRes.data));
          }
        } catch (_) {
          // Log mungkin sedang dalam proses inisialisasi
        }

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
            setCurrentPhaseName('Memproses Komputasi...');
          }
        }

        // Jika belum selesai dan belum gagal, polling ulang tiap 3 detik
        if (!hasCompleted && !hasFailed && isSubscribed) {
          pollTimerRef.current = window.setTimeout(fetchStatus, 3000);
        }
      } catch (err: any) {
        if (!isSubscribed) return;
        if (err.response?.status === 404) {
          setNotFound(true);
          setErrorMessage(`Result ID #${cleanJobId} tidak ditemukan pada server database.`);
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
  }, [cleanJobId, hasJob]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    const clean = searchInput.trim().replace(/^#/, '');
    navigate(`/status/${clean}`);
  };

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
                {hasJob && !notFound && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Terhubung Backend
                  </span>
                )}
                {!hasJob && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500 border border-slate-200">
                    Belum Dimulai
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

          {/* Banner ID Tidak Ditemukan (404) */}
          {notFound && (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/80 p-5 shadow-xs animate-fade-in">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-amber-900">
                    Result ID #{cleanJobId} Tidak Ditemukan
                  </h3>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    {errorMessage || 'Sistem tidak menemukan riwayat analisis dengan Result ID tersebut. Silakan masukkan Result ID yang valid atau mulai analisis baru dari halaman Pipeline.'}
                  </p>

                  <form onSubmit={handleSearchSubmit} className="mt-4 flex flex-col sm:flex-row items-center gap-2 max-w-md">
                    <input
                      type="text"
                      placeholder="Masukkan Result ID valid..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="submit"
                      className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>Cari</span>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Banner Informasi Inaktif jika user belum menjalankan analisis dari Pipeline */}
          {!hasJob && (
            <div className="mb-6 rounded-2xl border border-sky-100 bg-sky-50/70 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 shrink-0 mt-0.5">
                  <Info className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Belum Ada Analisis yang Berjalan
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Halaman ini akan otomatis menampilkan progress real-time setelah Anda mengunggah file dataset dan mengklik tombol Mulai Analisis di menu Pipeline.
                  </p>
                </div>
              </div>
              <Link
                to="/pipeline"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs px-5 py-2.5 shadow-xs transition-all shrink-0 cursor-pointer"
              >
                <span>Buka Menu Pipeline</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Top Result ID & Overall Progress Card */}
          <ResultIdCard
            resultId={cleanJobId}
            progressPercent={overallProgress}
            currentPhaseName={currentPhaseName}
            isFailed={isFailed}
            hasJob={hasJob && !notFound}
            phenoName={parameters?.pheno_name}
          />

          {/* Banner Peringatan Analisis Gagal */}
          {hasJob && isFailed && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50/90 p-5 shadow-xs animate-fade-in">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-red-900">
                    Analisis GWAS Terhenti (Gagal)
                  </h3>
                  <p className="text-xs text-red-800 mt-1 leading-relaxed">
                    {errorMessage || 'Terjadi kesalahan teknis saat mengeksekusi pipeline GWAS di server backend.'}
                  </p>
                  <div className="mt-3.5 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowLogConsole(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                    >
                      <Terminal className="w-3.5 h-3.5" />
                      <span>Buka Log Diagnostik</span>
                    </button>
                    <a
                      href={`${apiClient.defaults.baseURL || ''}/api/v1/jobs/${cleanJobId}/download/pipeline_log`}
                      download={`pipeline_${cleanJobId}.log`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-300 bg-white hover:bg-red-50 text-red-800 text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-red-600" />
                      <span>Unduh pipeline.log</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main GWAS Pipeline Stepper Card */}
          <PipelineStepper
            steps={liveSteps}
            syncIntervalSeconds={3}
            isSyncing={isSyncing}
            hasJob={hasJob && !notFound}
          />

          {/* Real-time Backend Log Console */}
          {hasJob && !notFound && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowLogConsole((prev) => !prev)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
                >
                  <Terminal className="w-3.5 h-3.5 text-cyan-600" />
                  <span>{showLogConsole ? 'Sembunyikan Log Real-time' : 'Lihat Log Real-time Backend'}</span>
                  {showLogConsole ? (
                    <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>

                {jobLog && (
                  <a
                    href={`${apiClient.defaults.baseURL || ''}/api/v1/jobs/${cleanJobId}/download/pipeline_log`}
                    download={`pipeline_${cleanJobId}.log`}
                    className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-cyan-700 font-medium transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Unduh Log Pipeline</span>
                  </a>
                )}
              </div>

              {showLogConsole && (
                <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs font-mono text-slate-200 shadow-inner">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[11px] text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block w-2 h-2 rounded-full ${isCompleted ? 'bg-emerald-400' : isFailed ? 'bg-red-400' : 'bg-cyan-400 animate-pulse'}`} />
                      <span>Catatan Eksekusi Pipeline #{cleanJobId}</span>
                    </div>
                    <span>{jobLog ? `${jobLog.split('\n').filter(Boolean).length} baris log` : 'Memuat log...'}</span>
                  </div>
                  <pre className="max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed text-slate-300 font-mono text-[11px] select-text">
                    {jobLog || 'Belum ada log yang dicatat oleh sistem backend...'}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Bottom Action Bar */}
          <ActionBar
            isCompleted={isCompleted}
            resultId={cleanJobId}
            isFailed={isFailed}
            hasJob={hasJob && !notFound}
          />

          {/* Optional Search ID Bar di Bawah jika belum ada job */}
          {!hasJob && (
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    Sudah punya Result ID sebelumnya?
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Masukkan kode Result ID untuk melacak status analisis yang pernah Anda jalankan:
                  </p>
                </div>
                <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Contoh: GWAS-20261104-..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500 w-48 sm:w-56"
                  />
                  <button
                    type="submit"
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Lacak</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <StatusFooter />
    </main>
  );
};

export default StatusAnalisisPage;
