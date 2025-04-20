from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ReceptionImageBase(BaseModel):
    """Schema cơ bản cho ReceptionImage"""
    URL: str = Field(..., description="Đường dẫn đến hình ảnh")
    decription: Optional[str] = Field(None, description="Mô tả hình ảnh")

class ReceptionImageCreate(ReceptionImageBase):
    """Schema để tạo mới ReceptionImage"""
    pass

class ReceptionImageResponse(ReceptionImageBase):
    """Schema để trả về thông tin ReceptionImage"""
    img_id: int
    form_id: int
    URL: Optional[str] = Field(None, description="Đường dẫn đến hình ảnh")
    decription: Optional[str] = Field(None, description="Mô tả hình ảnh")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "img_id": 1,
                "URL": "/uploads/reception/image1.jpg",
                "decription": "Hình ảnh phanh trước",
                "form_id": 1
            }
        }