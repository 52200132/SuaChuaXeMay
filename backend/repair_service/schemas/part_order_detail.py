from pydantic import BaseModel, Field
from typing import Optional

class PartOrderDetailBase(BaseModel):
    part_detail_ID: int = Field(..., description='Mã chi tiết đơn hàng phụ tùng')
    order_id: int = Field(..., description='Mã đơn hàng')
    part_id: int = Field(..., description='Mã phụ tùng')
    price: int = Field(..., description='Giá phụ tùng')
    quantity: int = 1
    is_selected: Optional[bool] = False

class PartOrderDetailCreate(BaseModel):
    order_id: int = Field(..., description='Mã đơn hàng')
    part_id: int = Field(..., description='Mã phụ tùng')
    price: int = Field(..., description='Giá phụ tùng')
    quantity: int = 1
    is_selected: Optional[bool] = False
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "order_id": 1,
                "part_id": 1,
                "price": 100000,
                "quantity": 2,
                "is_selected": False
            }
        }

class PartOrderDetailUpdate(BaseModel):
    part_id: Optional[int] = None
    price: Optional[int] = None
    quantity: Optional[int] = None
    is_selected: Optional[bool] = None
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "part_id": 1,
                "price": 100000,
                "quantity": 2,
                "is_selected": False
            }
        }

class PartOrderDetailResponse(BaseModel):
    part_detail_ID: int
    order_id: int
    part_id: int
    price: int
    quantity: int
    is_selected: Optional[bool] = False

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "part_detail_ID": 1,
                "order_id": 1,
                "part_id": 1,
                "price": 100000,
                "quantity": 2,
                "is_selected": False
            }
        }
# class PartOrderDetailInDB(PartOrderDetailBase):
#     part_detail_ID: int
    
#     class Config:
#         orm_mode = True

# class PartOrderDetail(PartOrderDetailInDB):
#     pass

# class PartOrderDetailWithPart(PartOrderDetail):
#     part_name: str
#     part_description: Optional[str] = None
#     part_manufacturer: Optional[str] = None
