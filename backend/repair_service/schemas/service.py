from typing import Optional, List
from pydantic import BaseModel, Field

class ServiceBase(BaseModel):
    name: str = Field(..., description="Tên dịch vụ")
    service_type_id: int
    is_deleted: Optional[bool] = False

class ServiceCreate(ServiceBase):
    pass

class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    service_type_id: Optional[int] = None
    is_deleted: Optional[bool] = None

class ServiceResponse(ServiceBase):
    service_id: int
    
    class Config:
        attribute_from = True
        json_schema_extra = {
            "example": {
                "service_id": 1,
                "name": "Thay dầu động cơ",
                "service_type_id": 2,
                "is_deleted": False
            }
        }

class ServiceDetailResponse(ServiceResponse):
    service_type: Optional[dict] = None

class ServicesPage(BaseModel):
    total: int
    items: List[ServiceResponse]