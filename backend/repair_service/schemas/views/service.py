from pydantic import BaseModel
from typing import Optional

class ServiceView(BaseModel):
    service_id: int
    name: str
    description: Optional[str] = None
    price: Optional[int] = None

class ServiceOrderDetailView(BaseModel):
    service_detail_id: int
    service_id: int
    name: str
    price: Optional[int] = None
    is_selected: Optional[bool] = None

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "service_detail_id": 1,
                "service_id": 1,
                "name": "Thay dầu động cơ",
                "price": 50000,
                "is_selected": True,
            }
        }
