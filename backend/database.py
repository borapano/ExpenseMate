import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# 1. GJETJA E SKEDARIT .ENV
BASE_DIR = Path(__file__).resolve().parent
env_path = BASE_DIR / ".env"
load_dotenv(dotenv_path=env_path)

# 2. MARRJA DHE RREGULLIMI I URL-SË
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

print("\n=== KONTROLLI I LIDHJES ME DATABASE ===")
if SQLALCHEMY_DATABASE_URL:
    if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
        SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)
    print(f"✅ Lidhja me Neon.tech u gjet me sukses!")
else:
    raise ValueError("❌ ERROR: DATABASE_URL nuk u gjet te skedari .env!")
print("========================================\n")

# 3. ENGINE (I konfiguruar për Neon/PostgreSQL)
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    connect_args={"sslmode": "require"}
)

# 4. SESSION & BASE
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 5. DEPENDENCY (Për t'u përdorur në FastAPI)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()