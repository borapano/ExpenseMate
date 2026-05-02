from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
from models import User

client = TestClient(app)
db = SessionLocal()
user = db.query(User).first()
if not user:
    print("No user found")
    exit()

def override_get_current_user():
    return user

app.dependency_overrides[app.dependency_overrides.get("get_current_user", override_get_current_user)] = override_get_current_user
# Actually, let's just override the dependency in the app
from dependencies import get_current_user
app.dependency_overrides[get_current_user] = override_get_current_user

try:
    res = client.get("/users/me/expenses")
    print("/users/me/expenses:", res.status_code)
    if res.status_code == 500:
        print(res.text)
        
    res2 = client.get("/users/me/settlement_dashboard")
    print("/users/me/settlement_dashboard:", res2.status_code)
    if res2.status_code == 500:
        print(res2.text)
except Exception as e:
    print("Exception:", e)
