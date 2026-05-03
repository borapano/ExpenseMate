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
@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await asyncio.to_thread(models.Base.metadata.create_all, engine)
        logger.info("✅ Database schema synced successfully.")
    except Exception as e:
        logger.error(f"❌ Database sync error: {e}")
    yield
    logger.info("🛑 Server shutting down.")


app = FastAPI(title="ExpenseMate API", version="2.0.0", lifespan=lifespan)

# --- CORS ---
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
        user_balance = None
        transaction_status = "NONE"

        if current_user_id:
            user_id_str = str(current_user_id)
            is_payer = (str(expense.payer_id) == user_id_str)

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
    _, total_expenses_count = crud.get_user_expenses(
        db, current_user.id, limit=1, offset=0, group_id=group_id
    )

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

    # All pending settlements linked to these expenses (no time filter — Approach B)
    specific_pending_map = {}
    if expense_ids:
        for s in db.query(models.Settlement).filter(
            models.Settlement.expense_id.in_(expense_ids),
            models.Settlement.status == "PENDING",
        ).all():
            specific_pending_map[(str(s.expense_id), str(s.sender_id))] = s

    all_participants_map = {}
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

    expenses_map = {}
    for ep, exp in shares:
        eid = str(exp.id)
        if eid not in expenses_map:
            expenses_map[eid] = {"exp": exp, "shares": []}
        expenses_map[eid]["shares"].append(ep)

    formatted_items = []

    for eid, data in expenses_map.items():
        exp = data["exp"]
        participants = data["shares"]
        current_user_str = str(current_user.id)

        is_payer = str(exp.payer_id) == current_user_str

        # Approach B: per_person_share = equal split of total
        _all_eps = all_participants_map.get(eid, [])
        _ep_count = len(_all_eps)
        per_person_share_expenses = round(float(exp.amount) / _ep_count, 2) if _ep_count > 0 else 0.0

        if is_payer:
            to_be_paid = 0.0
            waiting = 0.0
            all_issued = True

            for ep in participants:
                ep_user_str = str(ep.user_id)
                specific = specific_pending_map.get((eid, ep_user_str))

                if ep.is_settled:
                    pass
                elif specific:
                    waiting += per_person_share_expenses
                    all_issued = False
                else:
                    to_be_paid += per_person_share_expenses
                    all_issued = False

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
            ep = participants[0]
            specific = specific_pending_map.get((eid, current_user_str))
            to_be_paid_out = 0.0
            waiting_out = 0.0

            if ep.is_settled:
                agg_status = "CONFIRMED"
                user_balance = 0.0
            elif specific:
                agg_status = "PENDING"
                user_balance = -per_person_share_expenses
            else:
                agg_status = "NONE"
                user_balance = -per_person_share_expenses

        all_eps_for_expense = _all_eps  # already fetched above

        payer_id_str = str(exp.payer_id) if exp.payer_id else ""
        payer_has_share = any(str(ep.user_id) == payer_id_str for ep in all_eps_for_expense)

        # Approach B: my_share = equal split of total
        my_share_ep = next((ep for ep in all_eps_for_expense if str(ep.user_id) == current_user_str), None)
        my_share = per_person_share_expenses if my_share_ep else 0.0
        per_person_share = per_person_share_expenses

        def get_participant_status(ep_item):
            ep_uid = str(ep_item.user_id)
            if is_payer:
                if ep_item.is_settled:
                    return "CONFIRMED"
                if specific_pending_map.get((eid, ep_uid)):
                    return "PENDING"
                return "NONE"
            else:
                if ep_uid == current_user_str:
                    if ep_item.is_settled:
                        return "CONFIRMED"
                    if specific_pending_map.get((eid, ep_uid)):
                        return "PENDING"
                    return "NONE"
                else:
                    return None

        participants_list = sorted([
            {
                "user_id": str(ep.user_id),
                "user_name": ep.user.name if ep.user else "Unknown",
                "share_amount": per_person_share,
                "amount": per_person_share,
                "is_settled": ep.is_settled,
                "is_payer": str(ep.user_id) == payer_id_str,
                "is_me": str(ep.user_id) == current_user_str,
                "status": get_participant_status(ep)
            }
            for ep in all_eps_for_expense
        ], key=lambda x: x["user_name"])

        if not payer_has_share and exp.payer:
            participants_list.insert(0, {
                "user_id": payer_id_str,
                "user_name": exp.payer.name,
                "share_amount": 0.0,
                "amount": 0.0,
                "is_settled": True,
                "is_payer": True,
                "is_me": payer_id_str == current_user_str,
                "status": "PAYER"
            })

        preview_names = [p["user_name"] for p in participants_list if not (p["is_payer"] and p["amount"] == 0.0)][:2]

        f = {
            "id": eid,
            "expense_id": eid,
            "group_id": str(exp.group_id),
            "group_name": exp.group.name if exp.group else "Personal",
            "description": exp.description,
            "category": exp.category,
            "amount": float(exp.amount),
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
    groups = crud.get_user_groups(db, current_user.id)

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


# ── Validate invite code (must be before /groups/{group_id}) ──────────────────
@app.get("/groups/validate/{code}")
def validate_group_code(
    code: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    group = db.query(models.Group).filter(models.Group.code == code.upper()).first()
    return {"exists": group is not None}


@app.get("/groups/{group_id}")
def read_group(group_id: UUID, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
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

    uid_str = str(current_user.id)

    # ── Approach B: per-expense settlements, no netting ───────────────────────
    #
    # Pending settlements I sent in this group (keyed by expense_id → Settlement)
    my_pending_sent = (
        db.query(models.Settlement)
        .filter(
            models.Settlement.group_id == group_id,
            models.Settlement.sender_id == current_user.id,
            models.Settlement.status == "PENDING",
        )
        .all()
    )
    my_pending_by_expense: dict[str, models.Settlement] = {
        str(s.expense_id): s for s in my_pending_sent if s.expense_id
    }

    # Incoming PENDING settlements others sent me (action required for me)
    incoming_pending = (
        db.query(models.Settlement)
        .options(
            joinedload(models.Settlement.sender),
            joinedload(models.Settlement.expense),
        )
        .filter(
            models.Settlement.group_id == group_id,
            models.Settlement.receiver_id == current_user.id,
            models.Settlement.status == "PENDING",
        )
        .all()
    )
    # (expense_id, sender_id) → True  — used by build_group_expense p_status
    incoming_by_key: dict[tuple, bool] = {
        (str(s.expense_id), str(s.sender_id)): True
        for s in incoming_pending
        if s.expense_id
    }

    # ── Build per-expense debt / receivable lists from already-loaded expenses ─
    my_debts: list[dict] = []
    expected_payments: list[dict] = []

    # Per-person running totals for net_balance and members card
    i_owe_per_person: dict[str, float] = {}       # payer_uid → total I owe them
    owed_to_me_per_person: dict[str, float] = {}  # debtor_uid → total they owe me

    for e in group.expenses:
        eid = str(e.id)
        payer_id_str = str(e.payer_id) if e.payer_id else ""
        all_parts = e.participants or []
        count = len(all_parts)
        per_share = round(float(e.amount) / count, 2) if count > 0 else 0.0

        if payer_id_str != uid_str:
            # Someone else paid — check if I'm a participant with an unpaid share
            my_part = next((p for p in all_parts if str(p.user_id) == uid_str), None)
            if my_part and not my_part.is_settled:
                pending = my_pending_by_expense.get(eid)
                my_debts.append({
                    "expense_id": eid,
                    "expense_description": e.description or "",
                    "payer_id": payer_id_str,
                    "payer_name": e.payer.name if e.payer else "Unknown",
                    "amount": per_share,
                    "is_pending": pending is not None,
                    "settlement_id": str(pending.id) if pending else None,
                })
                i_owe_per_person[payer_id_str] = (
                    i_owe_per_person.get(payer_id_str, 0.0) + per_share
                )
        else:
            # I paid — each unsettled participant owes me one share
            for p in all_parts:
                p_uid = str(p.user_id)
                if p_uid == uid_str or p.is_settled:
                    continue
                owed_to_me_per_person[p_uid] = (
                    owed_to_me_per_person.get(p_uid, 0.0) + per_share
                )
                # Only add to "To Collect" if they haven't already sent a pending settlement
                if not incoming_by_key.get((eid, p_uid)):
                    expected_payments.append({
                        "expense_id": eid,
                        "expense_description": e.description or "",
                        "user_id": p_uid,
                        "user_name": p.user.name if getattr(p, "user", None) else "Unknown",
                        "amount": per_share,
                    })

    net_balance = round(
        sum(owed_to_me_per_person.values()) - sum(i_owe_per_person.values()), 2
    )

    # Members list with per-person net balance for the Members card
    members_list = []
    for m in group.members:
        m_uid = str(m.user.id)
        balance = round(
            owed_to_me_per_person.get(m_uid, 0.0) - i_owe_per_person.get(m_uid, 0.0),
            2,
        )
        members_list.append({
            "user_id": m_uid,
            "user_name": m.user.name,
            "user_email": m.user.email,
            "balance": balance,
        })

    # Action-required list: incoming PENDING settlements I need to confirm/reject
    pending_settlements_list = [
        {
            "id": str(s.id),
            "sender_id": str(s.sender_id),
            "sender_name": s.sender.name if s.sender else "Unknown",
            "expense_id": str(s.expense_id) if s.expense_id else None,
            "expense_description": s.expense.description if s.expense else "",
            "amount": float(s.amount),
        }
        for s in incoming_pending
    ]

    # Build rich expense data for the table (Approach B — per-expense only)
    def build_group_expense(e):
        eid = str(e.id)
        payer_id_str = str(e.payer_id) if e.payer_id else ""
        is_payer = payer_id_str == uid_str
        all_parts = e.participants or []

        # Equal-split share (Approach B: always expense.amount / participant_count)
        participant_count = len(all_parts)
        per_person_share = round(float(e.amount) / participant_count, 2) if participant_count > 0 else 0.0

        # Participant status — expense-level settlements only
        def p_status(p):
            p_uid = str(p.user_id)
            if is_payer:
                if p.is_settled:
                    return "CONFIRMED"
                if incoming_by_key.get((eid, p_uid)):
                    return "PENDING"
                return "NONE"
            else:
                if p_uid == uid_str:
                    if p.is_settled:
                        return "CONFIRMED"
                    if eid in my_pending_by_expense:
                        return "PENDING"
                    return "NONE"
                return None

        payer_has_share = any(str(p.user_id) == payer_id_str for p in all_parts)
        participants_list = [
            {
                "user_id": str(p.user_id),
                "user_name": p.user.name if getattr(p, "user", None) else "Unknown",
                "share_amount": per_person_share,
                "amount":       per_person_share,
                "is_settled": bool(p.is_settled),
                "is_payer": str(p.user_id) == payer_id_str,
                "is_me": str(p.user_id) == uid_str,
                "status": p_status(p),
            }
            for p in all_parts
        ]
        if not payer_has_share and e.payer:
            participants_list.insert(0, {
                "user_id": payer_id_str,
                "user_name": e.payer.name,
                "share_amount": 0.0,
                "amount": 0.0,
                "is_settled": True,
                "is_payer": True,
                "is_me": payer_id_str == uid_str,
                "status": "PAYER",
            })

        # Compute transaction_status and user_balance using per_person_share
        if is_payer:
            to_receive = 0.0
            waiting = 0.0
            for p in participants_list:
                if p["user_id"] == uid_str or (p["is_payer"] and p["share_amount"] == 0.0):
                    continue
                if p["is_settled"]:
                    continue
                if p["status"] == "PENDING":
                    waiting += per_person_share
                else:
                    to_receive += per_person_share
            if to_receive > 0 and waiting > 0:
                tx_status, user_balance = "MIXED", to_receive + waiting
                to_be_paid_out, waiting_out = to_receive, waiting
            elif waiting > 0:
                tx_status, user_balance = "WAITING_CONFIRMATION", waiting
                to_be_paid_out, waiting_out = 0.0, waiting
            elif to_receive > 0:
                tx_status, user_balance = "NONE", to_receive
                to_be_paid_out, waiting_out = to_receive, 0.0
            else:
                tx_status, user_balance = "CONFIRMED", 0.0
                to_be_paid_out, waiting_out = 0.0, 0.0
        else:
            my_p = next((p for p in participants_list if p["user_id"] == uid_str and not p.get("is_payer")), None)
            to_be_paid_out = waiting_out = 0.0
            if my_p:
                if my_p["is_settled"]:
                    tx_status, user_balance = "CONFIRMED", 0.0
                elif eid in my_pending_by_expense:
                    tx_status, user_balance = "PENDING", -per_person_share
                else:
                    tx_status, user_balance = "NONE", -per_person_share
            else:
                tx_status, user_balance = "NONE", 0.0

        my_share_p = next((p for p in all_parts if str(p.user_id) == uid_str), None)
        my_share = per_person_share if my_share_p else 0.0

        return {
            "id": eid,
            "group_id": str(e.group_id),
            "payer_id": payer_id_str,
            "payer_name": e.payer.name if e.payer else "Unknown",
            "amount": float(e.amount),
            "description": e.description or "",
            "category": e.category or "",
            "expense_date": e.expense_date.isoformat() if e.expense_date else "",
            "created_date": e.created_date.isoformat() if e.created_date else "",
            "user_balance": user_balance,
            "transaction_status": tx_status,
            "to_be_paid": to_be_paid_out,
            "waiting_amount": waiting_out,
            "my_share": my_share,
            "participants": participants_list,
            "is_payer": is_payer,
        }

    return {
        "id": str(group.id),
        "name": group.name,
        "description": group.description or "",
        "code": group.code,
        "creator_id": str(group.creator_id),
        "created_date": group.created_date.isoformat() if group.created_date else None,
        "members": members_list,
        "expenses": [build_group_expense(e) for e in sorted_expenses],
        "total_expenses": float(total),
        "my_debts": my_debts,
        "pending_settlements": pending_settlements_list,
        "net_balance": net_balance,
        "expected_payments": expected_payments,
    }


@app.put("/groups/{group_id}")
def update_group(group_id: UUID, data: schemas.GroupUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(404, "GROUP_NOT_FOUND")
    if str(group.creator_id) != str(current_user.id):
        raise HTTPException(403, "NOT_ADMIN")
    group.name = data.name
    group.description = data.description
    db.commit()
    db.refresh(group)
    return read_group(group_id, db, current_user)


@app.delete("/groups/{group_id}")
def delete_group(group_id: UUID, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(404, "GROUP_NOT_FOUND")
    if str(group.creator_id) != str(current_user.id):
        raise HTTPException(403, "NOT_ADMIN")
    expense_count = db.query(models.Expense).filter(models.Expense.group_id == group_id).count()
    if expense_count > 0:
        raise HTTPException(400, "GROUP_HAS_EXPENSES")
    db.delete(group)
    db.commit()
    return {"detail": "DELETED"}


@app.post("/groups/{group_id}/leave")
def leave_group(group_id: UUID, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(404, "GROUP_NOT_FOUND")
    if str(group.creator_id) == str(current_user.id):
        raise HTTPException(400, "ADMIN_CANNOT_LEAVE")
    membership = db.query(models.GroupMember).filter_by(user_id=current_user.id, group_id=group_id).first()
    if not membership:
        raise HTTPException(404, "NOT_A_MEMBER")
    db.delete(membership)
    db.commit()
    return {"detail": "LEFT"}


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
    if str(settlement.receiver_id) == str(current_user.id):
        raise HTTPException(status_code=400, detail="SELF_SETTLEMENT_NOT_ALLOWED")

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

    pending_received = db.query(models.Settlement).options(
        joinedload(models.Settlement.sender),
        joinedload(models.Settlement.group),
        joinedload(models.Settlement.expense)
    ).filter(
        models.Settlement.receiver_id == current_user.id,
        models.Settlement.status == "PENDING",
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

    # Key set: (expense_id, sender_id) for all incoming pending settlements
    # Used to exclude those entries from expected_payments (they're already in Action Required)
    incoming_pending_key: set[tuple] = {
        (str(s.expense_id), str(s.sender_id))
        for s in pending_received if s.expense_id
    }

    pending_sent = db.query(models.Settlement).filter(
        models.Settlement.sender_id == current_user.id,
        models.Settlement.status == "PENDING",
    ).all()

    pending_sent_map = {}
    for s in pending_sent:
        key = (str(s.group_id), str(s.receiver_id))
        pending_sent_map[key] = pending_sent_map.get(key, 0.0) + float(s.amount)

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
        joinedload(models.Expense.group),
        joinedload(models.Expense.participants)
    ).all()

    payables_expense_ids = [e.id for _, e in payables_query]
    specific_pending_list = db.query(models.Settlement).filter(
        models.Settlement.expense_id.in_(payables_expense_ids),
        models.Settlement.status == "PENDING",
    ).all() if payables_expense_ids else []
    specific_pending_map = {s.expense_id: True for s in specific_pending_list}

    payables = []
    total_to_pay = 0.0

    for ep, exp in payables_query:
        p_count = len(exp.participants) if exp.participants else 1
        amount = round(float(exp.amount) / p_count, 2)
        total_to_pay += amount
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

    payables.sort(key=lambda x: (1 if x["is_pending"] else 0, x["created_date"] or ""), reverse=True)

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
        joinedload(models.Expense.group),
        joinedload(models.Expense.participants)
    ).all()

    receivables = []
    total_to_receive = 0.0

    for ep, exp in receivables_query:
        # Skip if this person already sent a pending settlement for this expense
        # (it belongs in Action Required, not To Collect)
        if (str(exp.id), str(ep.user_id)) in incoming_pending_key:
            continue
        p_count = len(exp.participants) if exp.participants else 1
        amount = round(float(exp.amount) / p_count, 2)
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