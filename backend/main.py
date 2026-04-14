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
    version="1.2.1",
    swagger_ui_parameters={"persistAuthorization": True}
)

# --- KONFIGURIMI I CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",    # React via localhost
        "http://127.0.0.1:5173",    # React via IP
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Konfigurimi i Sigurisë
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
    except Exception as e:
        logger.error(f"Error gjatë regjistrimit: {e}")
        raise HTTPException(status_code=500, detail="Gabim i brendshëm i serverit.")

@app.get("/users/me", response_model=schemas.UserOut, tags=["Users"])
def read_users_me(current_user: models.User = Depends(get_current_user)):
    """Kthen profilin e përdoruesit të loguar."""
    return current_user

# --- GROUP ENDPOINTS ---

@app.post("/groups/", response_model=schemas.GroupOut, status_code=status.HTTP_201_CREATED, tags=["Groups"])
def create_group(
    group: schemas.GroupCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Krijon një grup të ri dhe shton krijuesin si anëtar."""
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
    """Bashkohet me një grup ekzistues duke përdorur kodin e ftesës."""
    group = crud.join_group_by_code(db=db, code=data.invite_code, user_id=current_user.id)
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
    """Liston të gjitha grupet ku bën pjesë përdoruesi aktual."""
    return crud.get_user_groups(db=db, user_id=current_user.id)

@app.get("/groups/{group_id}", response_model=schemas.GroupOut, tags=["Groups"])
def get_group_details(
    group_id: UUID, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Kthen detajet e një grupi specifik nëse përdoruesi është anëtar."""
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Grupi nuk u gjet.")

    # Verifikimi i anëtarësisë
    is_member = db.query(models.GroupMember).filter_by(
        group_id=group_id, 
        user_id=current_user.id
    ).first()

    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Nuk keni akses në këtë grup."
        )
    return group

# --- EXPENSE ENDPOINTS ---

@app.post("/expenses/", response_model=schemas.ExpenseOut, status_code=status.HTTP_201_CREATED, tags=["Expenses"])
def create_expense(
    expense: schemas.ExpenseCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Regjistron një shpenzim të ri."""
    if expense.payer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Nuk mund të regjistroni shpenzime për dikë tjetër."
        )

    # Validimi i pjesëmarrësve
    member_ids = {m.user_id for m in db.query(models.GroupMember).filter_by(group_id=expense.group_id).all()}
    for p in expense.participants:
        if p.user_id not in member_ids:
            raise HTTPException(
                status_code=400, 
                detail=f"Përdoruesi {p.user_id} nuk është anëtar i grupit."
            )

    try:
        return crud.create_expense(db=db, expense=expense)
    except Exception as e:
        logger.error(f"Dështim gjatë krijimit të shpenzimit: {e}")
        raise HTTPException(status_code=400, detail="Të dhënat e shpenzimit janë të pasakta.")