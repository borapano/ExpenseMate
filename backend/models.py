import uuid
from sqlalchemy import Column, String, ForeignKey, Numeric, DateTime, Date, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

# --- 1. USER MODEL ---
class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="user")
    phone_number = Column(String, nullable=True)
    avatar = Column(String, nullable=True)

    # RELATIONSHIPS
    created_groups = relationship("Group", back_populates="creator")
    memberships = relationship("GroupMember", back_populates="user", cascade="all, delete-orphan")
    expenses_paid = relationship("Expense", back_populates="payer")
    participations = relationship("ExpenseParticipant", back_populates="user", cascade="all, delete-orphan")
    balances = relationship("Balance", back_populates="user", cascade="all, delete-orphan")

# --- 2. GROUP MODEL ---
class Group(Base):
    __tablename__ = "groups"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    code = Column(String, unique=True, index=True, nullable=False)
    creator_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    description = Column(String, nullable=True)
    created_date = Column(DateTime(timezone=True), server_default=func.now())

    # RELATIONSHIPS
    creator = relationship("User", back_populates="created_groups")
    members = relationship("GroupMember", back_populates="group", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="group", cascade="all, delete-orphan")
    balances = relationship("Balance", back_populates="group", cascade="all, delete-orphan")

# --- 3. GROUP_MEMBER (Association Table) ---
class GroupMember(Base):
    __tablename__ = "group_members"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id"), primary_key=True)

    # RELATIONSHIPS
    user = relationship("User", back_populates="memberships")
    group = relationship("Group", back_populates="members")

# --- 4. EXPENSE MODEL ---
class Expense(Base):
    __tablename__ = "expenses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id"), nullable=False)
    payer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Currency: EURO (Precision 10, Scale 2)
    amount = Column(Numeric(10, 2), nullable=False)
    description = Column(String, nullable=True)
    category = Column(String, nullable=True)
    
    expense_date = Column(Date, nullable=False, server_default=func.current_date())
    created_date = Column(DateTime(timezone=True), server_default=func.now())
    receipt_image = Column(String, nullable=True)

    # RELATIONSHIPS
    group = relationship("Group", back_populates="expenses")
    payer = relationship("User", back_populates="expenses_paid")
    participants = relationship("ExpenseParticipant", back_populates="expense", cascade="all, delete-orphan")

# --- 5. EXPENSE_PARTICIPANT (Who owes what) ---
class ExpenseParticipant(Base):
    __tablename__ = "expense_participants"

    expense_id = Column(UUID(as_uuid=True), ForeignKey("expenses.id"), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    
    # Part of the total expense in EURO
    share_amount = Column(Numeric(10, 2), nullable=False)
    is_settled = Column(Boolean, default=False)

    # RELATIONSHIPS
    expense = relationship("Expense", back_populates="participants")
    user = relationship("User", back_populates="participations")

# --- 6. BALANCE MODEL ---
class Balance(Base):
    __tablename__ = "balances"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id"))
    
    # Net amounts in EURO
    amount_owed = Column(Numeric(10, 2), default=0.00)
    amount_to_receive = Column(Numeric(10, 2), default=0.00)

    # RELATIONSHIPS
    user = relationship("User", back_populates="balances")
    group = relationship("Group", back_populates="balances")