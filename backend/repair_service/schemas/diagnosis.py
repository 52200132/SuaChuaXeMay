from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

class DiagnosisBase(BaseModel):
    diagnosis_id: int = Field(..., description='Mã chẩn đoán')
    form_id: int = Field(..., description='Mã phiếu sửa chữa')
    order_id: int = Field(..., description='Mã đơn hàng')
    problem: str = Field(..., description='Vấn đề phát hiện')
    created_at: datetime = Field(default= datetime.now(), description='Ngày chẩn đoán')
    estimated_cost: int = Field(..., description='Chi phí ước tính')

class DiagnosisCreate(BaseModel):
    form_id: int = Field(..., description='Mã phiếu sửa chữa')
    order_id: int = Field(..., description='Mã đơn hàng')
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "form_id": 1,
                "order_id": 1
            }
        }

class DiagnosisUpdate(BaseModel):
    problem: Optional[str]
    estimated_cost: Optional[int]
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "problem": "Xe không khởi động được",
                "estimated_cost": 500000
            }
        }

class DiagnosisResponse(BaseModel):
    diagnosis_id: int
    form_id: int
    order_id: int
    problem: Optional[str]
    created_at: datetime
    estimated_cost: Optional[int]

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "diagnosis_id": 1,
                "form_id": 1,
                "order_id": 1,
                "created_at": datetime.now(),
            }
        }
# class DiagnosisInDB(DiagnosisBase):
#     diagnosis_id: int
#     created_at: datetime
    
#     class Config:
#         orm_mode = True

# class Diagnosis(DiagnosisInDB):
#     pass

# class DiagnosisWithOrders(Diagnosis):
#     orders: List = []