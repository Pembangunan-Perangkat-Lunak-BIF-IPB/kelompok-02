import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PipelineNavbar } from './pipeline/pipelinenavbar'
import { PipelineHeader } from './pipeline/pipelineheader'
import { UploadSection } from './pipeline/uploadsection'
import { ColumnSelect } from './pipeline/columnselect'
import { ParameterConfig } from './pipeline/parameterconfig'
import { extractCsvPhenotypeColumns } from './pipeline/csvhelper'
import { Clock, Play, Loader2, AlertCircle, Sparkles } from 'lucide-react'
import apiClient from '../api/client'

export default function ParametersPage() {
  const navigate = useNavigate()

  // State File & Kolom Fenotipe Target
  const [vcfFile, setVcfFile] = useState<File | null>(null)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [phenotypeColumns, setPhenotypeColumns] = useState<string[]>([])
  const [selectedColumn, setSelectedColumn] = useState<string>('')

  // State Parameter GWAS (Default awal diatur ke 0)
  const [maf, setMaf] = useState<number>(0)
  const [callRate, setCallRate] = useState<number>(0)
  const [pca, setPca] = useState<number>(0)

  // State Loading & Error saat kirim ke Backend
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Handler Upload File Genotipe (.vcf)
  const handleVcfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVcfFile(e.target.files[0])
      setErrorMsg(null)
    }
  }

  // Handler Upload File Fenotipe (.csv) & Otomatis Deteksi Header Kolom
  const handleCsvChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setCsvFile(file)
      setErrorMsg(null)

      const extracted = await extractCsvPhenotypeColumns(file)
      setPhenotypeColumns(extracted)
      if (extracted.length > 0) {
        setSelectedColumn(extracted[0])
      } else {
        setSelectedColumn('')
      }
    }
  }

  // Handler Tombol "Gunakan Sample Data" (Termasuk beberapa pilihan kolom fenotipe)
  const handleUseSampleData = () => {
    const sampleIds = Array.from({ length: 35 }, (_, i) => `SAMP_${String(i + 1).padStart(3, '0')}`)
    const vcfHeader = `##fileformat=VCFv4.2\n#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO\tFORMAT\t${sampleIds.join('\t')}\n`
    const vcfRows = Array.from({ length: 20 }, (_, i) => {
      const gts = sampleIds.map((_, idx) => (idx % 3 === 0 ? '0/1' : idx % 5 === 0 ? '1/1' : '0/0')).join('\t')
      return `22\t${10000 + i * 150}\trs${1000 + i}\tA\tG\t100\tPASS\t.\tGT\t${gts}`
    }).join('\n') + '\n'

    // Contoh berkas dengan 4 kolom fenotipe klinis realistis
    const sampleCols = ['HDL', 'LDL', 'Trigliserida', 'Fenotipe_Lipid']
    const csvHeader = `FID,IID,Sample_ID,${sampleCols.join(',')}\n`
    const csvRows = sampleIds.map((id, idx) => {
      const hdl = (45 + (idx % 10) * 2.1).toFixed(2)
      const ldl = (110 + (idx % 8) * 4.3).toFixed(2)
      const tg = (130 + (idx % 12) * 5.0).toFixed(2)
      const lipid = (120 + (idx % 15) * 3.5).toFixed(2)
      return `${id},${id},${id},${hdl},${ldl},${tg},${lipid}`
    }).join('\n') + '\n'

    setVcfFile(new File([vcfHeader + vcfRows], 'cohort_indonesia_chr22.vcf', { type: 'text/plain' }))
    setCsvFile(new File([csvHeader + csvRows], 'lipid_pheno.csv', { type: 'text/csv' }))
    setPhenotypeColumns(sampleCols)
    setSelectedColumn(sampleCols[0])
    setMaf(0)
    setCallRate(0)
    setPca(0)
    setErrorMsg(null)
  }

  // SYARAT UTAMA: Kedua file wajib ada agar form parameter & tombol eksekusi aktif
  const isReady = Boolean(vcfFile && csvFile)

  // Handler Mulai Analisis -> Mengirim data ke POST /api/v1/upload di Backend
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

      // Sertakan kolom fenotipe yang dipilih pengguna
      if (selectedColumn) {
        formData.append('pheno_col', selectedColumn)
      }

      const response = await apiClient.post('/api/v1/upload', formData)
      
      // Ambil result_id asli dari response backend
      const resultId = response.data.result_id
      localStorage.setItem('last_gwas_result_id', resultId)
      navigate(`/status/${resultId}`)
    } catch (err: unknown) {
      console.error('Error upload:', err)
      const axiosErr = err as { response?: { data?: { detail?: unknown } } }
      const detail = axiosErr.response?.data?.detail || 'Gagal menghubungi server Backend di port 8000.'
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

        {/* Step 1: Upload Dataset Genomik & Klinis */}
        <UploadSection
          vcfFile={vcfFile}
          csvFile={csvFile}
          onVcfChange={handleVcfChange}
          onCsvChange={handleCsvChange}
          onUseSampleData={handleUseSampleData}
        />

        {/* Step 2: Pilih Kolom Fenotipe */}
        <ColumnSelect
          columns={phenotypeColumns}
          selectedColumn={selectedColumn}
          onSelectColumn={setSelectedColumn}
          isActive={isReady}
        />

        {/* Step 3: Konfigurasi Parameter GWAS & Kontrol Kualitas */}
        <div className={`transition-all duration-300 ${!isReady ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          <ParameterConfig
            maf={maf}
            callRate={callRate}
            pca={pca}
            onMafChange={setMaf}
            onCallRateChange={setCallRate}
            onPcaChange={setPca}
            isActive={isReady}
            stepNumber={3}
          />
        </div>

        {/* Bottom Execution Bar */}
        <div
          className={`rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 transition-all ${
            isReady ? 'bg-cyan-500 text-white shadow-lg' : 'bg-slate-300 text-slate-500'
          }`}
        >
          <div className="flex items-center gap-3 pl-2">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${
                isReady ? 'bg-amber-400 text-slate-900' : 'bg-slate-400 text-white'
              }`}
            >
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium opacity-90">Estimasi Waktu Komputasi:</span>
                {isReady && selectedColumn && (
                  <span className="bg-white/20 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    Target: {selectedColumn}
                  </span>
                )}
              </div>
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
                <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
                <span>Memproses Upload...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Mulai Analisis</span>
              </>
            )}
          </button>
        </div>
      </div>
    </main>
  )
}
