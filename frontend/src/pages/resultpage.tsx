import { useState, useEffect } from 'react';
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

// Sample demo data jika user membuka /result/sample atau backend belum ada data
const SAMPLE_SNPS: TopSnp[] = [
  { snp_id: 'rs1042522', chrom: 22, pos: 17284920, effect_allele: 'C', other_allele: 'G', effect: 0.428, p_value: 3.2e-9 },
  { snp_id: 'rs738409', chrom: 22, pos: 19438104, effect_allele: 'G', other_allele: 'C', effect: -0.382, p_value: 8.7e-9 },
  { snp_id: 'rs2893457', chrom: 22, pos: 21940122, effect_allele: 'T', other_allele: 'A', effect: 0.315, p_value: 1.4e-8 },
  { snp_id: 'rs9603482', chrom: 22, pos: 24890114, effect_allele: 'A', other_allele: 'G', effect: -0.294, p_value: 4.1e-8 },
  { snp_id: 'rs1801133', chrom: 22, pos: 27103940, effect_allele: 'T', other_allele: 'C', effect: 0.251, p_value: 1.1e-7 },
  { snp_id: 'rs4820124', chrom: 22, pos: 31049281, effect_allele: 'A', other_allele: 'T', effect: -0.229, p_value: 3.8e-7 },
  { snp_id: 'rs6003921', chrom: 22, pos: 35129044, effect_allele: 'G', other_allele: 'C', effect: 0.198, p_value: 6.2e-7 },
  { snp_id: 'rs1170293', chrom: 22, pos: 38940120, effect_allele: 'C', other_allele: 'T', effect: -0.174, p_value: 1.8e-6 },
  { snp_id: 'rs3749201', chrom: 22, pos: 42109340, effect_allele: 'T', other_allele: 'G', effect: 0.155, p_value: 4.5e-6 },
  { snp_id: 'rs5749201', chrom: 22, pos: 46201948, effect_allele: 'G', other_allele: 'A', effect: -0.142, p_value: 9.1e-6 },
];

export default function ResultPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const cleanJobId = (jobId || localStorage.getItem('last_gwas_result_id') || '').replace(/^#/, '').trim();
  const isSample = !cleanJobId || cleanJobId === 'sample';
  const displayId = isSample ? 'GWAS-2024-IDN-CH22' : cleanJobId;

  // States
  const [data, setData] = useState<ResultsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(!isSample);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewImage, setPreviewImage] = useState<{ src: string; title: string } | null>(null);

  useEffect(() => {
    if (isSample) {
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
        const msg = err.response?.data?.detail || 'Gagal memuat hasil analisis dari server.';
        setError(msg);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchResults();

    return () => {
      isMounted = false;
    };
  }, [cleanJobId, isSample]);

  const handleCopyId = () => {
    navigator.clipboard.writeText(`#${displayId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const snpList = isSample ? SAMPLE_SNPS : data?.summary?.top_snps || [];
  const filteredSnps = snpList.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.snp_id.toLowerCase().includes(q) ||
      String(s.chrom).toLowerCase().includes(q) ||
      String(s.pos).includes(q)
    );
  });

  const manhattanUrl = isSample
    ? '/assets/hero.png'
    : `${API_BASE_URL}/api/v1/jobs/${cleanJobId}/download/manhattan_png`;

  const qqUrl = isSample
    ? '/assets/hero.png'
    : `${API_BASE_URL}/api/v1/jobs/${cleanJobId}/download/qq_png`;

  const getDownloadUrl = (type: string) => {
    if (isSample) return '#';
    return `${API_BASE_URL}/api/v1/jobs/${cleanJobId}/download/${type}`;
  };

  const formatPValue = (p: number) => {
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
                <Link to={`/status/${cleanJobId}`} className="hover:text-cyan-700 transition-colors">
                  Status
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-cyan-600 font-semibold">Hasil Analisis</span>
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Laporan Hasil Analisis GWAS
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                  <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                  Selesai
                </span>
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

          {/* Banner ID & Quick Export Bar */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  RESULT IDENTIFIER
                </span>
                <div className="flex items-center gap-2">
                  <div className="rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-1.5 font-mono text-sm sm:text-base font-bold text-slate-900">
                    #{displayId}
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
                  href={getDownloadUrl('report_pdf')}
                  download={`GWAS_Report_${displayId}.pdf`}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-slate-900 shadow-sm hover:bg-amber-500 transition-all active:scale-95"
                >
                  <FileText className="w-4 h-4 text-slate-900" />
                  <span>Unduh Laporan PDF</span>
                </a>
                <a
                  href={getDownloadUrl('summary_csv')}
                  download="gwas_summary.csv"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Top SNPs (CSV)</span>
                </a>
                <a
                  href={getDownloadUrl('raw_tsv')}
                  download="gwas_raw_summary.tsv"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Raw GLM (TSV)</span>
                </a>
              </div>
            </div>
          </div>

          {/* Error Banner jika Hasil Belum Selesai di Backend */}
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 shadow-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <h3 className="font-bold text-sm">Hasil Analisis Belum Tersedia</h3>
                  <p className="text-xs text-amber-700 mt-0.5">{error}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/status/${cleanJobId}`)}
                className="rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition-all"
              >
                Lihat Status Job
              </button>
            </div>
          )}

          {/* Grid Plot Visualisasi (Manhattan & QQ Plot) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Main Manhattan Plot Card (Spans 2 Cols) */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-cyan-600" />
                    <h2 className="text-base font-bold text-slate-900">Manhattan Plot</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={manhattanUrl}
                      download={`manhattan_${displayId}.png`}
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

                {/* Container Gambar Manhattan */}
                <div className="relative rounded-xl border border-slate-100 bg-slate-50/50 p-2 overflow-hidden flex items-center justify-center min-h-[220px]">
                  {loading ? (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-600 border-t-transparent" />
                      <span>Memuat visualisasi...</span>
                    </div>
                  ) : (
                    <img
                      src={manhattanUrl}
                      alt="Manhattan Plot"
                      className="w-full h-auto max-h-[300px] object-contain rounded-lg hover:scale-[1.01] transition-transform cursor-pointer"
                      onClick={() => setPreviewImage({ src: manhattanUrl, title: 'Manhattan Plot' })}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Keterangan Ambang Batas */}
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
                      download={`qq_${displayId}.png`}
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

                {/* Container Gambar QQ */}
                <div className="relative rounded-xl border border-slate-100 bg-slate-50/50 p-2 overflow-hidden flex items-center justify-center min-h-[220px]">
                  {loading ? (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-600 border-t-transparent" />
                      <span>Memuat visualisasi...</span>
                    </div>
                  ) : (
                    <img
                      src={qqUrl}
                      alt="QQ Plot"
                      className="w-full h-auto max-h-[300px] object-contain rounded-lg hover:scale-[1.01] transition-transform cursor-pointer"
                      onClick={() => setPreviewImage({ src: qqUrl, title: 'QQ Plot' })}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Keterangan Lambda */}
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                <p className="leading-relaxed">
                  Garis diagonal putus-putus menunjukkan distribusi teoritis null tanpa efek stratifikasi genetik.
                </p>
              </div>
            </div>
          </div>

          {/* Top Significant SNPs Table */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <TableIcon className="w-5 h-5 text-cyan-600" />
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    Top 10 SNP Signifikan
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
                    <th className="py-3 px-4">Posisi (bp)</th>
                    <th className="py-3 px-4">Alel (Efek / Lain)</th>
                    <th className="py-3 px-4">Efek (Beta/OR)</th>
                    <th className="py-3 px-4 rounded-r-xl">p-value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSnps.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                        Tidak ada varian yang cocok dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredSnps.map((snp, idx) => {
                      const isGenomeWideSignificant = snp.p_value < 5e-8;
                      return (
                        <tr
                          key={`${snp.snp_id}-${idx}`}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="py-3 px-4 text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            {snp.snp_id}
                          </td>
                          <td className="py-3 px-4 text-slate-700">Chr {snp.chrom}</td>
                          <td className="py-3 px-4 font-mono text-slate-600">
                            {snp.pos.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-100">
                              {snp.effect_allele}
                            </span>
                            <span className="text-slate-400 mx-1">/</span>
                            <span className="font-mono text-slate-500">{snp.other_allele}</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-700">
                            {snp.effect !== undefined ? snp.effect.toFixed(4) : '-'}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`font-mono font-bold px-2 py-0.5 rounded-full text-[11px] ${
                                isGenomeWideSignificant
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'text-slate-800'
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
        </div>
      </div>

      {/* Footer */}
      <StatusFooter />
    </main>
  );
}
