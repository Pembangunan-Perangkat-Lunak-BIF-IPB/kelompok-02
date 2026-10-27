import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Enum, JSON, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class AnalysisStatus(str, enum.Enum):
    QUEUED = "Queued"
    RUNNING = "Running"
    SUCCESS = "Selesai"
    FAILED = "Gagal"

class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    result_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. GWAS-2026-IDN-0001
    status = Column(Enum(AnalysisStatus), default=AnalysisStatus.QUEUED, nullable=False)
    progress = Column(Integer, default=0)
    estimated_time = Column(String(50), default="~2 Menit")
    
    parameters = Column(JSON, nullable=True) # MAF, call_rate, num_pcs
    vcf_path = Column(Text, nullable=False)
    csv_path = Column(Text, nullable=False)
    results = Column(JSON, nullable=True) # Output file path (Manhattan/QQ plots, top SNPs CSV)

    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    finished_at = Column(DateTime, nullable=True)

    stages = relationship("AnalysisStage", back_populates="analysis", cascade="all, delete-orphan")


class AnalysisStage(Base):
    __tablename__ = "analysis_stages"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id", ondelete="CASCADE"), nullable=False)
    stage_key = Column(String(50), nullable=False)
    stage_name = Column(String(100), nullable=False)
    status = Column(Enum(AnalysisStatus), default=AnalysisStatus.QUEUED, nullable=False)
    duration_seconds = Column(Integer, default=0)
    detail_text = Column(Text, nullable=True)
    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)

    analysis = relationship("Analysis", back_populates="stages")