from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# --- Accession Schema ---
class AccessionBase(BaseModel):
    accession_name: str
    origin_country: Optional[str] = None

class AccessionResponse(AccessionBase):
    accession_id: int
    class Config:
        from_attributes = True

# --- SNP Genotype Schema ---
class SNPGenotypeBase(BaseModel):
    chrom: str
    position: int
    allele_ref: str
    allele_alt: str

class SNPGenotypeResponse(SNPGenotypeBase):
    snp_id: int
    class Config:
        from_attributes = True

# --- Phenotype Schema ---
class PhenotypeBase(BaseModel):
    trait_name: str
    trait_unit: Optional[str] = None

class PhenotypeResponse(PhenotypeBase):
    phenotype_id: int
    class Config:
        from_attributes = True

# --- Analysis Model Schema ---
class AnalysisModelBase(BaseModel):
    model_name: str
    software_used: str

class AnalysisModelResponse(AnalysisModelBase):
    model_id: int
    class Config:
        from_attributes = True

# --- GWAS Result Schema ---
class GWASResultBase(BaseModel):
    p_value: float
    maf: float
    effect_size: float
    snp_id: int
    phenotype_id: int
    model_id: int

class GWASResultResponse(GWASResultBase):
    result_id: int
    snp: Optional[SNPGenotypeResponse] = None
    phenotype: Optional[PhenotypeResponse] = None
    model: Optional[AnalysisModelResponse] = None

    class Config:
        from_attributes = True

# --- Filter & Response untuk Top Significant SNPs (FR-06 / FR-07) ---
class SignificantSNPFilter(BaseModel):
    p_value_threshold: float = 0.05