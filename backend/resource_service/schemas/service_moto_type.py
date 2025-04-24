from pydantic import BaseModel, Field
from typing import Optional

class ServiceMotoTypeCreate(BaseModel):
    moto_type_id: int = Field(..., title="Moto Type ID", description="Unique identifier for the moto type")
    service_id: int = Field(..., title="Service ID", description="Unique identifier for the service")
    price: int = Field(..., title="Price", description="Price of the service follow moto type")
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "moto_type_id": 1,
                "service_id": 1,
                "price": 1000
            }
        }
    
class ServiceMotoTypeUpdate(BaseModel):
    # moto_type_id: Optional[int] = Field(None, title="Moto Type ID", description="Unique identifier for the moto type")
    # service_id: Optional[int] = Field(None, title="Service ID", description="Unique identifier for the service")
    price: Optional[int] = Field(None, title="Price", description="Price of the service follow moto type")
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "price": 1000
            }
        }

class ServiceMotoTypeResponse(BaseModel):
    service_mototype_id: int = Field(..., title="Service Moto Type ID", description="Unique identifier for the service moto type")
    moto_type_id: int = Field(..., title="Moto Type ID", description="Unique identifier for the moto type")
    service_id: int = Field(..., title="Service ID", description="Unique identifier for the service")
    price: int = Field(..., title="Price", description="Price of the service follow moto type")
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "service_mototype_id": 1,
                "moto_type_id": 1,
                "service_id": 1,
                "price": 1000
            }
        }