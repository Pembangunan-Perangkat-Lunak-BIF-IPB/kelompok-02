import React from 'react'

interface PipelineHeaderProps {
  currentStep: number
}

export const PipelineHeader: React.FC<PipelineHeaderProps> = ({ currentStep }) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm mb-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="bg-cyan-500 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
          ⚡ Pipeline GWAS
        </span>
      </div>
      <h1 className="text-lg font-bold text-slate-900">Konfigurasi & Eksekusi Pipeline</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-cyan-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
            1
          </div>
          <div>
            <h4 className="text-[11px] font-bold text-slate-900">Step 1: Unggah Dataset</h4>
            <p className="text-[10px] text-slate-400">Genotipe (.vcf) & Fenotipe (.csv)</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
            currentStep >= 2 ? 'bg-cyan-500 text-white' : 'bg-cyan-100 text-cyan-600'
          }`}>
            2
          </div>
          <div>
            <h4 className="text-[11px] font-bold text-slate-900">Step 2: Konfigurasi Parameter</h4>
            <p className="text-[10px] text-slate-400">QC, MAF, Call Rate, & PCA</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 font-bold text-xs flex items-center justify-center shrink-0">
            3
          </div>
          <div>
            <h4 className="text-[11px] font-bold text-slate-400">Step 3: Eksekusi & Hasil</h4>
            <p className="text-[10px] text-slate-400">Manhattan Plot & Summary Stats</p>
          </div>
        </div>
      </div>
    </div>
  )
}