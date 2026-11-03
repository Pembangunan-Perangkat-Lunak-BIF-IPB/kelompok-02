import os
from statistics import NormalDist
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
 
GWAS_THRESHOLD = 5e-8
TOP_N = 10

def _load_glm(glm_file: str) -> pd.DataFrame:
    """Baca output PLINK2 .glm dan rapikan kolomnya."""
    df = pd.read_csv(glm_file, sep=r"\s+")
    df = df.rename(columns={"#CHROM": "CHROM"})
 
    # hanya baris efek SNP (abaikan kovariat kalau ada)
    if "TEST" in df.columns:
        df = df[df["TEST"] == "ADD"]
 
    p_col = "P" if "P" in df.columns else None
    if p_col is None:
        return pd.DataFrame()
    df = df.dropna(subset=[p_col]).copy()
    df["P"] = pd.to_numeric(df["P"], errors="coerce")
    df = df.dropna(subset=["P"])
    df = df[(df["P"] > 0) & (df["P"] <= 1)]
 
    # kromosom -> angka untuk pengurutan (X=23, Y=24, MT=25)
    chrom_map = {"X": 23, "Y": 24, "XY": 25, "MT": 26, "M": 26}
    chrom_str = df["CHROM"].astype(str).str.replace("chr", "", case=False)
    df["CHROM_NUM"] = pd.to_numeric(chrom_str.map(lambda c: chrom_map.get(c.upper(), c)), errors="coerce")
    df = df.dropna(subset=["CHROM_NUM"])
    df["CHROM_NUM"] = df["CHROM_NUM"].astype(int)
    df["CHROM"] = chrom_str.loc[df.index]
 
    # alel efek (A1) dan alel lain
    if "A1" in df.columns:
        df["effect_allele"] = df["A1"]
        df["other_allele"] = np.where(df["A1"] == df["ALT"], df["REF"], df["ALT"])
    else:
        df["effect_allele"] = df.get("ALT", "")
        df["other_allele"] = df.get("REF", "")
 
    # ukuran efek: BETA (linear) atau OR (logistik)
    effect_col = "BETA" if "BETA" in df.columns else ("OR" if "OR" in df.columns else None)
    df["effect"] = df[effect_col] if effect_col else np.nan
    return df.sort_values(["CHROM_NUM", "POS"]).reset_index(drop=True)
 
 
def _manhattan(df: pd.DataFrame, out_path: str, title: str):
    df = df.copy()
    df["minus_log_p"] = -np.log10(df["P"])
 
    # posisi kumulatif agar kromosom berurutan di sumbu x
    offset, ticks, labels = 0, [], []
    xs = np.zeros(len(df))
    for chrom, grp in df.groupby("CHROM_NUM", sort=True):
        xs[grp.index] = grp["POS"].values + offset
        ticks.append(offset + grp["POS"].max() / 2)
        labels.append(str(chrom))
        offset += grp["POS"].max() + 1
    df["x"] = xs
 
    fig, ax = plt.subplots(figsize=(12, 5))
    colors = ["#0B3D91", "#8A99AD"]
    for i, (chrom, grp) in enumerate(df.groupby("CHROM_NUM", sort=True)):
        ax.scatter(grp["x"], grp["minus_log_p"], s=8, color=colors[i % 2], alpha=0.8)
    hits = df[df["P"] < GWAS_THRESHOLD]
    if not hits.empty:
        ax.scatter(hits["x"], hits["minus_log_p"], s=18, color="#FBB034")
    ax.axhline(-np.log10(GWAS_THRESHOLD), color="#FBB034", linestyle="--", linewidth=1.2)
    ax.set_xticks(ticks)
    ax.set_xticklabels(labels, fontsize=8)
    ax.set_xlabel("Kromosom")
    ax.set_ylabel("-log10(p-value)")
    ax.set_title(f"Manhattan Plot - {title}")
    fig.tight_layout()
    fig.savefig(out_path, dpi=150)
    plt.close(fig)
 
 
def _qq(df: pd.DataFrame, out_path: str, title: str) -> float:
    p = np.sort(df["P"].values)
    n = len(p)
    expected = -np.log10((np.arange(1, n + 1) - 0.5) / n)
    observed = -np.log10(p)
 
    # lambda GC (inflasi genomik): median chi-square / 0.4549 (tanpa scipy)
    median_p = float(np.median(p))
    median_chisq = NormalDist().inv_cdf(1 - median_p / 2) ** 2
    lam = median_chisq / 0.4549364
 
    fig, ax = plt.subplots(figsize=(5.5, 5.5))
    ax.scatter(expected[::-1], observed[::-1], s=8, color="#0B3D91", alpha=0.8)
    lim = max(expected.max(), observed.max()) * 1.05
    ax.plot([0, lim], [0, lim], color="#FBB034", linestyle="--", linewidth=2)
    ax.set_xlim(0, lim)
    ax.set_ylim(0, lim)
    ax.set_xlabel("Expected -log10(p)")
    ax.set_ylabel("Observed -log10(p)")
    ax.set_title(f"QQ Plot - {title} (lambda GC = {lam:.3f})")
    fig.tight_layout()
    fig.savefig(out_path, dpi=150)
    plt.close(fig)
    return lam
 
 
def run_parsing_and_rendering(glm_files: list[str], job_dir: str):
    """
    Menghasilkan berkas yang dibutuhkan endpoint download & results:
      - gwas_raw_summary.tsv  (semua SNP, hasil mentah)
      - gwas_summary.csv      (Top 10 SNP signifikan)
      - manhattan_plot.png, qq_plot.png
    Jika ada banyak fenotipe, berkas utama memakai fenotipe pertama;
    plot per fenotipe tetap disimpan sebagai manhattan_{pheno}.png / qq_{pheno}.png.
    """
    generated = []
    primary_done = False
 
    for glm_file in glm_files:
        parts = os.path.basename(glm_file).split(".")
        pheno_name = parts[1] if len(parts) > 3 else "result"
 
        df = _load_glm(glm_file)
        if df.empty:
            continue
 
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
 
    return generated
 
 
def generate_pdf_report(result_id: str, job_dir: str) -> str:
    pdf_path = os.path.join(job_dir, f"GWAS_Report_{result_id}.pdf")
    doc = SimpleDocTemplate(pdf_path, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []
 
    title_style = ParagraphStyle("TitleStyle", parent=styles["Heading1"], fontSize=18, spaceAfter=12)
    story.append(Paragraph(f"GWAS Analysis Report - {result_id}", title_style))
    story.append(Spacer(1, 12))
    story.append(Paragraph("<b>Status:</b> Completed", styles["Normal"]))
    story.append(Spacer(1, 12))
 
    for name, label in [("manhattan_plot.png", "Manhattan Plot"), ("qq_plot.png", "QQ Plot")]:
        path = os.path.join(job_dir, name)
        if os.path.exists(path):
            story.append(Paragraph(f"<b>{label}</b>", styles["Heading2"]))
            story.append(Spacer(1, 6))
            story.append(Image(path, width=450, height=225 if "manhattan" in name else 450))
            story.append(Spacer(1, 12))
 
    doc.build(story)
    return pdf_path