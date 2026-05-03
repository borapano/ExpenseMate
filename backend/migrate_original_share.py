import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv("DATABASE_URL")
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

engine = create_engine(db_url)
with engine.connect() as conn:
    print("Adding original_share_amount column...")
    conn.execute(text("""
        ALTER TABLE expense_participants
        ADD COLUMN IF NOT EXISTS original_share_amount NUMERIC(10, 2)
    """))
    # Populate with current share_amount for all existing rows
    conn.execute(text("""
        UPDATE expense_participants
        SET original_share_amount = share_amount
        WHERE original_share_amount IS NULL
    """))
    conn.commit()
    print("Done. All existing rows have original_share_amount set.")
