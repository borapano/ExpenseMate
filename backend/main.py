from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from uuid import UUID
import logging

import models, schemas, crud, security
from database import SessionLocal, engine

# --- CONFIG & LOGGING ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Krijimi i tabelave
models.Base.metadata.create_all(bind=engine)

# NDRYSHIMI: Shtohet skema e sigurisë për Swagger UI
app = FastAPI(
    title="ExpenseMate API",
    description="Professional Backend for Expense Sharing - Sprint 1.B Secure Edition",
    version="1.1.0",
    # Kjo siguron që butoni Authorize të shfaqet dhe të funksionojë saktë
    swagger_ui_parameters={"persistAuthorization": True}
)

# Konfigurimi i Sigurisë - tokenUrl duhet të jetë fiks path-i i login-it
# Pasi ta kesh këtë, butoni Authorize do të kërkojë 'username' (email-in tënd) dhe 'password'
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

# --- DEPENDENCIES ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Validon Token-in dhe kthen objektin e User-it nga DB."""
    payload = security.decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token i pavlefshëm ose i skaduar",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id_str = payload.get("sub")
    if user_id_str is None:
        raise HTTPException(status_code=401, detail="Token i korruptuar")
    
    try:
        user_id = UUID(user_id_str)
    except (ValueError, TypeError):
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
    """Gjeneron JWT Access Token."""
    # Këtu form_data.username merr vlerën e email-it nga Swagger
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not security.verify_password(form_data.password, user.password_hash):
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
    """Regjistron një përdorues të ri."""
    try:
        return crud.create_user(db=db, user=user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/users/me", response_model=schemas.UserOut, tags=["Users"])
def read_users_me(current_user: models.User = Depends(get_current_user)):
    """Kthen profilin e përdoruesit të loguar (Testi i JWT)."""
    return current_user

# --- GROUP ENDPOINTS ---

@app.post("/groups/", response_model=schemas.GroupOut, status_code=status.HTTP_201_CREATED, tags=["Groups"])
def create_group(
    group: schemas.GroupCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Krijon një grup të ri ku krijuesi shtohet automatikisht."""
    return crud.create_group(db=db, group=group, creator_id=current_user.id)

# --- EXPENSE ENDPOINTS ---

@app.post("/expenses/", response_model=schemas.ExpenseOut, status_code=status.HTTP_201_CREATED, tags=["Expenses"])
def create_expense(
    expense: schemas.ExpenseCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Regjistron një shpenzim të ri me validim sigurie."""
    if expense.payer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Nuk mund të regjistroni shpenzime për llogari të dikujt tjetër."
        )

    member_ids = {m.user_id for m in db.query(models.GroupMember).filter_by(group_id=expense.group_id).all()}
    
    for p in expense.participants:
        if p.user_id not in member_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"Përdoruesi {p.user_id} nuk është anëtar i këtij grupi."
            )

    try:
        return crud.create_expense(db=db, expense=expense)
    except Exception as e:
        logger.error(f"Dështim gjatë krijimit të shpenzimit: {e}")
        raise HTTPException(status_code=400, detail="Të dhënat e shpenzimit janë të pasakta.")