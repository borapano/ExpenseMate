import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from uuid import UUID
import logging
import uvicorn

import models, schemas, crud, security 
from database import SessionLocal, engine

# --- CONFIG & LOGGING ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    models.Base.metadata.create_all(bind=engine)
    logger.info("✅ Database u sinkronizua.")
except Exception as e:
    logger.error(f"❌ Gabim Database: {e}")

app = FastAPI(title="ExpenseMate API", version="1.5.1")

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

# --- DEPENDENCIES ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = security.decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="TOKEN_INVALID")
    try:
        user_id = UUID(payload.get("sub"))
    except:
        raise HTTPException(status_code=401, detail="TOKEN_CORRUPTED")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="USER_NOT_FOUND")
    return user

# --- AUTH & USERS ---
@app.post("/auth/token", tags=["Auth"])
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=form_data.username.lower().strip())
    if not user or not security.verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="INVALID_CREDENTIALS")
    return {"access_token": security.create_access_token(data={"sub": str(user.id)}), "token_type": "bearer"}

@app.post("/users/", response_model=schemas.UserOut, tags=["Users"])
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    return crud.create_user(db=db, user=user)

@app.get("/users/me", response_model=schemas.UserOut, tags=["Users"])
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

# --- GROUPS ---

@app.post("/groups/", response_model=schemas.GroupOut, tags=["Groups"])
def create_group(group: schemas.GroupCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    try:
        new_group = crud.create_group(db=db, group=group, creator_id=current_user.id)
        return read_group(group_id=new_group.id, db=db, current_user=current_user)
    except Exception as e:
        logger.error(f"Error create_group: {e}")
        raise HTTPException(status_code=500, detail="INTERNAL_SERVER_ERROR")

@app.get("/groups/me", response_model=list[schemas.GroupOut], tags=["Groups"])
def get_my_groups(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Optimizim: Marrim grupet bashkë me anëtarët dhe shpenzimet në një kërkesë të vetme (Eager Loading)
    user_groups = crud.get_user_groups(db=db, user_id=current_user.id)
    
    results = []
    for g in user_groups:
        # Llogarisim totalin direkt nga relationship-i (nëse është i definuar në models.py)
        # Nëse nuk e ke relationship-in, kjo query është më e shpejtë se func.sum
        total = db.query(func.sum(models.Expense.amount)).filter(models.Expense.group_id == g.id).scalar() or 0.0
        
        # Marrim anëtarët
        members = db.query(models.User).join(models.GroupMember).filter(models.GroupMember.group_id == g.id).all()
        
        results.append({
            "id": g.id, 
            "name": g.name, 
            "description": g.description or "", 
            "code": g.code,
            "creator_id": g.creator_id, 
            "created_at": getattr(g, 'created_at', datetime.now()),
            "members": [{"user_id": m.id, "user_name": m.name, "user_email": m.email} for m in members],
            "expenses": [], 
            "total_expenses": float(total)
        })
    return results

@app.get("/groups/{group_id}", response_model=schemas.GroupOut, tags=["Groups"])
def read_group(group_id: UUID, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group: 
        raise HTTPException(status_code=404, detail="GROUP_NOT_FOUND")
    
    is_member = db.query(models.GroupMember).filter_by(user_id=current_user.id, group_id=group_id).first()
    if not is_member: 
        raise HTTPException(status_code=403, detail="ACCESS_DENIED")

    # Optimizim: Marrim shpenzimet dhe anëtarët paralelisht
    members = db.query(models.User).join(models.GroupMember).filter(models.GroupMember.group_id == group_id).all()
    expenses = db.query(models.Expense).filter(models.Expense.group_id == group_id).all()
    total = sum([e.amount for e in expenses]) or 0.0
    
    return {
        "id": group.id,
        "name": group.name,
        "description": group.description or "",
        "code": group.code,
        "creator_id": group.creator_id,
        "created_at": getattr(group, 'created_at', datetime.now()),
        "members": [{"user_id": m.id, "user_name": m.name, "user_email": m.email} for m in members],
        "expenses": expenses, 
        "total_expenses": float(total)
    }

@app.post("/groups/join", response_model=schemas.GroupOut, tags=["Groups"])
def join_group(data: schemas.GroupJoin, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    group = crud.join_group_by_code(db=db, code=data.invite_code, user_id=current_user.id)
    if not group: 
        raise HTTPException(status_code=404, detail="INVALID_CODE")
    return read_group(group_id=group.id, db=db, current_user=current_user)

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)