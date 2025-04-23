from pydantic import BaseModel, Field
from typing import Optional

class PartCreate(BaseModel):
    name: str = Field(..., description="Name of the part")
    URL: str = Field(..., description="URL of the part")
    unit: str = Field(..., description="Unit of the part")
    stock: int = Field(..., description="Stock quantity of the part")
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "part_id": "part_001",
                "name": "Part Name",
                "URL": "http://example.com/part",
                "unit": "pcs",
                "stock": 100
            }
        }

class PartUpdate(BaseModel):
    name: Optional[str] = Field(None, description="Name of the part")
    URL: Optional[str] = Field(None, description="URL of the part")
    unit: Optional[str] = Field(None, description="Unit of the part")
    stock: Optional[int] = Field(None, description="Stock quantity of the part")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "name": "Updated Part Name",
                "URL": "http://example.com/updated_part",
                "unit": "pcs",
                "stock": 150
            }
        }

class PartResponse(BaseModel):
    part_id: int = Field(..., description="Unique identifier for the part")
    name: str = Field(..., description="Name of the part")
    URL: str = Field(..., description="URL of the part")
    unit: str = Field(..., description="Unit of the part")
    stock: int = Field(..., description="Stock quantity of the part")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "part_id": 1,
                "name": "Part Name",
                "URL": "http://example.com/part",
                "unit": "pcs",
                "stock": 100
            }
        }