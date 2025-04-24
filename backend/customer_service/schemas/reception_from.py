from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

from schemas.reception_image import ReceptionImageCreate, ReceptionImageResponse

class ReceptionFormBase(BaseModel):
    """Schema cơ bản cho ReceptionForm"""
    motocycle_id: int = Field(..., description="ID của xe máy")
    customer_id: int = Field(..., description="ID của khách hàng")
    staff_id: int = Field(..., description="ID của nhân viên tiếp nhận")
    initial_conditon: str = Field(..., description="Tình trạng ban đầu do khách mô tả")
    note: Optional[str] = Field(..., description="Ghi chú thêm từ nhân viên tiếp nhận")
    is_returned: Optional[bool] = Field(False, description="Xe được bàn giao lại cho khách hay chưa")


class ReceptionFormCreate(ReceptionFormBase):
    """Schema để tạo mới ReceptionForm"""
    images: Optional[List[ReceptionImageCreate]] = Field(None, description="Danh sách hình ảnh kèm theo")
    
    class Config:
        json_schema_extra = {
            "example": {
                "motocycle_id": 1,
                "customer_id": 1,
                "staff_id": 1,
                "initial_conditon": "Xe bị hư hệ thống phanh, tiếng máy kêu to",
                "note": "Khách hàng đã đồng ý sửa chữa",
                "is_returned": False,
                "images": [
                    {
                        "URL": "/uploads/reception/image1.jpg",
                        "decription": "Hình ảnh phanh trước"
                    },
                    {
                        "URL": "/uploads/reception/image2.jpg",
                        "decription": "Hình ảnh động cơ"
                    }
                ]
            }
        }

class ReceptionFormUpdate(BaseModel):
    """Schema để cập nhật ReceptionForm"""
    motocycle_id: Optional[int] = Field(None, description="ID của xe máy")
    staff_id: Optional[int] = Field(None, description="ID của nhân viên tiếp nhận")
    initial_conditon: Optional[str] = Field(None, description="Tình trạng ban đầu do khách mô tả")

class ReceptionFormResponse(BaseModel):
    """Schema để trả về thông tin ReceptionForm"""
    form_id: int
    motocycle_id: int
    customer_id: int
    staff_id: int
    created_at: datetime
    initial_conditon: str
    note: Optional[str] = None
    is_returned: bool = False
    reception_images: List[ReceptionImageResponse] = []

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "form_id": 1,
                "motocycle_id": 1,
                "moto_type_id": 1,
                "customer_id": 1,
                "staff_id": 1,
                "created_at": datetime.now(),
                "initial_conditon": "Xe bị hư hệ thống phanh, tiếng máy kêu to",
                "note": "Khách hàng đã đồng ý sửa chữa",
                "is_returned": False,
                "reception_images": [
                    {
                        "img_id": 1,
                        "form_id": 1,
                        "URL": "/uploads/reception/image1.jpg",
                        "decription": "Hình ảnh phanh trước"
                    }
                ]
            }
        }

class ReceptionFormCreate2(BaseModel):
    """Schema để tạo mới ReceptionForm"""
    customer_id: int = Field(..., description="ID của khách hàng")
    brand: str = Field(..., description="Hãng xe")
    model: str = Field(..., description="Mẫu xe")
    moto_type_id: int = Field(..., description="ID của loại xe máy")
    license_plate: str = Field(..., description="Biển số xe")
    staff_id: int = Field(..., description="ID của nhân viên tiếp nhận")
    initial_conditon: str = Field(..., description="Tình trạng ban đầu do khách mô tả")
    note: Optional[str] = Field(..., description="Ghi chú thêm từ nhân viên tiếp nhận")
    is_returned: Optional[bool] = Field(False, description="Xe được bàn giao lại cho khách hay chưa")
    images: Optional[List[ReceptionImageCreate]] = Field(None, description="Danh sách hình ảnh kèm theo")
    
    class Config:
        json_schema_extra = {
            "example": {
                "customer_id": 1,
                "moto_type_id": 1,
                "brand": "Honda",
                "model": "SH 2020",
                "license_plate": "29B1-23456",
                "staff_id": 1,
                "initial_conditon": "Xe bị hư hệ thống phanh, tiếng máy kêu to",
                "note": "Khách hàng đã đồng ý sửa chữa",
                "is_returned": False,
                "images": [
                    {
                        "URL": "/uploads/reception/image1.jpg",
                        "decription": "Hình ảnh phanh trước"
                    },
                    {
                        "URL": "/uploads/reception/image2.jpg",
                        "decription": "Hình ảnh động cơ"
                    }
                ]
            }
        }


class ReceptionFormCreateNoCustomerIdNoMotoCycleId(BaseModel):
    """Schema để tạo mới ReceptionForm"""
    fullname: str = Field(..., description="Họ và tên của khách hàng")
    phone_num: str = Field(..., description="Số điện thoại của khách hàng")
    email: Optional[str] = Field(None, description="Email của khách hàng")
    brand: str = Field(..., description="Hãng xe")
    model: str = Field(..., description="Mẫu xe")
    moto_type_id: int = Field(..., description="ID của loại xe máy")
    license_plate: str = Field(..., description="Biển số xe")
    staff_id: int = Field(..., description="ID của nhân viên tiếp nhận")
    initial_conditon: str = Field(..., description="Tình trạng ban đầu do khách mô tả")
    note: Optional[str] = Field(..., description="Ghi chú thêm từ nhân viên tiếp nhận")
    is_returned: Optional[bool] = Field(False, description="Xe được bàn giao lại cho khách hay chưa")
    images: Optional[List[ReceptionImageCreate]] = Field(None, description="Danh sách hình ảnh kèm theo")
    
    class Config:
        json_schema_extra = {
            "example": {
                "fullname": "Nguyễn Văn A",
                "phone_num": "0987654321",
                "email": "nguyenvana@gmail.com",
                "brand": "Honda",
                "model": "SH 2020",
                "license_plate": "29B1-23456",
                "moto_type_id": 1,
                "staff_id": 1,
                "initial_conditon": "Xe bị hư hệ thống phanh, tiếng máy kêu to",
                "note": "Khách hàng đã đồng ý sửa chữa",
                "is_returned": False,
                "images": [
                    {
                        "URL": "/uploads/reception/image1.jpg",
                        "decription": "Hình ảnh phanh trước"
                    },
                    {
                        "URL": "/uploads/reception/image2.jpg",
                        "decription": "Hình ảnh động cơ"
                    }
                ]
            }
        }