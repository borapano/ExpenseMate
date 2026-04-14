import os
from dotenv import load_dotenv

# RREGULLI I ARTË: Ngarkimi i .env para çdo gjëje tjetër
load_dotenv()

from sqlalchemy.orm import Session
from sqlalchemy import func
from uuid import uuid4, UUID
import models
import schemas
import security
import utils 
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException

# Printimi i kontrollit për kolegun në Windows/WSL
db_url = os.getenv("DATABASE_URL")
print(f"DEBUG CRUD: Duke përdorur database: {db_url[:25] if db_url else 'NUK U GJET'}...")

# ---------------- USER CRUD ----------------

def get_user_by_email(db: Session, email: str):
    """
    Kërkon përdoruesin duke përdorur func.lower() për të shmangur 
    problemet e Case-Sensitivity në Windows/WSL dhe Neon.
    """
    if not email:
        return None
    # strip() heq hapësirat e padukshme që shkaktojnë errore false
    clean_email = email.lower().strip()
    return db.query(models.User).filter(func.lower(models.User.email) == clean_email).first()

def create_user(db: Session, user: schemas.UserCreate):
    # 1. Kontrollo nëse ekziston email-i
    existing_user = get_user_by_email(db, user.email)
    if existing_user:
        # Kjo ValueError kapet nga main.py dhe kthehet si HTTPException 400
        raise ValueError("Ky email është i regjistruar më parë.")

    # 2. Hashing i sigurt (përdor security.get_password_hash)
    hashed_pass = security.get_password_hash(user.password)

    # 3. Krijimi i objektit
    db_user = models.User(
        id=uuid4(),
        name=user.name,
        email=user.email.lower().strip(),
        password_hash=hashed_pass,
        phone_number=user.phone_number,
        avatar=user.avatar,
        role="user"
    )

    try:
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    except IntegrityError:
        db.rollback()
        raise ValueError("Gabim i papritur: Email-i u regjistrua nga një tjetër proces.")

# ---------------- GROUP CRUD ----------------

def generate_unique_group_code(db: Session):
    """Gjeneron një kod unik 6-shifror dhe kontrollon nëse ekziston."""
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

        # Shto krijuesin automatikisht si anëtarin e parë
        membership = models.GroupMember(
            id=uuid4(), # Sigurohemi që ka UUID
            user_id=creator_id,
            group_id=db_group.id
        )
        db.add(membership)

        db.commit()
        db.refresh(db_group)
        return db_group
    except Exception as e:
        db.rollback()
        print(f"Error creating group: {e}")
        raise HTTPException(status_code=500, detail="Dështoi krijimi i grupit")

def join_group_by_code(db: Session, code: str, user_id: UUID):
    """Bashkohet me një grup (Case-Insensitive)."""
    clean_code = code.upper().strip()
    group = db.query(models.Group).filter(models.Group.code == clean_code).first()
    
    if not group:
        return None
    
    # Kontrollo nëse është anëtar
    already_member = db.query(models.GroupMember).filter_by(
        user_id=user_id,
        group_id=group.id
    ).first()
    
    if already_member:
        return group 

    new_member = models.GroupMember(
        id=uuid4(),
        user_id=user_id,
        group_id=group.id
    )
    try:
        db.add(new_member)
        db.commit()
        db.refresh(group)
        return group
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Nuk u mundësua bashkimi me grupin")

def get_user_groups(db: Session, user_id: UUID):
    return db.query(models.Group).join(models.GroupMember).filter(models.GroupMember.user_id == user_id).all()

# ---------------- EXPENSE CRUD ----------------

def create_expense(db: Session, expense: schemas.ExpenseCreate):
    try:
        db_expense = models.Expense(
            id=uuid4(),
            group_id=expense.group_id,
            payer_id=expense.payer_id,
            amount=expense.amount,
            description=expense.description,
            category=expense.category,
            expense_date=expense.expense_date,
            receipt_image=expense.receipt_image
        )

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
        print(f"Error creating expense: {e}")
        raise HTTPException(status_code=400, detail="Gabim gjatë ruajtjes së shpenzimit.")