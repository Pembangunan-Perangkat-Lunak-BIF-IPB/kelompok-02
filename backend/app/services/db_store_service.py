from pathlib import Path
import pandas as pd
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from app.models.gwas import (Accession, SNPGenotype, Phenotype,
                             PhenotypeMeasurement, AnalysisModel, GWASResult)

CHUNK = 2000


def _get_or_create(db: Session, model, **kw):
    obj = db.execute(select(model).filter_by(**kw)).scalars().first()
    if not obj:
        obj = model(**kw)
        db.add(obj)
        db.flush()
    return obj


def _f(v):
    return None if pd.isna(v) else float(v)


def store_measurements(db: Session, analysis_id: int, matched_csv: str, target_trait: str = None):
    df = pd.read_csv(matched_csv)
    id_col = "Sample_ID" if "Sample_ID" in df.columns else "IID"

    # satu query per sampel, bukan per sampel x fenotipe
    acc_map = {name: _get_or_create(db, Accession, accession_name=name).accession_id
               for name in df[id_col].astype(str).unique()}

    candidate_traits = [target_trait] if target_trait and target_trait in df.columns else [c for c in df.columns if c not in ("Sample_ID", "IID", "FID")]

    for trait in candidate_traits:
        if not pd.api.types.is_numeric_dtype(df[trait]):
            continue
        pheno = _get_or_create(db, Phenotype, trait_name=trait)
        db.add_all([
            PhenotypeMeasurement(trait_value=float(v), accession_id=acc_map[str(s)],
                                 phenotype_id=pheno.phenotype_id, analysis_id=analysis_id)
            for s, v in zip(df[id_col], df[trait]) if pd.notna(v)
        ])
    db.flush()

def _trait_from_glm(path: str) -> str:
    # gwas_assoc.<TRAIT>.glm.linear  ->  <TRAIT>
    return Path(path).name.removeprefix("gwas_assoc.").split(".glm.")[0]

def store_glm(db: Session, analysis_id: int, glm_path: str, trait_name: str, model_id: int):
    df = pd.read_csv(glm_path, sep="\t")
    df.columns = [c.lstrip("#") for c in df.columns]
    if "TEST" in df.columns:                      # buang baris kovariat
        df = df[df["TEST"] == "ADD"]
    df = df.copy()
    df["P"] = pd.to_numeric(df["P"], errors="coerce")
    df = df[df["P"].notna()]                      # P=NA (mis. ERRCODE VIF_INFINITE) dilewati
    if df.empty:
        return 0

    pheno = _get_or_create(db, Phenotype, trait_name=trait_name)

    # 1) upsert SNP, dapatkan snp_id
    loci = df[["CHROM", "POS", "REF", "ALT"]].drop_duplicates()
    snp_rows = [dict(chrom=str(c), position=int(p), allele_ref=str(r), allele_alt=str(a))
                for c, p, r, a in loci.itertuples(index=False)]
    id_map = {}
    for i in range(0, len(snp_rows), CHUNK):
        stmt = pg_insert(SNPGenotype).values(snp_rows[i:i + CHUNK])
        stmt = stmt.on_conflict_do_update(
            constraint="uq_snp_locus", set_={"allele_ref": stmt.excluded.allele_ref}
        ).returning(SNPGenotype.snp_id, SNPGenotype.chrom, SNPGenotype.position,
                    SNPGenotype.allele_ref, SNPGenotype.allele_alt)
        for r in db.execute(stmt):
            id_map[(r.chrom, r.position, r.allele_ref, r.allele_alt)] = r.snp_id

    # 2) insert hasil asosiasi
    effect_col = "BETA" if "BETA" in df.columns else ("OR" if "OR" in df.columns else None)
    rows = []
    for rec in df.to_dict("records"):
        f = _f(rec.get("A1_FREQ", float("nan")))
        rows.append(dict(
            analysis_id=analysis_id, phenotype_id=pheno.phenotype_id, model_id=model_id,
            snp_id=id_map[(str(rec["CHROM"]), int(rec["POS"]), str(rec["REF"]), str(rec["ALT"]))],
            p_value=float(rec["P"]),
            effect_size=_f(rec[effect_col]) if effect_col else None,
            maf=min(f, 1 - f) if f is not None else None,
        ))
    for i in range(0, len(rows), CHUNK):
        db.execute(pg_insert(GWASResult).values(rows[i:i + CHUNK])
                   .on_conflict_do_nothing(constraint="uq_result_per_analysis"))
    return len(rows)


def store_analysis_results(db: Session, analysis_id: int, matched_csv: str, glm_files: list[str], pheno_name: str = None):
    try:
        model = _get_or_create(db, AnalysisModel,
                               model_name="PLINK 2.0 --glm", software_used="PLINK 2.0")
        store_measurements(db, analysis_id, matched_csv, target_trait=pheno_name)
        total = 0
        for path in glm_files:
            if ".glm." not in Path(path).name:
                continue
            total += store_glm(db, analysis_id, path, _trait_from_glm(path), model.model_id)
        db.commit()
        return total
    except Exception:
        db.rollback()
        raise