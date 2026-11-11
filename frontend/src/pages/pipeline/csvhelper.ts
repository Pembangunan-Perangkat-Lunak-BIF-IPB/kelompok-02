/**
 * Membaca baris pertama (header) dari berkas CSV fenotipe dan mengembalikan
 * daftar kolom variabel klinis/fenotipe yang relevan.
 * Kolom ID umum (seperti FID, IID, Sample_ID) otomatis difilter.
 */
export async function extractCsvPhenotypeColumns(file: File): Promise<string[]> {
  try {
    // Baca 16KB pertama dari file agar cepat dan tidak memberatkan memori
    const blobSlice = file.slice(0, 16384)
    const textChunk = await blobSlice.text()
    
    // Ambil baris pertama yang tidak kosong
    const lines = textChunk.split(/\r\n|\n|\r/)
    const headerLine = lines.find((line) => line.trim().length > 0)
    if (!headerLine) return []

    // Deteksi delimiter: tab, koma, atau titik-koma
    let delimiter = ','
    if (headerLine.includes('\t')) {
      delimiter = '\t'
    } else if (headerLine.includes(';') && !headerLine.includes(',')) {
      delimiter = ';'
    }

    // Bersihkan nama kolom dari tanda kutip dan spasi
    const rawColumns = headerLine
      .split(delimiter)
      .map((col) => col.trim().replace(/^["']|["']$/g, ''))
      .filter((col) => col.length > 0)

    // Kolom identifikator individu yang tidak dipakai sebagai fenotipe asosiasi
    const idKeywords = new Set([
      'fid',
      '#fid',
      'iid',
      '#iid',
      'sample_id',
      'sample',
      'id',
      'individual_id',
      'subject_id',
      'patid',
      'matid',
      'sex'
    ])

    const candidateColumns = rawColumns.filter(
      (col) => !idKeywords.has(col.toLowerCase())
    )

    // Jika setelah difilter masih ada kolom kandidat, gunakan candidateColumns
    // Jika semua kolom terfilter (misal file hanya 1 kolom), gunakan seluruh kolom asli
    return candidateColumns.length > 0 ? candidateColumns : rawColumns
  } catch (err) {
    console.error('Gagal mengekstrak kolom CSV:', err)
    return []
  }
}
