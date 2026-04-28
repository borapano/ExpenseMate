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

# ✅ Statuset e reja për Settlement
class SettlementStatus(str, enum.Enum):
    pending = "PENDING"
    confirmed = "CONFIRMED"
    rejected = "REJECTED"

class ExpenseCategory(str, enum.Enum):
    food_dining = "Food & Dining"
    groceries = "Groceries"
    transportation = "Transportation"
    housing = "Housing"
    utilities = "Utilities"
    entertainment = "Entertainment"
    shopping = "Shopping"
    travel = "Travel"
    health = "Health"
    bills_subscriptions = "Bills & Subscriptions"
    other = "Other"

# --- USER SCHEMAS ---
class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone_number: Optional[str] = Field(None, max_length=20)
    avatar: Optional[str] = None
    monthly_budget: Decimal = Field(default=Decimal("1000.00"), ge=0, decimal_places=2)

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
    user_name: Optional[str] = None 
    is_settled: bool = False
    model_config = ConfigDict(from_attributes=True)

class ExpenseBase(BaseModel):
    amount: Decimal = Field(..., gt=0, decimal_places=2)
    description: str = Field(..., min_length=3, max_length=255)
    category: ExpenseCategory
    expense_date: date
    receipt_image: Optional[str] = None 

class ExpenseCreate(ExpenseBase):
    group_id: UUID
    participants: List[ExpenseParticipantBase]

    @field_validator('participants')
    @classmethod
    def validate_total_shares(cls, participants, info):
        total_amount = info.data.get('amount')
        if total_amount is None:
            return participants
        
        sum_shares = sum(p.share_amount for p in participants)
        if round(sum_shares, 2) != round(total_amount, 2):
            raise ValueError(f"Shuma e pjesëve ({sum_shares}) duhet të jetë e barabartë me totalin ({total_amount})")
        return participants

class ExpenseOut(ExpenseBase):
    id: UUID
    group_id: UUID
    payer_id: UUID 
    payer_name: Optional[str] = None 
    participants: List[ExpenseParticipantOut] = Field(default_factory=list)
    created_date: datetime 
    
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
    created_date: datetime 
    members: List[GroupMemberOut] = Field(default_factory=list)
    expenses: List[ExpenseOut] = Field(default_factory=list) 
    total_expenses: Decimal = Decimal("0.00")
    net_balance: Decimal = Decimal("0.00")
    
    model_config = ConfigDict(from_attributes=True)

# --- ✅ SETTLEMENT SCHEMAS (Faza 5) ---

class SettlementBase(BaseModel):
    amount: Decimal = Field(..., gt=0, decimal_places=2)
    group_id: UUID
    receiver_id: UUID

class SettlementCreate(SettlementBase):
    pass

class SettlementOut(SettlementBase):
    id: UUID
    sender_id: UUID
    sender_name: Optional[str] = None
    receiver_name: Optional[str] = None
    status: SettlementStatus
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# --- BALANCE SCHEMAS ---
class BalanceOut(BaseModel):
    user_id: UUID
    group_id: UUID
    amount_owed: Decimal
    amount_to_receive: Decimal
    net_balance: Decimal 
    model_config = ConfigDict(from_attributes=True)

# --- AUTH SCHEMAS ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[str] = None