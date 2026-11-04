import React, { useState } from 'react'
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
  // MAF State & Sync
  const [prevMaf, setPrevMaf] = useState(maf)
  const [mafStr, setMafStr] = useState(maf.toString())

  if (maf !== prevMaf) {
    setPrevMaf(maf)
    setMafStr(maf.toString())
  }

  // Call Rate State & Sync
  const [prevCallRate, setPrevCallRate] = useState(callRate)
  const [callRateStr, setCallRateStr] = useState(callRate.toString())

  if (callRate !== prevCallRate) {
    setPrevCallRate(callRate)
    setCallRateStr(callRate.toString())
  }

  // PCA State & Sync
  const [prevPca, setPrevPca] = useState(pca)
  const [pcaStr, setPcaStr] = useState(pca.toString())

  if (pca !== prevPca) {
    setPrevPca(pca)
    setPcaStr(pca.toString())
  }

  // Handlers with smart leading-zero cleanup & full backspace deletion
  const handleMafChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(',', '.')
    
    // User deletes everything
    if (raw === '') {
      setMafStr('')
      setPrevMaf(0)
      onMafChange(0)
      return
    }

    // Typing decimal point directly e.g. "." -> "0."
    if (raw === '.') {
      raw = '0.'
    }

    // Auto-clean leading zero: e.g. "05" -> "5", but keep "0."
    if (raw.length > 1 && raw.startsWith('0') && raw[1] !== '.') {
      raw = raw.replace(/^0+/, '')
      if (raw === '') raw = '0'
    }

    if (/^\d*\.?\d*$/.test(raw)) {
      setMafStr(raw)
      const parsed = parseFloat(raw)
      const val = isNaN(parsed) ? 0 : parsed
      setPrevMaf(val)
      onMafChange(val)
    }
  }

  const handleCallRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value

    if (raw === '') {
      setCallRateStr('')
      setPrevCallRate(0)
      onCallRateChange(0)
      return
    }

    // Hanya izinkan digit
    raw = raw.replace(/\D/g, '')

    // Bersihkan angka 0 di depan jika user mengetik angka baru, misal "09" -> "9"
    if (raw.length > 1 && raw.startsWith('0')) {
      raw = raw.replace(/^0+/, '')
      if (raw === '') raw = '0'
    }

    setCallRateStr(raw)
    const parsed = parseInt(raw, 10)
    const val = isNaN(parsed) ? 0 : Math.min(100, parsed)
    setPrevCallRate(val)
    onCallRateChange(val)
  }

  const handlePcaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value

    if (raw === '') {
      setPcaStr('')
      setPrevPca(0)
      onPcaChange(0)
      return
    }

    raw = raw.replace(/\D/g, '')

    if (raw.length > 1 && raw.startsWith('0')) {
      raw = raw.replace(/^0+/, '')
      if (raw === '') raw = '0'
    }

    setPcaStr(raw)
    const parsed = parseInt(raw, 10)
    const val = isNaN(parsed) ? 0 : parsed
    setPrevPca(val)
    onPcaChange(val)
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm mb-4 animate-fade-in-up">
      <div className="flex items-center gap-2 mb-3">
        {/* Nomor Step */}
        <span className="w-6 h-6 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-teal-400 text-slate-950 font-bold text-[10px] flex items-center justify-center shadow-md animate-gradient-btn">
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
              {/* Badge Nilai Gradasi */}
              <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs animate-gradient-btn">
                {maf.toFixed(2)}
              </span>
            </div>
            <p className="text-[9px] text-slate-400">(Standar: 0.01 - 0.05)</p>

            <input 
              type="range" 
              min="0.00" 
              max="0.05" 
              step="0.005" 
              value={maf}
              onChange={(e) => {
                const val = parseFloat(e.target.value)
                setMafStr(val.toString())
                setPrevMaf(val)
                onMafChange(val)
              }}
              className="w-full mt-3 accent-amber-600 cursor-pointer"
            />
            <input 
              type="text" 
              inputMode="decimal"
              placeholder="0"
              value={mafStr}
              onChange={handleMafChange}
              onFocus={(e) => e.target.select()}
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
              {/* Badge Nilai Gradasi */}
              <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs animate-gradient-btn">
                {callRate}%
              </span>
            </div>
            <p className="text-[9px] text-slate-400">(Ambang toleransi data hilang)</p>

            <div className="relative mt-6">
              <input 
                type="text" 
                inputMode="numeric"
                placeholder="0"
                value={callRateStr}
                onChange={handleCallRateChange}
                onFocus={(e) => e.target.select()}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-800 font-medium focus:outline-none focus:border-amber-500 pr-6"
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
              {/* Badge Nilai Gradasi */}
              <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs animate-gradient-btn">
                {pca} PCs
              </span>
            </div>
            <p className="text-[9px] text-slate-400">(Koreksi stratifikasi populasi)</p>

            <div className="grid grid-cols-3 gap-1 mt-2.5">
              {[5, 10, 20].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    setPcaStr(val.toString())
                    setPrevPca(val)
                    onPcaChange(val)
                  }}
                  className={`py-1 text-[10px] font-bold rounded-md border transition cursor-pointer ${
                    pca === val 
                      ? 'bg-gradient-to-r from-amber-500 via-cyan-200 to-teal-400 text-slate-950 border-transparent shadow-md animate-gradient-btn' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {val} PCs
                </button>
              ))}
            </div>

            <input 
              type="text" 
              inputMode="numeric"
              placeholder="0"
              value={pcaStr}
              onChange={handlePcaChange}
              onFocus={(e) => e.target.select()}
              className="w-full mt-2 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] text-slate-800 font-medium focus:outline-none focus:border-cyan-500"
            />
          </div>
          <span className="text-[9px] text-slate-400 mt-2">Stratification Control</span>
        </div>
      </div>

      {/* QC Status Checkbar */}
      <div className={`mt-3 p-3 rounded-xl border flex flex-wrap items-center gap-4 transition-all shadow-sm ${
        isActive 
          ? 'bg-gradient-to-r from-amber-600 via-white-700 to-teal-600 text-white border-transparent animate-gradient-btn' 
          : 'bg-slate-50 text-slate-600 border-slate-200'
      }`}>
        <div className="flex items-center gap-1.5 text-[11px] font-semibold">
          <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${isActive ? 'bg-amber-400 text-slate-950 shadow-xs' : 'bg-slate-400 text-white'}`}>
            <Check className="w-2.5 h-2.5 stroke-[3]" />
          </div>
          <span>Hardy-Weinberg Equilibrium (HWE &gt; 1e-6)</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-semibold">
          <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${isActive ? 'bg-amber-400 text-slate-950 shadow-xs' : 'bg-slate-400 text-white'}`}>
            <Check className="w-2.5 h-2.5 stroke-[3]" />
          </div>
          <span>Linear Mixed Model (LMM)</span>
        </div>
      </div>
    </div>
  )
}
