from sqlalchemy.orm import Session
from uuid import uuid4, UUID
import secrets
import models
import schemas
import security
from sqlalchemy.exc import IntegrityError

# ---------------- USER CRUD ----------------

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    # 1. Kontrollo nëse ekziston email-i
    existing_user = get_user_by_email(db, user.email)
    if existing_user:
        raise ValueError("Ky email është i regjistruar më parë.")

    # 2. Hashing i sigurt (SHA-256 + Bcrypt nga security.py)
    # Kjo zgjidh limitin 72-byte një herë e mirë
    hashed_pass = security.get_password_hash(user.password)

    # 3. Krijimi i objektit (Kujdes: user.username, jo user.name)
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
    """Gjeneron një kod unik 8-shifror (psh: A4B2C8D1)."""
    while True:
        code = secrets.token_hex(4).upper()
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
        db.flush()  # Rezervojmë ID-në e grupit për ta përdorur te anëtarësia

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

        # Shto pjesëmarrësit (ndarja e faturës)
        participants = []
        for p in expense.participants:
            participant = models.ExpenseParticipant(
                id=uuid4(), # Sigurohemi që çdo rresht ka ID-në e vet
                expense_id=db_expense.id,
                user_id=p.user_id,
                share_amount=p.share_amount
            )
            participants.append(participant)

        db.add_all(participants)

        db.commit()
        db.refresh(db_expense)
        return db_expense

    except Exception as e:
        db.rollback()
        print(f"Error creating expense: {e}")
        raise