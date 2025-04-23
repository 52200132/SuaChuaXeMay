from pydantic import BaseModel, Field
from typing import Optional

class PartMotoTypeCreate(BaseModel):
    moto_type_id: int = Field(..., description="ID of the motorcycle type")
    part_id: int = Field(..., description="ID of the part")
    price: int = Field(..., description="Price of the part for the motorcycle type")
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "moto_type_id": 1,
                "part_id": 1,
                "price": 1000
            }
        }

class PartMotoTypeUpdate(BaseModel):
    moto_type_id: Optional[int] = Field(None, description="ID of the motorcycle type")
    part_id: Optional[int] = Field(None, description="ID of the part")
    price: Optional[int] = Field(None, description="Price of the part for the motorcycle type")
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "price": 1200
            }
        }
        
class PartMotoTypeResponse(BaseModel):
    id: int = Field(..., description="ID of the part motorcycle type relationship")
    moto_type_id: int = Field(..., description="ID of the motorcycle type")
    part_id: int = Field(..., description="ID of the part")
    price: int = Field(..., description="Price of the part for the motorcycle type")
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "moto_type_id": 1,
                "part_id": 1,
                "price": 1000
            }
        }