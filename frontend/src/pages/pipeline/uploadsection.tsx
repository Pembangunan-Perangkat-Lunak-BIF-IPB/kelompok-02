import React, { useState, useRef } from 'react'
import { Upload, FileText, Check, X, AlertCircle, AlertTriangle, XCircle } from 'lucide-react'

export type GenotypeFormat = 'vcf' | 'plink'

export interface FileRejectionNotice {
  type: 'vcf' | 'plink' | 'csv'
  filename: string
  message: string
}

interface UploadSectionProps {
  genotypeFormat: GenotypeFormat
  onGenotypeFormatChange: (format: GenotypeFormat) => void

  // Single VCF Mode
  vcfFile: File | null
  onVcfSelect: (file: File) => void
  onClearVcf?: () => void

  // PLINK Triplet Mode (.bed, .bim, .fam)
  bedFile: File | null
  bimFile: File | null
  famFile: File | null
  onPlinkFilesChange: (files: FileList | File[]) => void
  onClearPlink?: () => void

  // Phenotype CSV
  csvFile: File | null
  onCsvSelect: (file: File) => void
  onClearCsv?: () => void

  // File Rejection Notice
  fileRejection: FileRejectionNotice | null
  onClearRejection: () => void
  onRejectFile: (rejection: FileRejectionNotice) => void
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  genotypeFormat,
  onGenotypeFormatChange,
  vcfFile,
  onVcfSelect,
  onClearVcf,
  bedFile,
  bimFile,
  famFile,
  onPlinkFilesChange,
  onClearPlink,
  csvFile,
  onCsvSelect,
  onClearCsv,
  fileRejection,
  onClearRejection,
  onRejectFile,
}) => {
  const [dragOverBox, setDragOverBox] = useState<'vcf' | 'plink' | 'csv' | null>(null)
  
  const vcfInputRef = useRef<HTMLInputElement>(null)
  const plinkInputRef = useRef<HTMLInputElement>(null)
  const csvInputRef = useRef<HTMLInputElement>(null)

  const isPlinkComplete = Boolean(bedFile && bimFile && famFile)
  const plinkUploadedCount = (bedFile ? 1 : 0) + (bimFile ? 1 : 0) + (famFile ? 1 : 0)

  // Validasi & Proses Berkas VCF (.vcf / .vcf.gz)
  const validateAndProcessVcf = (file: File) => {
    const lower = file.name.toLowerCase()
    if (!lower.endsWith('.vcf') && !lower.endsWith('.vcf.gz')) {
      if (vcfInputRef.current) vcfInputRef.current.value = ''
      onRejectFile({
        type: 'vcf',
        filename: file.name,
        message: `Format berkas "${file.name}" ditolak. Sistem hanya menerima berkas genotipe berformat .vcf atau .vcf.gz.`,
      })
      return
    }
    onClearRejection()
    onVcfSelect(file)
  }

  // Validasi & Proses Berkas PLINK Triplet (.bed, .bim, .fam)
  const validateAndProcessPlink = (files: FileList | File[]) => {
    const fileArr = Array.from(files)
    const validFiles: File[] = []
    const invalidNames: string[] = []

    fileArr.forEach((f) => {
      const lower = f.name.toLowerCase()
      if (lower.endsWith('.bed') || lower.endsWith('.bim') || lower.endsWith('.fam')) {
        validFiles.push(f)
      } else {
        invalidNames.push(f.name)
      }
    })

    if (invalidNames.length > 0) {
      if (plinkInputRef.current) plinkInputRef.current.value = ''
      onRejectFile({
        type: 'plink',
        filename: invalidNames.join(', '),
        message: `Berkas "${invalidNames.join(', ')}" ditolak. Untuk format PLINK biner, sistem hanya menerima berkas berekstensi .bed, .bim, dan .fam sebagai satu kesatuan.`,
      })
      if (validFiles.length === 0) {
        return
      }
    } else {
      onClearRejection()
    }

    if (validFiles.length > 0) {
      onPlinkFilesChange(validFiles)
    }
  }

  // Validasi & Proses Berkas Fenotipe CSV (.csv saja, tolak .txt dll)
  const validateAndProcessCsv = (file: File) => {
    const lower = file.name.toLowerCase()
    if (!lower.endsWith('.csv')) {
      if (csvInputRef.current) csvInputRef.current.value = ''
      onRejectFile({
        type: 'csv',
        filename: file.name,
        message: `Format berkas "${file.name}" ditolak. Berkas fenotipe harus berekstensi .csv (misalnya data_klinis.csv). Format lain seperti .txt, .xlsx, atau .tsv tidak didukung.`,
      })
      return
    }
    onClearRejection()
    onCsvSelect(file)
  }

  // Handlers untuk Drag & Drop
  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>, type: 'vcf' | 'plink' | 'csv') => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverBox(type)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverBox(null)
  }

  const handleDropVcf = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverBox(null)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessVcf(e.dataTransfer.files[0])
    }
  }

  const handleDropPlink = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverBox(null)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessPlink(e.dataTransfer.files)
    }
  }

  const handleDropCsv = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverBox(null)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessCsv(e.dataTransfer.files[0])
    }
  }

  const isVcfRejected = fileRejection?.type === 'vcf' && !vcfFile
  const isPlinkRejected = fileRejection?.type === 'plink' && !isPlinkComplete
  const isCsvRejected = fileRejection?.type === 'csv' && !csvFile

  return (
    <div 
      className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs mb-5 animate-fade-in-up"
      style={{ animationDelay: '160ms' }}
    >
      {/* Header Section dengan Judul & Dropdown Format Genotipe */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-extrabold text-[11px] flex items-center justify-center shadow-xs">
            1
          </span>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">Unggah Dataset Genomik &amp; Klinis</h2>
        </div>

        {/* Dropdown Kecil Pemilihan Format Genotipe */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/90 rounded-xl px-2.5 py-1.5 shadow-2xs self-start sm:self-auto">
          <span className="text-[11px] font-semibold text-slate-500 shrink-0">
            Format Genotipe:
          </span>
          <select
            value={genotypeFormat}
            onChange={(e) => {
              onGenotypeFormatChange(e.target.value as GenotypeFormat)
              onClearRejection()
            }}
            className="bg-white border border-slate-300 text-slate-900 text-xs font-bold rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer transition-all shadow-xs"
          >
            <option value="vcf">.vcf /.vcf.gz </option>
            <option value="plink">.bed / .bim / .fam (satu kesatuan)</option>
          </select>
        </div>
      </div>

      {/* Banner Notifikasi Penolakan Berkas (Format Tidak Sesuai) */}
      {fileRejection && (
        <div className="mb-4 p-3.5 rounded-xl bg-red-50/90 border border-red-200 text-red-900 text-xs flex items-start justify-between gap-3 animate-shake shadow-xs">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-red-900 uppercase tracking-wide text-[10px] bg-red-200/80 px-2 py-0.5 rounded">
                  Format Berkas Ditolak
                </span>
                <span className="text-[11px] font-bold text-red-800 font-mono">
                  {fileRejection.filename}
                </span>
              </div>
              <p className="text-red-700 mt-1 font-medium leading-relaxed">
                {fileRejection.message}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClearRejection}
            className="rounded-lg p-1 text-red-400 hover:bg-red-100 hover:text-red-700 transition-colors cursor-pointer shrink-0"
            title="Tutup pesan peringatan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Genotype Box */}
        {genotypeFormat === 'vcf' ? (
          /* Mode 1: VCF / VCF.GZ */
          <label 
            onDragOver={(e) => handleDragOver(e, 'vcf')}
            onDragLeave={handleDragLeave}
            onDrop={handleDropVcf}
            className={`relative flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 group active:scale-[0.99] ${
              vcfFile 
                ? 'border-emerald-300 bg-emerald-50/20 hover:border-emerald-400' 
                : isVcfRejected
                ? 'border-red-400 bg-red-50/40 ring-4 ring-red-400/15 animate-shake'
                : dragOverBox === 'vcf'
                ? 'border-amber-400 bg-amber-50/40 ring-4 ring-amber-400/20 scale-[1.01]'
                : 'border-slate-200 hover:border-cyan-400 bg-slate-50/50 hover:bg-cyan-50/20'
            }`}
          >
            <input 
              ref={vcfInputRef}
              type="file" 
              accept=".vcf,.vcf.gz" 
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  validateAndProcessVcf(e.target.files[0])
                }
              }} 
              className="hidden" 
            />

            <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-2 transition-transform duration-200 group-hover:scale-105 ${
              vcfFile 
                ? 'bg-emerald-100 text-emerald-700 shadow-xs' 
                : isVcfRejected
                ? 'bg-red-100 text-red-700 shadow-xs'
                : 'bg-amber-100/80 text-amber-700'
            }`}>
              {vcfFile ? (
                <Check className="w-4 h-4 stroke-[2.5]" />
              ) : isVcfRejected ? (
                <XCircle className="w-4 h-4 stroke-[2.5]" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
            </div>

            {vcfFile ? (
              <div className="text-center animate-pop-out">
                <p className="text-xs font-bold text-slate-800 break-all max-w-[260px]">
                  {vcfFile.name}{' '}
                  <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">
                    {vcfFile.name.toLowerCase().endsWith('.gz') ? '.VCF.GZ' : '.VCF'}
                  </span>
                </p>
                <p className="text-[11px] text-emerald-600 font-semibold mt-1 inline-flex items-center gap-1">
                  <span>File VCF siap dianalisis</span>
                </p>
                {onClearVcf && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (vcfInputRef.current) vcfInputRef.current.value = ''
                        onClearVcf()
                      }}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-red-600 bg-white/80 border border-slate-200 px-2 py-0.5 rounded-md shadow-2xs hover:border-red-200 transition-colors cursor-pointer"
                    >
                      <X className="w-2.5 h-2.5" />
                      <span>Hapus / Ganti</span>
                    </button>
                  </div>
                )}
              </div>
            ) : isVcfRejected ? (
              <div className="text-center">
                <p className="text-xs font-bold text-red-800">
                  Format Berkas Genotipe Ditolak
                </p>
                <p className="text-[11px] text-red-600 mt-0.5 font-medium">
                  Berkas bukan format .vcf atau .vcf.gz yang valid
                </p>
                <span className="inline-block mt-2 bg-red-100 text-red-800 border border-red-300 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                  Wajib Berformat .VCF / .VCF.GZ
                </span>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-xs font-bold text-slate-700">
                  Upload Genotipe <span className="bg-amber-100 text-amber-900 border border-amber-200 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">.VCF / .VCF.GZ</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">Tarik &amp; lepas berkas <span className="font-semibold text-slate-600">.vcf / .vcf.gz</span> atau klik</p>
                <span className="text-[10px] text-slate-400 mt-2 block">Variant Call Format standar (Maks. 300MB)</span>
              </div>
            )}
          </label>
        ) : (
          /* Mode 2: BED / BIM / FAM Triplet (Satu Kesatuan) */
          <label 
            onDragOver={(e) => handleDragOver(e, 'plink')}
            onDragLeave={handleDragLeave}
            onDrop={handleDropPlink}
            className={`relative flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 group active:scale-[0.99] ${
              isPlinkComplete 
                ? 'border-emerald-300 bg-emerald-50/20 hover:border-emerald-400' 
                : isPlinkRejected
                ? 'border-red-400 bg-red-50/40 ring-4 ring-red-400/15 animate-shake'
                : dragOverBox === 'plink'
                ? 'border-amber-400 bg-amber-50/40 ring-4 ring-amber-400/20 scale-[1.01]'
                : plinkUploadedCount > 0
                ? 'border-amber-300 bg-amber-50/20 hover:border-amber-400'
                : 'border-slate-200 hover:border-cyan-400 bg-slate-50/50 hover:bg-cyan-50/20'
            }`}
          >
            <input 
              ref={plinkInputRef}
              type="file" 
              accept=".bed,.bim,.fam" 
              multiple 
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  validateAndProcessPlink(e.target.files)
                }
              }} 
              className="hidden" 
            />
            <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-2 transition-transform duration-200 group-hover:scale-105 ${
              isPlinkComplete 
                ? 'bg-emerald-100 text-emerald-700 shadow-xs' 
                : isPlinkRejected
                ? 'bg-red-100 text-red-700 shadow-xs'
                : plinkUploadedCount > 0 
                ? 'bg-amber-100 text-amber-800 shadow-xs' 
                : 'bg-amber-100/80 text-amber-700'
            }`}>
              {isPlinkComplete ? (
                <Check className="w-4 h-4 stroke-[2.5]" />
              ) : isPlinkRejected ? (
                <XCircle className="w-4 h-4 stroke-[2.5]" />
              ) : plinkUploadedCount > 0 ? (
                <AlertCircle className="w-4 h-4 stroke-[2.5]" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
            </div>

            {isPlinkComplete ? (
              <div className="text-center animate-pop-out w-full max-w-[280px]">
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mb-1.5">
                  Triplet PLINK Lengkap (3/3)
                </span>
                <div className="space-y-1 text-left bg-white/80 p-2 rounded-lg border border-emerald-200/60 text-[11px] font-mono text-slate-700">
                  <div className="truncate"><span className="text-emerald-600 font-bold">.BED:</span> {bedFile?.name}</div>
                  <div className="truncate"><span className="text-emerald-600 font-bold">.BIM:</span> {bimFile?.name}</div>
                  <div className="truncate"><span className="text-emerald-600 font-bold">.FAM:</span> {famFile?.name}</div>
                </div>
                <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                  Berkas PLINK biner siap dianalisis
                </p>
                {onClearPlink && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (plinkInputRef.current) plinkInputRef.current.value = ''
                        onClearPlink()
                      }}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-red-600 bg-white/80 border border-slate-200 px-2 py-0.5 rounded-md shadow-2xs hover:border-red-200 transition-colors cursor-pointer"
                    >
                      <X className="w-2.5 h-2.5" />
                      <span>Hapus / Ganti Triplet</span>
                    </button>
                  </div>
                )}
              </div>
            ) : isPlinkRejected ? (
              <div className="text-center w-full max-w-[280px]">
                <p className="text-xs font-bold text-red-800">
                  Format Berkas PLINK Ditolak
                </p>
                <p className="text-[11px] text-red-600 mt-0.5 font-medium">
                  Berkas yang diunggah bukan format .bed, .bim, atau .fam
                </p>
                <span className="inline-block mt-2 bg-red-100 text-red-800 border border-red-300 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                  Wajib Triplet .bed + .bim + .fam
                </span>
              </div>
            ) : (
              <div className="text-center w-full max-w-[280px]">
                <p className="text-xs font-bold text-slate-700">
                  Upload Genotipe <span className="bg-amber-100 text-amber-900 border border-amber-200 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">BED / BIM / FAM</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tarik 3 berkas sekaligus atau klik untuk memilih
                </p>

                {/* Status Berkas yang Sudah Diunggah */}
                <div className="mt-2.5 flex items-center justify-center gap-1.5">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    bedFile 
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold' 
                      : 'bg-slate-100 text-slate-400 border-slate-200'
                  }`}>
                    {bedFile ? '✓ .bed' : '.bed'}
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    bimFile 
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold' 
                      : 'bg-slate-100 text-slate-400 border-slate-200'
                  }`}>
                    {bimFile ? '✓ .bim' : '.bim'}
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    famFile 
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold' 
                      : 'bg-slate-100 text-slate-400 border-slate-200'
                  }`}>
                    {famFile ? '✓ .fam' : '.fam'}
                  </span>
                </div>

                <span className="text-[10px] text-amber-700/80 font-medium mt-2 block">
                  Ketiga berkas biner PLINK wajib diunggah bersamaan
                </span>
              </div>
            )}
          </label>
        )}

        {/* Phenotype CSV Box */}
        <label 
          onDragOver={(e) => handleDragOver(e, 'csv')}
          onDragLeave={handleDragLeave}
          onDrop={handleDropCsv}
          className={`relative flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 group active:scale-[0.99] ${
            csvFile 
              ? 'border-emerald-300 bg-emerald-50/20 hover:border-emerald-400' 
              : isCsvRejected
              ? 'border-red-400 bg-red-50/40 ring-4 ring-red-400/15 animate-shake'
              : dragOverBox === 'csv'
              ? 'border-amber-400 bg-amber-50/40 ring-4 ring-amber-400/20 scale-[1.01]'
              : 'border-slate-200 hover:border-cyan-400 bg-slate-50/50 hover:bg-cyan-50/20'
          }`}
        >
          <input 
            ref={csvInputRef}
            type="file" 
            accept=".csv" 
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                validateAndProcessCsv(e.target.files[0])
              }
            }} 
            className="hidden" 
          />

          <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-2 transition-transform duration-200 group-hover:scale-105 ${
            csvFile 
              ? 'bg-emerald-100 text-emerald-700 shadow-xs' 
              : isCsvRejected
              ? 'bg-red-100 text-red-700 shadow-xs'
              : 'bg-amber-100/80 text-amber-700'
          }`}>
            {csvFile ? (
              <Check className="w-4 h-4 stroke-[2.5]" />
            ) : isCsvRejected ? (
              <XCircle className="w-4 h-4 stroke-[2.5]" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
          </div>

          {csvFile ? (
            <div className="text-center animate-pop-out">
              <p className="text-xs font-bold text-slate-800 break-all max-w-[260px]">
                {csvFile.name} <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">.CSV</span>
              </p>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1 inline-flex items-center gap-1">
                <span>File siap dianalisis</span>
              </p>
              {onClearCsv && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (csvInputRef.current) csvInputRef.current.value = ''
                      onClearCsv()
                    }}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-red-600 bg-white/80 border border-slate-200 px-2 py-0.5 rounded-md shadow-2xs hover:border-red-200 transition-colors cursor-pointer"
                  >
                    <X className="w-2.5 h-2.5" />
                    <span>Hapus / Ganti</span>
                  </button>
                </div>
              )}
            </div>
          ) : isCsvRejected ? (
            <div className="text-center">
              <p className="text-xs font-bold text-red-800">
                Format Berkas Fenotipe Ditolak
              </p>
              <p className="text-[11px] text-red-600 mt-0.5 font-medium">
                Berkas bukan format .csv (misal .txt atau .xlsx ditolak)
              </p>
              <span className="inline-block mt-2 bg-red-100 text-red-800 border border-red-300 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                Hanya Menerima Berkas .CSV
              </span>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-xs font-bold text-slate-700">
                Upload Data Fenotipe <span className="bg-slate-200 text-slate-700 text-[9px] px-1.5 py-0.5 rounded font-mono">.CSV</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Tarik &amp; lepas berkas <span className="font-semibold text-slate-600">.csv</span> atau klik</p>
              <span className="text-[10px] text-slate-500 mt-2 block">Wajib memuat kolom ID dan nilai fenotipe</span>
            </div>
          )}
        </label>
      </div>
    </div>
  )
}
