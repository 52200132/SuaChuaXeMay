from typing import Optional, Any
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
    is_exported: Optional[bool] = False
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

class PartOrderDetailView(BaseModel):
    part_order_details: list[Any]
    total_amount_for_part: int

class ServiceOrderDetailView(BaseModel):
    service_order_details: list[Any]
    total_amount_for_service: int

class Staff(BaseModel):
    staff_id: int
    fullname: str

class Customer(BaseModel):
    customer_id: int
    fullname: str
    phone_num: str

class Motocycle(BaseModel):
    motocycle_id: int
    license_plate: str
    brand: str
    model: str
    type: Optional[str] = None

class OrderDetailView(BaseModel):
    order_id: int
    total_price: int
    created_at: datetime
    staff: Staff
    customer: Customer
    motocycle: Motocycle
    part_order_detail: PartOrderDetailView
    service_order_detail: ServiceOrderDetailView

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "order_id": 1,
                "total_price": 1000000,
                "staff": {
                    "staff_id": 1,
                    "fullname": "Nguyen Van B"
                },
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
