from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

from .logger import get_logger


logger = get_logger(__name__)

# Password context for hashing and verifying
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = "Su@chuedXem_jffffgM&ar"  # Should be stored in environment variables
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    try:
        to_encode = data.copy()
        
        # Set expiration time
        if expires_delta:
            expire = datetime.now() + expires_delta
        else:
            expire = datetime.now() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            
        to_encode.update({"exp": expire})
        
        # Create JWT token
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        logger.info(f"JWT token created: {encoded_jwt}")
        return encoded_jwt
    except Exception as e:
        logger.error(f"Error creating JWT token: {str(e)}")
        raise e


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decode a JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None
