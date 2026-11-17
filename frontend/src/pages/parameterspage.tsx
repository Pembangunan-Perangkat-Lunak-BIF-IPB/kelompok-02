import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PipelineNavbar } from './pipeline/pipelinenavbar'
import { PipelineHeader } from './pipeline/pipelineheader'
import { UploadSection, type GenotypeFormat, type FileRejectionNotice } from './pipeline/uploadsection'
import { ColumnSelect } from './pipeline/columnselect'
import { ParameterConfig } from './pipeline/parameterconfig'
import { extractCsvPhenotypeColumns } from './pipeline/csvhelper'
import { AppFooter } from '../components/layout/AppFooter'
import { Clock, Play, Loader2, AlertCircle, Sparkles } from 'lucide-react'
import apiClient from '../api/client'

export default function ParametersPage() {
  const navigate = useNavigate()

  // State Format Genotipe: 'vcf' atau 'plink' (BED/BIM/FAM triplet)
  const [genotypeFormat, setGenotypeFormat] = useState<GenotypeFormat>('vcf')

  // State File Genotipe
  const [vcfFile, setVcfFile] = useState<File | null>(null)
  const [bedFile, setBedFile] = useState<File | null>(null)
  const [bimFile, setBimFile] = useState<File | null>(null)
  const [famFile, setFamFile] = useState<File | null>(null)

  // State File & Kolom Fenotipe Target
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [phenotypeColumns, setPhenotypeColumns] = useState<string[]>([])
  const [selectedColumn, setSelectedColumn] = useState<string>('')

  // State Parameter GWAS (Default: MAF 0.05, Call Rate SNP 95%, Call Rate Individu 90%, PCA 10)
  const [maf, setMaf] = useState<number>(0.05)
  const [callRateSnp, setCallRateSnp] = useState<number>(95)
  const [callRateIndiv, setCallRateIndiv] = useState<number>(90)
  const [pca, setPca] = useState<number>(10)

  // State Loading & Error saat kirim ke Backend
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // State Notifikasi Penolakan Berkas (Format Tidak Sesuai)
  const [fileRejection, setFileRejection] = useState<FileRejectionNotice | null>(null)

  // Handler Upload Berkas Genotipe (.vcf / .vcf.gz)
  const handleVcfSelect = (file: File) => {
    setVcfFile(file)
    setFileRejection(null)
    setErrorMsg(null)
  }

  // Handler Upload File Triplet PLINK (.bed, .bim, .fam)
  const handlePlinkFilesChange = (files: FileList | File[]) => {
    const fileArr = Array.from(files)
    let newBed = bedFile
    let newBim = bimFile
    let newFam = famFile

    fileArr.forEach((f) => {
      const lower = f.name.toLowerCase()
      if (lower.endsWith('.bed')) newBed = f
      else if (lower.endsWith('.bim')) newBim = f
      else if (lower.endsWith('.fam')) newFam = f
    })

    setBedFile(newBed)
    setBimFile(newBim)
    setFamFile(newFam)
    setErrorMsg(null)
  }

  // Handler Reset File Genotipe
  const handleClearVcf = () => {
    setVcfFile(null)
    setFileRejection(null)
    setErrorMsg(null)
  }

  const handleClearPlink = () => {
    setBedFile(null)
    setBimFile(null)
    setFamFile(null)
    setFileRejection(null)
    setErrorMsg(null)
  }

  // Handler Upload Berkas Fenotipe (.csv) & Otomatis Deteksi Header Kolom
  const handleCsvSelect = async (file: File) => {
    setCsvFile(file)
    setFileRejection(null)
    setErrorMsg(null)

    const extracted = await extractCsvPhenotypeColumns(file)
    setPhenotypeColumns(extracted)
    if (extracted.length > 0) {
      setSelectedColumn(extracted[0])
    } else {
      setSelectedColumn('')
    }
  }

  const handleClearCsv = () => {
    setCsvFile(null)
    setPhenotypeColumns([])
    setSelectedColumn('')
    setFileRejection(null)
    setErrorMsg(null)
  }

  // Validasi Kesiapan Input: Genotipe (VCF atau BED/BIM/FAM lengkap) + CSV
  const isGenotypeReady = genotypeFormat === 'vcf' 
    ? Boolean(vcfFile) 
    : Boolean(bedFile && bimFile && famFile)

  const isReady = Boolean(isGenotypeReady && csvFile)

  // Handler Mulai Analisis -> Mengirim data ke POST /api/v1/upload di Backend
  const handleExecute = async () => {
    if (!isReady || !csvFile || isSubmitting) return

    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      const formData = new FormData()
      formData.append('csv_file', csvFile)

      if (genotypeFormat === 'vcf') {
        if (!vcfFile) return
        formData.append('vcf_file', vcfFile)
      } else {
        if (!bedFile || !bimFile || !famFile) return
        formData.append('bed_file', bedFile)
        formData.append('bim_file', bimFile)
        formData.append('fam_file', famFile)
      }

      formData.append('maf', String(maf))
      
      // Backend meminta float desimal (misal 0.95), sedangkan input UI dalam persen (95)
      const normalizedCallRateSnp = callRateSnp > 1 ? callRateSnp / 100 : callRateSnp
      const normalizedCallRateIndiv = callRateIndiv > 1 ? callRateIndiv / 100 : callRateIndiv
      
      // Kirim parameter call rate
      formData.append('call_rate', String(normalizedCallRateSnp || 0.95))
      formData.append('call_rate_snp', String(normalizedCallRateSnp))
      formData.append('call_rate_ind', String(normalizedCallRateIndiv || 0.90))
      formData.append('call_rate_indiv', String(normalizedCallRateIndiv))
      formData.append('num_pcs', String(pca))

      // Sertakan kolom fenotipe yang dipilih pengguna
      if (selectedColumn) {
        formData.append('pheno_name', selectedColumn)
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
    <div className="min-h-screen bg-slate-50/60 font-sans flex flex-col justify-between">
      <main className="pb-16">
        <PipelineNavbar />
        <div className="max-w-5xl mx-auto px-4 mt-4">
          <PipelineHeader currentStep={isReady ? 2 : 1} />

          {/* Pesan Error Jika Gagal Upload ke Backend */}
          {errorMsg && (
            <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2.5 animate-pop-out">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <div>
                <span className="font-bold">Gagal Memulai Analisis: </span>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Step 1: Upload Dataset Genomik & Klinis */}
          <UploadSection
            genotypeFormat={genotypeFormat}
            onGenotypeFormatChange={setGenotypeFormat}
            vcfFile={vcfFile}
            onVcfSelect={handleVcfSelect}
            onClearVcf={handleClearVcf}
            bedFile={bedFile}
            bimFile={bimFile}
            famFile={famFile}
            onPlinkFilesChange={handlePlinkFilesChange}
            onClearPlink={handleClearPlink}
            csvFile={csvFile}
            onCsvSelect={handleCsvSelect}
            onClearCsv={handleClearCsv}
            fileRejection={fileRejection}
            onClearRejection={() => setFileRejection(null)}
            onRejectFile={setFileRejection}
          />

          {/* Step 2: Pilih Kolom Fenotipe (z-30 agar dropdown melayang di atas Step 3) */}
          <div className="relative z-30">
            <ColumnSelect
              columns={phenotypeColumns}
              selectedColumn={selectedColumn}
              onSelectColumn={setSelectedColumn}
              isActive={isReady}
            />
          </div>

          {/* Step 3: Konfigurasi Parameter GWAS & Kontrol Kualitas */}
          <div className={`relative z-10 transition-all duration-300 transform ${
            !isReady 
              ? 'opacity-50 grayscale-20 scale-[0.99] pointer-events-none' 
              : 'opacity-100 scale-100'
          }`}>
            <ParameterConfig
              maf={maf}
              callRateSnp={callRateSnp}
              callRateIndiv={callRateIndiv}
              pca={pca}
              onMafChange={setMaf}
              onCallRateSnpChange={setCallRateSnp}
              onCallRateIndivChange={setCallRateIndiv}
              onPcaChange={setPca}
              isActive={isReady}
              stepNumber={3}
            />
          </div>

          {/* Bottom Execution Bar */}
          <div
            className={`rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 transition-all duration-300 animate-fade-in-up mt-5 ${
              isReady 
                ? 'bg-gradient-to-r from-sky-700 via-cyan-700 to-teal-700 text-white shadow-lg border border-cyan-500/30' 
                : 'bg-slate-100/90 text-slate-600 border border-slate-200 shadow-2xs'
            }`}
            style={{ animationDelay: '400ms' }}
          >
            <div className="flex items-center gap-3 pl-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 transition-all duration-300 ${
                  isReady ? 'bg-amber-400 text-slate-950 shadow-xs' : 'bg-slate-200 text-slate-500'
                }`}
              >
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${isReady ? 'text-slate-100' : 'text-slate-700'}`}>
                    Estimasi Waktu Komputasi:
                  </span>
                  {isReady && selectedColumn ? (
                    <span className="bg-white/20 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 animate-pop-out">
                      <Sparkles className="w-2.5 h-2.5" />
                      Target: {selectedColumn}
                    </span>
                  ) : !isReady ? (
                    <span className="text-[10px] text-slate-500 font-medium">(Lengkapi Step 1 &amp; 2 untuk mengaktifkan)</span>
                  ) : null}
                </div>
                <p className={`text-sm font-extrabold ${isReady ? 'text-white' : 'text-slate-700'}`}>
                  ~2 Menit 
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={!isReady || isSubmitting}
              onClick={handleExecute}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer ${
                isReady && !isSubmitting
                  ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-slate-950 shadow-md hover:shadow-lg hover:scale-102 active:scale-95 animate-gradient-btn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300/60'
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

      {/* Footer Konsisten */}
      <AppFooter />
    </div>
  )
}
