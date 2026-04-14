import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# 1. GJETJA E SKEDARIT .ENV (Fix për WSL/Windows)
# Kjo gjen folderin ku ndodhet ky skedar (database.py) dhe kërkon .env aty
BASE_DIR = Path(__file__).resolve().parent
env_path = BASE_DIR / ".env"
load_dotenv(dotenv_path=env_path)

# 2. MARRJA E URL-SË
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# --- DEBUG BLOCK (Shumë i rëndësishëm për fazën e zhvillimit) ---
print("\n=== KONTROLLI I LIDHJES ME DATABASE ===")
if SQLALCHEMY_DATABASE_URL:
    # Korrigjim për prefix-in e vjetër 'postgres://'
    if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
        SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    print(f"✅ URL u gjet në: {env_path}")
    print(f"✅ Lidhja: {SQLALCHEMY_DATABASE_URL[:30]}...")
else:
    print(f"❌ ERROR: DATABASE_URL nuk u gjet te: {env_path}")
    print("⚠️ KËSHILLË: Kontrollo nëse skedari .env ka emrin saktë (me pikë përpara).")
    
    # NËSE NUK PUNON: Hiq komentet rreshtit poshtë dhe vendos linkun tënd të Neon:
    # SQLALCHEMY_DATABASE_URL = "postgresql://neondb_owner:fjalekalimi_yt@ep-cool-darkness.neon.tech/neondb?sslmode=require"
print("========================================\n")

# 3. KONTROLLI PARA NISJES
if not SQLALCHEMY_DATABASE_URL:
    raise ValueError("Nuk mund të niset serveri pa DATABASE_URL!")

# 4. ENGINE (I konfiguruar për Neon/PostgreSQL)
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,      # Kontrollon nëse lidhja është gjallë para se ta përdorë
    pool_recycle=300,        # Rifreskon lidhjen çdo 5 minuta
    connect_args={"sslmode": "require"} if "neon.tech" in SQLALCHEMY_DATABASE_URL else {}
)

# 5. SESSION & BASE
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

# 6. DEPENDENCY (Për t'u përdorur në FastAPI)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()