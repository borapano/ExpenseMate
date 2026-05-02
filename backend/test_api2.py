from main import app, get_my_expenses, get_global_settlements
from database import SessionLocal
from models import User

db = SessionLocal()
user = db.query(User).first()
if not user:
    print("No user")
    exit()

try:
    print("Testing get_my_expenses")
    res = get_my_expenses(limit=10, offset=0, group_id=None, db=db, current_user=user)
    print("Expenses success:", len(res["expenses"]))
except Exception as e:
    import traceback
    traceback.print_exc()

try:
    print("Testing get_global_settlements")
    res = get_global_settlements(db=db, current_user=user)
    print("Dashboard success")
except Exception as e:
    import traceback
    traceback.print_exc()
