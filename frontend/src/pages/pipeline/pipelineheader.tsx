import React from 'react'

interface PipelineHeaderProps {
  currentStep: number
}

export const PipelineHeader: React.FC<PipelineHeaderProps> = ({ currentStep }) => {
  return (
    <div 
      className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs mb-5 animate-fade-in-up"
      style={{ animationDelay: '80ms' }}
    >
      <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
        Konfigurasi & Eksekusi Pipeline
      </h1>
      <p className="text-xs text-slate-600 mt-1">
        Unggah dataset genomik, tentukan target fenotipe klinis, dan sesuaikan parameter QC sebelum komputasi GWAS dimulai.
      </p>

      {/* Stepper Progress Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-100">
        {/* Step 1 */}
        <div className="flex items-center gap-3 p-2 rounded-xl transition-all duration-200 bg-slate-50/60 border border-slate-100">
          <div className="w-8 h-8 rounded-full bg-amber-500 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
            1
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Step 1: Unggah Dataset</h4>
            <p className="text-[11px] text-slate-500">Genotipe (.vcf) & Fenotipe (.csv)</p>
          </div>
        </div>

        {/* Step 2 */}
        <div className={`flex items-center gap-3 p-2 rounded-xl transition-all duration-200 border ${
          currentStep >= 2 
            ? 'bg-amber-50/50 border-amber-200/70' 
            : 'bg-slate-50/30 border-slate-100 opacity-70'
        }`}>
          <div className={`w-8 h-8 rounded-full font-extrabold text-xs flex items-center justify-center shrink-0 transition-all duration-300 ${
            currentStep >= 2 ? 'bg-amber-500 text-white shadow-xs scale-105' : 'bg-slate-200 text-slate-600'
          }`}>
            2
          </div>
          <div>
            <h4 className={`text-xs font-bold transition-colors duration-200 ${
              currentStep >= 2 ? 'text-slate-900' : 'text-slate-600'
            }`}>
              Step 2: Target & Parameter
            </h4>
            <p className="text-[11px] text-slate-500">Pilih Kolom Fenotipe & Kontrol QC</p>
          </div>
        </div>

        {/* Step 3 */}
        <div className={`flex items-center gap-3 p-2 rounded-xl transition-all duration-200 border ${
          currentStep >= 3 
            ? 'bg-amber-50/50 border-amber-200/70' 
            : 'bg-slate-50/30 border-slate-100 opacity-70'
        }`}>
          <div className={`w-8 h-8 rounded-full font-extrabold text-xs flex items-center justify-center shrink-0 transition-all duration-300 ${
            currentStep >= 3 ? 'bg-amber-500 text-white shadow-xs scale-105' : 'bg-slate-200 text-slate-600'
          }`}>
            3
          </div>
          <div>
            <h4 className={`text-xs font-bold transition-colors duration-200 ${
              currentStep >= 3 ? 'text-slate-900' : 'text-slate-600'
            }`}>
              Step 3: Eksekusi & Hasil
            </h4>
            <p className="text-[11px] text-slate-500">Manhattan Plot & Summary Stats</p>
          </div>
        </div>
      </div>
    </div>
  )
}