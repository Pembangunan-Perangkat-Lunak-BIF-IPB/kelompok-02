import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

interface ColumnSelectProps {
  columns: string[]
  selectedColumn: string
  onSelectColumn: (col: string) => void
  isActive: boolean
}

export const ColumnSelect: React.FC<ColumnSelectProps> = ({
  columns,
  selectedColumn,
  onSelectColumn,
  isActive
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Menutup dropdown jika user klik di luar area komponen
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div
      className={`bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs mb-5 transition-all duration-300 animate-fade-in-up relative ${
        isOpen ? 'z-40' : 'z-20'
      } ${
        !isActive 
          ? 'opacity-50 grayscale-20 scale-[0.99] pointer-events-none' 
          : 'opacity-100 scale-100'
      }`}
      style={{ animationDelay: '240ms' }}
    >
      {/* Judul Step 2 */}
      <div className="flex items-center gap-2 mb-3.5">
        <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-extrabold text-[11px] flex items-center justify-center shadow-xs">
          2
        </span>
        <h2 className="text-sm font-bold text-slate-900 tracking-tight">Pilih Kolom Fenotipe</h2>
      </div>

      {/* 1 Shape Elemen Dropdown Sesuai Contoh */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          disabled={!isActive || columns.length === 0}
          onClick={() => setIsOpen((prev) => !prev)}
          className={`w-full bg-slate-50/70 hover:bg-white border rounded-xl px-4 py-3 text-left flex items-center justify-between transition-all duration-200 cursor-pointer text-xs font-semibold shadow-2xs active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
            isOpen
              ? 'border-amber-500 ring-2 ring-amber-200/50 bg-white text-slate-900'
              : 'border-slate-200 hover:border-amber-400 text-slate-800'
          }`}
        >
          <div className="flex items-center gap-2 truncate pr-2">
            {selectedColumn ? (
              <>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-mono shrink-0">
                  Target:
                </span>
                <span className="font-bold text-slate-900 truncate">{selectedColumn}</span>
              </>
            ) : (
              <span className="text-slate-500">
                {columns.length > 0 ? 'Pilih kolom fenotipe...' : 'Belum ada kolom terdeteksi'}
              </span>
            )}
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${
              isOpen ? 'rotate-180 text-amber-600' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu Options dengan z-50 dan shadow-2xl agar tampil di atas elemen berikutnya */}
        {isOpen && columns.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden py-1 max-h-60 overflow-y-auto animate-dropdown">
            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span>Daftar Kolom Fenotipe</span>
              <span>{columns.length} Terdeteksi</span>
            </div>
            {columns.map((col) => {
              const isSelected = selectedColumn === col
              return (
                <button
                  key={col}
                  type="button"
                  onClick={() => {
                    onSelectColumn(col)
                    setIsOpen(false)
                  }}
                  className={`w-full text-left px-4 py-2.5 text-xs transition-colors duration-150 cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-500 text-white font-bold'
                      : 'text-slate-700 hover:bg-amber-50 hover:text-amber-950'
                  }`}
                >
                  <span className="truncate pr-2 font-medium">{col}</span>
                  {isSelected && <Check className="w-4 h-4 stroke-[2.5] shrink-0" />}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
