import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, Play, Pause, ChevronRight } from 'lucide-react';
import { StatusNavbar } from './StatusNavbar';
import { ResultIdCard } from './ResultIdCard';
import { PipelineStepper } from './PipelineStepper';
import { ActionBar } from './ActionBar';
import { StatusFooter } from './StatusFooter';
import type { PipelineStep } from './types';

// Predefined states matching the user's mockup screenshots
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
        details:
          'Genotipe cohort_indonesia_chr22.vcf.gz (1.42 GB) & Fenotipe lipid_pheno_hdl.csv terverifikasi 100%.',
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
        details:
          'Genotipe cohort_indonesia_chr22.vcf.gz (1.42 GB) & Fenotipe lipid_pheno_hdl.csv terverifikasi 100%.',
      },
      {
        id: 2,
        title: 'Kontrol Kualitas Genomik (QC)',
        status: 'completed',
        duration: '48s',
        details:
          'Filter MAF > 0.05, Call Rate 95%, HWE passed (p > 1e-6). Sebanyak 4.120.500 varian lolos ambang batas klinis.',
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
        details:
          'Genotipe cohort_indonesia_chr22.vcf.gz (1.42 GB) & Fenotipe lipid_pheno_hdl.csv terverifikasi 100%.',
      },
      {
        id: 2,
        title: 'Kontrol Kualitas Genomik (QC)',
        status: 'completed',
        duration: '48s',
        details:
          'Filter MAF > 0.05, Call Rate 95%, HWE passed (p > 1e-6). Sebanyak 4.120.500 varian lolos ambang batas klinis.',
      },
      {
        id: 3,
        title: 'Komputasi PCA & Stratifikasi Populasi',
        status: 'completed',
        duration: '186s',
        details:
          '10 Principal Components (PCs) berhasil dihitung & disertakan sebagai kovariat.',
      },
      {
        id: 4,
        title: 'Uji Asosiasi Genetik (Association Test)',
        status: 'completed',
        duration: '48s',
        details:
          'Uji regresi linear (GLM/MLM) selesai dilakukan pada 412.500 SNP dengan kovariat PC1-PC10.',
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
        details:
          'Genotipe cohort_indonesia_chr22.vcf.gz (1.42 GB) & Fenotipe lipid_pheno_hdl.csv terverifikasi 100%.',
      },
      {
        id: 2,
        title: 'Kontrol Kualitas Genomik (QC)',
        status: 'completed',
        duration: '48s',
        details:
          'Filter MAF > 0.05, Call Rate 95%, HWE passed (p > 1e-6). Sebanyak 4.120.500 varian lolos ambang batas klinis.',
      },
      {
        id: 3,
        title: 'Komputasi PCA & Stratifikasi Populasi',
        status: 'completed',
        duration: '186s',
        details:
          '10 Principal Components (PCs) berhasil dihitung & disertakan sebagai kovariat.',
      },
      {
        id: 4,
        title: 'Uji Asosiasi Genetik (Association Test)',
        status: 'completed',
        duration: '48s',
        details:
          '10 Principal Components (PCs) berhasil dihitung & disertakan sebagai kovariat.',
      },
      {
        id: 5,
        title: 'Visualisasi & Ekspor Hasil',
        status: 'completed',
        duration: '49s',
        details:
          'Manhattan dan QQ plot berhasil dibuat. Lihat Riwayat Analisis untuk mengunduh plot.',
      },
    ],
  },
];

export const StatusAnalisisPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();

  // Use jobId from params or default to the exact one from screenshot
  const displayJobId = jobId && jobId !== 'sample' ? jobId : 'GWAS-2024-IDN-CH22';

  // State index pointing to one of the 4 presets
  const [presetIndex, setPresetIndex] = useState<number>(1); // Default to 48% (Image 1)
  const [isAutoSimulate, setIsAutoSimulate] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const activePreset = STAGE_PRESETS[presetIndex];

  // Auto-simulate progression every 5 seconds
  useEffect(() => {
    if (!isAutoSimulate) return;

    const interval = setInterval(() => {
      setIsSyncing(true);
      setTimeout(() => {
        setIsSyncing(false);
        setPresetIndex((prev) => {
          if (prev < STAGE_PRESETS.length - 1) {
            return prev + 1;
          }
          return prev; // Stay at 100% once done
        });
      }, 700);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoSimulate]);

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
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Status Analisis GWAS
              </h1>
            </div>

            {/* Time Estimation Pill */}
            <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-3.5 py-1 text-xs shadow-2xs w-fit">
              <Clock className="w-3.5 h-3.5 text-cyan-500" />
              <span className="text-slate-500 font-medium">Est:</span>
              <span className="text-cyan-600 font-bold">~2 Menit</span>
            </div>
          </div>

          {/* Top Result ID & Overall Progress Card */}
          <ResultIdCard
            resultId={displayJobId}
            progressPercent={activePreset.overallProgress}
            currentPhaseName={activePreset.currentPhaseName}
          />

          {/* Main GWAS Pipeline Stepper Card */}
          <PipelineStepper
            steps={activePreset.steps}
            syncIntervalSeconds={5}
            isSyncing={isSyncing}
          />

          {/* Bottom Action Bar (Waiting vs Ready) */}
          <ActionBar
            isCompleted={activePreset.isCompleted}
            resultId={displayJobId}
          />

          {/* Simulation / Testing Controller Pill Bar */}
          <div className="mt-8 rounded-xl border border-dashed border-slate-200 bg-white/70 p-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600">Preset Desain (Mockup):</span>
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
            </div>

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
          </div>
        </div>
      </div>

      {/* Footer */}
      <StatusFooter />
    </main>
  );
};

export default StatusAnalisisPage;
