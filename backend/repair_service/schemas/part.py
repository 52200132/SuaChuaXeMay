from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List

class PartBase(BaseModel):
    """Schema cơ bản cho phụ tùng xe máy"""
    name: str = Field(..., description="Tên của phụ tùng")
    unit: str = Field(..., description="Đơn vị tính (cái, bộ, v.v.)")
    price: Optional[int] = Field(None, description="Giá của phụ tùng")
    supplier_id: Optional[int] = Field(None, description="ID của nhà cung cấp")
    URL: Optional[str] = Field(None, description="Đường dẫn đến hình ảnh phụ tùng")

class PartCreate(PartBase):
    """Schema cho việc tạo mới một phụ tùng"""
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Lọc gió Wave Alpha",
                "unit": "cái",
                "price": 65000,
                "supplier_id": 1,
                "URL": "/images/parts/loc-gio-wave-alpha.jpg"
            }
        }

class PartUpdate(BaseModel):
    """Schema cho việc cập nhật thông tin phụ tùng"""
    name: Optional[str] = Field(None, description="Tên của phụ tùng")
    unit: Optional[str] = Field(None, description="Đơn vị tính (cái, bộ, v.v.)")
    price: Optional[int] = Field(None, description="Giá của phụ tùng")
    supplier_id: Optional[int] = Field(None, description="ID của nhà cung cấp")
    URL: Optional[str] = Field(None, description="Đường dẫn đến hình ảnh phụ tùng")
    is_deleted: Optional[bool] = Field(None, description="Trạng thái xóa của phụ tùng")
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Lọc gió Wave Alpha 2022",
                "unit": "cái",
                "price": 70000,
                "supplier_id": 2,
                "URL": "/images/parts/loc-gio-wave-alpha-2022.jpg",
                "is_deleted": False
            }
        }

class PartResponse(PartBase):
    """Schema cho việc phản hồi thông tin phụ tùng"""
    part_id: int
    is_deleted: bool = False
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "part_id": 1,
                "name": "Lọc gió Wave Alpha",
                "unit": "cái",
                "price": 65000,
                "supplier_id": 1,
                "URL": "/images/parts/loc-gio-wave-alpha.jpg",
                "is_deleted": False
            }
        }

class PartWithMotocycleTypes(PartResponse):
    """Schema phản hồi thông tin phụ tùng kèm theo các loại xe tương thích"""
    compatible_types: Optional[List[int]] = Field(None, description="Danh sách ID các loại xe tương thích")
    
    class Config:
        from_attributes = True
