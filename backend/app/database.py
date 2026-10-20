import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Load file .env lokal
load_dotenv()

# Ambil DATABASE_URL dari .env
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql+psycopg://postgres:postgres@localhost:5432/jiwasku"
)

# Inisialisasi Engine SQLAlchemy
engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base Class untuk Model
Base = declarative_base()

# Dependency DB untuk router
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()