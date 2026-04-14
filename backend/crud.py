from sqlalchemy.orm import Session
from uuid import uuid4, UUID
import models
import schemas
import security
import utils 
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException

# ---------------- USER CRUD ----------------

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    # 1. Kontrollo nëse ekziston email-i
    existing_user = get_user_by_email(db, user.email)
    if existing_user:
        raise ValueError("Ky email është i regjistruar më parë.")

    # 2. Hashing i sigurt i fjalëkalimit
    hashed_pass = security.get_password_hash(user.password)

    # 3. Krijimi i objektit të përdoruesit
    db_user = models.User(
        id=uuid4(),
        name=user.name,
        email=user.email,
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
        raise ValueError("Gabim në database gjatë regjistrimit.")

# ---------------- GROUP CRUD ----------------

def generate_unique_group_code(db: Session):
    """Gjeneron një kod unik 6-shifror dhe kontrollon nëse ekziston në DB."""
    while True:
        # Përdor funksionin te utils.py
        code = utils.generate_invite_code(length=6)
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
        db.flush()  # Rezervojmë ID-në e grupit për ta përdorur te membership

        # Shto krijuesin automatikisht si anëtarin e parë
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
        print(f"Error creating group: {e}")
        raise

def join_group_by_code(db: Session, code: str, user_id: UUID):
    """Bashkohet me një grup përmes kodit të ftesës."""
    group = db.query(models.Group).filter(models.Group.code == code.upper()).first()
    if not group:
        return None
    
    # Kontrollo nëse përdoruesi është tashmë anëtar
    already_member = db.query(models.GroupMember).filter_by(
        user_id=user_id,
        group_id=group.id
    ).first()
    
    if already_member:
        return group 

    # Shto anëtarin e ri
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
        raise e

def get_user_groups(db: Session, user_id: UUID):
    """Merr listën e të gjitha grupeve ku bën pjesë përdoruesi."""
    return db.query(models.Group).join(models.GroupMember).filter(models.GroupMember.user_id == user_id).all()

# ---------------- EXPENSE CRUD ----------------

def create_expense(db: Session, expense: schemas.ExpenseCreate):
    """Krijon shpenzimin dhe regjistron pjesëmarrësit."""
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

        # Shto pjesëmarrësit (ndarja e faturës)
        # KUJDES: Hiqet 'id=uuid4()' sepse models.py nuk ka id kolonë te kjo tabelë
        for p in expense.participants:
            participant = models.ExpenseParticipant(
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
        raise HTTPException(status_code=400, detail="Dështoi krijimi i shpenzimit.")