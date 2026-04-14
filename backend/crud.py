import os
from pathlib import Path
from dotenv import load_dotenv

# 1. Blindimi i .env (Fix për sinkronizimin Windows/Mac)
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(dotenv_path=BASE_DIR / ".env")

from sqlalchemy.orm import Session
from sqlalchemy import func
from uuid import uuid4, UUID
import models, schemas, security, utils
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException

# Printimi për DEBUG
db_check = os.getenv("DATABASE_URL")
print(f"DEBUG CRUD: Database URL is {'DETECTED' if db_check else 'NOT FOUND'}")

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
    except IntegrityError:
        db.rollback()
        raise ValueError("DATABASE_INTEGRITY_ERROR")

# ---------------- GROUP CRUD ----------------

def get_group(db: Session, group_id: UUID):
    """Merr një grup specifik sipas ID-së (SHTESA E RE)."""
    return db.query(models.Group).filter(models.Group.id == group_id).first()

def generate_unique_group_code(db: Session):
    """Gjeneron kod unik 6-shifror (Case-Insensitive)."""
    while True:
        try:
            code = utils.generate_invite_code(length=6).upper()
        except AttributeError:
            import secrets
            import string
            code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))
            
        exists = db.query(models.Group).filter(models.Group.code == code).first()
        if not exists:
            return code

def create_group(db: Session, group: schemas.GroupCreate, creator_id: UUID):
    """Krijon grupin dhe shton automatikisht krijuesin si anëtar."""
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

        # Anëtarësia pa ID (pasi modeli yt nuk e ka fushën id)
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
        print(f"CRITICAL ERROR (Create Group): {str(e)}")
        raise HTTPException(status_code=500, detail=f"DATABASE_ERROR: {str(e)}")

def join_group_by_code(db: Session, code: str, user_id: UUID):
    clean_code = code.upper().strip()
    group = db.query(models.Group).filter(models.Group.code == clean_code).first()
    
    if not group:
        return None
    
    already_member = db.query(models.GroupMember).filter_by(
        user_id=user_id,
        group_id=group.id
    ).first()
    
    if already_member:
        return group 

    new_member = models.GroupMember(
        user_id=user_id,
        group_id=group.id
    )
    
    try:
        db.add(new_member)
        db.commit()
        db.refresh(group)
        return group
    except Exception as e:
        db.rollback()
        print(f"CRITICAL ERROR (Join Group): {e}")
        raise HTTPException(status_code=400, detail="JOIN_FAILED")

def get_user_groups(db: Session, user_id: UUID):
    return db.query(models.Group).join(models.GroupMember).filter(models.GroupMember.user_id == user_id).all()

# ---------------- EXPENSE CRUD ----------------

def create_expense(db: Session, expense: schemas.ExpenseCreate):
    db_expense = models.Expense(
        id=uuid4(),
        group_id=expense.group_id,
        payer_id=expense.payer_id,
        amount=expense.amount,
        description=expense.description,
        category=expense.category,
        expense_date=expense.expense_date
    )

    try:
        db.add(db_expense)
        db.flush() 

        for p in expense.participants:
            participant = models.ExpenseParticipant(
                id=uuid4(),
                expense_id=db_expense.id,
                user_id=p.user_id,
                share_amount=p.share_amount
            )
            db.add(participant)

        db.commit()
        db.refresh(db_expense)
        return db_expense
    except Exception as e:
        db.rollback()
        print(f"CRITICAL ERROR (Create Expense): {e}")
        raise HTTPException(status_code=400, detail="EXPENSE_CREATION_FAILED")