from pydantic import BaseModel
from typing import Optional

class ServiceCreate(BaseModel):
    name: str
    service_type_id: int

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "name": "Thay dầu động cơ",
                "service_type_id": 1
            }
        }

class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    service_type_id: Optional[int] = None

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "name": "Thay dầu động cơ",
                "service_type_id": 1
            }
        }

class ServiceResponse(BaseModel):
    service_id: int
    name: str
    service_type_id: int

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "service_id": 1,
                "name": "Thay dầu động cơ",
                "service_type_id": 1
            }
        }