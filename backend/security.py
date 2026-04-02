import hashlib
import base64
import unicodedata
from passlib.context import CryptContext

# Konfigurimi i raundeve të sigurisë
BCRYPT_ROUNDS = 12

# Krijimi i kontekstit të passlib
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=BCRYPT_ROUNDS
)

def _prepare_password(password: str) -> str:
    """
    Normalizon fjalëkalimin dhe e kthen në një hash SHA-256 të koduar në Base64.
    Kjo zgjidh limitin prej 72-bytes të bcrypt dhe problemet me Unicode.
    """
    # 1. Normalizimi NFKC për pajtueshmëri mes pajisjeve (Apple/Windows/Linux)
    normalized = unicodedata.normalize("NFKC", password)
    
    # 2. Krijimi i një digest SHA-256 (gjithmonë 32 bytes)
    sha256_hash = hashlib.sha256(normalized.encode("utf-8")).digest()
    
    # 3. Kodimi në Base64 që bcrypt ta lexojë si string të pastër
    return base64.b64encode(sha256_hash).decode("utf-8")

def get_password_hash(password: str) -> str:
    """Gjeneron një hash të sigurt bcrypt nga fjalëkalimi i dhënë."""
    if not password or not password.strip():
        raise ValueError("Password cannot be empty")
    
    # Përgatisim fjalëkalimin përpara hashing-ut
    prepared_password = _prepare_password(password)
    return pwd_context.hash(prepared_password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifikon nëse fjalëkalimi i dhënë përputhet me hash-in në Database."""
    if not plain_password or not hashed_password:
        return False
    try:
        # Përgatisim fjalëkalimin e thjeshtë për t'u krahasuar me hash-in
        prepared_password = _prepare_password(plain_password)
        return pwd_context.verify(prepared_password, hashed_password)
    except Exception:
        # Kthejmë False nëse hash-i është i dëmtuar ose format i panjohur
        return False

def needs_rehash(hashed_password: str) -> bool:
    """Kontrollon nëse hash-i duhet përditësuar (psh. nëse rrisim BCRYPT_ROUNDS)."""
    return pwd_context.needs_update(hashed_password)