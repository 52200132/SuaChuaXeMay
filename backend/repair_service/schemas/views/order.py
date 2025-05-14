from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class CustomerView(BaseModel):
    customer_id: int
    fullname: str
    phone_num: str

class MotocycleView(BaseModel):
    motocycle_id: int
    license_plate: str
    brand: str
    model: str
    type: Optional[str] = None

class OrderDetailView(BaseModel):
    pass

class OrderViewForTable(BaseModel):
    order_id: int
    status: Optional[str] = None
    created_at: Optional[datetime] = None
    customer: CustomerView
    motocycle: MotocycleView
    order_detail: Optional[OrderDetailView] = None
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "order_id": 1,
                "status": "pending",
                "created_at": "2023-10-01T12:00:00",
                "customer": {
                    "customer_id": 1,
                    "fullname": "Nguyen Van A",
                    "phone_num": "0123456789"
                },
                "motorcycle": {
                    "motocycle_id": 1,
                    "license_plate": "29A-123.45",
                    "brand": "Honda",
                    "model": "SH",
                    "type": "xe tay ga"
                }
            }
        }