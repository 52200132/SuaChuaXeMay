from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from jwt import PyJWTError

from .database import get_db
from .utils.security import decode_access_token
from .crud.staff import get_staff

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/staff/login")


async def get_current_staff(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    """
    Get the current authenticated staff member from JWT token.
    This dependency can be used in protected endpoints.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decode the JWT token
        payload = decode_access_token(token)
        if payload is None:
            raise credentials_exception
        
        staff_id: str = payload.get("sub")
        if staff_id is None:
            raise credentials_exception
        
    except PyJWTError:
        raise credentials_exception
    
    # Get the staff from database
    staff = get_staff(db, int(staff_id))
    if staff is None:
        raise credentials_exception
    
    # Return staff info as dict 
    return {
        "staff_id": staff.staff_id,
        "email": staff.email,
        "role": staff.role,
        "fullname": staff.fullname
    }
