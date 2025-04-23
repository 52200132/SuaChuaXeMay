from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

from schemas.service_order_detail import ServiceOrderDetailResponse
from schemas.part_order_detail import PartOrderDetailResponse

class OrderStatusEnum(str, Enum):

    RECEIVED = 'received'
    CHECKING = 'checking'
    WAIT_CONFIRM = 'wait_confirm'
    REPAIRING = 'repairing'
    WAIT_DELIVERY = 'wait_delivery'
    DELIVERED = 'delivered'

class OrderBase(BaseModel):
    order_id: int = Field(..., description='Mã đơn hàng')
    motocycle_id: int = Field(..., description='Mã loại xe')
    staff_id: int = Field(..., description='Mã nhân viên')
    status: OrderStatusEnum = OrderStatusEnum.RECEIVED
    total_price: Optional[int] = 0

class OrderCreate(BaseModel):
    motocycle_id: int = Field(..., description='Mã loại xe')
    staff_id: Optional[int] = Field(default=0, description='Mã nhân viên')
    status: OrderStatusEnum = OrderStatusEnum.RECEIVED

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "motocycle_id": 1,
                "status": OrderStatusEnum.RECEIVED
            }
        }

class OrderUpdate(BaseModel):
    motocycle_id: Optional[int] = None
    staff_id: Optional[int] = None
    status: Optional[OrderStatusEnum] = None
    total_price: Optional[int] = None

class OrderResponse(BaseModel):
    order_id: int
    motocycle_id: int
    staff_id: Optional[int] = 0
    status: OrderStatusEnum
    total_price: Optional[int] = 0

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "order_id": 1,
                "motocycle_id": 1,
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
#     service_details: List[ServiceOrderDetailResponse] = []
#     part_details: List[PartOrderDetailResponse] = []

# class OrderSummary(BaseModel):
#     order_id: int
#     status: OrderStatusEnum
#     created_at: datetime
#     total_price: int
#     staff_name: Optional[str]
    
#     class Config:
#         orm_mode = True
