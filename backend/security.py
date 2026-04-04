import hashlib
import base64
import unicodedata
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext

# --- KONFIGURIMI I SIGURISË ---
# Shënim: Në një aplikacion real, këto merren nga skedari .env
SECRET_KEY = "NDRYSHO_KETE_NE_PRODUCTION_SHUME_E_RENDESISHME" 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # Tokeni vlen 24 orë
BCRYPT_ROUNDS = 12

# Konfigurimi i Passlib për Bcrypt
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=BCRYPT_ROUNDS
)

# --- LOGJIKA E HASHING (PASSWORDS) ---

def _prepare_password(password: str) -> str:
    """
    Zgjidhja e error-it '72 bytes':
    Normalizon fjalëkalimin dhe e kalon në SHA-256 përpara Bcrypt.
    Kjo garanton që fjalëkalimi është gjithmonë 64 karaktere (brenda limitit).
    """
    normalized = unicodedata.normalize("NFKC", password)
    sha256_hash = hashlib.sha256(normalized.encode("utf-8")).digest()
    return base64.b64encode(sha256_hash).decode("utf-8")

def get_password_hash(password: str) -> str:
    """Krijon hash-in e sigurt për t'u ruajtur në Database."""
    if not password or not password.strip():
        raise ValueError("Password cannot be empty")
    # Përdorim _prepare_password për të shmangur limitin 72-byte
    prepared = _prepare_password(password)
    return pwd_context.hash(prepared)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifikon nëse fjalëkalimi i dhënë përputhet me hash-in në DB."""
    try:
        prepared = _prepare_password(plain_password)
        return pwd_context.verify(prepared, hashed_password)
    except Exception:
        return False

# --- LOGJIKA E AUTENTIKIMIT (JWT) ---

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Krijon një Token (JWT) të nënshkruar për përdoruesin."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str):
    """Verifikon dhe dekodon Token-in për të parë nëse është i vlefshëm."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None