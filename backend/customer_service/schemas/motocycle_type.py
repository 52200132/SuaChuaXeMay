from pydantic import BaseModel, Field
from typing import Optional, List

class MotocycleTypeBase(BaseModel):
    """Base model cho MotocycleType"""
    name: str = Field(..., description="Tên loại xe máy")
    
class MotocycleTypeCreate(MotocycleTypeBase):
    """Schema để tạo mới MotocycleType"""
    pass

class MotocycleTypeUpdate(BaseModel):
    """Schema để cập nhật MotocycleType"""
    name: Optional[str] = Field(None, description="Tên loại xe máy")

class MotocycleTypeInDBBase(MotocycleTypeBase):
    """Base model cho dữ liệu MotocycleType từ DB"""
    moto_type_id: int
    
    class Config:
        orm_mode = True

class MotocycleTypeResponse(BaseModel):
    """Schema cơ bản để trả về thông tin MotocycleType"""
    moto_type_id: int
    name: str
    brand: Optional[str] = None
    model: Optional[str] = None
    type: Optional[str] = None
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "moto_type_id": 1,
                "name": "Xe tay ga",
                "brand": "Honda",
                "model": "SH",
                "type": "Xe máy"
            }
        }
    
    


