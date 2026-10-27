import os
import pandas as pd
import matplotlib.pyplot as plt
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def run_parsing_and_rendering(glm_files: list[str], job_dir: str):
    """
    Membaca setiap file hasil GLM (per fenotipe) dan merender Manhattan/Q-Q Plot.
    """
    generated_plots = []
    for glm_file in glm_files:
        filename = os.path.basename(glm_file)
        parts = filename.split('.')
        pheno_name = parts[1] if len(parts) > 3 else "result"
        
        df = pd.read_csv(glm_file, sep=r'\s+')
        
        p_col = 'P' if 'P' in df.columns else 'p_value'
        if p_col not in df.columns:
            continue
            
        df = df.dropna(subset=[p_col])
        
        plot_out_path = os.path.join(job_dir, f"manhattan_{pheno_name}.png")
        
        plt.figure(figsize=(10, 5))
        plt.scatter(range(len(df)), -pd.Series(df[p_col]).apply(lambda x: pd.np.log10(x) if x > 0 else 0), c='blue', alpha=0.6, s=10)
        plt.title(f"Manhattan Plot - {pheno_name}")
        plt.xlabel("Variants")
        plt.ylabel("-log10(p-value)")
        plt.tight_layout()
        plt.savefig(plot_out_path)
        plt.close()
        
        generated_plots.append(plot_out_path)
        
    return generated_plots


def generate_pdf_report(result_id: str, job_dir: str) -> str:
    """
    Menghasilkan laporan PDF ringkas dari hasil analisis GWAS.
    """
    pdf_path = os.path.join(job_dir, f"GWAS_Report_{result_id}.pdf")
    doc = SimpleDocTemplate(pdf_path, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []

    # Title
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=18,
        spaceAfter=12
    )
    story.append(Paragraph(f"GWAS Analysis Report - {result_id}", title_style))
    story.append(Spacer(1, 12))

    # General info
    story.append(Paragraph("<b>Status:</b> Completed", styles['Normal']))
    story.append(Spacer(1, 12))

    # Lampirkan Plot jika ada
    for file in os.listdir(job_dir):
        if file.startswith("manhattan_") and file.endswith(".png"):
            plot_path = os.path.join(job_dir, file)
            story.append(Paragraph(f"<b>Visualization:</b> {file}", styles['Heading2']))
            story.append(Spacer(1, 6))
            story.append(Image(plot_path, width=450, height=225))
            story.append(Spacer(1, 12))

    doc.build(story)
    return pdf_path