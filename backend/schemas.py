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

class UserOut(UserBase):
    id: UUID
    role: UserRole
    model_config = ConfigDict(from_attributes=True)

# --- GROUP MEMBER SCHEMAS ---
class GroupMemberOut(BaseModel):
    user_id: UUID
    user_name: str
    user_email: str
    model_config = ConfigDict(from_attributes=True)

# --- EXPENSE SCHEMAS ---
class ExpenseParticipantBase(BaseModel):
    user_id: UUID
    share_amount: Decimal = Field(..., gt=0, decimal_places=2)

class ExpenseParticipantOut(ExpenseParticipantBase):
    expense_id: UUID
    model_config = ConfigDict(from_attributes=True)

class ExpenseBase(BaseModel):
    amount: Decimal = Field(..., gt=0, decimal_places=2)
    description: str = Field(..., min_length=3, max_length=255)
    category: str = Field("General", max_length=50)
    expense_date: date
    receipt_image: Optional[str] = None 

class ExpenseCreate(ExpenseBase):
    group_id: UUID
    payer_id: UUID
    participants: List[ExpenseParticipantBase]

class ExpenseOut(ExpenseBase):
    id: UUID
    group_id: UUID
    payer_id: UUID
    participants: List[ExpenseParticipantOut] = Field(default_factory=list)
    model_config = ConfigDict(from_attributes=True)

# --- GROUP SCHEMAS ---
class GroupBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = Field(None, max_length=255)

class GroupCreate(GroupBase):
    pass

class GroupJoin(BaseModel):
    invite_code: str = Field(..., min_length=6, max_length=6)

class GroupOut(GroupBase):
    id: UUID
    code: str
    creator_id: UUID
    created_at: Optional[datetime] = None 
    members: List[GroupMemberOut] = Field(default_factory=list)
    expenses: List[ExpenseOut] = Field(default_factory=list) # SHTUAR: Për faqen e detajeve
    total_expenses: float = 0.0
    model_config = ConfigDict(from_attributes=True)

# --- AUTH SCHEMAS ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[str] = None