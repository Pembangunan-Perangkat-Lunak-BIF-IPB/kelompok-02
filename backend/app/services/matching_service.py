import os
import gzip
import pandas as pd
from fastapi import HTTPException
from app.services.job_logger import log_job

import os
import gzip
import pandas as pd
from fastapi import HTTPException
from app.services.job_logger import log_job

def run_sample_matching(genotype_input: str, csv_path: str, job_dir: str, genotype_type: str = "vcf") -> tuple[str, str]:
    """
    Pencocokan ID sampel antara berkas genotipe (VCF atau PLINK .fam) dan CSV fenotipe.
    Fleksibel mendeteksi alias kolom ID sampel: Sample_ID, IID, Taxa, Sample, ID, dll.
    """
    log_job(job_dir, "Memulai validasi dan pencocokan ID sampel antara data genotipe dan CSV fenotipe.")
    
    # 1. Ekstraksi Sample ID dari Berkas Genotipe
    genotype_samples = []

    # Cek apakah input berupa berkas .fam (atau bfile prefix yang punya .fam)
    fam_file = None
    if genotype_type == "plink_bed":
        if genotype_input.endswith(".fam"):
            fam_file = genotype_input
        elif os.path.exists(f"{genotype_input}.fam"):
            fam_file = f"{genotype_input}.fam"
        elif genotype_input.endswith(".bed"):
            fam_candidate = genotype_input[:-4] + ".fam"
            if os.path.exists(fam_candidate):
                fam_file = fam_candidate

    if fam_file and os.path.exists(fam_file):
        with open(fam_file, "r") as ff:
            for line in ff:
                parts = line.strip().split()
                if len(parts) >= 2:
                    genotype_samples.append(parts[1])  # Kolom ke-2 adalah IID
        log_job(job_dir, f"Ditemukan {len(genotype_samples)} sampel dari berkas PLINK .fam: {os.path.basename(fam_file)}")
    else:
        # Asumsikan VCF / VCF.GZ
        is_gz = genotype_input.endswith(".vcf.gz")
        open_func = gzip.open if is_gz else open
        with open_func(genotype_input, "rt", errors="ignore") as f:
            for line in f:
                if line.startswith("#CHROM"):
                    parts = line.strip().split("\t")
                    if len(parts) > 9:
                        genotype_samples = parts[9:]  # ID sampel dimulai dari kolom ke-10
                    break
        log_job(job_dir, f"Ditemukan {len(genotype_samples)} sampel dalam berkas genotipe VCF.")

    if not genotype_samples:
        err = "Tidak dapat menemukan kolom header / ID sampel di berkas genotipe yang diunggah"
        log_job(job_dir, err, "ERROR")
        raise HTTPException(status_code=400, detail=err)

    # 2. Baca Fenotipe CSV
    try:
        pheno_df = pd.read_csv(csv_path)
    except Exception as e:
        err = f"Gagal membaca berkas CSV fenotipe: {str(e)}"
        log_job(job_dir, err, "ERROR")
        raise HTTPException(status_code=400, detail=err)
        
    pheno_df.columns = [str(c).lstrip("#").strip() for c in pheno_df.columns]

    # Deteksi alias kolom ID sampel secara fleksibel (case-insensitive)
    id_aliases = ["sample_id", "iid", "taxa", "sample", "id", "individual_id", "accession", "accession_id"]
    detected_id_col = None

    for col in pheno_df.columns:
        if col.lower() in id_aliases:
            detected_id_col = col
            break

    if detected_id_col:
        pheno_df = pheno_df.rename(columns={detected_id_col: "Sample_ID"})
    else:
        # Fallback: jika kolom pertama berisi teks ID sampel yang cocok dengan genotipe
        first_col = pheno_df.columns[0]
        first_col_vals = pheno_df[first_col].astype(str).tolist()
        overlap = set(first_col_vals).intersection(set(genotype_samples))
        if len(overlap) > 0:
            pheno_df = pheno_df.rename(columns={first_col: "Sample_ID"})
        else:
            err = f"Berkas CSV fenotipe wajib memiliki kolom ID sampel (seperti 'Sample_ID', 'IID', atau 'Taxa'). Kolom saat ini: {list(pheno_df.columns)}"
            log_job(job_dir, err, "ERROR")
            raise HTTPException(status_code=400, detail=err)

    # Buang kolom FID/IID tambahan jika bukan primary ID agar tidak terdeteksi sbg fenotipe PLINK
    cols_to_drop = [c for c in ["FID", "IID"] if c in pheno_df.columns and c != "Sample_ID"]
    if cols_to_drop:
        pheno_df = pheno_df.drop(columns=cols_to_drop, errors="ignore")
    
    csv_samples = pheno_df["Sample_ID"].astype(str).tolist()
    log_job(job_dir, f"Ditemukan {len(csv_samples)} baris sampel dalam berkas fenotipe CSV.")

    # 3. Cari Irisan (Matching) ID Sampel
    genotype_samples_str = [str(s) for s in genotype_samples]
    matched_ids = [s for s in genotype_samples_str if s in csv_samples]
    
    if not matched_ids:
        err = "Pencocokan gagal: Tidak ada satu pun Sample ID yang cocok antara berkas genotipe dan fenotipe CSV."
        log_job(job_dir, err, "ERROR")
        raise HTTPException(status_code=400, detail=err)

    log_job(job_dir, f"Pencocokan berhasil: {len(matched_ids)} sampel cocok antara data genotipe dan fenotipe.")

    # 4. Buat File Perantara `keep_samples.txt` (format PLINK: FID IID)
    keep_samples_path = os.path.join(job_dir, "keep_samples.txt")
    with open(keep_samples_path, "w") as f:
        for s_id in matched_ids:
            f.write(f"{s_id}\t{s_id}\n")

    # 5. Filter & Simpan `matched_phenotype.csv`
    matched_csv_path = os.path.join(job_dir, "matched_phenotype.csv")
    matched_df = pheno_df[pheno_df["Sample_ID"].astype(str).isin(matched_ids)]
    matched_df.to_csv(matched_csv_path, index=False)

    return keep_samples_path, matched_csv_path