from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
from uuid import UUID
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
import enum

# --- ENUMS ---
class UserRole(str, enum.Enum):
    admin = "admin"
    user = "user"

# --- USER SCHEMAS ---
class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone_number: Optional[str] = Field(None, max_length=20)
    avatar: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone_number: Optional[str] = Field(None, max_length=20)
    avatar: Optional[str] = None

class UserOut(UserBase):
    id: UUID
    role: UserRole
    created_date: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# --- GROUP SCHEMAS ---
class GroupBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = Field(None, max_length=255)

class GroupCreate(GroupBase):
    pass

class GroupOut(GroupBase):
    id: UUID
    code: str
    creator_id: UUID
    created_date: datetime

    model_config = ConfigDict(from_attributes=True)

# --- EXPENSE PARTICIPANT SCHEMAS ---
class ExpenseParticipantCreate(BaseModel):
    user_id: UUID
    share_amount: Decimal = Field(..., gt=0)

class ExpenseParticipantOut(ExpenseParticipantCreate):
    expense_id: UUID

    model_config = ConfigDict(from_attributes=True)

# --- EXPENSE SCHEMAS ---
class ExpenseBase(BaseModel):
    amount: Decimal = Field(..., gt=0)
    description: str = Field(..., min_length=3, max_length=255)
    category: str = Field("General", max_length=50)
    expense_date: date

    @field_validator("expense_date")
    def validate_date(cls, v):
        if v > date.today():
            raise ValueError("Expense date cannot be in the future")
        return v

class ExpenseCreate(ExpenseBase):
    group_id: UUID
    payer_id: UUID
    participants: List["ExpenseParticipantCreate"]

class ExpenseOut(ExpenseBase):
    id: UUID
    group_id: UUID
    payer_id: UUID
    created_date: datetime
    receipt_image: Optional[str] = None
    participants: List["ExpenseParticipantOut"] = []

    model_config = ConfigDict(from_attributes=True)

# --- BALANCE SCHEMAS ---
class BalanceOut(BaseModel):
    id: UUID
    user_id: UUID
    group_id: UUID
    amount_owed: Decimal
    amount_to_receive: Decimal

    model_config = ConfigDict(from_attributes=True)

# --- FIX forward references ---
ExpenseCreate.model_rebuild()
ExpenseOut.model_rebuild()