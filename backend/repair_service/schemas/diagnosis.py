from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

class DiagnosisBase(BaseModel):
    diagnosis_id: int = Field(..., description='Mã chẩn đoán')
    form_id: int = Field(..., description='Mã phiếu sửa chữa')
    problem: str = Field(..., description='Vấn đề phát hiện')
    created_at: datetime = Field(default= datetime.now(), description='Ngày chẩn đoán')
    estimated_cost: int = Field(..., description='Chi phí ước tính')

class DiagnosisCreate(DiagnosisBase):
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "form_id": 1,
                "problem": "Xe không khởi động được",
                "estimated_cost": 500000
            }
        }

class DiagnosisUpdate(BaseModel):
    problem: Optional[str] = None
    estimated_cost: Optional[int] = None

class DiagnosisResponse(DiagnosisBase):
    form_id: int
    problem: str
    created_at: datetime
    estimated_cost: int

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "diagnosis_id": 1,
                "form_id": 1,
                "problem": "Xe không khởi động được",
                "created_at": datetime.now(),
                "estimated_cost": 500000
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