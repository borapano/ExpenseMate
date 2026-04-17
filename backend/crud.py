import os
import logging
from pathlib import Path
from datetime import datetime, timedelta
from dotenv import load_dotenv
from sqlalchemy.orm import Session
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
    # Owed to me (Lekë që do marr)
    owed_to_me = db.query(func.sum(models.ExpenseParticipant.share_amount))\
        .join(models.Expense, models.Expense.id == models.ExpenseParticipant.expense_id)\
        .filter(models.Expense.payer_id == user_id)\
        .filter(models.ExpenseParticipant.user_id != user_id)\
        .filter(models.ExpenseParticipant.is_settled == False)\
        .scalar() or 0.0

    # I owe (Lekë që do jap)
    i_owe = db.query(func.sum(models.ExpenseParticipant.share_amount))\
        .join(models.Expense, models.Expense.id == models.ExpenseParticipant.expense_id)\
        .filter(models.Expense.payer_id != user_id)\
        .filter(models.ExpenseParticipant.user_id == user_id)\
        .filter(models.ExpenseParticipant.is_settled == False)\
        .scalar() or 0.0

    return float(owed_to_me) - float(i_owe)

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
    return db.query(models.Group).join(models.GroupMember).filter(models.GroupMember.user_id == user_id).all()

# ---------------- EXPENSE CRUD ----------------

def create_expense(db: Session, expense: schemas.ExpenseCreate, payer_id: UUID):
    total_shares = sum(p.share_amount for p in expense.participants)
    if abs(float(total_shares) - float(expense.amount)) > 0.01:
        raise HTTPException(status_code=400, detail="Shuma e pjesëve nuk përputhet me totalin")

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
        raise HTTPException(status_code=400, detail="Shuma e pjesëve nuk përputhet me totalin")

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

# ---------------- ✅ SETTLEMENT CRUD (I RI) ----------------

def create_settlement(db: Session, settlement: schemas.SettlementCreate, sender_id: UUID):
    db_settlement = models.Settlement(
        id=uuid4(),
        group_id=settlement.group_id,
        sender_id=sender_id,
        receiver_id=settlement.receiver_id,
        amount=settlement.amount,
        status="PENDING"
    )
    db.add(db_settlement)
    db.commit()
    db.refresh(db_settlement)
    return db_settlement

def get_group_settlements(db: Session, group_id: UUID):
    # Filtrojmë që të mos shohim kërkesa më të vjetra se 7 ditë nëse janë PENDING
    seven_days_ago = datetime.now() - timedelta(days=7)
    
    return db.query(models.Settlement).filter(
        models.Settlement.group_id == group_id,
        or_(
            models.Settlement.status != "PENDING",
            models.Settlement.created_at >= seven_days_ago
        )
    ).order_by(models.Settlement.created_at.desc()).all()

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

        # 2. Logjika e mbylljes së borxheve: 
        # Gjejmë pjesëmarrjet ku Sender (paguesi i settlement) i ka borxh Receiver-it
        # (dmth Receiver ka paguar faturën origjinale dhe Sender është pjesëmarrës)
        borxhet = db.query(models.ExpenseParticipant)\
            .join(models.Expense)\
            .filter(
                models.Expense.group_id == settlement.group_id,
                models.Expense.payer_id == receiver_id,
                models.ExpenseParticipant.user_id == settlement.sender_id,
                models.ExpenseParticipant.is_settled == False
            ).order_by(models.Expense.created_date.asc()).all()

        rem_amount = settlement.amount
        for b in borxhet:
            if rem_amount <= 0: break
            
            if b.share_amount <= rem_amount:
                rem_amount -= b.share_amount
                b.is_settled = True
            else:
                # Nëse paguan pjesërisht një shpenzim të madh, krijojmë një balancë të re 
                # (Kjo pjesë mund të lihet e thjeshtë duke e mbyllur vetëm nqs shuma mbulon plotësisht)
                b.share_amount -= rem_amount
                rem_amount = 0

        db.commit()
        return True
    except Exception as e:
        db.rollback()
        logger.error(f"Gabim gjatë konfirmimit: {e}")
        return False

def reject_settlement(db: Session, settlement_id: UUID, receiver_id: UUID):
    settlement = db.query(models.Settlement).filter(
        models.Settlement.id == settlement_id,
        models.Settlement.receiver_id == receiver_id
    ).first()
    
    if not settlement:
        return False
    
    settlement.status = "REJECTED"
    db.commit()
    return True