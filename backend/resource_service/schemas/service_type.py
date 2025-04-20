from pydantic import BaseModel
from typing import Optional

class ServiceTypeCreate(BaseModel):
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "name": "Bảo dưỡng",
                "description": "Bảo dưỡng định kỳ cho xe máy"
            }
        }

class ServiceTypeResponse(BaseModel):
    service_type_id: int
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True
        schema_ejson_schema_extraxtra = {
            "example": {
                "id": 1,
                "name": "Bảo dưỡng",
                "description": "Bảo dưỡng định kỳ cho xe máy"
            }
        }
