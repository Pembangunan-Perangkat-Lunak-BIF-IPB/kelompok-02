import React, { useState } from 'react'
import { Filter, Sliders, BarChart3, CheckCircle2 } from 'lucide-react'

interface StepItem {
  stepNumber: string
  title: string
  description: string
  icon: React.ReactNode
  delay: string
  tags: string[]
}

const STEPS_DATA: StepItem[] = [
  {
    stepNumber: 'TAHAP 01',
    title: 'Kontrol Kualitas Genomik',
    description: 'Penyaringan varian secara real-time dengan parameter call-rate & MAF terstandarisasi serta filtering Hardy-Weinberg.',
    icon: <Filter className="w-4 h-4" />,
    delay: '850ms',
    tags: ['Filter VCF & CSV', 'Call-Rate & MAF QC', 'Hardy-Weinberg Equilibrium'],
  },
  {
    stepNumber: 'TAHAP 02',
    title: 'Model Asosiasi Linear / Logistik',
    description: 'Penyesuaian kovariat dan struktur populasi berbasis Principal Component Analysis (PCA) berkecepatan tinggi.',
    icon: <Sliders className="w-4 h-4" />,
    delay: '1000ms',
    tags: ['PCA Stratifikasi Populasi', 'Kovariat Klinis', 'Model Linear & Logistik'],
  },
  {
    stepNumber: 'TAHAP 03',
    title: 'Visualisasi Manhattan & QQ-Plot',
    description: 'Eksplorasi interaktif lokus signifikan genomik p-value < 5×10⁻⁸ instan dengan ekspor data publikasi ilmiah.',
    icon: <BarChart3 className="w-4 h-4" />,
    delay: '1150ms',
    tags: ['Manhattan Plot Interaktif', 'QQ-Plot (λGC)', 'Ekspor Publikasi Ilmiah'],
  },
]

export const PipelineSteps: React.FC = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <section className="py-20 max-w-5xl mx-auto px-6 text-center">
      <div className="animate-fade-in-up" style={{ animationDelay: '750ms' }}>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Arsitektur Pipeline GWAS
        </h2>
        <p className="text-slate-600 text-xs md:text-sm mt-2.5 max-w-xl mx-auto leading-relaxed">
          Sistem otomatis menyeluruh dari manipulasi mikrogugus genetik hingga pemetaan lokus penyakit poligenik yang siap publikasi.
        </p>
      </div>

      {/* Grid 3 Steps dengan Interaktif Popout Focus & Dim Sibling */}
      <div 
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 text-left relative"
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {STEPS_DATA.map((step, index) => {
          const isHovered = hoveredIndex === index
          const isDimmed = hoveredIndex !== null && !isHovered

          return (
            <div
              key={step.stepNumber}
              tabIndex={0}
              onMouseEnter={() => setHoveredIndex(index)}
              onFocus={() => setHoveredIndex(index)}
              onBlur={() => setHoveredIndex(null)}
              className={`rounded-2xl p-6 border transition-all duration-300 flex flex-col justify-between animate-card-cascade cursor-pointer relative outline-none ${
                isHovered
                  ? 'bg-white z-20 scale-[1.04] -translate-y-3.5 shadow-[0_24px_50px_-10px_rgba(245,158,11,0.22),0_12px_24px_-8px_rgba(15,23,42,0.1)] border-amber-400 ring-4 ring-amber-400/20'
                  : isDimmed
                  ? 'bg-white/80 opacity-45 scale-[0.98] blur-[0.3px] border-slate-200/70 shadow-none'
                  : 'bg-white opacity-100 scale-100 border-slate-200/80 shadow-2xs'
              }`}
              style={{ animationDelay: step.delay }}
            >
              <div>
                {/* Header Step: Badge & Icon */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md font-mono tracking-wider transition-all duration-200 ${
                    isHovered
                      ? 'bg-amber-400 text-slate-950 font-extrabold shadow-2xs scale-105'
                      : 'text-slate-500 bg-slate-100/90'
                  }`}>
                    {step.stepNumber}
                  </span>

                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    isHovered
                      ? 'bg-amber-400 text-slate-950 scale-120 rotate-6 shadow-md'
                      : 'bg-amber-500/10 text-amber-700'
                  }`}>
                    {step.icon}
                  </div>
                </div>

                {/* Judul Tahap */}
                <h4 className={`text-base font-bold mb-2 tracking-tight transition-colors duration-200 ${
                  isHovered ? 'text-amber-600' : 'text-slate-900'
                }`}>
                  {step.title}
                </h4>

                {/* Deskripsi Tahap */}
                <p className={`text-xs leading-relaxed transition-colors duration-200 ${
                  isHovered ? 'text-slate-900 font-medium' : 'text-slate-600'
                }`}>
                  {step.description}
                </p>

                {/* Highlight Chip Tags yang Muncul Mulus Saat Di-hover */}
                <div className={`transition-all duration-300 overflow-hidden ${
                  isHovered 
                    ? 'opacity-100 max-h-24 mt-4 pt-3 border-t border-amber-200/80' 
                    : 'opacity-0 max-h-0 mt-0 pt-0 border-transparent pointer-events-none'
                }`}>
                  <div className="flex flex-wrap gap-1.5">
                    {step.tags.map((tag) => (
                      <span 
                        key={tag}
                        className="text-[10px] font-semibold bg-amber-50/90 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1 shadow-2xs"
                      >
                        <CheckCircle2 className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                        <span>{tag}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
