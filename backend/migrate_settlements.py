import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv("DATABASE_URL")
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

engine = create_engine(db_url)
with engine.connect() as conn:
    print("Executing ALTER TABLE...")
    # Add column if not exists
    conn.execute(text("ALTER TABLE settlements ADD COLUMN IF NOT EXISTS expense_id UUID REFERENCES expenses(id)"))
    conn.commit()
    print("Done.")
