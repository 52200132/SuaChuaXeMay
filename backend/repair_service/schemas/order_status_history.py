from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from enum import Enum

class OrderStatusEnum(str, Enum):
    RECEIVED = 'received'
    CHECKING = 'checking'
    WAIT_CONFIRM = 'wait_confirm'
    REPAIRING = 'repairing'
    WAIT_DELIVERY = 'wait_delivery'
    DELIVERED = 'delivered'

class OrderStatusHistoryBase(BaseModel):
    history_id: int = Field(..., description='Mã lịch sử trạng thái đơn hàng')
    order_id: int = Field(..., description='Mã đơn hàng')
    status: OrderStatusEnum = Field(..., description='Trạng thái đơn hàng')
    changed_at: datetime = Field(default= datetime.now(), description='Thời gian thay đổi trạng thái')
    changed_by: int = Field(..., description='Mã nhân viên thay đổi trạng thái')

class OrderStatusHistoryCreate(BaseModel):
    order_id: int = Field(..., description='Mã đơn hàng')
    status: OrderStatusEnum = Field(..., description='Trạng thái đơn hàng')
    changed_at: datetime = Field(default= datetime.now(), description='Thời gian thay đổi trạng thái')
    changed_by: int = Field(..., description='Mã nhân viên thay đổi trạng thái')
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "order_id": 1,
                "status": OrderStatusEnum.RECEIVED,
                "changed_by": 1
            }
        }

# class OrderStatusHistoryUpdate(BaseModel):
#     status: Optional[OrderStatusEnum] = None
#     changed_by: Optional[int] = None

class OrderStatusHistoryResponse(BaseModel):
    order_id: int
    status: OrderStatusEnum
    changed_at: datetime
    changed_by: int

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "history_id": 1,
                "order_id": 1,
                "status": OrderStatusEnum.RECEIVED,
                "changed_at": datetime.now(),
                "changed_by": 1
            }
        }
# class OrderStatusHistoryInDB(OrderStatusHistoryBase):
#     history_id: int
#     changed_at: datetime
    
#     class Config:
#         orm_mode = True

# class OrderStatusHistory(OrderStatusHistoryInDB):
#     pass

# class OrderStatusHistoryWithStaff(OrderStatusHistory):
#     staff_name: str