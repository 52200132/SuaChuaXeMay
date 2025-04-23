from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select
from typing import List, Optional, Dict, Any, Union
from fastapi import HTTPException, status

from models.models import Staff
from schemas.staff import StaffCreate, StaffUpdate, StaffRoleEnum, StaffStatusEnum
from utils.security import get_password_hash, verify_password
from utils.logger import get_logger

logger = get_logger(__name__)

async def get_staff_by_id(db: AsyncSession, staff_id: int) -> Optional[Staff]:
    """Lấy thông tin nhân viên theo ID"""
    result = await db.execute(select(Staff).where(Staff.staff_id == staff_id))
    return result.scalars().first()

async def get_staff_by_email(db: AsyncSession, email: str) -> Optional[Staff]:
    """Lấy thông tin nhân viên theo email"""
    result = await db.execute(select(Staff).where(Staff.email == email))
    return result.scalars().first()

async def get_all_staff(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[Staff]:
    """Lấy danh sách tất cả nhân viên"""
    result = await db.execute(select(Staff).order_by(Staff.staff_id.asc()).offset(skip).limit(limit))
    return result.scalars().all()

async def get_staffs(
    db: AsyncSession, 
    skip: int = 0, 
    limit: int = 100, 
    role: Optional[StaffRoleEnum] = None,
    status: Optional[StaffStatusEnum] = None,
    search: Optional[str] = None
) -> List[Staff]:
    """Get list of staff members with optional filters"""
    query = select(Staff)
    
    # Apply filters if provided
    if role:
        query = query.where(Staff.role == role)
    
    if status:
        query = query.where(Staff.status == status)
    
    if search:
        search_term = f"%{search}%"
        query = query.where(Staff.fullname.ilike(search_term) | Staff.email.ilike(search_term))
    
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


# async def create_staff(db: AsyncSession, staff: StaffCreate) -> Staff:
#     """Create a new staff member"""
#     # Check if email already exists
#     existing_staff = await get_staff_by_email(db, staff.email)
#     if existing_staff:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Email already registered"
#         )
    
#     # TODO: Có thể mã hóa mật khẩu ở đây nếu cần thiết
#     # hashed_password = get_password_hash(staff.password)
#     hashed_password = staff.password

    
#     # Create new staff object
#     db_staff = Staff(
#         fullname=staff.fullname,
#         role=staff.role,
#         status=staff.status,
#         email=staff.email,
#         password=hashed_password
#     )
    
#     try:
#         db.add(db_staff)
#         await db.commit()
#         await db.refresh(db_staff)
#         return db_staff
#     except IntegrityError:
#         await db.rollback()
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Error creating staff member"
#         )


# async def update_staff(db: AsyncSession, staff_id: int, staff_update: StaffUpdate) -> Staff:
#     """Update staff member details"""
#     db_staff = await get_staff(db, staff_id)
#     if not db_staff:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail=f"Staff with ID {staff_id} not found"
#         )
    
#     # Prepare update data
#     update_data = staff_update.dict(exclude_unset=True)
    
#     # Hash password if it was provided
#     if "password" in update_data and update_data["password"]:
#         update_data["password"] = get_password_hash(update_data["password"])
    
#     # Check email uniqueness if changing email
#     if "email" in update_data and update_data["email"] != db_staff.email:
#         existing_staff = await get_staff_by_email(db, update_data["email"])
#         if existing_staff:
#             raise HTTPException(
#                 status_code=status.HTTP_400_BAD_REQUEST,
#                 detail="Email already registered"
#             )
    
#     # Update the staff object attributes
#     for key, value in update_data.items():
#         setattr(db_staff, key, value)
    
#     try:
#         await db.commit()
#         await db.refresh(db_staff)
#         return db_staff
#     except IntegrityError:
#         await db.rollback()
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Error updating staff member"
#         )


# async def delete_staff(db: AsyncSession, staff_id: int) -> Dict[str, Any]:
#     """Delete a staff member"""
#     db_staff = await get_staff(db, staff_id)
#     if not db_staff:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail=f"Staff with ID {staff_id} not found"
#         )
    
#     try:
#         await db.delete(db_staff)
#         await db.commit()
#         return {"detail": f"Staff with ID {staff_id} deleted successfully"}
#     except IntegrityError:
#         await db.rollback()
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail=f"Cannot delete staff member with ID {staff_id}, they have associated records"
#         )


async def authenticate_staff(db: AsyncSession, email: str, password: str) -> Optional[Staff]:
    """Xác thực thông tin đăng nhập của nhân viên"""
    staff = await get_staff_by_email(db, email)

    if staff.status == StaffStatusEnum.OFF:
        logger.warning(f"Tài khoản {email} đã bị khóa")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản đã bị khóa"
        )

    if not staff:
        return None
    
    if not staff.password == password:
        return None
    # if not verify_password(password, staff.password):
    #     return None
    
    return staff


# async def update_staff_status(db: AsyncSession, staff_id: int, status: StaffStatusEnum) -> Staff:
#     """Update a staff member's status"""
#     db_staff = await get_staff(db, staff_id)
#     if not db_staff:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail=f"Staff with ID {staff_id} not found"
#         )
    
#     db_staff.status = status
#     try:
#         await db.commit()
#         await db.refresh(db_staff)
#         return db_staff
#     except IntegrityError:
#         await db.rollback()
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Error updating staff status"
#         )
