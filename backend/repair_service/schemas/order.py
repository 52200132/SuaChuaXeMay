from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

from .service_order_detail import ServiceOrderDetail
from .part_order_detail import PartOrderDetail

class OrderStatusEnum(str, Enum):

    RECEIVED = 'received'
    CHECKING = 'checking'
    WAIT_CONFIRM = 'wait_confirm'
    REPAIRING = 'repairing'
    WAIT_DELIVERY = 'wait_delivery'
    DELIVERED = 'delivered'

class OrderBase(BaseModel):
    order_id: int = Field(..., description='Mã đơn hàng')
    diagnosis_id: int = Field(..., description='Mã chẩn đoán')
    moto_type_id: int = Field(..., description='Mã loại xe')
    staff_id: int = Field(..., description='Mã nhân viên')
    status: OrderStatusEnum = OrderStatusEnum.RECEIVED
    total_price: Optional[int] = 0

class OrderCreate(OrderBase):
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "diagnosis_id": 1,
                "moto_type_id": 1,
                "staff_id": 1,
                "status": OrderStatusEnum.RECEIVED,
                "total_price": 0
            }
        }

class OrderUpdate(BaseModel):
    diagnosis_id: Optional[int] = None
    moto_type_id: Optional[int] = None
    staff_id: Optional[int] = None
    status: Optional[OrderStatusEnum] = None
    total_price: Optional[int] = None

class OrderResponse(BaseModel):
    order_id: int
    diagnosis_id: int
    moto_type_id: int
    staff_id: int
    status: OrderStatusEnum
    total_price: Optional[int] = 0

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "order_id": 1,
                "diagnosis_id": 1,
                "moto_type_id": 1,
                "staff_id": 1,
                "status": OrderStatusEnum.RECEIVED,
                "total_price": 0
            }
        }
# class OrderInDB(OrderBase):
#     order_id: int
#     created_at: datetime
    
#     class Config:
#         orm_mode = True

# class Order(OrderInDB):
#     pass

# class OrderWithDetails(Order):
#     service_details: List[ServiceOrderDetail] = []
#     part_details: List[PartOrderDetail] = []

# class OrderSummary(BaseModel):
#     order_id: int
#     status: OrderStatusEnum
#     created_at: datetime
#     total_price: int
#     staff_name: Optional[str]
    
#     class Config:
#         orm_mode = True
