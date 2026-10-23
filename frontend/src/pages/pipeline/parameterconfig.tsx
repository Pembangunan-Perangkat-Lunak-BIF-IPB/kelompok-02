import React from 'react'
import { HelpCircle, Check } from 'lucide-react'

interface ParameterConfigProps {
  maf: number
  callRate: number
  pca: number
  onMafChange: (val: number) => void
  onCallRateChange: (val: number) => void
  onPcaChange: (val: number) => void
  isActive: boolean
}

export const ParameterConfig: React.FC<ParameterConfigProps> = ({
  maf,
  callRate,
  pca,
  onMafChange,
  onCallRateChange,
  onPcaChange,
  isActive
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm mb-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-5 h-5 rounded-full bg-cyan-500 text-white font-bold text-[10px] flex items-center justify-center">
          2
        </span>
        <h2 className="text-sm font-bold text-slate-900">Konfigurasi Parameter GWAS & Kontrol Kualitas</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* MAF */}
        <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                MAF Threshold <HelpCircle className="w-3 h-3 text-slate-400" />
              </label>
              <span className="bg-amber-100 text-amber-700 text-[9px] font-bold px-2 py-0.5 rounded-full">
                {maf.toFixed(2)}
              </span>
            </div>
            <p className="text-[9px] text-slate-400">(Standar: 0.01 - 0.05)</p>

            <input 
              type="range" 
              min="0.00" 
              max="0.20" 
              step="0.01" 
              value={maf}
              onChange={(e) => onMafChange(parseFloat(e.target.value))}
              className="w-full mt-3 accent-amber-500 cursor-pointer"
            />
            <input 
              type="number" 
              value={maf}
              onChange={(e) => onMafChange(parseFloat(e.target.value) || 0)}
              className="w-full mt-2 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] text-slate-800 font-medium focus:outline-none focus:border-cyan-500"
            />
          </div>
          <span className="text-[9px] text-slate-400 mt-2">Filter Rare Variants</span>
        </div>

        {/* Call Rate */}
        <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                Call Rate <HelpCircle className="w-3 h-3 text-slate-400" />
              </label>
              <span className="bg-amber-100 text-amber-700 text-[9px] font-bold px-2 py-0.5 rounded-full">
                {callRate}%
              </span>
            </div>
            <p className="text-[9px] text-slate-400">(Ambang toleransi data hilang)</p>

            <div className="relative mt-6">
              <input 
                type="number" 
                value={callRate}
                onChange={(e) => onCallRateChange(parseInt(e.target.value) || 0)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-800 font-medium focus:outline-none focus:border-cyan-500 pr-6"
              />
              <span className="absolute right-2.5 top-1.5 text-[11px] text-slate-400 font-bold">%</span>
            </div>
          </div>
          <span className="text-[9px] text-slate-400 mt-2">Missingness Threshold</span>
        </div>

        {/* PCA */}
        <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                Jumlah PC (PCA) <HelpCircle className="w-3 h-3 text-slate-400" />
              </label>
              <span className="bg-amber-100 text-amber-700 text-[9px] font-bold px-2 py-0.5 rounded-full">
                {pca} PCs
              </span>
            </div>
            <p className="text-[9px] text-slate-400">(Koreksi stratifikasi populasi)</p>

            <div className="grid grid-cols-3 gap-1 mt-2.5">
              {[5, 10, 20].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => onPcaChange(val)}
                  className={`py-1 text-[10px] font-bold rounded-md border transition ${
                    pca === val ? 'bg-amber-400 text-slate-900 border-amber-400 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {val} PCs
                </button>
              ))}
            </div>

            <input 
              type="number" 
              value={pca}
              onChange={(e) => onPcaChange(parseInt(e.target.value) || 0)}
              className="w-full mt-2 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] text-slate-800 font-medium focus:outline-none focus:border-cyan-500"
            />
          </div>
          <span className="text-[9px] text-slate-400 mt-2">Stratification Control</span>
        </div>
      </div>

      {/* QC Status Checkbar */}
      <div className={`mt-3 p-2.5 rounded-xl border flex flex-wrap items-center gap-4 transition-all ${
        isActive ? 'bg-cyan-500 text-white border-cyan-500' : 'bg-slate-50 text-slate-600 border-slate-200'
      }`}>
        <div className="flex items-center gap-1.5 text-[11px] font-semibold">
          <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${isActive ? 'bg-amber-400 text-slate-900' : 'bg-slate-400 text-white'}`}>
            <Check className="w-2.5 h-2.5 stroke-[3]" />
          </div>
          <span>Hardy-Weinberg Equilibrium (HWE &gt; 1e-6)</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-semibold">
          <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${isActive ? 'bg-amber-400 text-slate-900' : 'bg-slate-400 text-white'}`}>
            <Check className="w-2.5 h-2.5 stroke-[3]" />
          </div>
          <span>Linear Mixed Model (LMM)</span>
        </div>
      </div>
    </div>
  )
}