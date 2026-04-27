import os
import logging
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# --- CONFIG & LOGGING ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 1. LOCATE .env
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(dotenv_path=BASE_DIR / ".env")

# 2. BUILD DATABASE URL
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

if SQLALCHEMY_DATABASE_URL:
    # SQLAlchemy requires "postgresql://" not the legacy "postgres://"
    if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
        SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)
    logger.info("✅ DATABASE_URL loaded successfully.")
else:
    raise ValueError("❌ DATABASE_URL not found in .env file!")

# 3. ENGINE — tuned for Neon.tech serverless PostgreSQL
#
#   pool_size=5       : Keep 5 warm connections alive (avoids cold-start per request)
#   max_overflow=10   : Allow 10 extra burst connections under load
#   pool_recycle=300  : Recycle connections every 5 min (Neon closes idle conns ~5 min)
#   pool_timeout=30   : Raise PoolTimeout after 30s waiting for a connection
#   pool_pre_ping     : Validate connection health before each use
#   connect_timeout=10: TCP-level timeout — prevents hanging indefinitely on a cold start
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_recycle=300,
    pool_timeout=30,
    pool_pre_ping=True,
    connect_args={
        "sslmode": "require",
        "connect_timeout": 10,
    }
)

# 4. SESSION & BASE
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 5. DEPENDENCY — use in FastAPI route handlers
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()