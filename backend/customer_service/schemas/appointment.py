from pydantic import BaseModel, Field, validator
from typing import Optional, List, Union
from datetime import datetime, timezone, timedelta
import enum


class AppointmentStatusEnum(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"

class AppointmentBase(BaseModel):
    """Schema cơ bản cho Appointment"""
    customer_id: int = Field(..., description="ID của khách hàng")
    service_type_id: int = Field(..., description="ID của loại dịch vụ chính")
    appointment_date: datetime = Field(..., description="Ngày giờ hẹn")
    status: AppointmentStatusEnum = Field(AppointmentStatusEnum.PENDING, description="Trạng thái lịch hẹn")
    note: Optional[str] = Field(None, description="Ghi chú về lịch hẹn")
    
    @validator('appointment_date')
    def appointment_date_not_in_past(cls, v):
        # Chỉ kiểm tra khi tạo mới, không kiểm tra khi update
        now = datetime.now()
        print(f"Current time: {now}, Appointment date: {v}")
        if now > v:
            raise ValueError('Ngày giờ hẹn không thể là thời điểm trong quá khứ')
        return v

class AppointmentCreate(AppointmentBase):
    """Schema để tạo mới Appointment"""
    class Config:
        json_schema_extra = {
            "example": {
                "appointment_date": (datetime.now().replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)),
                "status": "pending",
                "note": "Khách hàng yêu cầu kiểm tra xe",
                "customer_id": 1,
                "service_type_id": 2,
            }
        }

class AppointmentUpdate(BaseModel):
    """Schema để cập nhật Appointment"""
    service_type_id: Optional[int] = Field(None, description="ID của loại dịch vụ chính")
    appointment_date: Optional[datetime] = Field(None, description="Ngày giờ hẹn")
    status: Optional[AppointmentStatusEnum] = Field(None, description="Trạng thái lịch hẹn")
    note: Optional[str] = Field(None, description="Ghi chú về lịch hẹn")
    
    @validator('appointment_date')
    def appointment_date_not_in_past(cls, v):
        if v is not None:
            now = datetime.utcnow()
            if v < now:
                raise ValueError('Ngày giờ hẹn không thể là thời điểm trong quá khứ')
        return v


class AppointmentResponse(BaseModel):
    """Schema cơ bản để trả về thông tin Appointment"""
    appointment_id:  int = None
    service_type_id: int = None
    appointment_date: datetime = None
    customer_id: int = None
    status: AppointmentStatusEnum 
    note: Optional[str] = None
    created_at: datetime = None

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "appointment_id": 1,
                "service_type_id": 2,
                "appointment_date": datetime.now(timezone.utc) - timedelta(hours=1),
                "customer_id": 1,
                "status": "pending",
                "note": "Khách hàng yêu cầu kiểm tra xe",
                "created_at": datetime.now(timezone.utc),
            }
        }
    

# class AppointmentDetailResponse(AppointmentInDBBase):
#     """Schema để trả về thông tin chi tiết Appointment kèm danh sách dịch vụ"""
#     services: List[AppointmentServiceResponse] = []
    
#     class Config:
#         from_attributes = True
