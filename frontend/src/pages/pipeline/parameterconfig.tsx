import React, { useState } from 'react'
import { HelpCircle, Check } from 'lucide-react'

interface ParameterConfigProps {
  maf: number
  callRateSnp?: number
  callRateIndiv?: number
  pca: number
  onMafChange: (val: number) => void
  onCallRateSnpChange?: (val: number) => void
  onCallRateIndivChange?: (val: number) => void
  onPcaChange: (val: number) => void
  isActive: boolean
  stepNumber?: number
  // Backward compatibility fallback
  callRate?: number
  onCallRateChange?: (val: number) => void
}

export const ParameterConfig: React.FC<ParameterConfigProps> = ({
  maf,
  callRateSnp,
  callRateIndiv,
  pca,
  onMafChange,
  onCallRateSnpChange,
  onCallRateIndivChange,
  onPcaChange,
  isActive,
  stepNumber = 3,
  callRate,
  onCallRateChange,
}) => {
  const currentCallRateSnp = callRateSnp ?? callRate ?? 95
  const currentCallRateIndiv = callRateIndiv ?? callRate ?? 90

  // MAF State & Sync
  const [prevMaf, setPrevMaf] = useState(maf)
  const [mafStr, setMafStr] = useState(maf.toString())

  if (maf !== prevMaf) {
    setPrevMaf(maf)
    setMafStr(maf.toString())
  }

  // Call Rate SNP State & Sync
  const [prevCallRateSnp, setPrevCallRateSnp] = useState(currentCallRateSnp)
  const [callRateSnpStr, setCallRateSnpStr] = useState(currentCallRateSnp.toString())

  if (currentCallRateSnp !== prevCallRateSnp) {
    setPrevCallRateSnp(currentCallRateSnp)
    setCallRateSnpStr(currentCallRateSnp.toString())
  }

  // Call Rate Individu State & Sync
  const [prevCallRateIndiv, setPrevCallRateIndiv] = useState(currentCallRateIndiv)
  const [callRateIndivStr, setCallRateIndivStr] = useState(currentCallRateIndiv.toString())

  if (currentCallRateIndiv !== prevCallRateIndiv) {
    setPrevCallRateIndiv(currentCallRateIndiv)
    setCallRateIndivStr(currentCallRateIndiv.toString())
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

  const handleCallRateSnpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value

    if (raw === '') {
      setCallRateSnpStr('')
      setPrevCallRateSnp(0)
      if (onCallRateSnpChange) onCallRateSnpChange(0)
      if (onCallRateChange) onCallRateChange(0)
      return
    }

    // Hanya izinkan digit
    raw = raw.replace(/\D/g, '')

    // Bersihkan angka 0 di depan jika user mengetik angka baru, misal "09" -> "9"
    if (raw.length > 1 && raw.startsWith('0')) {
      raw = raw.replace(/^0+/, '')
      if (raw === '') raw = '0'
    }

    setCallRateSnpStr(raw)
    const parsed = parseInt(raw, 10)
    const val = isNaN(parsed) ? 0 : Math.min(100, parsed)
    setPrevCallRateSnp(val)
    if (onCallRateSnpChange) onCallRateSnpChange(val)
    if (onCallRateChange) onCallRateChange(val)
  }

  const handleCallRateIndivChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value

    if (raw === '') {
      setCallRateIndivStr('')
      setPrevCallRateIndiv(0)
      if (onCallRateIndivChange) onCallRateIndivChange(0)
      return
    }

    // Hanya izinkan digit
    raw = raw.replace(/\D/g, '')

    // Bersihkan angka 0 di depan jika user mengetik angka baru, misal "09" -> "9"
    if (raw.length > 1 && raw.startsWith('0')) {
      raw = raw.replace(/^0+/, '')
      if (raw === '') raw = '0'
    }

    setCallRateIndivStr(raw)
    const parsed = parseInt(raw, 10)
    const val = isNaN(parsed) ? 0 : Math.min(100, parsed)
    setPrevCallRateIndiv(val)
    if (onCallRateIndivChange) onCallRateIndivChange(val)
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
    <div 
      className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs mb-5 animate-fade-in-up"
      style={{ animationDelay: '320ms' }}
    >
      <div className="flex items-center gap-2 mb-3.5">
        <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-extrabold text-[11px] flex items-center justify-center shadow-xs">
          {stepNumber}
        </span>
        <h2 className="text-sm font-bold text-slate-900 tracking-tight">Konfigurasi Parameter GWAS & Kontrol Kualitas</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* MAF */}
        <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/70 hover:border-slate-300 hover:shadow-2xs transition-all duration-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                MAF Threshold
                <span title="Minor Allele Frequency: Ambang batas frekuensi alel minor untuk memfilter varian genetik langka atau kemungkinan artefak genotyping (standar ilmiah: 0.01 - 0.05)">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-help" />
                </span>
              </label>
              <span className="bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs font-mono">
                {maf.toFixed(2)}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">(Standar ilmiah: 0.01 - 0.05)</p>

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
              className="w-full mt-3.5 accent-amber-500 hover:accent-amber-600 cursor-pointer transition-all"
            />
            <input 
              type="text" 
              inputMode="decimal"
              placeholder="0"
              value={mafStr}
              onChange={handleMafChange}
              onFocus={(e) => e.target.select()}
              className="w-full mt-2 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 transition-all"
            />
          </div>
          <span className="text-[10px] font-medium text-slate-500 mt-2.5">Filter Varian Langka (Rare Variants)</span>
        </div>

        {/* Call Rate SNP */}
        <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/70 hover:border-slate-300 hover:shadow-2xs transition-all duration-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                Call Rate SNP
                <span title="Call Rate SNP: Ambang batas kelengkapan data per varian SNP (--geno). Varian dengan tingkat data hilang di atas batas toleransi akan difilter">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-help" />
                </span>
              </label>
              <span className="bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs font-mono">
                {currentCallRateSnp}%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">(Ambang toleransi data SNP)</p>

            <div className="relative mt-6">
              <input 
                type="text" 
                inputMode="numeric"
                placeholder="0"
                value={callRateSnpStr}
                onChange={handleCallRateSnpChange}
                onFocus={(e) => e.target.select()}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 transition-all pr-6"
              />
              <span className="absolute right-2.5 top-1.5 text-xs text-slate-400 font-bold">%</span>
            </div>
          </div>
          <span className="text-[10px] font-medium text-slate-500 mt-2.5">Missingness SNP QC (--geno)</span>
        </div>

        {/* Call Rate Individu */}
        <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/70 hover:border-slate-300 hover:shadow-2xs transition-all duration-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                Call Rate Individu
                <span title="Call Rate Individu: Ambang batas kelengkapan data per individu/sampel (--mind). Sampel dengan data hilang melebihi batas toleransi akan dieksklusi">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-help" />
                </span>
              </label>
              <span className="bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs font-mono">
                {currentCallRateIndiv}%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">(Ambang toleransi individu)</p>

            <div className="relative mt-6">
              <input 
                type="text" 
                inputMode="numeric"
                placeholder="0"
                value={callRateIndivStr}
                onChange={handleCallRateIndivChange}
                onFocus={(e) => e.target.select()}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 transition-all pr-6"
              />
              <span className="absolute right-2.5 top-1.5 text-xs text-slate-400 font-bold">%</span>
            </div>
          </div>
          <span className="text-[10px] font-medium text-slate-500 mt-2.5">Missingness Individu QC (--mind)</span>
        </div>

        {/* PCA */}
        <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/70 hover:border-slate-300 hover:shadow-2xs transition-all duration-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                Jumlah PC (PCA)
                <span title="Principal Component Analysis: Jumlah komponen utama untuk mengoreksi struktur populasi genomik">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-help" />
                </span>
              </label>
              <span className="bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs font-mono">
                {pca} PCs
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">(Koreksi stratifikasi populasi)</p>

            <div className="grid grid-cols-3 gap-1.5 mt-2.5">
              {[5, 10, 20].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    setPcaStr(val.toString())
                    setPrevPca(val)
                    onPcaChange(val)
                  }}
                  className={`py-1.5 text-[11px] font-bold rounded-lg border transition-all duration-150 active:scale-95 cursor-pointer ${
                    pca === val 
                      ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-xs' 
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
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
              className="w-full mt-2 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 transition-all"
            />
          </div>
          <span className="text-[10px] font-medium text-slate-500 mt-2.5">Koreksi Struktur Populasi Genomik</span>
        </div>
      </div>

      {/* QC Status Checkbar */}
      <div className={`mt-4 p-3.5 rounded-xl border flex flex-wrap items-center gap-5 transition-all duration-300 shadow-xs ${
        isActive 
          ? 'bg-gradient-to-r from-sky-700 via-cyan-700 to-teal-700 text-white border-transparent' 
          : 'bg-slate-50 text-slate-600 border-slate-200'
      }`}>
        <div className="flex items-center gap-2 text-xs font-semibold">
          <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 ${
            isActive ? 'bg-amber-400 text-slate-950 shadow-xs' : 'bg-slate-300 text-slate-600'
          }`}>
            <Check className="w-2.5 h-2.5 stroke-[3]" />
          </div>
          <span>Kontrol Kualitas Genomik (QC Call Rate &amp; MAF)</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold">
          <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 ${
            isActive ? 'bg-amber-400 text-slate-950 shadow-xs' : 'bg-slate-300 text-slate-600'
          }`}>
            <Check className="w-2.5 h-2.5 stroke-[3]" />
          </div>
          <span>Stratifikasi Populasi (PCA) &amp; Uji Asosiasi Regresi</span>
        </div>
      </div>
    </div>
  )
}
