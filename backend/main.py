from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from uuid import UUID
import logging

import models, schemas, crud, security 
from database import SessionLocal, engine

# --- CONFIG & LOGGING ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Krijimi i tabelave në DB
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ExpenseMate API",
    description="Professional Backend for Expense Sharing - Sprint 2.B Group Edition",
    version="1.2.2",
    swagger_ui_parameters={"persistAuthorization": True}
)

# --- KONFIGURIMI I CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",    
        "http://127.0.0.1:5173",    
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
            detail="Token i pavlefshëm ose i skaduar",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id_str = payload.get("sub")
    try:
        user_id = UUID(user_id_str)
    except (ValueError, TypeError, AttributeError):
        raise HTTPException(status_code=401, detail="Token i korruptuar")
        
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="Përdoruesi nuk ekziston")
    return user

# --- AUTH ENDPOINTS ---

@app.post("/auth/token", tags=["Auth"])
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    # Konvertojmë email-in në lowercase për të shmangur gabimet e shkrimit
    email_clean = form_data.username.lower().strip()
    user = crud.get_user_by_email(db, email=email_clean)
    
    if not user:
        logger.warning(f"Login dështoi: Emaili {email_clean} nuk u gjet.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ose fjalëkalim i gabuar",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not security.verify_password(form_data.password, user.password_hash):
        logger.warning(f"Login dështoi: Fjalëkalim i gabuar për {email_clean}.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ose fjalëkalim i gabuar",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = security.create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}

# --- USER ENDPOINTS ---

@app.post("/users/", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED, tags=["Users"])
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    try:
        # Sigurohemi që email ruhet lowercase
        user.email = user.email.lower().strip()
        return crud.create_user(db=db, user=user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error gjatë regjistrimit: {e}")
        raise HTTPException(status_code=500, detail="Gabim i brendshëm i serverit.")

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
        return crud.create_group(db=db, group=group, creator_id=current_user.id)
    except Exception as e:
        logger.error(f"Error creating group: {e}")
        raise HTTPException(status_code=500, detail="Dështoi krijimi i grupit.")

@app.post("/groups/join", response_model=schemas.GroupOut, tags=["Groups"])
def join_group(
    data: schemas.GroupJoin, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    group = crud.join_group_by_code(db=db, code=data.invite_code.upper().strip(), user_id=current_user.id)
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Kodi i ftesës është i gabuar ose ky grup nuk ekziston."
        )
    return group

@app.get("/groups/me", response_model=list[schemas.GroupOut], tags=["Groups"])
def get_my_groups(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    return crud.get_user_groups(db=db, user_id=current_user.id)

@app.get("/groups/{group_id}", response_model=schemas.GroupOut, tags=["Groups"])
def get_group_details(
    group_id: UUID, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Grupi nuk u gjet.")

    is_member = db.query(models.GroupMember).filter_by(
        group_id=group_id, 
        user_id=current_user.id
    ).first()

    if not is_member:
        raise HTTPException(status_code=403, detail="Nuk keni akses në këtë grup.")
    return group

# --- EXPENSE ENDPOINTS ---

@app.post("/expenses/", response_model=schemas.ExpenseOut, status_code=status.HTTP_201_CREATED, tags=["Expenses"])
def create_expense(
    expense: schemas.ExpenseCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if expense.payer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Nuk mund të regjistroni shpenzime për dikë tjetër.")

    member_ids = {m.user_id for m in db.query(models.GroupMember).filter_by(group_id=expense.group_id).all()}
    for p in expense.participants:
        if p.user_id not in member_ids:
            raise HTTPException(status_code=400, detail=f"Përdoruesi {p.user_id} nuk është anëtar i grupit.")

    try:
        return crud.create_expense(db=db, expense=expense)
    except Exception as e:
        logger.error(f"Dështim gjatë krijimit të shpenzimit: {e}")
        raise HTTPException(status_code=400, detail="Të dhënat e shpenzimit janë të pasakta.")