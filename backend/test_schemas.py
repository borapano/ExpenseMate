from schemas import (
    UserCreate,
    ExpenseBase,
    ExpenseCreate,
    ExpenseParticipantCreate
)
from datetime import date
from decimal import Decimal
from uuid import uuid4

print("\n--- TESTIM I PLOTË Pydantic ---\n")

# ---------------- USER TESTS ----------------

# Test 1: User valid
try:
    user = UserCreate(
        name="Filan Fisteku",
        email="filan@gmail.com",
        password="password123"
    )
    print("✅ User valid")
except Exception as e:
    print("❌ User valid failed:", e)

# Test 2: Email invalid
try:
    user = UserCreate(
        name="Test",
        email="invalid-email",
        password="password123"
    )
    print("❌ Email invalid u pranua")
except Exception as e:
    print("✅ Email invalid u refuzua")

# Test 3: Password short
try:
    user = UserCreate(
        name="Test",
        email="test@gmail.com",
        password="123"
    )
    print("❌ Password i shkurtër u pranua")
except Exception:
    print("✅ Password i shkurtër u refuzua")

# ---------------- EXPENSE TESTS ----------------

# Test 4: Expense valid
try:
    exp = ExpenseBase(
        amount=Decimal("50.50"),
        description="Darkë",
        expense_date=date.today()
    )
    print("✅ Expense valid")
except Exception as e:
    print("❌ Expense valid failed:", e)

# Test 5: Future date
try:
    exp = ExpenseBase(
        amount=Decimal("50"),
        description="Test",
        expense_date=date(2030, 1, 1)
    )
    print("❌ Future date u pranua")
except Exception:
    print("✅ Future date u refuzua")

# Test 6: Negative amount
try:
    exp = ExpenseBase(
        amount=Decimal("-10"),
        description="Gabim",
        expense_date=date.today()
    )
    print("❌ Negative amount u pranua")
except Exception:
    print("✅ Negative amount u refuzua")

# ---------------- EXPENSE CREATE (ADVANCED) ----------------

# Test 7: ExpenseCreate valid me participants
try:
    exp_create = ExpenseCreate(
        group_id=uuid4(),
        payer_id=uuid4(),
        amount=Decimal("100"),
        description="Dinner",
        expense_date=date.today(),
        participants=[
            ExpenseParticipantCreate(
                user_id=uuid4(),
                share_amount=Decimal("50")
            ),
            ExpenseParticipantCreate(
                user_id=uuid4(),
                share_amount=Decimal("50")
            )
        ]
    )
    print("✅ ExpenseCreate valid")
except Exception as e:
    print("❌ ExpenseCreate failed:", e)

# Test 8: Participant me share negative
try:
    exp_create = ExpenseCreate(
        group_id=uuid4(),
        payer_id=uuid4(),
        amount=Decimal("100"),
        description="Dinner",
        expense_date=date.today(),
        participants=[
            ExpenseParticipantCreate(
                user_id=uuid4(),
                share_amount=Decimal("-10")
            )
        ]
    )
    print("❌ Participant negativ u pranua")
except Exception:
    print("✅ Participant negativ u refuzua")

# Test 9: Pa participants
try:
    exp_create = ExpenseCreate(
        group_id=uuid4(),
        payer_id=uuid4(),
        amount=Decimal("100"),
        description="Dinner",
        expense_date=date.today(),
        participants=[]
    )
    print("⚠️ Expense pa participants u pranua (vendos vetë nëse lejohet)")
except Exception:
    print("✅ Expense pa participants u refuzua")

print("\n--- TESTIMI PERFUNDOI ---\n")