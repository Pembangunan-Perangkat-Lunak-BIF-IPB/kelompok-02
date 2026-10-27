import React from 'react'
import { Upload, FileText } from 'lucide-react'

interface UploadSectionProps {
  vcfFile: File | null
  csvFile: File | null
  onVcfChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onCsvChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onUseSampleData: () => void
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  vcfFile,
  csvFile,
  onVcfChange,
  onCsvChange,
  onUseSampleData
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm mb-4">
      <div className="flex items-center gap-2 mb-3">
        {/* Nomor Step dengan Gradasi Cyan-Sky */}
        <span className="w-6 h-6 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-teal-400 text-white-950 font-bold text-[10px] flex items-center justify-center shadow-md animate-gradient-btn">
          1
        </span>
        <h2 className="text-sm font-bold text-slate-900">Unggah Dataset Genomik & Klinis</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="relative flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-200 hover:border-cyan-400 rounded-xl cursor-pointer bg-slate-50/50 transition-all">
          <input type="file" accept=".vcf,.vcf.gz" onChange={onVcfChange} className="hidden" />
          {/* Ubah ikon background menjadi nuansa cyan */}
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mb-1.5">
            <Upload className="w-4 h-4" />
          </div>

          {vcfFile ? (
            <div className="text-center">
              <p className="text-[11px] font-bold text-slate-800">
                {vcfFile.name} <span className="bg-slate-200 text-slate-700 text-[9px] px-1 py-0.5 rounded font-semibold">.VCF</span>
              </p>
              <p className="text-[10px] text-emerald-600 font-bold mt-1">File berhasil di upload</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-[11px] font-bold text-slate-700">
                Upload Data Genotipe <span className="bg-slate-200 text-slate-700 text-[9px] px-1.5 py-0.5 rounded">.VCF/VCF.GZ</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Tarik & lepas berkas <span className="font-semibold text-slate-600">.vcf</span> atau klik</p>
              <span className="text-[9px] text-slate-400 mt-2 block">Maksimal 300MB per berkas</span>
            </div>
          )}
        </label>

        <label className="relative flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-200 hover:border-cyan-400 rounded-xl cursor-pointer bg-slate-50/50 transition-all">
          <input type="file" accept=".csv" onChange={onCsvChange} className="hidden" />
          {/* Ubah ikon background menjadi nuansa cyan */}
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mb-1.5">
            <FileText className="w-4 h-4" />
          </div>

          {csvFile ? (
            <div className="text-center">
              <p className="text-[11px] font-bold text-slate-800">
                {csvFile.name} <span className="bg-slate-200 text-slate-700 text-[9px] px-1 py-0.5 rounded font-semibold">.CSV</span>
              </p>
              <p className="text-[10px] text-emerald-600 font-bold mt-1">File berhasil di upload</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-[11px] font-bold text-slate-700">
                Upload Data Fenotipe <span className="bg-slate-200 text-slate-700 text-[9px] px-1.5 py-0.5 rounded">.CSV</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Tarik & lepas berkas <span className="font-semibold text-slate-600">.csv</span> atau klik</p>
              <span className="text-[9px] text-slate-400 mt-2 block">Wajib: FID, IID, Fenotipe</span>
            </div>
          )}
        </label>
      </div>

      <div className="mt-3 bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex items-center justify-between text-[11px] text-slate-600">
        <div className="flex items-center gap-1.5">
          <span className="text-amber-600 font-bold">🧪 Contoh Uji:</span>
          <span className="text-slate-500 font-mono text-[10px]">cohort_indonesia_chr22.vcf.gz & lipid_pheno.csv</span>
        </div>
        <button 
          onClick={onUseSampleData}
          type="button" 
          className="text-amber-600 hover:text-cyan-700 font-bold underline cursor-pointer text-[11px]"
        >
          Gunakan Sample
        </button>
      </div>
    </div>
  )
}