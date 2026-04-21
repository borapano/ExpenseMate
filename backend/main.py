import os
import logging
from uuid import UUID
from decimal import Decimal
from typing import List
from datetime import datetime, timedelta, timezone

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

# Sinkronizimi i Database në start
try:
    models.Base.metadata.create_all(bind=engine)
    logger.info("✅ Database u sinkronizua me sukses.")
except Exception as e:
    logger.error(f"❌ Gabim Database: {e}")

app = FastAPI(title="ExpenseMate API", version="1.9.0")

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
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

@app.post("/users/", response_model=schemas.UserOut)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    return crud.create_user(db, user)

@app.get("/users/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.get("/users/me/balance")
def get_my_balance(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    net_bal = crud.get_user_net_balance(db, current_user.id)
    return {"net_balance": float(net_bal)}

@app.get("/users/me/spending-history")
def get_spending_history(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_last_10_days_spending(db, current_user.id)

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
        net_bal = crud.get_group_net_balance(db, current_user.id, g.id)
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
            "total_expenses": float(total),
            "net_balance": float(net_bal)
        })
    return result

@app.get("/groups/{group_id}")
def read_group(group_id: UUID, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(404, "GROUP_NOT_FOUND")

    member_check = db.query(models.GroupMember).filter_by(user_id=current_user.id, group_id=group_id).first()
    if not member_check:
        raise HTTPException(403, "ACCESS_DENIED")

    total = db.query(func.sum(models.Expense.amount)).filter(models.Expense.group_id == group_id).scalar() or 0
    sorted_expenses = db.query(models.Expense).filter_by(group_id=group_id).order_by(models.Expense.created_date.desc()).all()

    my_debts = []
    for m in group.members:
        if m.user_id != current_user.id:
            i_owe = db.query(func.sum(models.ExpenseParticipant.share_amount))\
                .join(models.Expense).filter(models.Expense.group_id == group_id, models.Expense.payer_id == m.user_id, models.ExpenseParticipant.user_id == current_user.id, models.ExpenseParticipant.is_settled == False).scalar() or 0
            owed_to_me = db.query(func.sum(models.ExpenseParticipant.share_amount))\
                .join(models.Expense).filter(models.Expense.group_id == group_id, models.Expense.payer_id == current_user.id, models.ExpenseParticipant.user_id == m.user_id, models.ExpenseParticipant.is_settled == False).scalar() or 0
            
            net_bal = float(i_owe) - float(owed_to_me)
            if net_bal > 0:
                # KONTROLLI PËR STATUSIN PENDING
                seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
                is_pending = db.query(models.Settlement).filter(
                    models.Settlement.group_id == group_id,
                    models.Settlement.sender_id == current_user.id,
                    models.Settlement.receiver_id == m.user_id,
                    models.Settlement.status == "PENDING",
                    models.Settlement.created_at >= seven_days_ago
                ).first() is not None

                my_debts.append({
                    "user_id": str(m.user_id),
                    "user_name": m.user.name,
                    "amount": round(net_bal, 2),
                    "is_pending": is_pending
                })

    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    pending_settlements = db.query(models.Settlement).filter(
        models.Settlement.group_id == group_id,
        models.Settlement.receiver_id == current_user.id,
        models.Settlement.status == "PENDING",
        models.Settlement.created_at >= seven_days_ago
    ).all()

    return {
        "id": str(group.id),
        "name": group.name,
        "description": group.description or "",
        "code": group.code,
        "creator_id": str(group.creator_id),
        "created_date": group.created_date,
        "members": [{"user_id": str(m.user.id), "user_name": m.user.name, "user_email": m.user.email} for m in group.members],
        "expenses": [format_expense(e) for e in sorted_expenses],
        "total_expenses": float(total),
        "my_debts": my_debts,
        "pending_settlements": [{"id": str(s.id), "sender_name": s.sender.name, "amount": float(s.amount)} for s in pending_settlements]
    }

@app.post("/groups/join", response_model=schemas.GroupOut)
def join_group(data: schemas.GroupJoin, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    group = crud.join_group_by_code(db, data.invite_code, current_user.id)
    if not group: raise HTTPException(404, "INVALID_CODE")
    return read_group(group.id, db, current_user)

# --- EXPENSES ---
@app.post("/expenses/", response_model=dict)
def create_expense(expense: schemas.ExpenseCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    is_member = db.query(models.GroupMember).filter_by(user_id=current_user.id, group_id=expense.group_id).first()
    if not is_member: raise HTTPException(status_code=403, detail="NOT_A_GROUP_MEMBER")
    db_expense = crud.create_expense(db, expense, current_user.id)
    db.refresh(db_expense)
    return format_expense(db_expense)

@app.put("/expenses/{expense_id}", response_model=dict)
def update_expense(expense_id: UUID, expense: schemas.ExpenseCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_expense = crud.update_expense(db, expense_id, expense, current_user.id)
    if not db_expense: raise HTTPException(404, "UPDATE_NOT_ALLOWED_OR_NOT_FOUND")
    db.refresh(db_expense)
    return format_expense(db_expense)

@app.delete("/expenses/{expense_id}")
def delete_expense(expense_id: UUID, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    success = crud.delete_expense(db, expense_id, current_user.id)
    if not success: raise HTTPException(404, "DELETE_NOT_ALLOWED_OR_NOT_FOUND")
    return {"detail": "DELETED"}

# --- SETTLEMENTS ---
@app.post("/settlements/", response_model=dict)
def create_settlement(settlement: schemas.SettlementCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Bllokimi i kërkesave duplikatë në pritje
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    existing_pending = db.query(models.Settlement).filter(
        models.Settlement.group_id == settlement.group_id,
        models.Settlement.sender_id == current_user.id,
        models.Settlement.receiver_id == settlement.receiver_id,
        models.Settlement.status == "PENDING",
        models.Settlement.created_at >= seven_days_ago
    ).first()
    
    if existing_pending:
        raise HTTPException(status_code=400, detail="ALREADY_PENDING")

    db_settlement = crud.create_settlement(db, settlement, current_user.id)
    return {
        "id": str(db_settlement.id), 
        "status": db_settlement.status, 
        "amount": float(db_settlement.amount), 
        "receiver_id": str(db_settlement.receiver_id)
    }

@app.get("/groups/{group_id}/settlements", response_model=List[dict])
def get_group_settlements(group_id: UUID, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    settlements = crud.get_group_settlements(db, group_id)
    return [
        {
            "id": str(s.id),
            "sender_id": str(s.sender_id),
            "sender_name": s.sender.name,
            "receiver_id": str(s.receiver_id),
            "receiver_name": s.receiver.name,
            "amount": float(s.amount),
            "status": s.status,
            "created_at": s.created_at
        } for s in settlements
    ]

@app.patch("/settlements/{settlement_id}/confirm")
def confirm_settlement(settlement_id: UUID, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    success = crud.confirm_settlement(db, settlement_id, current_user.id)
    if not success:
        raise HTTPException(status_code=400, detail="CONFIRMATION_FAILED_OR_UNAUTHORIZED")
    return {"detail": "CONFIRMED"}

@app.patch("/settlements/{settlement_id}/reject")
def reject_settlement(settlement_id: UUID, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    success = crud.reject_settlement(db, settlement_id, current_user.id)
    if not success:
        raise HTTPException(status_code=400, detail="REJECTION_FAILED")
    return {"detail": "REJECTED"}

# --- DASHBOARD GLOBAL ---
@app.get("/users/me/settlement_dashboard")
def get_global_settlements(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    my_groups = crud.get_user_groups(db, current_user.id)
    global_debts = []
    
    for g in my_groups:
        for m in g.members:
            if m.user_id != current_user.id:
                i_owe = db.query(func.sum(models.ExpenseParticipant.share_amount))\
                    .join(models.Expense).filter(models.Expense.group_id == g.id, models.Expense.payer_id == m.user_id, models.ExpenseParticipant.user_id == current_user.id, models.ExpenseParticipant.is_settled == False).scalar() or 0
                owed_to_me = db.query(func.sum(models.ExpenseParticipant.share_amount))\
                    .join(models.Expense).filter(models.Expense.group_id == g.id, models.Expense.payer_id == current_user.id, models.ExpenseParticipant.user_id == m.user_id, models.ExpenseParticipant.is_settled == False).scalar() or 0
                
                net_bal = float(i_owe) - float(owed_to_me)
                if net_bal > 0:
                    # Kontrolli i statusit pending kudo në dashboard
                    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
                    is_pending = db.query(models.Settlement).filter(
                        models.Settlement.group_id == g.id,
                        models.Settlement.sender_id == current_user.id,
                        models.Settlement.receiver_id == m.user_id,
                        models.Settlement.status == "PENDING",
                        models.Settlement.created_at >= seven_days_ago
                    ).first() is not None

                    global_debts.append({
                        "user_id": str(m.user_id),
                        "user_name": m.user.name,
                        "group_name": g.name,
                        "group_id": str(g.id),
                        "amount": round(net_bal, 2),
                        "is_pending": is_pending
                    })

    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    pending_requests = db.query(models.Settlement).filter(
        models.Settlement.receiver_id == current_user.id,
        models.Settlement.status == "PENDING",
        models.Settlement.created_at >= seven_days_ago
    ).all()

    return {
        "global_debts": global_debts,
        "global_requests": [
            {
                "id": str(s.id), 
                "sender_name": s.sender.name, 
                "group_id": str(s.group_id), 
                "amount": float(s.amount)
            } for s in pending_requests
        ]
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)