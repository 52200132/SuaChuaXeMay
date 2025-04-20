from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import timedelta

from schemas.staff import (
    StaffCreate, 
    StaffUpdate, 
    StaffResponse, 
    StaffLogin,
    StaffRoleEnum,
    StaffStatusEnum
)
from crud import staff as staff_crud
from utils.security import create_access_token
from db.session import get_db
from utils.logger import get_logger
from .url import URLS


logger = get_logger(__name__)

router = APIRouter()


# @router.post("/", response_model=StaffResponse, status_code=status.HTTP_201_CREATED)
# def create_staff(
#     staff_data: StaffCreate,
#     db: AsyncSession = Depends(get_db),
#     current_staff: dict = Depends(get_current_staff)
# ):
#     """
#     Create a new staff member.
#     Only managers can create new staff members.
#     """
#     # Check if the current user has permission (manager role)
#     if current_staff["role"] != "manager":
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Only managers can create new staff members"
#         )
    
#     return staff_crud.create_staff(db, staff_data)


# @router.get("/", response_model=List[StaffResponse])
# def read_staffs(
#     skip: int = 0,
#     limit: int = 100,
#     role: Optional[StaffRoleEnum] = None,
#     status: Optional[StaffStatusEnum] = None,
#     search: Optional[str] = Query(None, min_length=2, max_length=50),
#     db: AsyncSession = Depends(get_db),
#     current_staff: dict = Depends(get_current_staff)
# ):
#     """
#     Get list of staff members with optional filtering.
#     """
#     return staff_crud.get_staffs(db, skip, limit, role, status, search)


# @router.get("/{staff_id}", response_model=StaffResponse)
# def read_staff(
#     staff_id: int,
#     db: AsyncSession = Depends(get_db),
#     current_staff: dict = Depends(get_current_staff)
# ):
#     """
#     Get a specific staff member by ID.
#     """
#     db_staff = staff_crud.get_staff(db, staff_id)
#     if db_staff is None:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Staff not found"
#         )
#     return db_staff


# @router.put("/{staff_id}", response_model=StaffResponse)
# def update_staff(
#     staff_id: int,
#     staff_data: StaffUpdate,
#     db: AsyncSession = Depends(get_db),
#     current_staff: dict = Depends(get_current_staff)
# ):
#     """
#     Update a staff member.
#     Staff can update their own profile, but only managers can update other staff members.
#     """
#     # Check permissions
#     if current_staff["staff_id"] != staff_id and current_staff["role"] != "manager":
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="You don't have permission to update this staff member"
#         )
    
#     # Additional check: non-managers cannot change their own role
#     if (
#         current_staff["staff_id"] == staff_id and 
#         current_staff["role"] != "manager" and 
#         staff_data.role is not None and 
#         staff_data.role != current_staff["role"]
#     ):
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="You cannot change your own role"
#         )
    
#     return staff_crud.update_staff(db, staff_id, staff_data)


# @router.delete("/{staff_id}", status_code=status.HTTP_200_OK)
# def delete_staff(
#     staff_id: int,
#     db: AsyncSession = Depends(get_db),
#     current_staff: dict = Depends(get_current_staff)
# ):
#     """
#     Delete a staff member.
#     Only managers can delete staff members.
#     """
#     # Check if the current user has permission (manager role)
#     if current_staff["role"] != "manager":
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Only managers can delete staff members"
#         )
    
#     # Prevent self-deletion
#     if current_staff["staff_id"] == staff_id:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="You cannot delete your own account"
#         )
    
#     return staff_crud.delete_staff(db, staff_id)


@router.post(URLS['STAFF']['LOGIN'], status_code=status.HTTP_200_OK)
async def login_staff(login_data: StaffLogin, db: AsyncSession = Depends(get_db)):
    """
    Đăng nhập vào hệ thống với tài khoản nhân viên.
    Trả về access token và thông tin nhân viên.
    """
    try:
        staff = await staff_crud.authenticate_staff(db, login_data.email, login_data.password)
        if not staff:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Tài khoản hoặc mật khẩu không đúng",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Create access token with staff info
        # access_token_expires = timedelta(minutes=30)
        # access_token_expires = timedelta(hours=11)  # 1 week
        # access_token = create_access_token(
        #     data={"staff_id": str(staff.staff_id), "email": staff.email, "role": staff.role},
        #     expires_delta=access_token_expires
        # )
        
        return {
            # "access_token": access_token,
            # "token_type": "bearer",
            "staff_id": staff.staff_id,
            "role": staff.role,
            "fullname": staff.fullname,
            "email": staff.email
        }

    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


# @router.put("/{staff_id}/status", response_model=StaffResponse)
# def update_staff_status(
#     staff_id: int,
#     status: StaffStatusEnum,
#     db: AsyncSession = Depends(get_db),
#     current_staff: dict = Depends(get_current_staff)
# ):
#     """
#     Update a staff member's status.
#     Staff can update their own status, but only managers can update other staff statuses.
#     """
#     # Check permissions
#     if current_staff["staff_id"] != staff_id and current_staff["role"] != "manager":
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="You don't have permission to update this staff member's status"
#         )
    
#     return staff_crud.update_staff_status(db, staff_id, status)
