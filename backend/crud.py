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
    # Kontrollo nëse ekziston
    existing_user = get_user_by_email(db, user.email)
    if existing_user:
        raise ValueError("Email already registered")

    hashed_pass = security.get_password_hash(user.password)

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
        raise


# ---------------- GROUP CRUD ----------------

def generate_unique_group_code(db: Session):
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
        db.flush()  # marrim ID pa commit

        # Shto creator si member
        membership = models.GroupMember(
            user_id=creator_id,
            group_id=db_group.id
        )
        db.add(membership)

        db.commit()
        db.refresh(db_group)
        return db_group

    except Exception:
        db.rollback()
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
            expense_date=expense.expense_date
        )

        db.add(db_expense)
        db.flush()  # marrim expense_id

        # Shto participants
        participants = []
        for p in expense.participants:
            participant = models.ExpenseParticipant(
                expense_id=db_expense.id,
                user_id=p.user_id,
                share_amount=p.share_amount
            )
            participants.append(participant)

        db.add_all(participants)

        db.commit()
        db.refresh(db_expense)
        return db_expense

    except Exception:
        db.rollback()
        raise