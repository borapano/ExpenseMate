import os
import logging
from pathlib import Path
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(dotenv_path=BASE_DIR / ".env")

from sqlalchemy.orm import Session
from sqlalchemy import func
from uuid import uuid4, UUID
import models, schemas, security, utils
from sqlalchemy.exc import IntegrityError, DataError
from fastapi import HTTPException

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

        membership = models.GroupMember(
            user_id=creator_id,
            group_id=db_group.id
        )
        db.add(membership)
        
        db.commit()
        db.refresh(db_group)
        return db_group
    except Exception as e:
        db.rollback()
        logger.error(f"Gabim në krijimin e grupit: {str(e)}")
        raise HTTPException(status_code=500, detail="DATABASE_ERROR")

def join_group_by_code(db: Session, code: str, user_id: UUID):
    clean_code = code.upper().strip()
    group = db.query(models.Group).filter(models.Group.code == clean_code).first()
    
    if not group:
        return None
    
    already_member = db.query(models.GroupMember).filter_by(user_id=user_id, group_id=group.id).first()
    if already_member:
        return group 

    try:
        new_member = models.GroupMember(user_id=user_id, group_id=group.id)
        db.add(new_member)
        db.commit()
        db.refresh(group)
        return group
    except Exception as e:
        db.rollback()
        logger.error(f"Gabim në bashkimin e grupit: {str(e)}")
        raise HTTPException(status_code=400, detail="JOIN_FAILED")

def get_user_groups(db: Session, user_id: UUID):
    return db.query(models.Group).join(models.GroupMember).filter(models.GroupMember.user_id == user_id).all()

# ---------------- EXPENSE CRUD ----------------

def create_expense(db: Session, expense: schemas.ExpenseCreate, payer_id: UUID):
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
            participant = models.ExpenseParticipant(
                expense_id=db_expense.id,
                user_id=p.user_id,
                share_amount=p.share_amount,
                is_settled=False
            )
            db.add(participant)

        db.commit()
        db.refresh(db_expense)
        return db_expense

    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="INVALID_DATA")
    except DataError:
        db.rollback()
        raise HTTPException(status_code=400, detail="FORMAT_ERROR")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

def update_expense(db: Session, expense_id: UUID, expense_data: schemas.ExpenseCreate, current_user_id: UUID):
    db_expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    
    if not db_expense:
        return None
    
    if db_expense.payer_id != current_user_id:
        raise HTTPException(status_code=403, detail="NOT_ALLOWED")

    try:
        db_expense.amount = expense_data.amount
        db_expense.description = expense_data.description
        db_expense.category = expense_data.category
        db_expense.expense_date = expense_data.expense_date
        db_expense.receipt_image = expense_data.receipt_image

        db.query(models.ExpenseParticipant).filter(
            models.ExpenseParticipant.expense_id == expense_id
        ).delete()

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

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="UPDATE_FAILED")

def get_group_expenses(db: Session, group_id: UUID, skip: int = 0, limit: int = 50):
    expenses = db.query(models.Expense).filter(
        models.Expense.group_id == group_id
    ).order_by(models.Expense.created_date.desc(), models.Expense.expense_date.desc()).offset(skip).limit(limit).all()

    result = []

    for expense in expenses:
        payer = db.query(models.User).filter(models.User.id == expense.payer_id).first()

        participants = db.query(models.ExpenseParticipant).filter(
            models.ExpenseParticipant.expense_id == expense.id
        ).all()

        participants_data = []

        for p in participants:
            user = db.query(models.User).filter(models.User.id == p.user_id).first()

            participants_data.append({
                "user_id": str(p.user_id),
                "user_name": user.name if user else "Unknown",
                "share_amount": float(p.share_amount),
                "is_settled": p.is_settled
            })

        result.append({
            "id": str(expense.id),
            "group_id": str(expense.group_id),
            "payer_id": str(expense.payer_id),
            "payer_name": payer.name if payer else "Unknown",
            "amount": float(expense.amount),
            "description": expense.description,
            "category": expense.category,
            "expense_date": expense.expense_date,
            "created_date": expense.created_date,  # ✅ Fixed: was incorrectly set to expense_date
            "participants": participants_data
        })

    return result

def delete_expense(db: Session, expense_id: UUID, current_user_id: UUID):
    db_expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    
    if not db_expense:
        return False

    if db_expense.payer_id != current_user_id:
        raise HTTPException(status_code=403, detail="NOT_ALLOWED")

    db.delete(db_expense)
    db.commit()
    return True