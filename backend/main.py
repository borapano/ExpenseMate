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
from sqlalchemy import func, or_, and_, extract
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


def format_expense(expense, current_user_id=None):
    try:
        # Calculate specific balance if user_id is provided
        user_balance = None
        transaction_status = "NONE"
        
        if current_user_id:
            user_id_str = str(current_user_id)
            is_payer = (str(expense.payer_id) == user_id_str)
            
            # Balance
            if is_payer:
                user_balance = sum(
                    float(p.share_amount) for p in getattr(expense, "participants", [])
                    if str(p.user_id) != user_id_str and not getattr(p, "is_settled", False)
                )
            else:
                my_p = next((p for p in getattr(expense, "participants", []) if str(p.user_id) == user_id_str), None)
                if my_p:
                    user_balance = 0.0 if getattr(my_p, "is_settled", False) else -float(getattr(my_p, "share_amount", 0.0))
                else:
                    user_balance = 0.0
            
            # Pending checks for this specific expense
            # Since settlement model has expense_id, check relationships if available
            # Note: We need a direct query or mapped property. We'll add this dynamically if needed
            # For now, rely on frontend or global pending arrays. Let's see if we can get it from DB.
            # We will handle the transaction status in get_my_expenses where we have DB session.
            
        res = {
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
        
        if current_user_id:
            res["user_balance"] = user_balance
            res["transaction_status"] = transaction_status
            
        return res
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
def get_my_expenses(
    limit: int = 10,
    offset: int = 0,
    group_id: UUID = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # 1. Fetch real expenses total (excluding settlements) for "Total Expenses" logic.
    _, total_expenses_count = crud.get_user_expenses(
        db, current_user.id, limit=1, offset=0, group_id=group_id
    )

    # 2. Fetch all individual shares involving the user (Debts & Credits)
    # We fetch where the user is either the debtor or the payer.
    # Exclude where user is BOTH payer and debtor (their own share).
    shares_query = db.query(models.ExpenseParticipant, models.Expense).join(
        models.Expense, models.Expense.id == models.ExpenseParticipant.expense_id
    ).filter(
        or_(
            and_(models.ExpenseParticipant.user_id == current_user.id, models.Expense.payer_id != current_user.id),
            and_(models.Expense.payer_id == current_user.id, models.ExpenseParticipant.user_id != current_user.id)
        )
    ).options(
        joinedload(models.ExpenseParticipant.user),
        joinedload(models.Expense.payer),
        joinedload(models.Expense.group)
    )

    if group_id:
        shares_query = shares_query.filter(models.Expense.group_id == group_id)

    shares = shares_query.all()
    expense_ids = list({exp.id for _, exp in shares})
    group_ids = list({exp.group_id for _, exp in shares})

    # specific_pending_map: key = (str(expense_id), str(sender_id))
    # Kap vetem settlements PENDING brenda 7 diteve — pas 7 ditesh trajtohen si te skaduara
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    specific_pending_map = {}
    if expense_ids:
        for s in db.query(models.Settlement).filter(
            models.Settlement.expense_id.in_(expense_ids),
            models.Settlement.status == "PENDING",
            models.Settlement.created_at >= seven_days_ago
        ).all():
            specific_pending_map[(str(s.expense_id), str(s.sender_id))] = s

    # Fetch ALL participants for each expense (for the participants column)
    all_participants_map = {}  # expense_id -> list of all ExpenseParticipant + User
    if expense_ids:
        all_eps = db.query(models.ExpenseParticipant).options(
            joinedload(models.ExpenseParticipant.user)
        ).filter(
            models.ExpenseParticipant.expense_id.in_(expense_ids)
        ).all()
        for ep in all_eps:
            eid = str(ep.expense_id)
            if eid not in all_participants_map:
                all_participants_map[eid] = []
            all_participants_map[eid].append(ep)

    # Group shares by expense_id
    # Key: expense_id → {exp, shares: [ep, ...]}
    expenses_map = {}
    for ep, exp in shares:
        eid = str(exp.id)
        if eid not in expenses_map:
            expenses_map[eid] = {"exp": exp, "shares": []}
        expenses_map[eid]["shares"].append(ep)

    formatted_items = []

    for eid, data in expenses_map.items():
        exp = data["exp"]
        participants = data["shares"]  # shares that involve current_user
        current_user_str = str(current_user.id)

        # Determine if current_user is payer (creditor) or debtor
        is_payer = str(exp.payer_id) == current_user_str

        if is_payer:
            # TI je payer — llogarit balancën agregate nga të gjithë debtor-ët
            to_be_paid = 0.0     # aktive, pa paguar
            waiting = 0.0        # ka dërguar settlement PENDING
            all_issued = True    # true nëse të gjithë janë settled

            for ep in participants:
                ep_user_str = str(ep.user_id)
                amount = float(ep.share_amount)
                specific = specific_pending_map.get((eid, ep_user_str))

                if ep.is_settled:
                    pass  # issued, nuk ndikon në balancë
                elif specific:
                    waiting += amount
                    all_issued = False
                else:
                    to_be_paid += amount
                    all_issued = False

            # Aggregate status
            if all_issued:
                agg_status = "CONFIRMED"
                user_balance = 0.0
                to_be_paid_out = 0.0
                waiting_out = 0.0
            elif waiting > 0 and to_be_paid > 0:
                agg_status = "MIXED"
                user_balance = to_be_paid + waiting
                to_be_paid_out = to_be_paid
                waiting_out = waiting
            elif waiting > 0:
                agg_status = "WAITING_CONFIRMATION"
                user_balance = waiting
                to_be_paid_out = 0.0
                waiting_out = waiting
            else:
                agg_status = "NONE"
                user_balance = to_be_paid
                to_be_paid_out = to_be_paid
                waiting_out = 0.0

        else:
            # TI je debtor — shiko statusin tënd
            ep = participants[0]  # vetëm share-ja jote
            amount = float(ep.share_amount)
            specific = specific_pending_map.get((eid, current_user_str))
            to_be_paid_out = 0.0
            waiting_out = 0.0

            if ep.is_settled:
                agg_status = "CONFIRMED"
                user_balance = 0.0
            elif specific:
                agg_status = "PENDING"
                user_balance = -amount
            else:
                agg_status = "NONE"
                user_balance = -amount

        # Build participants list for modal (ALL participants including payer if has share)
        all_eps_for_expense = all_participants_map.get(eid, [])
        
        # Check if payer has a share in this expense
        payer_id_str = str(exp.payer_id) if exp.payer_id else ""
        payer_has_share = any(str(ep.user_id) == payer_id_str for ep in all_eps_for_expense)
        
        # my_share: the current user's share amount in this expense (0 if not participant)
        my_share_ep = next((ep for ep in all_eps_for_expense if str(ep.user_id) == current_user_str), None)
        my_share = float(my_share_ep.share_amount) if my_share_ep else 0.0

        def get_participant_status(ep_item):
            ep_uid = str(ep_item.user_id)
            # Status is shown only if this participant has a direct relationship with current_user
            if is_payer:
                # I am payer — show status for all (they all owe me)
                if ep_item.is_settled:
                    return "CONFIRMED"
                s = specific_pending_map.get((eid, ep_uid))
                if s:
                    return "PENDING"
                return "NONE"
            else:
                # I am debtor — show status only for myself
                if ep_uid == current_user_str:
                    if ep_item.is_settled:
                        return "CONFIRMED"
                    s = specific_pending_map.get((eid, ep_uid))
                    if s:
                        return "PENDING"
                    return "NONE"
                else:
                    return None  # No status for other participants

        participants_list = sorted([
            {
                "user_id": str(ep.user_id),
                "user_name": ep.user.name if ep.user else "Unknown",
                "amount": float(ep.share_amount),
                "is_settled": ep.is_settled,
                "is_payer": str(ep.user_id) == payer_id_str,
                "is_me": str(ep.user_id) == current_user_str,
                "status": get_participant_status(ep)
            }
            for ep in all_eps_for_expense
        ], key=lambda x: x["user_name"])

        # Add payer as entry if payer has NO share (paid only for others)
        if not payer_has_share and exp.payer:
            participants_list.insert(0, {
                "user_id": payer_id_str,
                "user_name": exp.payer.name,
                "amount": 0.0,
                "is_settled": True,
                "is_payer": True,
                "is_me": payer_id_str == current_user_str,
                "status": "PAYER"  # special tag — paid but has no share
            })

        # Preview: first 2 names alphabetically (exclude payer-only entry)
        preview_names = [p["user_name"] for p in participants_list if not (p["is_payer"] and p["amount"] == 0.0)][:2]

        f = {
            "id": eid,
            "expense_id": eid,
            "group_id": str(exp.group_id),
            "group_name": exp.group.name if exp.group else "Personal",
            "description": exp.description,
            "category": exp.category,
            "amount": float(sum(float(ep.share_amount) for ep in participants)),
            "total_amount": float(exp.amount),
            "user_balance": user_balance,
            "expense_date": exp.expense_date.isoformat() if exp.expense_date else "",
            "created_date": exp.created_date.isoformat() if exp.created_date else "",
            "payer_name": exp.payer.name if exp.payer else "Unknown",
            "payer_id": str(exp.payer_id) if exp.payer_id else "",
            "transaction_status": agg_status,
            "to_be_paid": to_be_paid_out,
            "waiting_amount": waiting_out,
            "my_share": my_share,
            "participants": participants_list,
            "participants_preview": preview_names,
            "is_payer": is_payer
        }

        formatted_items.append(f)

    # Sort all items chronologically (newest first)
    formatted_items.sort(key=lambda x: x["created_date"] or x["expense_date"], reverse=True)

    paginated_items = formatted_items[offset:offset+limit]

    return {"expenses": paginated_items, "total": len(formatted_items)}



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
def create_settlement(
    settlement: schemas.SettlementCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Security: prevent a user from settling a debt with themselves
    if str(settlement.receiver_id) == str(current_user.id):
        raise HTTPException(status_code=400, detail="SELF_SETTLEMENT_NOT_ALLOWED")

    # Idempotency: prevent duplicate PENDING settlements for the same expense
    existing = db.query(models.Settlement).filter(
        models.Settlement.sender_id == current_user.id,
        models.Settlement.receiver_id == settlement.receiver_id,
        models.Settlement.expense_id == settlement.expense_id,
        models.Settlement.status == "PENDING",
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="SETTLEMENT_ALREADY_PENDING")

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
    group_ids = [g.id for g in my_groups]
    
    if not group_ids:
        return {
            "payables": [], 
            "receivables": [], 
            "pending_settlements_received": [],
            "total_to_pay": 0.0, 
            "total_to_receive": 0.0
        }

    # 1. PENDING SETTLEMENTS (Incoming / Received) — brenda 7 diteve
    now_utc = datetime.now(timezone.utc)
    seven_days_ago_global = now_utc - timedelta(days=7)
    pending_received = db.query(models.Settlement).options(
        joinedload(models.Settlement.sender),
        joinedload(models.Settlement.group),
        joinedload(models.Settlement.expense)
    ).filter(
        models.Settlement.receiver_id == current_user.id,
        models.Settlement.status == "PENDING",
        models.Settlement.created_at >= seven_days_ago_global
    ).all()
    
    pending_received_list = [{
        "id": str(s.id),
        "sender_id": str(s.sender_id),
        "sender_name": s.sender.name if s.sender else "Unknown",
        "group_id": str(s.group_id),
        "group_name": s.group.name if s.group else "Unknown",
        "expense_description": s.expense.description if s.expense else "Direct Payment",
        "amount": float(s.amount),
        "created_at": s.created_at.isoformat() if s.created_at else None
    } for s in pending_received]

    # 2. PENDING SETTLEMENTS (Outgoing / Sent) — brenda 7 diteve
    pending_sent = db.query(models.Settlement).filter(
        models.Settlement.sender_id == current_user.id,
        models.Settlement.status == "PENDING",
        models.Settlement.created_at >= seven_days_ago_global
    ).all()
    
    # Create a fast lookup for pending sent amounts per pair (group, receiver)
    pending_sent_map = {}
    for s in pending_sent:
        key = (str(s.group_id), str(s.receiver_id))
        pending_sent_map[key] = pending_sent_map.get(key, 0.0) + float(s.amount)

    # 3. PAYABLES (Debts to Settle: I owe money)
    # user_id == current_user AND is_settled == False AND Expense.payer_id != current_user
    payables_query = db.query(
        models.ExpenseParticipant, 
        models.Expense
    ).join(models.Expense, models.Expense.id == models.ExpenseParticipant.expense_id).filter(
        models.ExpenseParticipant.user_id == current_user.id,
        models.ExpenseParticipant.is_settled == False,
        models.Expense.payer_id != current_user.id,
        models.Expense.group_id.in_(group_ids)
    ).options(
        joinedload(models.Expense.payer),
        joinedload(models.Expense.group)
    ).all()

    payables_expense_ids = [e.id for _, e in payables_query]
    seven_days_ago_dash = datetime.now(timezone.utc) - timedelta(days=7)
    specific_pending_list = db.query(models.Settlement).filter(
        models.Settlement.expense_id.in_(payables_expense_ids),
        models.Settlement.status == "PENDING",
        models.Settlement.created_at >= seven_days_ago_dash
    ).all() if payables_expense_ids else []
    specific_pending_map = {s.expense_id: True for s in specific_pending_list}

    payables = []
    total_to_pay = 0.0

    for ep, exp in payables_query:
        amount = float(ep.share_amount)
        total_to_pay += amount
        
        # Check ONLY specific settlement (linked to this exact expense)
        # Global pending check removed — it caused false positives when
        # multiple debts exist with the same payer in the same group.
        is_pending = specific_pending_map.get(exp.id, False)

        payables.append({
            "expense_id": str(exp.id),
            "expense_description": exp.description,
            "group_id": str(exp.group_id),
            "group_name": exp.group.name if exp.group else "Unknown",
            "receiver_id": str(exp.payer_id),
            "receiver_name": exp.payer.name if exp.payer else "Unknown",
            "user_id": str(exp.payer_id),
            "user_name": exp.payer.name if exp.payer else "Unknown",
            "amount": amount,
            "is_pending": is_pending,
            "created_date": exp.created_date.isoformat() if exp.created_date else None
        })

    # Sort payables: active first, then pending, then by date desc
    payables.sort(key=lambda x: (1 if x["is_pending"] else 0, x["created_date"] or ""), reverse=True)

    # 4. RECEIVABLES (Active Credits: Money owed to me)
    # Expense.payer_id == current_user AND user_id != current_user AND is_settled == False
    receivables_query = db.query(
        models.ExpenseParticipant,
        models.Expense
    ).join(models.Expense, models.Expense.id == models.ExpenseParticipant.expense_id).filter(
        models.Expense.payer_id == current_user.id,
        models.ExpenseParticipant.user_id != current_user.id,
        models.ExpenseParticipant.is_settled == False,
        models.Expense.group_id.in_(group_ids)
    ).options(
        joinedload(models.ExpenseParticipant.user),
        joinedload(models.Expense.group)
    ).all()

    receivables = []
    total_to_receive = 0.0

    for ep, exp in receivables_query:
        amount = float(ep.share_amount)
        total_to_receive += amount
        receivables.append({
            "expense_id": str(exp.id),
            "expense_description": exp.description,
            "group_id": str(exp.group_id),
            "group_name": exp.group.name if exp.group else "Unknown",
            "debtor_id": str(ep.user_id),
            "debtor_name": ep.user.name if ep.user else "Unknown",
            "user_id": str(ep.user_id),
            "user_name": ep.user.name if ep.user else "Unknown",
            "amount": amount,
            "created_date": exp.created_date.isoformat() if exp.created_date else None
        })

    # Sort receivables by date desc
    receivables.sort(key=lambda x: x["created_date"] or "", reverse=True)

    total_pending_sent = sum(pending_sent_map.values())
    total_pending_received = sum(s["amount"] for s in pending_received_list)

    return {
        "global_debts": payables,
        "expected_payments": receivables,
        "global_requests": pending_received_list,
        "total_gross_debt": round(total_to_pay, 2),
        "total_owed_to_me": round(total_to_receive, 2),
        "effective_total": round(total_to_pay - total_pending_sent, 2),
        "effective_receive_total": round(total_to_receive - total_pending_received, 2),
        "total_pending_sent": round(total_pending_sent, 2),
        "total_pending_received": round(total_pending_received, 2)
    }



if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)