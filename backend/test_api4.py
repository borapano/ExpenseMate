from main import app, get_my_expenses, get_global_settlements
from database import SessionLocal
from models import User, ExpenseParticipant
from fastapi.encoders import jsonable_encoder
import json

db = SessionLocal()
# find a user who has expenses
ep = db.query(ExpenseParticipant).first()
if ep:
    user = db.query(User).filter(User.id == ep.user_id).first()
    print("Found user:", user.name)
    try:
        print("Testing get_my_expenses...")
        res = get_my_expenses(limit=100, offset=0, group_id=None, db=db, current_user=user)
        encoded = jsonable_encoder(res)
        print("get_my_expenses SUCCESS, total:", encoded.get("total", "N/A"), "items count:", len(encoded.get("expenses", [])))
    except Exception as e:
        import traceback
        traceback.print_exc()

    try:
        print("Testing get_global_settlements...")
        res2 = get_global_settlements(db=db, current_user=user)
        encoded2 = jsonable_encoder(res2)
        print("get_global_settlements SUCCESS")
    except Exception as e:
        import traceback
        traceback.print_exc()
else:
    print("No expenses found in DB")
