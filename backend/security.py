import hashlib
import base64
import unicodedata
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext

# Konfigurimi i Logger për të kapur mospërputhjet mes sistemeve
logger = logging.getLogger(__name__)

# --- KONFIGURIMI I SIGURISË ---
SECRET_KEY = "NDRYSHO_KETE_NE_PRODUCTION_SHUME_E_RENDESISHME" 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 

# Konfigurimi i Passlib - Minimalist për të evituar gabimet në WSL/Windows
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

# --- LOGJIKA E HASHING (PASSWORDS) ---

def _prepare_password(password: str) -> str:
    """
    Normalizon fjalëkalimin dhe aplikon SHA-256.
    Garanton që hyrja për Bcrypt është gjithmonë 44 karaktere.
    """
    normalized = unicodedata.normalize("NFKC", password)
    sha256_hash = hashlib.sha256(normalized.encode("utf-8")).digest()
    return base64.b64encode(sha256_hash).decode("utf-8")

def get_password_hash(password: str) -> str:
    """Krijon hash-in e sigurt për t'u ruajtur në Database."""
    if not password or not password.strip():
        raise ValueError("Fjalëkalimi nuk mund të jetë bosh")
    
    prepared = _prepare_password(password)
    return pwd_context.hash(prepared)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifikon fjalëkalimin me DEBUG printime për terminalin."""
    if not hashed_password:
        print("DEBUG: hashed_password mungon!")
        return False
    try:
        prepared = _prepare_password(plain_password)
        
        # --- DEBUG LOGS (Shiko terminalin kur bën login) ---
        print(f"\n--- DEBUG LOGIN ATTEMPT ---")
        print(f"1. Plain password length: {len(plain_password)}")
        print(f"2. Prepared (SHA256) prefix: {prepared[:10]}...")
        print(f"3. DB Hash prefix: {hashed_password[:10]}...")
        
        result = pwd_context.verify(prepared, hashed_password)
        
        print(f"4. Result: {'✅ MATCH' if result else '❌ NO MATCH'}")
        print(f"---------------------------\n")
        # ---------------------------------------------------
        
        return result
    except Exception as e:
        logger.error(f"Gabim kritik gjatë verifikimit: {e}")
        print(f"DEBUG ERROR: {e}")
        return False

# --- LOGJIKA E AUTENTIKIMIT (JWT) ---

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Krijon një Token (JWT) të vlefshëm."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str):
    """Verifikon dhe dekodon Token-in."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None