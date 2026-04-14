import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# 1. Gjen rrugën absolute të skedarit .env (Zgjidhja për WSL/Windows)
env_path = Path(__name__).parent.absolute() / ".env"
load_dotenv(dotenv_path=env_path)

# 2. Merr DATABASE_URL
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# --- DEBUG BLOCK (Kjo do të të tregojë ku është gabimi) ---
print("\n=== KONTROLLI I LIDHJES ME DATABASE ===")
if SQLALCHEMY_DATABASE_URL:
    # Rregullon prefix-in nëse duhet
    if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
        SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    # Printon vetëm fillimin e URL-së për siguri
    print(f"✅ URL u gjet: {SQLALCHEMY_DATABASE_URL[:25]}...")
else:
    print("❌ ERROR: DATABASE_URL nuk u gjet te .env!")
    print("Sigurohu që skedari .env është në të njëjtin folder me main.py")
    # Nëse je në hall të madh, vendose URL-në direkt këtu poshtë për provë:
    # SQLALCHEMY_DATABASE_URL = "postgresql://user:pass@ep-cool-darkness...neon.tech/neondb"
print("========================================\n")

# 3. Engine (Nëse URL mungon, këtu do të jepte error, prandaj shtojmë këtë kontroll)
if not SQLALCHEMY_DATABASE_URL:
    raise ValueError("Nuk mund të niset serveri pa DATABASE_URL. Kontrollo .env")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True  # E rëndësishme për Neon
)

# 4. Session
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# 5. Base për modelet
Base = declarative_base()

# 6. Dependency për DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()