import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# 1. Lexon .env
load_dotenv()

# 2. Merr DATABASE_URL dhe korrigjon prefix-in nëse duhet
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# Kjo rregullon një bug të mundshëm nëse linku vjen si 'postgres://'
if SQLALCHEMY_DATABASE_URL and SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# 3. Engine (me pool_pre_ping për stabilitet me Neon)
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True
)

# 4. Session
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# 5. Base për modelet
Base = declarative_base()

# 6. Dependency për DB (p.sh. në FastAPI)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()