from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

# 1. Entitas Aksesi (Accession)
class Accession(Base):
    __tablename__ = "accessions"

    accession_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    accession_name = Column(String, unique=True, nullable=False, index=True)
    origin_country = Column(String, nullable=True)

    measurements = relationship("PhenotypeMeasurement", back_populates="accession")


# 2. Entitas Genotipe / SNP (snp_genotype)
class SNPGenotype(Base):
    __tablename__ = "snp_genotypes"

    snp_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    chrom = Column(String, nullable=False, index=True)
    position = Column(Integer, nullable=False, index=True)
    allele_ref = Column(String, nullable=False)
    allele_alt = Column(String, nullable=False)

    gwas_results = relationship("GWASResult", back_populates="snp")


# 3. Entitas Fenotipe (phenotype)
class Phenotype(Base):
    __tablename__ = "phenotypes"

    phenotype_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    trait_name = Column(String, nullable=False, index=True)
    trait_unit = Column(String, nullable=True)

    measurements = relationship("PhenotypeMeasurement", back_populates="phenotype")
    gwas_results = relationship("GWASResult", back_populates="phenotype")


# 4. Entitas Pengukuran Fenotipe (phenotype_measurement)
class PhenotypeMeasurement(Base):
    __tablename__ = "phenotype_measurements"

    measurement_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    trait_value = Column(Float, nullable=False)
    measurement_date = Column(DateTime(timezone=True), server_default=func.now())

    accession_id = Column(Integer, ForeignKey("accessions.accession_id"), nullable=False)
    phenotype_id = Column(Integer, ForeignKey("phenotypes.phenotype_id"), nullable=False)

    accession = relationship("Accession", back_populates="measurements")
    phenotype = relationship("Phenotype", back_populates="measurements")


# 5. Entitas Model Analisis (analysis_model)
class AnalysisModel(Base):
    __tablename__ = "analysis_models"

    model_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    model_name = Column(String, nullable=False)
    software_used = Column(String, nullable=False)

    gwas_results = relationship("GWASResult", back_populates="model")


# 6. Entitas Hasil Asosiasi (gwas_result)
class GWASResult(Base):
    __tablename__ = "gwas_results"

    result_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    p_value = Column(Float, nullable=False, index=True)
    maf = Column(Float, nullable=False)
    effect_size = Column(Float, nullable=False) # beta / odds ratio

    snp_id = Column(Integer, ForeignKey("snp_genotypes.snp_id"), nullable=False)
    phenotype_id = Column(Integer, ForeignKey("phenotypes.phenotype_id"), nullable=False)
    model_id = Column(Integer, ForeignKey("analysis_models.model_id"), nullable=False)

    snp = relationship("SNPGenotype", back_populates="gwas_results")
    phenotype = relationship("Phenotype", back_populates="gwas_results")
    model = relationship("AnalysisModel", back_populates="gwas_results")