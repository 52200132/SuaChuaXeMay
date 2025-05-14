from pydantic import BaseModel, Field, validator
from typing import Optional
import re

from schemas.motocycle_type import MotocycleTypeResponse

class MotocycleBase(BaseModel):
    """Base model cho Motocycle"""
    customer_id: int = Field(..., description="ID của khách hàng sở hữu xe máy")
    moto_type_id: int = Field(..., description="ID của loại xe máy")
    license_plate: str = Field(..., description="Biển số xe", min_length=5, max_length=20)
    brand: Optional[str] = Field(None, description="Thương hiệu xe máy")
    model: Optional[str] = Field(None, description="Model xe máy")
    
    # @validator('license_plate')
    # def license_plate_valid(cls, v):
    #     # Mẫu biển số xe VN: 59-Y2 123.45, 59Y2-123.45
    #     if not re.match(r'^[0-9A-Z][0-9A-Z\-\. ]{4,19}$', v):
    #         raise ValueError('Biển số xe không hợp lệ')
    #     return v

class MotocycleCreate(MotocycleBase):
    """Schema để tạo mới Motocycle"""
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "customer_id": 1,
                "moto_type_id": 1,
                "license_plate": "59Y2-123.45",
                "brand": "Honda",
                "model": "SH"
            }
        }

class MotocycleUpdate(BaseModel):
    """Schema để cập nhật Motocycle"""
    customer_id: Optional[int] = Field(None, description="ID của khách hàng sở hữu xe máy")
    moto_type_id: Optional[int] = Field(None, description="ID của loại xe máy")
    license_plate: Optional[str] = Field(None, description="Biển số xe")
    brand: Optional[str] = Field(None, description="Thương hiệu xe máy")
    model: Optional[str] = Field(None, description="Model xe máy")
    
    # @validator('license_plate')
    # def license_plate_valid(cls, v):
    #     if v is not None:
    #         if not re.match(r'^[0-9A-Z][0-9A-Z\-\. ]{4,19}$', v):
    #             raise ValueError('Biển số xe không hợp lệ')
    #     return v
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "customer_id": 1,
                "moto_type_id": 1,
                "license_plate": "59Y2-123.45",
                "brand": "Honda",
                "model": "SH"
            }
        }

class MotocycleResponse(BaseModel):
    """Schema để trả về thông tin Motocycle"""
    motocycle_id: Optional[int] = None
    customer_id: Optional[int] = None
    moto_type_id: Optional[int] = None
    license_plate: Optional[str] = None
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "motocycle_id": 1,
                "customer_id": 1,
                "moto_type_id": 1,
                "license_plate": "59Y2-123.45",
            }
        }

class MotocycleResponse2(MotocycleResponse):
    brand: Optional[str] = None
    model: Optional[str] = None
    type: Optional[str] = None  # Thông tin loại xe máy

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "motocycle_id": 1,
                "customer_id": 1,
                "moto_type_id": 1,
                "license_plate": "59Y2-123.45",
                "brand": "Honda",
                "model": "SH",
                "type": "Xe tay ga"
            }
        }
