import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PipelineNavbar } from './pipeline/pipelinenavbar'
import { PipelineHeader } from './pipeline/pipelineheader'
import { UploadSection } from './pipeline/uploadsection'
import { ParameterConfig } from './pipeline/parameterconfig'
import { Clock, Rocket, Loader2, AlertCircle } from 'lucide-react'
import apiClient from '../api/client'

export default function ParametersPage() {
  const navigate = useNavigate()

  // State File & Parameter
  const [vcfFile, setVcfFile] = useState<File | null>(null)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [maf, setMaf] = useState<number>(0.05)
  const [callRate, setCallRate] = useState<number>(95)
  const [pca, setPca] = useState<number>(10)

  // State Loading & Error saat kirim ke Backend
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Handler Upload File
  const handleVcfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVcfFile(e.target.files[0])
      setErrorMsg(null)
    }
  }

  const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0])
      setErrorMsg(null)
    }
  }

  // Handler Tombol "Gunakan Sample Data" (Berisi sampel valid agar tidak 0 byte)
  const handleUseSampleData = () => {
    const sampleIds = Array.from({ length: 35 }, (_, i) => `SAMP_${String(i + 1).padStart(3, '0')}`)
    const vcfHeader = `##fileformat=VCFv4.2\n#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO\tFORMAT\t${sampleIds.join('\t')}\n`
    const vcfRows = Array.from({ length: 20 }, (_, i) => {
      const gts = sampleIds.map((_, idx) => (idx % 3 === 0 ? '0/1' : idx % 5 === 0 ? '1/1' : '0/0')).join('\t')
      return `22\t${10000 + i * 150}\trs${1000 + i}\tA\tG\t100\tPASS\t.\tGT\t${gts}`
    }).join('\n') + '\n'

    const csvHeader = `FID,IID,Sample_ID,Fenotipe\n`
    const csvRows = sampleIds.map((id, idx) => `${id},${id},${id},${(120 + (idx % 15) * 3.5).toFixed(2)}`).join('\n') + '\n'

    setVcfFile(new File([vcfHeader + vcfRows], 'cohort_indonesia_chr22.vcf', { type: 'text/plain' }))
    setCsvFile(new File([csvHeader + csvRows], 'lipid_pheno.csv', { type: 'text/csv' }))
    setMaf(0.05)
    setCallRate(95)
    setPca(10)
    setErrorMsg(null)
  }

  // SYARAT UTAMA: Kedua file wajib ada agar form parameter & tombol aktif
  const isReady = Boolean(vcfFile && csvFile)

  // Handler Mulai Analisis -> Langsung ke POST /api/v1/upload di Backend
  const handleExecute = async () => {
    if (!isReady || !vcfFile || !csvFile || isSubmitting) return

    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      const formData = new FormData()
      formData.append('vcf_file', vcfFile)
      formData.append('csv_file', csvFile)
      formData.append('maf', String(maf))
      
      // Backend meminta float desimal (misal 0.95), sedangkan input UI dalam persen (95)
      const normalizedCallRate = callRate > 1 ? callRate / 100 : callRate
      formData.append('call_rate', String(normalizedCallRate))
      formData.append('num_pcs', String(pca))

      const response = await apiClient.post('/api/v1/upload', formData)
      
      // Ambil result_id asli dari response backend
      const resultId = response.data.result_id
      localStorage.setItem('last_gwas_result_id', resultId)
      navigate(`/status/${resultId}`)
    } catch (err: any) {
      console.error('Error upload:', err)
      const detail = err.response?.data?.detail || 'Gagal menghubungi server Backend di port 8000.'
      setErrorMsg(typeof detail === 'string' ? detail : JSON.stringify(detail))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50/60 pb-12 font-sans">
      <PipelineNavbar />
      <div className="max-w-5xl mx-auto px-4 mt-4">
        <PipelineHeader currentStep={isReady ? 2 : 1} />

        {/* Pesan Error Jika Gagal Upload ke Backend */}
        {errorMsg && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <div>
              <span className="font-bold">Gagal Memulai Analisis: </span>
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        <UploadSection
          vcfFile={vcfFile}
          csvFile={csvFile}
          onVcfChange={handleVcfChange}
          onCsvChange={handleCsvChange}
          onUseSampleData={handleUseSampleData}
        />

        {/* Jika belum upload, bagian parameter diberi efek disabled */}
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
        <div
          className={`rounded-2xl p-4 flex items-center justify-between transition-all ${
            isReady ? 'bg-cyan-500 text-white shadow-lg' : 'bg-slate-300 text-slate-500'
          }`}
        >
          <div className="flex items-center gap-3 pl-2">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                isReady ? 'bg-amber-400 text-slate-900' : 'bg-slate-400 text-white'
              }`}
            >
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-medium opacity-90">Estimasi Waktu Komputasi:</span>
              <p className="text-sm font-bold">~5 Menit</p>
            </div>
          </div>
          <button
            type="button"
            disabled={!isReady || isSubmitting}
            onClick={handleExecute}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              isReady && !isSubmitting
                ? 'bg-amber-400 hover:bg-amber-500 text-slate-900 shadow-md hover:scale-105'
                : 'bg-slate-400 text-slate-200 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Mengunggah...</span>
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4" />
                <span>Mulai Analisis</span>
              </>
            )}
          </button>
        </div>
      </div>
    </main>
  )
}