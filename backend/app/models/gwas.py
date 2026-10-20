import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    vcf_path = Column(String, nullable=False)
    pheno_path = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    samples = relationship("Sample", back_populates="dataset", cascade="all, delete-orphan")

class Sample(Base):
    __tablename__ = "samples"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    dataset_id = Column(String, ForeignKey("datasets.id"), nullable=False)
    sample_id = Column(String, nullable=False)
    
    dataset = relationship("Dataset", back_populates="samples")
    phenotypes = relationship("Phenotype", back_populates="sample", cascade="all, delete-orphan")

class Variant(Base):
    __tablename__ = "variants"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    chrom = Column(String, nullable=False)
    pos = Column(Integer, nullable=False)
    rsid = Column(String, index=True)
    ref = Column(String, nullable=False)
    alt = Column(String, nullable=False)

class SNPGenotype(Base):
    __tablename__ = "snp_genotypes"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    sample_id = Column(String, ForeignKey("samples.id"), nullable=False)
    variant_id = Column(String, ForeignKey("variants.id"), nullable=False)
    genotype = Column(String, nullable=False)

class Phenotype(Base):
    __tablename__ = "phenotypes"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    sample_id = Column(String, ForeignKey("samples.id"), nullable=False)
    phenotype_value = Column(Float, nullable=True)
    covariates = Column(JSON, nullable=True)

    sample = relationship("Sample", back_populates="phenotypes")