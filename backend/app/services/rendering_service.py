import os
from datetime import datetime
from statistics import NormalDist
from typing import Optional
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from fastapi import HTTPException

# ReportLab untuk Pembuatan PDF Laporan Profesional
from reportlab.lib.pagesizes import A4
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle, PageBreak, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

from app.services.job_logger import log_job

GWAS_THRESHOLD = 5e-8
SUGGESTIVE_THRESHOLD = 1e-5
TOP_N = 10


def _load_glm(glm_file: str) -> pd.DataFrame:
    """Baca output PLINK2 .glm dan rapikan kolomnya."""
    df = pd.read_csv(glm_file, sep=r"\s+")
    df = df.rename(columns={"#CHROM": "CHROM"})

    # Hanya baris efek SNP (abaikan baris estimasi kovariat)
    if "TEST" in df.columns:
        df = df[df["TEST"] == "ADD"]

    p_col = "P" if "P" in df.columns else None
    if p_col is None:
        return pd.DataFrame()
    df = df.dropna(subset=[p_col]).copy()
    df["P"] = pd.to_numeric(df["P"], errors="coerce")
    df = df.dropna(subset=["P"])
    df = df[(df["P"] > 0) & (df["P"] <= 1)]

    # Konversi kromosom -> angka untuk pengurutan sumbu X (X=23, Y=24, MT=25)
    chrom_map = {"X": 23, "Y": 24, "XY": 25, "MT": 26, "M": 26}
    chrom_str = df["CHROM"].astype(str).str.replace("chr", "", case=False)
    df["CHROM_NUM"] = pd.to_numeric(chrom_str.map(lambda c: chrom_map.get(c.upper(), c)), errors="coerce")
    df = df.dropna(subset=["CHROM_NUM"])
    df["CHROM_NUM"] = df["CHROM_NUM"].astype(int)
    df["CHROM"] = chrom_str.loc[df.index]

    # Identifikasi alel efek (A1) dan alel referensi
    if "A1" in df.columns:
        df["effect_allele"] = df["A1"]
        df["other_allele"] = np.where(df["A1"] == df["ALT"], df["REF"], df["ALT"])
    else:
        df["effect_allele"] = df.get("ALT", "")
        df["other_allele"] = df.get("REF", "")

    # Ukuran efek: BETA (linier) atau OR (logistik)
    effect_col = "BETA" if "BETA" in df.columns else ("OR" if "OR" in df.columns else None)
    df["effect"] = df[effect_col] if effect_col else np.nan
    return df.sort_values(["CHROM_NUM", "POS"]).reset_index(drop=True)


def _manhattan(df: pd.DataFrame, out_path: str, title: str):
    """
    Membuat Manhattan Plot dengan estetika modern yang selaras dengan UI Frontend Jiwasku:
    - Alternating palette: Sky-600 (#0284c7) dan Slate-500 (#64748b)
    - Significant hits: Amber-400 (#FBB034) dengan outline tegas
    - Ambang batas genomik (5e-8) dan sugestif (1e-5)
    - Despine (tanpa garis tepi kaku atas/kanan) dan grid horizontal lembut
    """
    df = df.copy()
    df["minus_log_p"] = -np.log10(df["P"])

    # Hitung posisi kumulatif koordinat sumbu X per kromosom
    offset, ticks, labels = 0, [], []
    xs = np.zeros(len(df))
    for chrom, grp in df.groupby("CHROM_NUM", sort=True):
        xs[grp.index] = grp["POS"].values + offset
        ticks.append(offset + (grp["POS"].max() - grp["POS"].min()) / 2 + grp["POS"].min())
        labels.append(str(chrom))
        offset += grp["POS"].max() + 1
    df["x"] = xs

    fig, ax = plt.subplots(figsize=(11, 4.6), dpi=200)
    fig.patch.set_facecolor('#ffffff')
    ax.set_facecolor('#ffffff')

    # Palet warna modern alternating: Sky & Slate
    col_primary = "#0284c7"    # Sky-600
    col_secondary = "#64748b"  # Slate-500
    palette = [col_primary, col_secondary]

    for i, (chrom, grp) in enumerate(df.groupby("CHROM_NUM", sort=True)):
        ax.scatter(
            grp["x"], grp["minus_log_p"],
            s=12, color=palette[i % 2], alpha=0.85,
            edgecolors='none', zorder=2
        )

    # Sorot varian signifikan genomik (P < 5e-8)
    hits = df[df["P"] < GWAS_THRESHOLD]
    if not hits.empty:
        ax.scatter(
            hits["x"], hits["minus_log_p"],
            s=36, color="#FBB034", edgecolors="#d97706", linewidths=1.2,
            alpha=1.0, zorder=5, label=f"Signifikan (P < 5e-8, n={len(hits)})"
        )

    # Garis ambang batas signifikansi genomik standar (5 × 10⁻⁸)
    gwas_line = -np.log10(GWAS_THRESHOLD)
    ax.axhline(gwas_line, color="#FBB034", linestyle="--", linewidth=1.4, zorder=3, label="Ambang Genomik (5e-8)")

    # Garis ambang batas sugestif (1 × 10⁻⁵)
    if df["minus_log_p"].max() >= -np.log10(SUGGESTIVE_THRESHOLD):
        ax.axhline(-np.log10(SUGGESTIVE_THRESHOLD), color="#94a3b8", linestyle=":", linewidth=1.0, zorder=3, label="Ambang Sugestif (1e-5)")

    ax.set_xticks(ticks)
    ax.set_xticklabels(labels, fontsize=8, color="#475569")
    
    # Grid horizontal halus
    ax.yaxis.grid(True, linestyle="--", color="#f1f5f9", linewidth=0.8, alpha=0.9, zorder=1)
    ax.set_axisbelow(True)

    # Hilangkan border kaku (spines) atas & kanan
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_color('#cbd5e1')
    ax.spines['bottom'].set_color('#cbd5e1')

    # Rentang Y yang nyaman dibaca
    max_y = max(8.0, df["minus_log_p"].max() * 1.12)
    ax.set_ylim(0, max_y)

    display_title = title.replace('_', ' ').title()
    ax.set_title(f"Manhattan Plot — {display_title}", fontsize=12, fontweight='bold', color="#0f172a", pad=12)
    ax.set_xlabel("Kromosom", fontsize=9.5, fontweight='bold', color="#334155", labelpad=8)
    ax.set_ylabel(r"$-\log_{10}(P\text{-value})$", fontsize=9.5, fontweight='bold', color="#334155", labelpad=8)

    ax.legend(loc="upper right", frameon=True, facecolor="#ffffff", edgecolor="#e2e8f0", fontsize=7.5, framealpha=0.95)

    fig.tight_layout()
    fig.savefig(out_path, dpi=200, bbox_inches="tight")
    plt.close(fig)


def _qq(df: pd.DataFrame, out_path: str, title: str) -> float:
    """
    Membuat QQ Plot modern yang selaras dengan UI Frontend Jiwasku:
    - Poin observasi Sky-600 (#0284c7)
    - Garis null teoritis Amber (#FBB034)
    - Badge informatif lambda GC (Genomic Inflation Factor)
    - Despine dan grid yang bersih
    """
    p = np.sort(df["P"].values)
    n = len(p)
    expected = -np.log10((np.arange(1, n + 1) - 0.5) / n)
    observed = -np.log10(p)

    median_p = float(np.median(p))
    median_chisq = NormalDist().inv_cdf(1 - median_p / 2) ** 2
    lam = median_chisq / 0.4549364

    fig, ax = plt.subplots(figsize=(5.5, 5.0), dpi=200)
    fig.patch.set_facecolor('#ffffff')
    ax.set_facecolor('#ffffff')

    lim = max(expected.max(), observed.max()) * 1.08

    # Garis diagonal 1:1 distribusi null teoritis
    ax.plot([0, lim], [0, lim], color="#FBB034", linestyle="--", linewidth=1.8, label="Distribusi Null Teoritis (y = x)", zorder=3)

    # Titik scatter observed
    ax.scatter(
        expected[::-1], observed[::-1],
        s=14, color="#0284c7", alpha=0.8,
        edgecolors="#0369a1", linewidths=0.6,
        label="Varian Terobservasi", zorder=4
    )

    # Despine & grid
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_color('#cbd5e1')
    ax.spines['bottom'].set_color('#cbd5e1')
    ax.grid(True, linestyle="--", color="#f1f5f9", linewidth=0.8, alpha=0.9, zorder=1)
    ax.set_axisbelow(True)

    ax.set_xlim(0, lim)
    ax.set_ylim(0, lim)

    display_title = title.replace('_', ' ').title()
    ax.set_title(f"QQ Plot (Inflasi) — {display_title}", fontsize=11, fontweight='bold', color="#0f172a", pad=12)
    ax.set_xlabel(r"Expected $-\log_{10}(P)$", fontsize=9.5, fontweight='bold', color="#334155", labelpad=6)
    ax.set_ylabel(r"Observed $-\log_{10}(P)$", fontsize=9.5, fontweight='bold', color="#334155", labelpad=6)

    # Badge indikator Lambda GC
    lam_status = "Terkontrol Baik" if 0.95 <= lam <= 1.08 else ("Sedang" if 1.08 < lam <= 1.15 else "Ada Inflasi")
    badge_text = f"$\\lambda_{{GC}} = {lam:.3f}$\n({lam_status})"
    ax.text(
        0.05, 0.92, badge_text,
        transform=ax.transAxes,
        fontsize=8.5, fontweight='bold', color="#0f172a",
        verticalalignment='top',
        bbox=dict(boxstyle='round,pad=0.5', facecolor='#f8fafc', edgecolor='#cbd5e1', linewidth=1)
    )

    ax.legend(loc="lower right", frameon=True, facecolor="#ffffff", edgecolor="#e2e8f0", fontsize=7.5, framealpha=0.95)

    fig.tight_layout()
    fig.savefig(out_path, dpi=200, bbox_inches="tight")
    plt.close(fig)
    return lam


def run_parsing_and_rendering(glm_files: list[str], job_dir: str):
    """
    Menghasilkan berkas yang dibutuhkan endpoint download & results:
      - gwas_raw_summary.tsv  (semua SNP, hasil mentah)
      - gwas_summary.csv      (Top 10 SNP signifikan)
      - manhattan_plot.png, qq_plot.png
    """
    generated = []
    primary_done = False
    log_job(job_dir, f"Memulai pembuatan visualisasi untuk {len(glm_files)} berkas GLM.")

    for glm_file in glm_files:
        parts = os.path.basename(glm_file).split(".")
        pheno_name = parts[1] if len(parts) > 3 else "result"

        df = _load_glm(glm_file)
        if df.empty:
            log_job(job_dir, f"[Visualisasi] Berkas {os.path.basename(glm_file)} tidak memiliki p-value valid (semua NA/kosong/kolinier). Melewati.", "WARN")
            continue

        log_job(job_dir, f"[Visualisasi] Membuat plot Manhattan & QQ untuk fenotipe: '{pheno_name}' ({len(df)} SNP valid).")
        _manhattan(df, os.path.join(job_dir, f"manhattan_{pheno_name}.png"), pheno_name)
        _qq(df, os.path.join(job_dir, f"qq_{pheno_name}.png"), pheno_name)
        generated.append(pheno_name)

        if not primary_done:
            primary_done = True
            _manhattan(df, os.path.join(job_dir, "manhattan_plot.png"), pheno_name)
            _qq(df, os.path.join(job_dir, "qq_plot.png"), pheno_name)

            df.to_csv(os.path.join(job_dir, "gwas_raw_summary.tsv"), sep="\t", index=False)

            top = df.nsmallest(TOP_N, "P")
            summary = pd.DataFrame({
                "snp_id": top["ID"],
                "chrom": top["CHROM"],
                "pos": top["POS"],
                "effect_allele": top["effect_allele"],
                "other_allele": top["other_allele"],
                "effect": top["effect"],
                "p_value": top["P"],
            })
            summary.to_csv(os.path.join(job_dir, "gwas_summary.csv"), index=False)
            log_job(job_dir, f"[Visualisasi] Plot utama dan ringkasan gwas_summary.csv berhasil dibuat untuk '{pheno_name}'.")

    if not primary_done:
        err = (
            "Uji asosiasi selesai tetapi tidak ada nilai p-value yang valid (semua p-value bernilai NA). "
            "Penyebab umum: jumlah sampel terlalu sedikit untuk jumlah PC kovariat yang dipilih, "
            "sehingga model regresi mengalami kegagalan estimasi (derajat kebebasan <= 0 / multikolinieritas)."
        )
        log_job(job_dir, err, "ERROR")
        raise HTTPException(status_code=422, detail=err)

    return generated


def generate_pdf_report(result_id: str, job_dir: str, params: Optional[dict] = None) -> str:
    """
    Membuat Laporan PDF Komprehensif Sesuai Permintaan PM:
    1. Branding Header Platform Jiwasku & Metadata Analisis
    2. Tabel Parameter yang Dipilih User (MAF, Call Rate, Jumlah PC, Nama Fenotipe)
    3. Tabel Top 10 SNP Signifikan (SNP ID, Chr, Pos, Alel, Efek, P-Value)
    4. 2 Plot Utama (Manhattan Plot & QQ Plot) dengan Resolusi Tinggi dan Keterangan
    """
    pdf_path = os.path.join(job_dir, f"GWAS_Report_{result_id}.pdf")
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Style Kustom Selaras Desain Jiwasku
    title_style = ParagraphStyle(
        "DocTitle", parent=styles["Heading1"],
        fontSize=18, leading=22, textColor=colors.HexColor("#0f172a"),
        fontName="Helvetica-Bold", spaceAfter=2
    )
    subtitle_style = ParagraphStyle(
        "DocSubTitle", parent=styles["Normal"],
        fontSize=9.5, leading=13, textColor=colors.HexColor("#64748b"),
        spaceAfter=14
    )
    section_style = ParagraphStyle(
        "SectionHeading", parent=styles["Heading2"],
        fontSize=11, leading=15, textColor=colors.HexColor("#0284c7"),
        fontName="Helvetica-Bold", spaceBefore=12, spaceAfter=6
    )
    caption_style = ParagraphStyle(
        "CaptionStyle", parent=styles["Normal"],
        fontSize=8, leading=11, textColor=colors.HexColor("#64748b"),
        spaceAfter=10
    )
    cell_style = ParagraphStyle(
        "Cell", parent=styles["Normal"],
        fontSize=7.5, leading=10, textColor=colors.HexColor("#1e293b")
    )
    cell_bold_style = ParagraphStyle(
        "CellBold", parent=styles["Normal"],
        fontSize=7.5, leading=10, textColor=colors.HexColor("#0f172a"),
        fontName="Helvetica-Bold"
    )
    cell_header_style = ParagraphStyle(
        "CellHeader", parent=styles["Normal"],
        fontSize=8, leading=11, textColor=colors.white,
        fontName="Helvetica-Bold"
    )

    story = []

    # 1. HEADER BRANDING & DOKUMEN
    story.append(Paragraph("Jiwasku — Laporan Hasil Analisis GWAS", title_style))
    story.append(Paragraph("Genome-Wide Association Study Analytics • Terintegrasi PLINK 2.0 Engine", subtitle_style))

    # 2. TABEL PARAMETER YANG DIPILIH USER
    story.append(Paragraph("Konfigurasi Parameter Analisis", section_style))

    safe_params = params or {}
    pheno_display = safe_params.get("pheno_name") or "Semua / Default"
    maf_val = safe_params.get("maf", 0.05)
    call_rate_raw = safe_params.get("call_rate", 0.95)
    call_rate_display = f"{int(call_rate_raw * 100)}%" if call_rate_raw <= 1.0 else f"{call_rate_raw}%"
    num_pcs_val = safe_params.get("num_pcs", 10)
    current_time_str = datetime.now().strftime("%d %B %Y, %H:%M WIB")

    param_table_data = [
        [
            Paragraph("Result ID:", cell_bold_style),
            Paragraph(f"<b>#{result_id}</b>", cell_style),
            Paragraph("Target Fenotipe:", cell_bold_style),
            Paragraph(f"<b>{pheno_display}</b>", cell_style),
        ],
        [
            Paragraph("Ambang MAF:", cell_bold_style),
            Paragraph(f"{maf_val} (Varian Langka)", cell_style),
            Paragraph("Call Rate:", cell_bold_style),
            Paragraph(f"{call_rate_display} (Missingness)", cell_style),
        ],
        [
            Paragraph("Principal Components:", cell_bold_style),
            Paragraph(f"{num_pcs_val} PCs (Stratifikasi)", cell_style),
            Paragraph("Software Engine:", cell_bold_style),
            Paragraph("PLINK 2.0 (--glm)", cell_style),
        ],
        [
            Paragraph("Waktu Selesai:", cell_bold_style),
            Paragraph(current_time_str, cell_style),
            Paragraph("Status Analisis:", cell_bold_style),
            Paragraph("<font color='#059669'><b>SUCCESS (Selesai)</b></font>", cell_style),
        ]
    ]

    param_table = Table(param_table_data, colWidths=[100, 160, 100, 163])
    param_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 0.8, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(param_table)
    story.append(Spacer(1, 10))

    # 3. TABEL TOP SIGNIFICANT SNPs
    story.append(Paragraph("Daftar Top 10 Varian SNP Paling Signifikan", section_style))

    summary_csv = os.path.join(job_dir, "gwas_summary.csv")
    if os.path.exists(summary_csv):
        try:
            top_df = pd.read_csv(summary_csv).head(TOP_N)
            snp_headers = ["No", "SNP ID", "Kromosom", "Posisi (BP)", "Alel (Efek/Lain)", "Efek (Beta/OR)", "P-Value"]
            snp_table_data = [[Paragraph(h, cell_header_style) for h in snp_headers]]

            for idx, r in top_df.iterrows():
                p_num = float(r["p_value"])
                p_text = f"<b>{p_num:.2e}</b>" if p_num < 0.0001 else f"{p_num:.5f}"
                if p_num < GWAS_THRESHOLD:
                    p_text = f"<font color='#d97706'>{p_text} *</font>"

                eff_val = r.get("effect")
                eff_text = f"{float(eff_val):.4f}" if pd.notna(eff_val) else "-"
                allele_text = f"{r.get('effect_allele', '')} / {r.get('other_allele', '')}"

                row = [
                    Paragraph(str(idx + 1), cell_style),
                    Paragraph(f"<b>{r.get('snp_id', '')}</b>", cell_style),
                    Paragraph(f"Chr {r.get('chrom', '')}", cell_style),
                    Paragraph(str(r.get('pos', '')), cell_style),
                    Paragraph(allele_text, cell_style),
                    Paragraph(eff_text, cell_style),
                    Paragraph(p_text, cell_style),
                ]
                snp_table_data.append(row)

            snp_table = Table(snp_table_data, colWidths=[24, 105, 60, 80, 85, 85, 84])
            snp_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0284c7')),
                ('BOX', (0, 0), (-1, -1), 0.8, colors.HexColor('#cbd5e1')),
                ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
                ('TOPPADDING', (0, 0), (-1, -1), 3),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
                ('LEFTPADDING', (0, 0), (-1, -1), 5),
                ('RIGHTPADDING', (0, 0), (-1, -1), 5),
            ]))
            story.append(snp_table)
            story.append(Paragraph("<font color='#d97706'>*</font> Menunjukkan varian yang melampaui ambang signifikansi genomik standar (P &lt; 5 &times; 10<sup>-8</sup>).", caption_style))
        except Exception as e:
            story.append(Paragraph(f"Catatan: Gagal memuat ringkasan SNP ({str(e)})", caption_style))
    else:
        story.append(Paragraph("Belum ada berkas ringkasan SNP yang dihasilkan.", caption_style))

    # Berpindah ke Halaman 2 khusus untuk Visualisasi Grafik Genomik
    story.append(PageBreak())

    # 4. DUA PLOT UTAMA (MANHATTAN & QQ PLOT)
    story.append(Paragraph("Visualisasi Grafik Genomik", section_style))

    manhattan_path = os.path.join(job_dir, "manhattan_plot.png")
    if os.path.exists(manhattan_path):
        story.append(Paragraph("<b>1. Manhattan Plot (Distribusi Nilai Signifikansi Seluruh Genom)</b>", cell_bold_style))
        story.append(Spacer(1, 4))
        # Lebar disesuaikan dengan lebar area cetak halaman A4 (~523 pt)
        story.append(Image(manhattan_path, width=520, height=210))
        story.append(Paragraph("Garis putus-putus kuning menunjukkan ambang batas signifikansi genomik (P = 5 &times; 10<sup>-8</sup>). Titik-titik di atas garis tersebut merupakan kandidat lokus genetik asosiasi kuat.", caption_style))
        story.append(Spacer(1, 10))

    qq_path = os.path.join(job_dir, "qq_plot.png")
    if os.path.exists(qq_path):
        story.append(Paragraph("<b>2. Quantile-Quantile (QQ) Plot (Evaluasi Inflasi Genomik)</b>", cell_bold_style))
        story.append(Spacer(1, 4))
        story.append(Image(qq_path, width=270, height=245))
        story.append(Paragraph("Garis diagonal putus-putus menunjukkan distribusi null teoritis tanpa efek genetik. Nilai faktor inflasi (Lambda GC) mendekati 1.00 menunjukkan stratifikasi populasi telah terkoreksi dengan baik oleh Principal Components (PCA).", caption_style))

    doc.build(story)
    log_job(job_dir, f"[Laporan PDF] Berkas laporan lengkap berhasil dibuat: {os.path.basename(pdf_path)}")
    return pdf_path
