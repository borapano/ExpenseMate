import os
import logging
from pathlib import Path
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, or_
from uuid import uuid4, UUID
from sqlalchemy.exc import IntegrityError, DataError
from fastapi import HTTPException

import models, schemas, security, utils

# --- CONFIG & LOGGING ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(dotenv_path=BASE_DIR / ".env")

# ---------------- USER CRUD ----------------

def get_user_by_email(db: Session, email: str):
    if not email:
        return None
    clean_email = email.lower().strip()
    return db.query(models.User).filter(func.lower(models.User.email) == clean_email).first()

def create_user(db: Session, user: schemas.UserCreate):
    if get_user_by_email(db, user.email):
        raise ValueError("EMAIL_ALREADY_EXISTS")

    hashed_pass = security.get_password_hash(user.password)
    db_user = models.User(
        id=uuid4(),
        name=user.name,
        email=user.email.lower().strip(),
        password_hash=hashed_pass,
        phone_number=user.phone_number,
        role="user"
    )

    try:
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Gabim integriteti (User): {str(e)}")
        raise ValueError("DATABASE_INTEGRITY_ERROR")

def get_user_net_balance(db: Session, user_id: UUID) -> float:
    owed_to_me = db.query(func.sum(models.ExpenseParticipant.share_amount))\
        .join(models.Expense, models.Expense.id == models.ExpenseParticipant.expense_id)\
        .filter(models.Expense.payer_id == user_id)\
        .filter(models.ExpenseParticipant.user_id != user_id)\
        .filter(models.ExpenseParticipant.is_settled == False)\
        .scalar() or 0.0

    i_owe = db.query(func.sum(models.ExpenseParticipant.share_amount))\
        .join(models.Expense, models.Expense.id == models.ExpenseParticipant.expense_id)\
        .filter(models.Expense.payer_id != user_id)\
        .filter(models.ExpenseParticipant.user_id == user_id)\
        .filter(models.ExpenseParticipant.is_settled == False)\
        .scalar() or 0.0

    return float(owed_to_me) - float(i_owe)

def get_group_net_balance(db: Session, user_id: UUID, group_id: UUID) -> float:
    owed_to_me = db.query(func.sum(models.ExpenseParticipant.share_amount))\
        .join(models.Expense, models.Expense.id == models.ExpenseParticipant.expense_id)\
        .filter(models.Expense.group_id == group_id)\
        .filter(models.Expense.payer_id == user_id)\
        .filter(models.ExpenseParticipant.user_id != user_id)\
        .filter(models.ExpenseParticipant.is_settled == False)\
        .scalar() or 0.0

    i_owe = db.query(func.sum(models.ExpenseParticipant.share_amount))\
        .join(models.Expense, models.Expense.id == models.ExpenseParticipant.expense_id)\
        .filter(models.Expense.group_id == group_id)\
        .filter(models.Expense.payer_id != user_id)\
        .filter(models.ExpenseParticipant.user_id == user_id)\
        .filter(models.ExpenseParticipant.is_settled == False)\
        .scalar() or 0.0

    return float(owed_to_me) - float(i_owe)

def get_last_10_days_spending(db: Session, user_id: UUID):
    ten_days_ago = datetime.now(timezone.utc).date() - timedelta(days=9)
    results = db.query(
        models.Expense.expense_date,
        func.sum(models.ExpenseParticipant.share_amount).label("total")
    ).join(models.ExpenseParticipant, models.Expense.id == models.ExpenseParticipant.expense_id)\
     .filter(models.ExpenseParticipant.user_id == user_id)\
     .filter(models.Expense.expense_date >= ten_days_ago)\
     .group_by(models.Expense.expense_date)\
     .order_by(models.Expense.expense_date.asc()).all()
    
    spending_dict = {row.expense_date: float(row.total) for row in results}
    last_10_days = [(datetime.now(timezone.utc).date() - timedelta(days=i)) for i in range(9, -1, -1)]
    monthly_data = [spending_dict.get(d, 0.0) for d in last_10_days]
    
    return {
        "monthly_data": monthly_data,
        "monthly_spend": sum(monthly_data)
    }

def update_user_budget(db: Session, user_id: UUID, budget: float):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user:
        user.monthly_budget = budget
        db.commit()
        db.refresh(user)
    return user

def normalize_category(cat: str) -> str:
    if not cat: return "Other"
    c = cat.strip().lower()
    mapping = {
        "ushqim": "Food & Dining",
        "food": "Food & Dining",
        "food & dining": "Food & Dining",
        "qira": "Housing",
        "housing": "Housing",
        "transport": "Transportation",
        "transportation": "Transportation",
        "fatura": "Bills & Subscriptions",
        "bills & subscriptions": "Bills & Subscriptions",
        "utilities": "Utilities",
        "argëtim": "Entertainment",
        "entertainment": "Entertainment",
        "shopping": "Shopping",
        "healthcare": "Health",
        "health": "Health",
        "travel": "Travel",
        "groceries": "Groceries",
    }
    return mapping.get(c, "Other")

def get_analytics_stats(db: Session, user_id: UUID):
    now = datetime.now(timezone.utc).date()
    start_of_month = now.replace(day=1)
    if start_of_month.month == 1:
        start_of_last_month = start_of_month.replace(year=start_of_month.year-1, month=12)
    else:
        start_of_last_month = start_of_month.replace(month=start_of_month.month-1)
    
    current_month_total = db.query(func.sum(models.ExpenseParticipant.share_amount))\
        .join(models.Expense)\
        .filter(models.ExpenseParticipant.user_id == user_id)\
        .filter(models.Expense.expense_date >= start_of_month)\
        .filter(models.Expense.expense_date <= now)\
        .scalar() or 0.0

    last_month_total = db.query(func.sum(models.ExpenseParticipant.share_amount))\
        .join(models.Expense)\
        .filter(models.ExpenseParticipant.user_id == user_id)\
        .filter(models.Expense.expense_date >= start_of_last_month)\
        .filter(models.Expense.expense_date < start_of_month)\
        .scalar() or 0.0

    top_cat_rows = db.query(models.Expense.category, func.sum(models.ExpenseParticipant.share_amount).label('total'))\
        .join(models.ExpenseParticipant)\
        .filter(models.ExpenseParticipant.user_id == user_id)\
        .filter(models.Expense.expense_date >= start_of_month)\
        .group_by(models.Expense.category)\
        .all()
        
    cat_totals = {}
    for row in top_cat_rows:
        norm_cat = normalize_category(row.category)
        cat_totals[norm_cat] = cat_totals.get(norm_cat, 0.0) + float(row.total)

    top_cat_name = "None"
    top_cat_amount = 0.0
    if cat_totals:
        top_cat_name = max(cat_totals, key=cat_totals.get)
        top_cat_amount = cat_totals[top_cat_name]

    return {
        "totalSpentMonth": float(current_month_total),
        "totalSpentLastMonth": float(last_month_total),
        "topCategory": {
            "name": top_cat_name,
            "amount": top_cat_amount
        }
    }

def get_analytics_charts(db: Session, user_id: UUID):
    now = datetime.now(timezone.utc).date()
    thirty_days_ago = now - timedelta(days=29)

    # 1. Daily Trends
    daily_rows = db.query(models.Expense.expense_date, func.sum(models.ExpenseParticipant.share_amount).label('total'))\
        .join(models.ExpenseParticipant)\
        .filter(models.ExpenseParticipant.user_id == user_id)\
        .filter(models.Expense.expense_date >= thirty_days_ago)\
        .group_by(models.Expense.expense_date)\
        .order_by(models.Expense.expense_date.asc())\
        .all()
    
    daily_dict = {row.expense_date: float(row.total) for row in daily_rows}
    dailyTrends = []
    for i in range(29, -1, -1):
        d = now - timedelta(days=i)
        dailyTrends.append({
            "day": d.strftime("%b %d"),
            "amount": daily_dict.get(d, 0.0)
        })

    # 2. Category Split (this month)
    start_of_month = now.replace(day=1)
    cat_rows = db.query(models.Expense.category, func.sum(models.ExpenseParticipant.share_amount).label('total'))\
        .join(models.ExpenseParticipant)\
        .filter(models.ExpenseParticipant.user_id == user_id)\
        .filter(models.Expense.expense_date >= start_of_month)\
        .group_by(models.Expense.category)\
        .all()
    
    colors = ["#FFC570", "#547792", "#1A3263", "#EFD2B0", "#6B8FAF", "#A8C5DA"]
    
    cat_totals = {}
    for row in cat_rows:
        norm_cat = normalize_category(row.category)
        cat_totals[norm_cat] = cat_totals.get(norm_cat, 0.0) + float(row.total)

    categorySplit = []
    for cat, total in cat_totals.items():
        categorySplit.append({
            "name": cat,
            "value": total,
        })

    # 3. Group Spending (this month)
    group_rows = db.query(models.Group.name, func.sum(models.ExpenseParticipant.share_amount).label('total'))\
        .select_from(models.ExpenseParticipant)\
        .join(models.Expense, models.Expense.id == models.ExpenseParticipant.expense_id)\
        .join(models.Group, models.Group.id == models.Expense.group_id)\
        .filter(models.ExpenseParticipant.user_id == user_id)\
        .filter(models.Expense.expense_date >= start_of_month)\
        .group_by(models.Group.name)\
        .all()

    groupSpending = []
    for i, row in enumerate(group_rows):
        groupSpending.append({
            "name": row.name,
            "value": float(row.total),
            "color": colors[len(colors) - 1 - (i % len(colors))]
        })

    # 4. Monthly Comparison (this month vs last month)
    if start_of_month.month == 1:
        start_of_last_month = start_of_month.replace(year=start_of_month.year-1, month=12)
    else:
        start_of_last_month = start_of_month.replace(month=start_of_month.month-1)

    last_month_cat_rows = db.query(models.Expense.category, func.sum(models.ExpenseParticipant.share_amount).label('total'))\
        .join(models.ExpenseParticipant)\
        .filter(models.ExpenseParticipant.user_id == user_id)\
        .filter(models.Expense.expense_date >= start_of_last_month)\
        .filter(models.Expense.expense_date < start_of_month)\
        .group_by(models.Expense.category)\
        .all()
    
    last_month_dict = {}
    for row in last_month_cat_rows:
        n = normalize_category(row.category)
        last_month_dict[n] = last_month_dict.get(n, 0.0) + float(row.total)
        
    this_month_dict = cat_totals # Re-use the normalized dict from above

    all_cats = set(last_month_dict.keys()).union(set(this_month_dict.keys()))
    monthlyComparison = []
    for cat in all_cats:
        monthlyComparison.append({
            "category": cat,
            "thisMonth": this_month_dict.get(cat, 0.0),
            "lastMonth": last_month_dict.get(cat, 0.0)
        })

    return {
        "dailyTrends": dailyTrends,
        "categorySplit": categorySplit,
        "groupSpending": groupSpending,
        "monthlyComparison": monthlyComparison
    }

# ---------------- GROUP CRUD ----------------

def get_group(db: Session, group_id: UUID):
    return db.query(models.Group).filter(models.Group.id == group_id).first()

def generate_unique_group_code(db: Session):
    while True:
        code = utils.generate_invite_code(length=6).upper()
        exists = db.query(models.Group).filter(models.Group.code == code).first()
        if not exists:
            return code

def create_group(db: Session, group: schemas.GroupCreate, creator_id: UUID):
    group_code = generate_unique_group_code(db)
    db_group = models.Group(
        id=uuid4(),
        name=group.name,
        description=group.description,
        code=group_code,
        creator_id=creator_id
    )
    try:
        db.add(db_group)
        db.flush()
        membership = models.GroupMember(user_id=creator_id, group_id=db_group.id)
        db.add(membership)
        db.commit()
        db.refresh(db_group)
        return db_group
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="DATABASE_ERROR")

def join_group_by_code(db: Session, code: str, user_id: UUID):
    clean_code = code.upper().strip()
    group = db.query(models.Group).filter(models.Group.code == clean_code).first()
    if not group: return None
    already_member = db.query(models.GroupMember).filter_by(user_id=user_id, group_id=group.id).first()
    if already_member: return group 
    try:
        new_member = models.GroupMember(user_id=user_id, group_id=group.id)
        db.add(new_member)
        db.commit()
        db.refresh(group)
        return group
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="JOIN_FAILED")

def get_user_groups(db: Session, user_id: UUID):
    # Eagerly load members→user in a single JOIN so callers don't trigger lazy loads
    return (
        db.query(models.Group)
        .join(models.GroupMember)
        .filter(models.GroupMember.user_id == user_id)
        .options(
            joinedload(models.Group.members).joinedload(models.GroupMember.user)
        )
        .all()
    )

# ---------------- EXPENSE CRUD ----------------

def create_expense(db: Session, expense: schemas.ExpenseCreate, payer_id: UUID):
    total_shares = sum(p.share_amount for p in expense.participants)
    if abs(float(total_shares) - float(expense.amount)) > 0.01:
        raise HTTPException(status_code=400, detail="SHARE_TOTAL_MISMATCH")

    db_expense = models.Expense(
        id=uuid4(),
        group_id=expense.group_id,
        payer_id=payer_id,
        amount=expense.amount,
        description=expense.description,
        category=expense.category,
        expense_date=expense.expense_date,
        receipt_image=expense.receipt_image
    )
    try:
        db.add(db_expense)
        db.flush()
        for p in expense.participants:
            db.add(models.ExpenseParticipant(
                expense_id=db_expense.id,
                user_id=p.user_id,
                share_amount=p.share_amount,
                is_settled=False
            ))
        db.commit()
        db.refresh(db_expense)
        return db_expense
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

def update_expense(db: Session, expense_id: UUID, expense_data: schemas.ExpenseCreate, current_user_id: UUID):
    db_expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if not db_expense or db_expense.payer_id != current_user_id:
        return None

    total_shares = sum(p.share_amount for p in expense_data.participants)
    if abs(float(total_shares) - float(expense_data.amount)) > 0.01:
        raise HTTPException(status_code=400, detail="SHARE_TOTAL_MISMATCH")

    try:
        db_expense.amount = expense_data.amount
        db_expense.description = expense_data.description
        db_expense.category = expense_data.category
        db_expense.expense_date = expense_data.expense_date
        db.query(models.ExpenseParticipant).filter_by(expense_id=expense_id).delete()
        for p in expense_data.participants:
            db.add(models.ExpenseParticipant(
                expense_id=expense_id,
                user_id=p.user_id,
                share_amount=p.share_amount,
                is_settled=False
            ))
        db.commit()
        db.refresh(db_expense)
        return db_expense
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="UPDATE_FAILED")

def delete_expense(db: Session, expense_id: UUID, current_user_id: UUID):
    db_expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if not db_expense or db_expense.payer_id != current_user_id:
        return False
    db.delete(db_expense)
    db.commit()
    return True

def get_user_expenses(db: Session, user_id: UUID, limit: int = 10, offset: int = 0, group_id: UUID = None):
    """
    Returns expenses where the user is either:
      - the payer, OR
      - a participant with share_amount > 0
    Expenses where the user has no stake (share_amount = 0) are excluded.
    If group_id is provided, further filters by that group.
    """
    from sqlalchemy import or_

    # Sub-query: expense IDs where user is a participant with share > 0
    participant_expense_ids = (
        db.query(models.ExpenseParticipant.expense_id)
        .filter(
            models.ExpenseParticipant.user_id == user_id,
            models.ExpenseParticipant.share_amount > 0
        )
        .subquery()
    )

    query_filters = [
        or_(
            models.Expense.payer_id == user_id,
            models.Expense.id.in_(participant_expense_ids)
        )
    ]

    if group_id:
        query_filters.append(models.Expense.group_id == group_id)

    base_query = (
        db.query(models.Expense)
        .options(
            joinedload(models.Expense.payer),
            joinedload(models.Expense.participants).joinedload(models.ExpenseParticipant.user),
            joinedload(models.Expense.group)
        )
        .filter(*query_filters)
        .order_by(models.Expense.created_date.desc())
    )

    total = base_query.count()
    expenses = base_query.offset(offset).limit(limit).all()
    return expenses, total

# ---------------- SETTLEMENT CRUD ----------------

def create_settlement(db: Session, settlement: schemas.SettlementCreate, sender_id: UUID):
    db_settlement = models.Settlement(
        id=uuid4(),
        group_id=settlement.group_id,
        sender_id=sender_id,
        receiver_id=settlement.receiver_id,
        expense_id=settlement.expense_id,
        amount=settlement.amount,
        status="PENDING"
    )
    db.add(db_settlement)
    db.commit()
    db.refresh(db_settlement)
    return db_settlement

def get_group_settlements(db: Session, group_id: UUID):
    # Eagerly load sender and receiver so serialization in main.py needs no extra queries
    return (
        db.query(models.Settlement)
        .options(
            joinedload(models.Settlement.sender),
            joinedload(models.Settlement.receiver),
        )
        .filter(models.Settlement.group_id == group_id)
        .order_by(models.Settlement.created_at.desc())
        .all()
    )

def confirm_settlement(db: Session, settlement_id: UUID, receiver_id: UUID):
    settlement = db.query(models.Settlement).filter(
        models.Settlement.id == settlement_id,
        models.Settlement.receiver_id == receiver_id,
        models.Settlement.status == "PENDING"
    ).first()

    if not settlement:
        return False

    try:
        # 1. Kalojmë statusin në CONFIRMED
        settlement.status = "CONFIRMED"

        if settlement.expense_id:
            # 2a. Mbyllim borxhin specifikisht për këtë shpenzim
            borxh = db.query(models.ExpenseParticipant)\
                .filter(
                    models.ExpenseParticipant.expense_id == settlement.expense_id,
                    models.ExpenseParticipant.user_id == settlement.sender_id
                ).first()
            if borxh:
                borxh.is_settled = True
            else:
                # Fallback: sender nuk është participant specifik — shlye FIFO
                logger.warning(f"confirm_settlement: borxh not found for expense_id={settlement.expense_id}, sender_id={settlement.sender_id}. Falling back to FIFO.")
                borxhet = db.query(models.ExpenseParticipant)\
                    .join(models.Expense)\
                    .filter(
                        models.Expense.group_id == settlement.group_id,
                        models.Expense.payer_id == receiver_id,
                        models.ExpenseParticipant.user_id == settlement.sender_id,
                        models.ExpenseParticipant.is_settled == False
                    ).order_by(models.Expense.created_date.asc()).all()
                rem_amount = float(settlement.amount)
                for b in borxhet:
                    if rem_amount <= 0: break
                    share = float(b.share_amount)
                    if share <= rem_amount:
                        rem_amount -= share
                        b.is_settled = True
                    else:
                        b.share_amount = share - rem_amount
                        rem_amount = 0
        else:
            # 2b. Mbyllim borxhet në mënyrë ciklike (FIFO) pёr settlements e vjetra
            borxhet = db.query(models.ExpenseParticipant)\
                .join(models.Expense)\
                .filter(
                    models.Expense.group_id == settlement.group_id,
                    models.Expense.payer_id == receiver_id,
                    models.ExpenseParticipant.user_id == settlement.sender_id,
                    models.ExpenseParticipant.is_settled == False
                ).order_by(models.Expense.created_date.asc()).all()

            rem_amount = float(settlement.amount)
            for b in borxhet:
                if rem_amount <= 0: break
                
                share = float(b.share_amount)
                if share <= rem_amount:
                    rem_amount -= share
                    b.is_settled = True
                else:
                    b.share_amount = share - rem_amount
                    rem_amount = 0
                    # share_amount u zvogëlua por borxhi nuk u shlye plotësisht
                    # is_settled mbetet False — i saktë

        db.commit()
        return True
    except Exception as e:
        db.rollback()
        logger.error(f"Gabim gjatë konfirmimit: {e}")
        return False

def reject_settlement(db: Session, settlement_id: UUID, receiver_id: UUID):
    settlement = db.query(models.Settlement).filter(
        models.Settlement.id == settlement_id,
        models.Settlement.receiver_id == receiver_id,
        models.Settlement.status == "PENDING"
    ).first()
    
    if not settlement:
        return False
    
    settlement.status = "REJECTED"
    db.commit()
    return True