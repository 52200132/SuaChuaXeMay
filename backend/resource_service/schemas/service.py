from pydantic import BaseModel
from typing import Optional

class ServiceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    service_type_id: int

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "name": "Thay dầu động cơ",
                "description": "Thay dầu động cơ cho xe máy",
                "service_type_id": 1
            }
        }

class ServiceResponse(BaseModel):
    service_id: int
    name: str
    description: Optional[str] = None
    service_type_id: int

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "service_id": 1,
                "name": "Thay dầu động cơ",
                "description": "Thay dầu động cơ cho xe máy",
                "service_type_id": 1
            }
        }