import os
import logging
from uuid import UUID
from decimal import Decimal
from typing import List

from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
import uvicorn

import models, schemas, crud, security
from database import SessionLocal, engine

# --- CONFIG & LOGGING ---
load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    models.Base.metadata.create_all(bind=engine)
    logger.info("✅ Database u sinkronizua me sukses.")
except Exception as e:
    logger.error(f"❌ Gabim Database: {e}")

app = FastAPI(title="ExpenseMate API", version="1.6.3")

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # më fleksibël për dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

# --- DEPENDENCIES ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = security.decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="TOKEN_INVALID")
    try:
        user_id = UUID(payload.get("sub"))
    except:
        raise HTTPException(status_code=401, detail="TOKEN_CORRUPTED")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="USER_NOT_FOUND")
    return user

# 🔥 HELPER → STANDARD FORMAT (KY ESHTE SEKRETI)
def format_expense(expense):
    return {
        "id": str(expense.id),
        "group_id": str(expense.group_id),
        "payer_id": str(expense.payer_id),
        "payer_name": expense.payer.name if expense.payer else "Unknown",
        "amount": float(expense.amount),
        "description": expense.description,
        "category": expense.category,
        "expense_date": expense.expense_date,
        "created_date": expense.created_date,
        "participants": [
            {
                "user_id": str(p.user_id),
                "user_name": p.user.name if p.user else "Unknown",
                "share_amount": float(p.share_amount),
                "is_settled": p.is_settled
            }
            for p in expense.participants
        ]
    }

# --- AUTH ---
@app.post("/auth/token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, form_data.username)
    if not user or not security.verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="INVALID_CREDENTIALS")

    return {
        "access_token": security.create_access_token({"sub": str(user.id)}),
        "token_type": "bearer"
    }

# --- USERS ---
@app.post("/users/", response_model=schemas.UserOut)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    return crud.create_user(db, user)

@app.get("/users/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(get_current_user)):
    return current_user

# --- GROUPS ---
@app.post("/groups/", response_model=schemas.GroupOut)
def create_group(group: schemas.GroupCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    new_group = crud.create_group(db, group, current_user.id)
    return read_group(new_group.id, db, current_user)

@app.get("/groups/me", response_model=List[schemas.GroupOut])
def my_groups(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    groups = crud.get_user_groups(db, current_user.id)

    result = []
    for g in groups:
        total = db.query(func.sum(models.Expense.amount)).filter(models.Expense.group_id == g.id).scalar() or 0

        result.append({
            "id": str(g.id),
            "name": g.name,
            "description": g.description or "",
            "code": g.code,
            "creator_id": str(g.creator_id),
            "created_date": g.created_date,
            "members": [
                {
                    "user_id": str(m.user.id),
                    "user_name": m.user.name,
                    "user_email": m.user.email
                } for m in g.members
            ],
            "expenses": [],
            "total_expenses": float(total)
        })

    return result

@app.get("/groups/{group_id}", response_model=schemas.GroupOut)
def read_group(group_id: UUID, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(404, "GROUP_NOT_FOUND")

    member = db.query(models.GroupMember).filter_by(user_id=current_user.id, group_id=group_id).first()
    if not member:
        raise HTTPException(403, "ACCESS_DENIED")

    total = db.query(func.sum(models.Expense.amount)).filter(models.Expense.group_id == group_id).scalar() or 0

    return {
        "id": str(group.id),
        "name": group.name,
        "description": group.description or "",
        "code": group.code,
        "creator_id": str(group.creator_id),
        "created_date": group.created_date,
        "members": [
            {
                "user_id": str(m.user.id),
                "user_name": m.user.name,
                "user_email": m.user.email
            } for m in group.members
        ],
        "expenses": [format_expense(e) for e in group.expenses],
        "total_expenses": float(total)
    }

@app.post("/groups/join", response_model=schemas.GroupOut)
def join_group(data: schemas.GroupJoin, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    group = crud.join_group_by_code(db, data.invite_code, current_user.id)
    if not group:
        raise HTTPException(404, "INVALID_CODE")
    return read_group(group.id, db, current_user)

# --- EXPENSES ---
@app.post("/expenses/", response_model=dict)
def create_expense(expense: schemas.ExpenseCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_expense = crud.create_expense(db, expense, current_user.id)

    # 🔥 KTHE FORMATIN E SAKTË
    db.refresh(db_expense)
    return format_expense(db_expense)

@app.put("/expenses/{expense_id}", response_model=dict)
def update_expense(expense_id: UUID, expense: schemas.ExpenseCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_expense = crud.update_expense(db, expense_id, expense, current_user.id)

    if not db_expense:
        raise HTTPException(404, "NOT_FOUND")

    db.refresh(db_expense)
    return format_expense(db_expense)

@app.delete("/expenses/{expense_id}")
def delete_expense(expense_id: UUID, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    success = crud.delete_expense(db, expense_id, current_user.id)

    if not success:
        raise HTTPException(404, "NOT_FOUND")

    return {"detail": "DELETED"}

# --- RUN ---
if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)