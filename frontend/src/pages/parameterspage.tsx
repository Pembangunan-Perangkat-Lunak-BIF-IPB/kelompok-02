import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PipelineNavbar } from './pipeline/pipelinenavbar'
import { PipelineHeader } from './pipeline/pipelineheader'
import { UploadSection } from './pipeline/uploadsection'
import { ParameterConfig } from './pipeline/parameterconfig'
import { Clock, Rocket } from 'lucide-react'

export default function ParametersPage() {
  const navigate = useNavigate()

  // State File & Parameter
  const [vcfFile, setVcfFile] = useState<File | null>(null)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [maf, setMaf] = useState<number>(0.00)
  const [callRate, setCallRate] = useState<number>(0)
  const [pca, setPca] = useState<number>(10)

  // Handler Upload File
  const handleVcfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVcfFile(e.target.files[0])
    }
  }

  const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0])
    }
  }

  // Handler Tombol "Gunakan Sample Data"
  const handleUseSampleData = () => {
    setVcfFile(new File([""], "garlic.vcf.gz"))
    setCsvFile(new File([""], "garlic.csv"))
    setMaf(0.05)
    setCallRate(95)
    setPca(10)
  }

  // SYARAT UTAMA: Kedua file wajib ada agar form parameter & tombol aktif
  const isReady = Boolean(vcfFile && csvFile)

  // Handler Mulai Analisis
  const handleExecute = () => {
    if (isReady) {
      navigate('/status/GWAS-2026-8891')
    }
  }

  return (
    <main className="min-h-screen bg-slate-50/60 pb-12 font-sans">
      <PipelineNavbar />

      <div className="max-w-5xl mx-auto px-4 mt-4">
        <PipelineHeader currentStep={isReady ? 2 : 1} />

        <UploadSection 
          vcfFile={vcfFile}
          csvFile={csvFile}
          onVcfChange={handleVcfChange}
          onCsvChange={handleCsvChange}
          onUseSampleData={handleUseSampleData}
        />

        {/* Jika belum upload, bagian parameter diberi efek disabled / abu-abu transparan */}
        <div className={`transition-all duration-300 ${!isReady ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          <ParameterConfig 
            maf={maf}
            callRate={callRate}
            pca={pca}
            onMafChange={setMaf}
            onCallRateChange={setCallRate}
            onPcaChange={setPca}
            isActive={isReady}
          />
        </div>

        {/* Bottom Execution Bar */}
        <div className={`rounded-2xl p-4 flex items-center justify-between transition-all ${
          isReady 
            ? 'bg-cyan-500 text-white shadow-lg' 
            : 'bg-slate-300 text-slate-500'
        }`}>
          <div className="flex items-center gap-3 pl-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              isReady ? 'bg-amber-400 text-slate-900' : 'bg-slate-400 text-white'
            }`}>
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-medium opacity-90">Estimasi Waktu Komputasi:</span>
              <p className="text-sm font-bold">~5 Menit</p>
            </div>
          </div>

          <button
            type="button"
            disabled={!isReady}
            onClick={handleExecute}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              isReady 
                ? 'bg-amber-400 hover:bg-amber-500 text-slate-900 shadow-md hover:scale-105' 
                : 'bg-slate-400 text-slate-200 cursor-not-allowed'
            }`}
          >
            <Rocket className="w-4 h-4" />
            <span>Mulai Analisis</span>
          </button>
        </div>
      </div>
    </main>
  )
}