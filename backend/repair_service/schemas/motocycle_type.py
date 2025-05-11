from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum

class MotocycleTypeEnum(str, Enum):
    XE_SO = "Xe số"
    XE_TAY_GA = "Xe tay ga"

class MotocycleTypeBase(BaseModel):
    """Base schema for motorcycle type"""
    brand: str = Field(..., description="Hãng xe máy")
    model: str = Field(..., description="Model của xe máy")
    type: MotocycleTypeEnum = Field(..., description="Loại xe (Xe số hoặc Xe tay ga)")

class MotocycleTypeCreate(MotocycleTypeBase):
    """Schema cho việc tạo mới một loại xe máy"""
    class Config:
        json_schema_extra = {
            "example": {
                "brand": "Honda",
                "model": "Wave Alpha",
                "type": "Xe số"
            }
        }

class MotocycleTypeUpdate(BaseModel):
    """Schema cho việc cập nhật thông tin loại xe máy"""
    brand: Optional[str] = Field(None, description="Hãng xe máy")
    model: Optional[str] = Field(None, description="Model của xe máy")
    type: Optional[MotocycleTypeEnum] = Field(None, description="Loại xe (Xe số hoặc Xe tay ga)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "brand": "Honda",
                "model": "Vision",
                "type": "Xe tay ga"
            }
        }

class MotocycleTypeResponse(MotocycleTypeBase):
    """Schema cho việc phản hồi thông tin loại xe máy"""
    moto_type_id: int

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "moto_type_id": 1,
                "brand": "Honda",
                "model": "Wave Alpha",
                "type": "Xe số"
            }
        }
