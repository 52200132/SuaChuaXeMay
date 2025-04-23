from pydantic import BaseModel, Field
from typing import Optional

class ServiceOrderDetailBase(BaseModel):
    service_detail_ID: int = Field(..., description='Mã chi tiết đơn hàng dịch vụ')
    order_id: int = Field(..., description='Mã đơn hàng')
    service_id: int = Field(..., description='Mã dịch vụ')
    price: int = Field(..., description='Giá dịch vụ')
    is_selected: Optional[bool] = False

class ServiceOrderDetailCreate(BaseModel):
    order_id: int = Field(..., description='Mã đơn hàng')
    service_id: int = Field(..., description='Mã dịch vụ')
    price: int = Field(..., description='Giá dịch vụ')
    is_selected: Optional[bool] = False
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "order_id": 1,
                "service_id": 1,
                "price": 100000,
                "is_selected": False
            }
        }

class ServiceOrderDetailUpdate(BaseModel):
    service_id: Optional[int] = None
    price: Optional[int] = None
    is_selected: Optional[bool] = None

class ServiceOrderDetailResponse(ServiceOrderDetailBase):
    service_detail_ID: int
    order_id: int
    service_id: int
    price: int
    is_selected: Optional[bool] = False

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "service_detail_ID": 1,
                "order_id": 1,
                "service_id": 1,
                "price": 100000,
                "is_selected": False
            }
        }
# class ServiceOrderDetailInDB(ServiceOrderDetailBase):
#     service_detail_ID: int
    
#     class Config:
#         orm_mode = True

# class ServiceOrderDetail(ServiceOrderDetailInDB):
#     pass

# class ServiceOrderDetailWithService(ServiceOrderDetail):
#     service_name: str
#     service_description: Optional[str] = None

