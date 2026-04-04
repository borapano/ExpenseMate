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
    name: str = Field(..., min_length=2, max_length=100) # Reverted to 'name' based on ERD
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

# --- MEMBER SCHEMAS (Shtuar për Sprint 1.B) ---
class GroupMemberOut(BaseModel):
    user_id: UUID
    group_id: UUID
    
    model_config = ConfigDict(from_attributes=True)

# --- EXPENSE PARTICIPANT SCHEMAS ---
class ExpenseParticipantBase(BaseModel):
    user_id: UUID
    share_amount: Decimal = Field(..., gt=0, decimal_places=2)

class ExpenseParticipantCreate(ExpenseParticipantBase):
    pass

class ExpenseParticipantOut(ExpenseParticipantBase):
    expense_id: UUID
    model_config = ConfigDict(from_attributes=True)

# --- EXPENSE SCHEMAS ---
class ExpenseBase(BaseModel):
    amount: Decimal = Field(..., gt=0, decimal_places=2)
    description: str = Field(..., min_length=3, max_length=255)
    category: str = Field("General", max_length=50)
    expense_date: date
    receipt_image: Optional[str] = None 

    @field_validator("expense_date")
    @classmethod
    def validate_date(cls, v):
        if v > date.today():
            raise ValueError("Expense date cannot be in the future")
        return v

class ExpenseCreate(ExpenseBase):
    group_id: UUID
    payer_id: UUID
    participants: List[ExpenseParticipantCreate]

    @field_validator("participants")
    @classmethod
    def validate_participants(cls, v):
        if not v:
            raise ValueError("Expense must have at least one participant")
        return v

class ExpenseOut(ExpenseBase):
    id: UUID
    group_id: UUID
    payer_id: UUID
    created_date: datetime
    participants: List[ExpenseParticipantOut] = []

    model_config = ConfigDict(from_attributes=True)

# --- BALANCE SCHEMAS ---
class BalanceOut(BaseModel):
    id: UUID
    user_id: UUID
    group_id: UUID
    amount_owed: Decimal = Field(..., decimal_places=2)
    amount_to_receive: Decimal = Field(..., decimal_places=2)

    model_config = ConfigDict(from_attributes=True)

# --- AUTH SCHEMAS (Shtuar për qartësi) ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[str] = None