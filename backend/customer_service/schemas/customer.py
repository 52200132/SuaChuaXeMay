from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional
import re
# Thêm để lấy list motocycles
from typing import List
from schemas.motocycle import MotocycleResponse

class CustomerBase(BaseModel):
    """Base model cho Customer"""
    fullname: str = Field(..., description="Họ tên đầy đủ của khách hàng")
    phone_num: str = Field(..., description="Số điện thoại khách hàng", min_length=10, max_length=10)
    email: Optional[EmailStr] = Field(None, description="Email của khách hàng")
    is_guest: Optional[bool] = Field(False, description="Là khách vãng lai hay không")
    
    @validator('phone_num')
    def phone_must_be_valid(cls, v):
        if not re.match(r'^0\d{9}$', v):
            raise ValueError('Số điện thoại phải có 10 số và bắt đầu bằng số 0')
        return v

class CustomerCreate(CustomerBase):
    """Schema để tạo mới Customer"""
    password: Optional[str] = Field(None, description="Mật khẩu của khách hàng")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "fullname": "Người Dùng Demo",
                "phone_num": "0000000000",
                "email": "demo@gmail.com",
                "is_guest": True,
                "password": "123456"
            }
        }
    }
    
class CustomerUpdate(BaseModel):
    """Schema để cập nhật Customer"""
    fullname: Optional[str] = None
    phone_num: Optional[str] = None
    email: Optional[EmailStr] = None
    is_guest: Optional[bool] = None
    password: Optional[str] = None
    
    @validator('phone_num')
    def phone_must_be_valid(cls, v):
        if v is not None and not re.match(r'^0\d{9}$', v):
            raise ValueError('Số điện thoại phải có 10 số và bắt đầu bằng số 0')
        return v

class CustomerResponse(BaseModel):
    """Schema để trả về thông tin Customer"""
    
    # Định nghĩa lại các trường để sắp xếp theo thứ tự mong muốn
    customer_id: int
    fullname: str 
    phone_num: str
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    is_guest: Optional[bool] = True
    
    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "customer_id": 1,
                "fullname": "Người Dùng Demo",
                "phone_num": "0000000000",
                "email": "demo@gmail.com",
                "password": "000000",
                "is_guest": True
            }
        }
    }

class CustomerResponseWithMotocycles(BaseModel):
    customer_id: int
    fullname: str
    phone_num: str
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    is_guest: Optional[bool] = True
    motocycles: List[MotocycleResponse] = []  # Danh sách xe máy

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "customer_id": 1,
                "fullname": "Người Dùng Demo",
                "phone_num": "0000000000",
                "email": "demo@gmail.com",
                "password": "000000",
                "is_guest": True,
                "motocycles": [
                    {
                        "motorcycle_id": 1,
                        "license_plate": "59A-12345",
                        "brand": "Honda",
                        "model": "Wave Alpha"
                    }
                ]
            }
        }

class CustomerLogin(BaseModel):
    """Schema để đăng nhập Customer"""
    email: EmailStr = Field(..., description="Email của khách hàng")
    password: str = Field(..., description="Mật khẩu của khách hàng")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "demo@gmail.com",
                "password": "123456"
            }
        }
    }
