import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Download,
  Copy,
  Check,
  ChevronRight,
  RotateCcw,
  Table as TableIcon,
  BarChart3,
  Search,
  AlertCircle,
  Eye,
  X,
  Sparkles,
  Rocket,
} from 'lucide-react';
import apiClient, { API_BASE_URL } from '../api/client';
import { StatusNavbar } from './statusanalisis/StatusNavbar';
import { StatusFooter } from './statusanalisis/StatusFooter';

interface TopSnp {
  snp_id: string;
  chrom: string | number;
  pos: number;
  effect_allele: string;
  other_allele: string;
  effect?: number;
  p_value: number;
}

interface ResultsResponse {
  result_id: string;
  status: string;
  summary: {
    top_snps: TopSnp[];
  };
  downloads: {
    summary_csv: string;
    raw_tsv: string;
    manhattan_png: string;
    qq_png: string;
    report_pdf: string;
  };
}

export default function ResultPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  // Resolusi ID murni dari URL param atau localStorage (tanpa template dummy)
  const cleanJobId = (jobId || localStorage.getItem('last_gwas_result_id') || '').trim().replace(/^#/, '');
  const hasJob = Boolean(cleanJobId && cleanJobId !== 'sample');

  // States
  const [data, setData] = useState<ResultsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(hasJob);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewImage, setPreviewImage] = useState<{ src: string; title: string } | null>(null);

  // Search Bar State untuk melacak ID lain
  const [searchIdInput, setSearchIdInput] = useState('');

  useEffect(() => {
    if (!hasJob || !cleanJobId) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get<ResultsResponse>(`/api/v1/jobs/${cleanJobId}/results`);
        if (!isMounted) return;
        setData(response.data);
      } catch (err: any) {
        if (!isMounted) return;
        const msg = err.response?.data?.detail || 'Gagal memuat hasil analisis dari server Backend.';
        setError(msg);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchResults();

    return () => {
      isMounted = false;
    };
  }, [cleanJobId, hasJob]);

  const handleCopyId = () => {
    if (!cleanJobId) return;
    navigator.clipboard.writeText(`#${cleanJobId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchIdInput.trim()) return;
    const clean = searchIdInput.trim().replace(/^#/, '');
    navigate(`/result/${clean}`);
  };

  const snpList = data?.summary?.top_snps || [];
  const filteredSnps = snpList.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      (s.snp_id || '').toLowerCase().includes(q) ||
      String(s.chrom).toLowerCase().includes(q) ||
      String(s.pos).includes(q)
    );
  });

  const manhattanUrl = cleanJobId
    ? `${API_BASE_URL}/api/v1/jobs/${cleanJobId}/download/manhattan_png`
    : '';

  const qqUrl = cleanJobId
    ? `${API_BASE_URL}/api/v1/jobs/${cleanJobId}/download/qq_png`
    : '';

  const formatPValue = (p: number) => {
    if (typeof p !== 'number') return String(p);
    if (p < 0.0001) {
      return p.toExponential(2);
    }
    return p.toFixed(5);
  };

  return (
    <main className="min-h-screen bg-slate-50/60 font-sans flex flex-col justify-between">
      <div>
        {/* Navbar */}
        <StatusNavbar />

        {/* Modal Preview Gambar Plot */}
        {previewImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm animate-fade-in"
            onClick={() => setPreviewImage(null)}
          >
            <div
              className="relative max-w-5xl w-full bg-white rounded-3xl p-6 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">{previewImage.title}</h3>
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="py-4 flex justify-center bg-slate-50 rounded-2xl mt-4">
                <img
                  src={previewImage.src}
                  alt={previewImage.title}
                  className="max-h-[70vh] w-auto object-contain rounded-xl shadow-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* Content Container */}
        <div className="mx-auto max-w-5xl px-4 mt-6">
          {/* Breadcrumb & Title */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Link to="/pipeline" className="hover:text-cyan-700 transition-colors">
                  Pipeline Komputasi
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <Link to={hasJob ? `/status/${cleanJobId}` : '/status'} className="hover:text-cyan-700 transition-colors">
                  Status
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-cyan-600 font-semibold">Hasil Analisis</span>
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Laporan Hasil Analisis GWAS
                </h1>
                {data && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                    <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                    Selesai
                  </span>
                )}
              </div>
            </div>

            {/* Tombol Buat Analisis Baru */}
            <Link
              to="/pipeline"
              className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all w-fit"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-600" />
              <span>Analisis Baru</span>
            </Link>
          </div>

          {/* Skenario 1: Belum Ada Analisis yang Dipilih/Dijalankan */}
          {!hasJob && (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 text-center shadow-xs my-8 animate-fade-in">
              <div className="mx-auto w-16 h-16 rounded-full bg-sky-50 flex items-center justify-center text-cyan-600 mb-4">
                <BarChart3 className="w-8 h-8" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Belum Ada Hasil Analisis yang Tersedia
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
                Halaman ini akan menampilkan Manhattan Plot, QQ Plot, dan Top 10 SNP Signifikan setelah Anda menjalankan proses analisis GWAS dari menu Pipeline.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  to="/pipeline"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-sky-500 to-cyan-400 px-6 py-3 text-xs sm:text-sm font-bold text-slate-950 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Rocket className="w-4 h-4" />
                  <span>Buka Menu Pipeline</span>
                </Link>
              </div>

              {/* Input Lacak ID */}
              <div className="mt-8 pt-6 border-t border-slate-100 max-w-md mx-auto">
                <p className="text-xs text-slate-600 font-semibold mb-2">
                  Sudah punya Result ID sebelumnya? Cek hasil di sini:
                </p>
                <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Masukkan Result ID..."
                    value={searchIdInput}
                    onChange={(e) => setSearchIdInput(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <button
                    type="submit"
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Cari</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Skenario 2: Sedang Loading Hasil dari Server */}
          {hasJob && loading && (
            <div className="rounded-3xl border border-slate-100 bg-white p-12 text-center shadow-xs my-8">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-cyan-600 border-t-transparent mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-800">Mengambil Data Hasil Analisis...</p>
              <p className="text-xs text-slate-400 mt-1">Mengunduh visualisasi dan rangkuman varian dari server</p>
            </div>
          )}

          {/* Skenario 3: Terjadi Error / Analisis Belum Selesai */}
          {hasJob && !loading && error && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-6 shadow-xs my-8">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-amber-900">
                    Hasil Belum Dapat Ditampilkan
                  </h3>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    {error}
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <Link
                      to={`/status/${cleanJobId}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 text-xs shadow-xs"
                    >
                      <span>Lihat Progress di Status Analisis</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Skenario 4: Hasil Analisis Sukses Didapatkan dari Backend */}
          {hasJob && !loading && data && (
            <>
              {/* Banner ID & Quick Export Bar */}
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      RESULT IDENTIFIER
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-1.5 font-mono text-sm sm:text-base font-bold text-slate-900">
                        #{data.result_id}
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyId}
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600">Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-cyan-600" />
                            <span>Salin ID</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Action Download Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={`${API_BASE_URL}${data.downloads.report_pdf}`}
                      download={`GWAS_Report_${data.result_id}.pdf`}
                      className="flex items-center gap-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold shadow-xs transition-all hover:scale-[1.02] cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh Laporan PDF</span>
                    </a>
                    <a
                      href={`${API_BASE_URL}${data.downloads.summary_csv}`}
                      download={`top_snps_${data.result_id}.csv`}
                      className="flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 text-xs font-semibold transition-all"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      <span>Top SNPs (CSV)</span>
                    </a>
                    <a
                      href={`${API_BASE_URL}${data.downloads.raw_tsv}`}
                      download={`raw_gwas_${data.result_id}.tsv`}
                      className="flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 text-xs font-semibold transition-all"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      <span>Raw GLM (TSV)</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Grid 2 Visualisasi Manhattan & QQ Plot */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Manhattan Plot Card */}
                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-cyan-600" />
                        <h2 className="text-base font-bold text-slate-900">Manhattan Plot</h2>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={manhattanUrl}
                          download={`manhattan_${data.result_id}.png`}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                          title="Unduh PNG"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => setPreviewImage({ src: manhattanUrl, title: 'Manhattan Plot' })}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                          title="Perbesar"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="relative rounded-xl border border-slate-100 bg-slate-50/50 p-2 overflow-hidden flex items-center justify-center min-h-[220px]">
                      <img
                        src={manhattanUrl}
                        alt="Manhattan Plot"
                        className="w-full h-auto max-h-[300px] object-contain rounded-lg hover:scale-[1.01] transition-transform cursor-pointer"
                        onClick={() => setPreviewImage({ src: manhattanUrl, title: 'Manhattan Plot' })}
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#FBB034]" />
                      <span>Ambang Batas Signifikansi Genomik: <strong>5 × 10⁻⁸</strong></span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-400">PLINK 2.0 GLM Engine</span>
                  </div>
                </div>

                {/* QQ Plot Card */}
                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-500" />
                        <h2 className="text-base font-bold text-slate-900">QQ Plot (Inflasi)</h2>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={qqUrl}
                          download={`qq_${data.result_id}.png`}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                          title="Unduh PNG"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => setPreviewImage({ src: qqUrl, title: 'QQ Plot' })}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                          title="Perbesar"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="relative rounded-xl border border-slate-100 bg-slate-50/50 p-2 overflow-hidden flex items-center justify-center min-h-[220px]">
                      <img
                        src={qqUrl}
                        alt="QQ Plot"
                        className="w-full h-auto max-h-[300px] object-contain rounded-lg hover:scale-[1.01] transition-transform cursor-pointer"
                        onClick={() => setPreviewImage({ src: qqUrl, title: 'QQ Plot' })}
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                    <p className="leading-relaxed">
                      Garis diagonal putus-putus menunjukkan distribusi teoritis null tanpa efek stratifikasi genetik.
                    </p>
                  </div>
                </div>
              </div>

              {/* Top Significant SNPs Table - HANYA MUNCUL JIKA ADA HASIL ANALISIS */}
              {snpList.length > 0 ? (
                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs mb-8">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <TableIcon className="w-5 h-5 text-cyan-600" />
                      <div>
                        <h2 className="text-base font-bold text-slate-900 tracking-tight">
                          Top {Math.min(10, snpList.length)} SNP Signifikan
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Daftar varian genetik dengan tingkat asosiasi terkuat terhadap fenotipe
                        </p>
                      </div>
                    </div>

                    {/* Search Filter */}
                    <div className="relative w-full sm:w-64">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Cari SNP ID / Posisi..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                  </div>

                  {/* Table Content */}
                  <div className="overflow-x-auto mt-4">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/60">
                          <th className="py-3 px-4 rounded-l-xl">No</th>
                          <th className="py-3 px-4">SNP ID</th>
                          <th className="py-3 px-4">Kromosom</th>
                          <th className="py-3 px-4">Posisi (BP)</th>
                          <th className="py-3 px-4">Alel (Efek / Lain)</th>
                          <th className="py-3 px-4">Efek (Beta/OR)</th>
                          <th className="py-3 px-4 rounded-r-xl">P-Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {filteredSnps.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-6 text-center text-slate-400 text-xs">
                              Tidak ada SNP yang sesuai dengan pencarian "{searchQuery}"
                            </td>
                          </tr>
                        ) : (
                          filteredSnps.slice(0, 10).map((snp, index) => {
                            const isHighlySignificant = snp.p_value < 5e-8;
                            return (
                              <tr key={snp.snp_id || index} className="hover:bg-slate-50/70 transition-colors">
                                <td className="py-3.5 px-4 font-mono text-slate-400">{index + 1}</td>
                                <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{snp.snp_id}</td>
                                <td className="py-3.5 px-4 font-sans font-medium text-slate-600">
                                  Chr {snp.chrom}
                                </td>
                                <td className="py-3.5 px-4 font-mono text-slate-600">
                                  {Number(snp.pos).toLocaleString('id-ID')}
                                </td>
                                <td className="py-3.5 px-4 font-mono">
                                  <span className="font-bold text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-200">
                                    {snp.effect_allele || '-'}
                                  </span>
                                  <span className="text-slate-300 mx-1">/</span>
                                  <span className="text-slate-500">{snp.other_allele || '-'}</span>
                                </td>
                                <td className="py-3.5 px-4 font-mono font-medium">
                                  {snp.effect !== undefined && snp.effect !== null ? (
                                    <span className={snp.effect > 0 ? 'text-emerald-600' : 'text-slate-600'}>
                                      {snp.effect > 0 ? `+${Number(snp.effect).toFixed(4)}` : Number(snp.effect).toFixed(4)}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">-</span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 font-mono">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded-full font-bold text-[11px] ${
                                      isHighlySignificant
                                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                        : 'bg-slate-100 text-slate-700'
                                    }`}
                                  >
                                    {formatPValue(snp.p_value)}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs mb-8 text-center">
                  <TableIcon className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">Tabel Top SNP Belum Tersedia</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Tidak ditemukan varian yang lolos ambang batas atau proses peringkasan tabel masih berlangsung.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <StatusFooter />
    </main>
  );
}
