import os
import logging
import asyncio
from uuid import UUID
from decimal import Decimal
from typing import List
from datetime import datetime, timedelta, timezone
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
import uvicorn

import models, schemas, crud, security
from database import SessionLocal, engine

# --- CONFIG & LOGGING ---
load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# --- LIFESPAN (replaces on_event startup) ---
# Running create_all inside lifespan prevents blocking Uvicorn workers
# if Neon is in a cold-start state when the server boots.
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: run table sync in a thread pool so the event loop is not blocked
    try:
        await asyncio.to_thread(models.Base.metadata.create_all, engine)
        logger.info("✅ Database schema synced successfully.")
    except Exception as e:
        logger.error(f"❌ Database sync error: {e}")
    yield
    # Shutdown: nothing to clean up (connection pool is handled by SQLAlchemy)
    logger.info("🛑 Server shutting down.")


app = FastAPI(title="ExpenseMate API", version="2.0.0", lifespan=lifespan)

# --- CORS ---
# IMPORTANT: allow_origins=["*"] is spec-invalid when allow_credentials=True.
# Browsers silently reject credentialed requests to wildcard origins.
# List exact origins instead.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
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
    except Exception:
        raise HTTPException(status_code=401, detail="TOKEN_CORRUPTED")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="USER_NOT_FOUND")
    return user


def format_expense(expense):
    try:
        return {
            "id": str(expense.id) if getattr(expense, "id", None) else "",
            "group_id": str(expense.group_id) if getattr(expense, "group_id", None) else "",
            "group_name": expense.group.name if getattr(expense, "group", None) else "Unknown",
            "payer_id": str(expense.payer_id) if getattr(expense, "payer_id", None) else "",
            "payer_name": expense.payer.name if getattr(expense, "payer", None) else "Unknown",
            "amount": float(expense.amount) if getattr(expense, "amount", None) is not None else 0.0,
            "description": expense.description if getattr(expense, "description", None) else "No description",
            "category": expense.category if getattr(expense, "category", None) else "Uncategorized",
            "expense_date": expense.expense_date.isoformat() if getattr(expense, "expense_date", None) else "",
            "created_date": expense.created_date.isoformat() if getattr(expense, "created_date", None) else "",
            "participants": [
                {
                    "user_id": str(p.user_id) if getattr(p, "user_id", None) else "",
                    "user_name": p.user.name if getattr(p, "user", None) else "Unknown",
                    "share_amount": float(p.share_amount) if getattr(p, "share_amount", None) is not None else 0.0,
                    "is_settled": bool(p.is_settled) if getattr(p, "is_settled", None) is not None else False
                }
                for p in getattr(expense, "participants", [])
            ]
        }
    except Exception as e:
        logger.error(f"Error formatting expense {getattr(expense, 'id', 'unknown')}: {e}")
        return {
            "id": str(getattr(expense, "id", "")),
            "group_id": "",
            "group_name": "Error",
            "payer_id": "",
            "payer_name": "Error",
            "amount": 0.0,
            "description": "Error loading expense data",
            "category": "Error",
            "expense_date": "",
            "created_date": "",
            "participants": []
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


@app.post("/users/")
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


@app.put("/users/me/budget")
def update_my_budget(budget_data: dict, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    budget = float(budget_data.get("monthly_budget", 1000.00))
    user = crud.update_user_budget(db, current_user.id, budget)
    return {"monthly_budget": float(user.monthly_budget)}


@app.get("/users/me/analytics/stats")
def get_analytics_stats(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_analytics_stats(db, current_user.id)


@app.get("/users/me/analytics/charts")
def get_analytics_charts(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_analytics_charts(db, current_user.id)


@app.get("/users/me/expenses")
def get_my_expenses(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Get all groups the user belongs to
    memberships = db.query(models.GroupMember).filter(models.GroupMember.user_id == current_user.id).all()
    group_ids = [m.group_id for m in memberships]
    
    if not group_ids:
        return []

    # Get all expenses for these groups, ordered by created_date descending
    expenses = (
        db.query(models.Expense)
        .options(
            joinedload(models.Expense.payer),
            joinedload(models.Expense.participants).joinedload(models.ExpenseParticipant.user),
            joinedload(models.Expense.group)
        )
        .filter(models.Expense.group_id.in_(group_ids))
        .order_by(models.Expense.created_date.desc())
        .limit(50) # Limit to 50 recent transactions
        .all()
    )
    
    return [format_expense(e) for e in expenses]


# --- GROUPS ---
@app.post("/groups/", response_model=schemas.GroupOut)
def create_group(group: schemas.GroupCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    new_group = crud.create_group(db, group, current_user.id)
    return read_group(new_group.id, db, current_user)


@app.get("/groups/me")
def my_groups(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # crud.get_user_groups now eagerly loads members+users in one query
    groups = crud.get_user_groups(db, current_user.id)

    # Bulk total expenses per group in ONE query
    group_ids = [g.id for g in groups]
    totals_rows = (
        db.query(models.Expense.group_id, func.sum(models.Expense.amount).label("total"))
        .filter(models.Expense.group_id.in_(group_ids))
        .group_by(models.Expense.group_id)
        .all()
    )
    totals = {str(row.group_id): float(row.total) for row in totals_rows}

    result = []
    for g in groups:
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
            "total_expenses": totals.get(str(g.id), 0.0),
            "net_balance": float(net_bal)
        })
    return result


@app.get("/groups/{group_id}")
def read_group(group_id: UUID, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Single query: group + members + member users + expenses + participants + payer
    group = (
        db.query(models.Group)
        .options(
            joinedload(models.Group.members).joinedload(models.GroupMember.user),
            joinedload(models.Group.expenses)
                .joinedload(models.Expense.payer),
            joinedload(models.Group.expenses)
                .joinedload(models.Expense.participants)
                .joinedload(models.ExpenseParticipant.user),
        )
        .filter(models.Group.id == group_id)
        .first()
    )
    if not group:
        raise HTTPException(404, "GROUP_NOT_FOUND")

    member_ids = {m.user_id for m in group.members}
    if current_user.id not in member_ids:
        raise HTTPException(403, "ACCESS_DENIED")

    total = sum(float(e.amount) for e in group.expenses)
    sorted_expenses = sorted(group.expenses, key=lambda e: e.created_date, reverse=True)

    now_utc = datetime.now(timezone.utc)
    seven_days_ago = now_utc - timedelta(days=7)
    other_member_ids = [m.user_id for m in group.members if m.user_id != current_user.id]

    # ── Bulk debt query: one pass for ALL members ──────────────────────────────
    # "i_owe[member]" = sum of my shares on expenses THEY paid
    i_owe_rows = (
        db.query(
            models.Expense.payer_id.label("other_user_id"),
            func.sum(models.ExpenseParticipant.share_amount).label("total")
        )
        .join(models.ExpenseParticipant, models.ExpenseParticipant.expense_id == models.Expense.id)
        .filter(
            models.Expense.group_id == group_id,
            models.Expense.payer_id.in_(other_member_ids),
            models.ExpenseParticipant.user_id == current_user.id,
            models.ExpenseParticipant.is_settled == False
        )
        .group_by(models.Expense.payer_id)
        .all()
    )
    i_owe_map = {str(row.other_user_id): float(row.total) for row in i_owe_rows}

    # "owed_to_me[member]" = sum of their shares on expenses I paid
    owed_to_me_rows = (
        db.query(
            models.ExpenseParticipant.user_id.label("other_user_id"),
            func.sum(models.ExpenseParticipant.share_amount).label("total")
        )
        .join(models.Expense, models.Expense.id == models.ExpenseParticipant.expense_id)
        .filter(
            models.Expense.group_id == group_id,
            models.Expense.payer_id == current_user.id,
            models.ExpenseParticipant.user_id.in_(other_member_ids),
            models.ExpenseParticipant.is_settled == False
        )
        .group_by(models.ExpenseParticipant.user_id)
        .all()
    )
    owed_to_me_map = {str(row.other_user_id): float(row.total) for row in owed_to_me_rows}

    # ── Bulk pending-settlement check: one query for ALL members ──────────────
    pending_sent_rows = (
        db.query(models.Settlement.receiver_id)
        .filter(
            models.Settlement.group_id == group_id,
            models.Settlement.sender_id == current_user.id,
            models.Settlement.receiver_id.in_(other_member_ids),
            models.Settlement.status == "PENDING",
            models.Settlement.created_at >= seven_days_ago,
        )
        .all()
    )
    pending_sent_ids = {str(row.receiver_id) for row in pending_sent_rows}

    # Build my_debts list
    member_map = {m.user_id: m.user for m in group.members}
    my_debts = []
    for uid in other_member_ids:
        uid_str = str(uid)
        net_bal = i_owe_map.get(uid_str, 0.0) - owed_to_me_map.get(uid_str, 0.0)
        if net_bal > 0:
            my_debts.append({
                "user_id": uid_str,
                "user_name": member_map[uid].name,
                "amount": round(net_bal, 2),
                "is_pending": uid_str in pending_sent_ids,
            })

    # ── Incoming pending settlements (others paying me) ────────────────────────
    pending_requests = (
        db.query(models.Settlement)
        .options(joinedload(models.Settlement.sender))
        .filter(
            models.Settlement.group_id == group_id,
            models.Settlement.receiver_id == current_user.id,
            models.Settlement.status == "PENDING",
            models.Settlement.created_at >= seven_days_ago,
        )
        .all()
    )

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
        "pending_settlements": [
            {"id": str(s.id), "sender_name": s.sender.name, "amount": float(s.amount)}
            for s in pending_requests
        ]
    }


@app.post("/groups/join")
def join_group(data: schemas.GroupJoin, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    group = crud.join_group_by_code(db, data.invite_code, current_user.id)
    if not group:
        raise HTTPException(404, "INVALID_CODE")
    return read_group(group.id, db, current_user)


# --- EXPENSES ---
@app.post("/expenses/")
def create_expense(expense: schemas.ExpenseCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    is_member = db.query(models.GroupMember).filter_by(user_id=current_user.id, group_id=expense.group_id).first()
    if not is_member:
        raise HTTPException(status_code=403, detail="NOT_A_GROUP_MEMBER")
    db_expense = crud.create_expense(db, expense, current_user.id)
    db.refresh(db_expense)
    return format_expense(db_expense)


@app.put("/expenses/{expense_id}")
def update_expense(expense_id: UUID, expense: schemas.ExpenseCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_expense = crud.update_expense(db, expense_id, expense, current_user.id)
    if not db_expense:
        raise HTTPException(404, "UPDATE_NOT_ALLOWED")
    db.refresh(db_expense)
    return format_expense(db_expense)


@app.delete("/expenses/{expense_id}")
def delete_expense(expense_id: UUID, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    success = crud.delete_expense(db, expense_id, current_user.id)
    if not success:
        raise HTTPException(404, "DELETE_NOT_ALLOWED")
    return {"detail": "DELETED"}


# --- SETTLEMENTS ---
@app.post("/settlements/")
def create_settlement(settlement: schemas.SettlementCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    now_utc = datetime.now(timezone.utc)
    seven_days_ago = now_utc - timedelta(days=7)

    existing = db.query(models.Settlement).filter(
        models.Settlement.group_id == settlement.group_id,
        models.Settlement.sender_id == current_user.id,
        models.Settlement.receiver_id == settlement.receiver_id,
        models.Settlement.status == "PENDING",
        models.Settlement.created_at >= seven_days_ago
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="ALREADY_PENDING")

    db_settlement = crud.create_settlement(db, settlement, current_user.id)
    return {
        "id": str(db_settlement.id),
        "status": db_settlement.status,
        "amount": float(db_settlement.amount),
        "receiver_id": str(db_settlement.receiver_id)
    }


@app.get("/groups/{group_id}/settlements")
def get_group_settlements(group_id: UUID, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    settlements = crud.get_group_settlements(db, group_id)
    return [
        {
            "id": str(s.id),
            "sender_name": s.sender.name,
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
        raise HTTPException(status_code=400, detail="CONFIRMATION_FAILED")
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
    now_utc = datetime.now(timezone.utc)
    seven_days_ago = now_utc - timedelta(days=7)

    group_ids = [g.id for g in my_groups]
    if not group_ids:
        return {"global_debts": [], "global_requests": []}

    # ── Bulk i_owe across all groups ──────────────────────────────────────────
    i_owe_rows = (
        db.query(
            models.Expense.group_id,
            models.Expense.payer_id.label("other_user_id"),
            func.sum(models.ExpenseParticipant.share_amount).label("total")
        )
        .join(models.ExpenseParticipant, models.ExpenseParticipant.expense_id == models.Expense.id)
        .filter(
            models.Expense.group_id.in_(group_ids),
            models.ExpenseParticipant.user_id == current_user.id,
            models.ExpenseParticipant.is_settled == False
        )
        .group_by(models.Expense.group_id, models.Expense.payer_id)
        .all()
    )
    # key: (group_id_str, other_user_id_str)
    i_owe_map = {(str(r.group_id), str(r.other_user_id)): float(r.total) for r in i_owe_rows}

    # ── Bulk owed_to_me across all groups ─────────────────────────────────────
    owed_to_me_rows = (
        db.query(
            models.Expense.group_id,
            models.ExpenseParticipant.user_id.label("other_user_id"),
            func.sum(models.ExpenseParticipant.share_amount).label("total")
        )
        .join(models.Expense, models.Expense.id == models.ExpenseParticipant.expense_id)
        .filter(
            models.Expense.group_id.in_(group_ids),
            models.Expense.payer_id == current_user.id,
            models.ExpenseParticipant.is_settled == False
        )
        .group_by(models.Expense.group_id, models.ExpenseParticipant.user_id)
        .all()
    )
    owed_to_me_map = {(str(r.group_id), str(r.other_user_id)): float(r.total) for r in owed_to_me_rows}

    # ── Bulk pending-sent settlements across all groups ───────────────────────
    pending_sent_rows = (
        db.query(models.Settlement.group_id, models.Settlement.receiver_id)
        .filter(
            models.Settlement.group_id.in_(group_ids),
            models.Settlement.sender_id == current_user.id,
            models.Settlement.status == "PENDING",
            models.Settlement.created_at >= seven_days_ago,
        )
        .all()
    )
    pending_sent_set = {(str(r.group_id), str(r.receiver_id)) for r in pending_sent_rows}

    # ── Build global_debts from precomputed maps ──────────────────────────────
    # Collect all (group, other_user) pairs that appear in either map
    all_pairs = set(i_owe_map.keys()) | set(owed_to_me_map.keys())
    # Build a lookup for member names
    member_name_map: dict[str, str] = {}
    for g in my_groups:
        for m in g.members:
            member_name_map[str(m.user_id)] = m.user.name

    group_name_map = {str(g.id): g.name for g in my_groups}

    global_debts = []
    for (gid_str, uid_str) in all_pairs:
        if uid_str == str(current_user.id):
            continue
        net_bal = i_owe_map.get((gid_str, uid_str), 0.0) - owed_to_me_map.get((gid_str, uid_str), 0.0)
        if net_bal > 0:
            global_debts.append({
                "user_id": uid_str,
                "user_name": member_name_map.get(uid_str, "Unknown"),
                "group_name": group_name_map.get(gid_str, "Unknown"),
                "group_id": gid_str,
                "amount": round(net_bal, 2),
                "is_pending": (gid_str, uid_str) in pending_sent_set,
            })

    # ── Incoming pending settlements ──────────────────────────────────────────
    pending_requests = (
        db.query(models.Settlement)
        .options(joinedload(models.Settlement.sender))
        .filter(
            models.Settlement.receiver_id == current_user.id,
            models.Settlement.status == "PENDING",
            models.Settlement.created_at >= seven_days_ago,
        )
        .all()
    )

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