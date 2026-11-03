import React from 'react'
import { Filter, Sliders, BarChart3 } from 'lucide-react'

interface StepCardProps {
  stepNumber: string
  title: string
  description: string
  icon: React.ReactNode
}

const StepCard: React.FC<StepCardProps> = ({ stepNumber, title, description, icon }) => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {stepNumber}
          </span>
          <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-cyan-600">
            {icon}
          </div>
        </div>
        <h4 className="text-base font-bold text-slate-900 mb-2">{title}</h4>
        <p className="text-slate-500 text-xs leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

export const PipelineSteps: React.FC = () => {
  return (
    <section className="py-16 max-w-5xl mx-auto px-6 text-center">
      {/* Category Badge */}
      <div className="inline-flex items-center gap-1.5 bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
        <span>⚡ Alur Kerja Terstandarisasi</span>
      </div>

      <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
        Arsitektur Pipeline GWAS
      </h2>
      <p className="text-slate-500 text-xs md:text-sm mt-2 max-w-xl mx-auto">
        Sistem otomatis menyeluruh dari manipulasi mikrogugus genetik hingga pemetaan lokus penyakit poligenik yang siap publikasi.
      </p>

      {/* Grid 3 Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 text-left">
        <StepCard 
          stepNumber="TAHAP 01"
          title="Kontrol Kualitas Genomik"
          description="Penyaringan varian secara real-time dengan parameter call-rate & MAF terstandarisasi serta filtering Hardy-Weinberg."
          icon={<Filter className="w-4 h-4" />}
        />
        <StepCard 
          stepNumber="TAHAP 02"
          title="Model Asosiasi Linear / Logistik"
          description="Penyesuaian kovariat dan struktur populasi berbasis Principal Component Analysis (PCA) berkecepatan tinggi."
          icon={<Sliders className="w-4 h-4" />}
        />
        <StepCard 
          stepNumber="TAHAP 03"
          title="Visualisasi Manhattan & QQ-Plot"
          description="Eksplorasi interaktif lokus signifikan genomik p-value < 5×10⁻⁸ instan dengan ekspor data publikasi ilmiah."
          icon={<BarChart3 className="w-4 h-4" />}
        />
      </div>
    </section>
  )
}