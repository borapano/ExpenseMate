import hashlib
import base64
import unicodedata
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext

logger = logging.getLogger(__name__)

# --- KONFIGURIMI I SIGURISË ---
SECRET_KEY = "NDRYSHO_KETE_NE_PRODUCTION_SHUME_E_RENDESISHME" 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 

# Konfigurimi më i thjeshtë i mundshëm - asnjë parametër shtesë
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def _prepare_password(password: str) -> str:
    """Normalizon dhe aplikon SHA-256 para bcrypt."""
    normalized = unicodedata.normalize("NFKC", password)
    sha256_hash = hashlib.sha256(normalized.encode("utf-8")).digest()
    return base64.b64encode(sha256_hash).decode("utf-8")

def get_password_hash(password: str) -> str:
    """Krijon hash-in."""
    if not password or not password.strip():
        raise ValueError("Fjalëkalimi nuk mund të jetë bosh")
    prepared = _prepare_password(password)
    return pwd_context.hash(prepared)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifikon fjalëkalimin me debug printime."""
    if not hashed_password:
        return False
    try:
        prepared = _prepare_password(plain_password)
        
        print("\n--- TESTIM LOGIN ---")
        result = pwd_context.verify(prepared, hashed_password)
        print(f"Rezultati: {result}")
        
        return result
    except Exception as e:
        print(f"ERROR NE VERIFIKIM: {e}")
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None