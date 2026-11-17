import React, { useState } from 'react'
import { Upload, FileText, Check, X } from 'lucide-react'

export const GENOTYPE_FORMATS = [
  { id: '.vcf', label: '.VCF / .VCF.GZ', accept: '.vcf,.vcf.gz', badge: 'VCF', desc: 'Variant Call Format' },
  { id: '.bed', label: '.BED', accept: '.bed', badge: 'BED', desc: 'PLINK Binary Genotype' },
  { id: '.bim', label: '.BIM', accept: '.bim', badge: 'BIM', desc: 'PLINK Binary Marker Info' },
  { id: '.fam', label: '.FAM', accept: '.fam', badge: 'FAM', desc: 'PLINK Binary Sample Pedigree' },
]

interface UploadSectionProps {
  vcfFile: File | null
  csvFile: File | null
  onVcfChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onCsvChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onUseSampleData?: () => void
  onClearVcf?: () => void
  onClearCsv?: () => void
  selectedFormat?: string
  onFormatChange?: (format: string) => void
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  vcfFile,
  csvFile,
  onVcfChange,
  onCsvChange,
  onClearVcf,
  onClearCsv,
  selectedFormat,
  onFormatChange
}) => {
  const [internalFormat, setInternalFormat] = useState<string>('.vcf')
  const activeFormat = selectedFormat ?? internalFormat

  const handleSelectFormat = (fmt: string) => {
    setInternalFormat(fmt)
    if (onFormatChange) onFormatChange(fmt)
  }

  const currentFmtConfig = GENOTYPE_FORMATS.find(f => f.id === activeFormat) || GENOTYPE_FORMATS[0]
  const uploadedExt = vcfFile 
    ? (vcfFile.name.endsWith('.vcf.gz') ? 'VCF.GZ' : vcfFile.name.split('.').pop()?.toUpperCase() || currentFmtConfig.badge)
    : currentFmtConfig.badge

  return (
    <div 
      className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs mb-5 animate-fade-in-up"
      style={{ animationDelay: '160ms' }}
    >
      <div className="flex items-center gap-2 mb-3.5">
        <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-extrabold text-[11px] flex items-center justify-center shadow-xs">
          1
        </span>
        <h2 className="text-sm font-bold text-slate-900 tracking-tight">Unggah Dataset Genomik & Klinis</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Genotype Box */}
        <label className={`relative flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 group active:scale-[0.99] ${
          vcfFile 
            ? 'border-emerald-300 bg-emerald-50/20 hover:border-emerald-400' 
            : 'border-slate-200 hover:border-cyan-400 bg-slate-50/50 hover:bg-cyan-50/20'
        }`}>
          <input type="file" accept={currentFmtConfig.accept} onChange={onVcfChange} className="hidden" />
          <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-2 transition-transform duration-200 group-hover:scale-105 ${
            vcfFile ? 'bg-emerald-100 text-emerald-700 shadow-xs' : 'bg-amber-100/80 text-amber-700'
          }`}>
            {vcfFile ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Upload className="w-4 h-4" />}
          </div>

          {vcfFile ? (
            <div className="text-center animate-pop-out">
              <p className="text-xs font-bold text-slate-800 break-all max-w-[260px]">
                {vcfFile.name} <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">.{uploadedExt}</span>
              </p>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1 inline-flex items-center gap-1">
                <span>File siap dianalisis</span>
              </p>
              {onClearVcf && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
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
          ) : (
            <div className="text-center">
              <p className="text-xs font-bold text-slate-700">
                Upload Data Genotipe <span className="bg-amber-100 text-amber-900 border border-amber-200 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">{currentFmtConfig.label}</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Tarik & lepas berkas <span className="font-semibold text-slate-600">{currentFmtConfig.id}</span> atau klik</p>
              <span className="text-[10px] text-slate-500 mt-2 block">Maksimal 300MB per berkas</span>
            </div>
          )}
        </label>

        {/* Phenotype CSV Box */}
        <label className={`relative flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 group active:scale-[0.99] ${
          csvFile 
            ? 'border-emerald-300 bg-emerald-50/20 hover:border-emerald-400' 
            : 'border-slate-200 hover:border-cyan-400 bg-slate-50/50 hover:bg-cyan-50/20'
        }`}>
          <input type="file" accept=".csv" onChange={onCsvChange} className="hidden" />
          <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-2 transition-transform duration-200 group-hover:scale-105 ${
            csvFile ? 'bg-emerald-100 text-emerald-700 shadow-xs' : 'bg-amber-100/80 text-amber-700'
          }`}>
            {csvFile ? <Check className="w-4 h-4 stroke-[2.5]" /> : <FileText className="w-4 h-4" />}
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
          ) : (
            <div className="text-center">
              <p className="text-xs font-bold text-slate-700">
                Upload Data Fenotipe <span className="bg-slate-200 text-slate-700 text-[9px] px-1.5 py-0.5 rounded font-mono">.CSV</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Tarik & lepas berkas <span className="font-semibold text-slate-600">.csv</span> atau klik</p>
              <span className="text-[10px] text-slate-500 mt-2 block">Wajib: FID, IID, Fenotipe</span>
            </div>
          )}
        </label>
      </div>

      {/* Pilihan Format Berkas Genotipe */}
      <div className="mt-3.5 bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-amber-800 font-bold bg-amber-100/90 border border-amber-200/80 px-2.5 py-0.5 rounded text-[11px] shrink-0">
            Pilihan Format File:
          </span>
          <span className="text-slate-600 font-medium text-xs">
            Format genotipe yang didukung untuk GWAS:
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {GENOTYPE_FORMATS.map((fmt) => {
            const isSelected = activeFormat === fmt.id
            return (
              <button
                key={fmt.id}
                type="button"
                onClick={() => handleSelectFormat(fmt.id)}
                title={fmt.desc}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer active:scale-95 ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950 border border-amber-400 shadow-xs'
                    : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 hover:bg-slate-100/80 shadow-2xs'
                }`}
              >
                {fmt.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
