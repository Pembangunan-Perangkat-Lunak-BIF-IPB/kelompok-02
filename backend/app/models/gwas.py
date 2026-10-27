from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base

# 1. Entitas Aksesi (accession)
class Accession(Base):
    __tablename__ = "accessions"

    accession_id = Column(Integer, primary_key=True, index=True)
    accession_name = Column(String(100), nullable=False)
    origin_country = Column(String(100), nullable=True)

    measurements = relationship("PhenotypeMeasurement", back_populates="accession")


# 2. Entitas Genotipe / SNP (snp_genotype)[cite: 15]
class SNPGenotype(Base):
    __tablename__ = "snp_genotypes"

    snp_id = Column(Integer, primary_key=True, index=True)
    chrom = Column(String(20), nullable=False, index=True)
    position = Column(Integer, nullable=False, index=True)
    allele_ref = Column(String(10), nullable=False)
    allele_alt = Column(String(10), nullable=False)

    gwas_results = relationship("GWASResult", back_populates="snp")


# 3. Entitas Fenotipe (phenotype)[cite: 15]
class Phenotype(Base):
    __tablename__ = "phenotypes"

    phenotype_id = Column(Integer, primary_key=True, index=True)
    trait_name = Column(String(100), nullable=False, index=True)
    trait_unit = Column(String(50), nullable=True)

    measurements = relationship("PhenotypeMeasurement", back_populates="phenotype")
    gwas_results = relationship("GWASResult", back_populates="phenotype")


# 4. Entitas Pengukuran Fenotipe (phenotype_measurement)[cite: 15]
class PhenotypeMeasurement(Base):
    __tablename__ = "phenotype_measurements"

    measurement_id = Column(Integer, primary_key=True, index=True)
    trait_value = Column(Float, nullable=False)
    measurement_date = Column(DateTime, default=datetime.utcnow)
    accession_id = Column(Integer, ForeignKey("accessions.accession_id"), nullable=False)
    phenotype_id = Column(Integer, ForeignKey("phenotypes.phenotype_id"), nullable=False)

    accession = relationship("Accession", back_populates="measurements")
    phenotype = relationship("Phenotype", back_populates="measurements")


# 5. Entitas Model Analisis (analysis_model)[cite: 15]
class AnalysisModel(Base):
    __tablename__ = "analysis_models"

    model_id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(100), nullable=False) # e.g. PLINK 2.0 Linear Regression
    software_used = Column(String(100), nullable=False) # e.g. PLINK 2.0 / Python

    gwas_results = relationship("GWASResult", back_populates="model")


# 6. Entitas Hasil Asosiasi (gwas_result)[cite: 15]
class GWASResult(Base):
    __tablename__ = "gwas_results"

    result_id = Column(Integer, primary_key=True, index=True)
    p_value = Column(Float, nullable=False, index=True)
    maf = Column(Float, nullable=True)
    effect_size = Column(Float, nullable=True) # Beta / Odds Ratio
    
    snp_id = Column(Integer, ForeignKey("snp_genotypes.snp_id"), nullable=False)
    phenotype_id = Column(Integer, ForeignKey("phenotypes.phenotype_id"), nullable=False)
    model_id = Column(Integer, ForeignKey("analysis_models.model_id"), nullable=False)

    snp = relationship("SNPGenotype", back_populates="gwas_results")
    phenotype = relationship("Phenotype", back_populates="gwas_results")
    model = relationship("AnalysisModel", back_populates="gwas_results")