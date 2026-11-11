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
      className={`bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm mb-4 transition-all duration-300 ${
        !isActive ? 'opacity-50 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Judul Step 2 */}
      <div className="flex items-center gap-2 mb-3">
        <span className="w-6 h-6 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-teal-400 text-slate-950 font-bold text-[10px] flex items-center justify-center shadow-md animate-gradient-btn">
          2
        </span>
        <h2 className="text-sm font-bold text-slate-900">Pilih Kolom Fenotipe</h2>
      </div>

      {/* 1 Shape Elemen Dropdown Sesuai Contoh */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          disabled={!isActive || columns.length === 0}
          onClick={() => setIsOpen((prev) => !prev)}
          className={`w-full bg-slate-50/70 hover:bg-white border rounded-xl px-4 py-3 text-left flex items-center justify-between transition-all cursor-pointer text-xs font-semibold text-slate-800 shadow-2xs ${
            isOpen
              ? 'border-amber-500 ring-2 ring-amber-200/50 bg-white'
              : 'border-slate-200 hover:border-amber-400'
          }`}
        >
          <span>
            {selectedColumn || (columns.length > 0 ? 'Pilih kolom fenotipe...' : 'Belum ada kolom terdeteksi')}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
              isOpen ? 'rotate-180 text-amber-600' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu Options */}
        {isOpen && columns.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-30 overflow-hidden py-1 max-h-56 overflow-y-auto">
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
                  className={`w-full text-left px-4 py-2.5 text-xs transition-colors cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-500 text-white font-bold'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span>{col}</span>
                  {isSelected && <Check className="w-4 h-4 stroke-[2.5]" />}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
