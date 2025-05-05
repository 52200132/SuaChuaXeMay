from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from enum import Enum as PyEnum
from datetime import datetime


class StaffRoleEnum(str, PyEnum):
    RECEPTIONIST = "receptionist"
    TECHNICIAN = "technician"
    CASHIER = "cashier"
    MANAGER = "manager"


class StaffStatusEnum(str, PyEnum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class StaffBase(BaseModel):
    fullname: str
    role: StaffRoleEnum
    status: Optional[StaffStatusEnum] = StaffStatusEnum.ACTIVE
    email: EmailStr


class StaffCreate(StaffBase):
    password: str
    
    @validator('password')
    def password_strength(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        return v


class StaffUpdate(BaseModel):
    fullname: Optional[str] = None
    role: Optional[StaffRoleEnum] = None
    status: Optional[StaffStatusEnum] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    
    @validator('password')
    def password_strength(cls, v):
        if v is not None and len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        return v


class StaffResponse(BaseModel):
    staff_id: int
    fullname: str
    role: StaffRoleEnum
    status: StaffStatusEnum
    email: EmailStr
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "staff_id": 1,
                "fullname": "Nguyen Van A",
                "role": StaffRoleEnum.RECEPTIONIST,
                "status": StaffStatusEnum.ACTIVE,
                "email": "nhanvien@gmail.com"
            }
        }


class StaffLogin(BaseModel):
    email: EmailStr
    password: str

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "email": "sangtiepnhan@gmail.com",
                "password": "123"
            }
        }