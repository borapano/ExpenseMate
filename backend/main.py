import os
from dotenv import load_dotenv

# 1. NGARKIMI I .ENV (Gjëja e parë që ekzekutohet)
load_dotenv()

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from uuid import UUID
import logging
import uvicorn

# Importet lokale
import models, schemas, crud, security 
from database import SessionLocal, engine, Base

# --- CONFIG & LOGGING ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 2. KRIJIMI I TABELAVE (Sinkronizimi me Neon)
try:
    models.Base.metadata.create_all(bind=engine)
    logger.info("✅ Tabelat në Database u sinkronizuan me sukses.")
except Exception as e:
    logger.error(f"❌ Gabim gjatë sinkronizimit të tabelave: {e}")

app = FastAPI(
    title="ExpenseMate API",
    description="Backend i sinkronizuar për Mac dhe Windows/WSL",
    version="1.3.3"
)

# --- KONFIGURIMI I CORS (I rregulluar për 127.0.0.1 dhe localhost) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
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
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="TOKEN_INVALID_OR_EXPIRED",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id_str = payload.get("sub")
    try:
        user_id = UUID(user_id_str)
    except (ValueError, TypeError, AttributeError):
        raise HTTPException(status_code=401, detail="TOKEN_CORRUPTED")
        
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="USER_NOT_FOUND")
    return user

# --- AUTH ENDPOINTS ---

@app.post("/auth/token", tags=["Auth"])
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    email_clean = form_data.username.lower().strip()
    user = crud.get_user_by_email(db, email=email_clean)
    
    if not user or not security.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="INVALID_CREDENTIALS",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = security.create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}

# --- USER ENDPOINTS ---

@app.post("/users/", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED, tags=["Users"])
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_user(db=db, user=user)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error regjistrimi: {e}")
        raise HTTPException(status_code=500, detail="INTERNAL_SERVER_ERROR")

@app.get("/users/me", response_model=schemas.UserOut, tags=["Users"])
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

# --- GROUP ENDPOINTS ---

@app.post("/groups/", response_model=schemas.GroupOut, status_code=status.HTTP_201_CREATED, tags=["Groups"])
def create_group(
    group: schemas.GroupCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    try:
        logger.info(f"Kërkesë për krijim grupi nga përdoruesi: {current_user.id}")
        new_group = crud.create_group(db=db, group=group, creator_id=current_user.id)
        logger.info(f"✅ Grupi u krijua me sukses: {new_group.name}")
        return new_group
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"❌ Gabim kritik te create_group: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"SERVER_ERROR: {str(e)}"
        )

@app.get("/groups/me", response_model=list[schemas.GroupOut], tags=["Groups"])
def get_my_groups(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    return crud.get_user_groups(db=db, user_id=current_user.id)

# --- ENDPOINT-I I RI PËR FAQEN GROUPDETAILS ---
@app.get("/groups/{group_id}", response_model=schemas.GroupOut, tags=["Groups"])
def read_group(
    group_id: UUID, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    """Merr detajet e një grupi specifik nëse përdoruesi është anëtar."""
    # Kontrollojmë nëse përdoruesi është anëtar i këtij grupi
    is_member = db.query(models.GroupMember).filter_by(
        user_id=current_user.id, 
        group_id=group_id
    ).first()
    
    if not is_member:
        logger.warning(f"Akses i paautorizuar: Përdoruesi {current_user.id} tentoi të hyjë në grupin {group_id}")
        raise HTTPException(status_code=403, detail="Nuk keni akses në këtë grup.")

    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if group is None:
        raise HTTPException(status_code=404, detail="Grupi nuk u gjet.")
        
    return group

@app.post("/groups/join", response_model=schemas.GroupOut, tags=["Groups"])
def join_group(
    data: schemas.GroupJoin, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    group = crud.join_group_by_code(db=db, code=data.invite_code, user_id=current_user.id)
    if not group:
        raise HTTPException(status_code=404, detail="INVALID_INVITE_CODE")
    return group

# --- EXPENSE ENDPOINTS ---

@app.post("/expenses/", response_model=schemas.ExpenseOut, status_code=status.HTTP_201_CREATED, tags=["Expenses"])
def create_expense(
    expense: schemas.ExpenseCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    try:
        return crud.create_expense(db=db, expense=expense)
    except Exception as e:
        logger.error(f"Error krijim shpenzimi: {e}")
        raise HTTPException(status_code=400, detail="EXPENSE_CREATION_FAILED")

# --- START SCRIPT ---
if __name__ == "__main__":
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("❌ ERROR: DATABASE_URL nuk u gjet te .env! Kontrollo path-in e skedarit.")
    else:
        print(f"\n🚀 ExpenseMate Backend po niset...")
        print(f"📡 Lidhja me Database: AKTIVE")
        uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)