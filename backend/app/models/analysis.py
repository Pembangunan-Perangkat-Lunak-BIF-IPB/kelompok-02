import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Enum, JSON, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class AnalysisStatus(str, enum.Enum):
    QUEUED = "Queued"
    RUNNING = "Running"
    SUCCESS = "Success"
    FAILED = "Failed"

class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    result_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. GWAS-2026-IDN-0001
    status = Column(Enum(AnalysisStatus), default=AnalysisStatus.QUEUED, nullable=False)
    progress = Column(Integer, default=0) # 0 - 100%
    parameters = Column(JSON, nullable=True) # MAF, call rate, jumlah PC
    vcf_path = Column(Text, nullable=False)
    csv_path = Column(Text, nullable=False)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    finished_at = Column(DateTime, nullable=True)

    stages = relationship("AnalysisStage", back_populates="analysis", cascade="all, delete-orphan")

class AnalysisStage(Base):
    __tablename__ = "analysis_stages"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id", ondelete="CASCADE"), nullable=False)
    stage_name = Column(String(100), nullable=False) # Validation, QC, PCA, Association, Visualization
    status = Column(Enum(AnalysisStatus), default=AnalysisStatus.QUEUED, nullable=False)
    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)

    analysis = relationship("Analysis", back_populates="stages")
