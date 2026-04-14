import hashlib
import base64
import unicodedata
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext

# Konfigurimi i Logger për debugging
logger = logging.getLogger(__name__)

# --- KONFIGURIMI I SIGURISË ---
# Shënim: Në production, këto duhet të vijnë nga variablat e ambientit (.env)
SECRET_KEY = "NDRYSHO_KETE_NE_PRODUCTION_SHUME_E_RENDESISHME" 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 

# Konfigurimi i Passlib - Versioni universal për të shmangur KeyError në Windows/WSL
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

# --- LOGJIKA E HASHING (PASSWORDS) ---

def _prepare_password(password: str) -> str:
    """
    Normalizon fjalëkalimin dhe aplikon SHA-256 për të shmangur limitin 72-byte.
    Garanton që hyrja për Bcrypt është gjithmonë 44 karaktere (Base64 e SHA-256).
    """
    # Normalizimi NFKC parandalon dështimin e karaktereve speciale (ë, ç, etj.)
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
    """
    Verifikon nëse fjalëkalimi përputhet me hash-in në DB.
    Përfshin printime debug për të identifikuar problemet në terminal.
    """
    if not hashed_password:
        return False
    try:
        prepared = _prepare_password(plain_password)
        
        # Logika e verifikimit
        result = pwd_context.verify(prepared, hashed_password)
        
        # Debugging log (mund t'i fshini pasi të vërtetoni që punon)
        if not result:
            logger.warning("Verifikimi i fjalëkalimit dështoi: Hash-i nuk përputhet.")
        
        return result
    except Exception as e:
        logger.error(f"Gabim kritik gjatë verifikimit: {e}")
        return False

# --- LOGJIKA E AUTENTIKIMIT (JWT) ---

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Krijon një Token (JWT) të vlefshëm për përdoruesin."""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str):
    """Verifikon dhe dekodon Token-in për të parë nëse është i vlefshëm."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None