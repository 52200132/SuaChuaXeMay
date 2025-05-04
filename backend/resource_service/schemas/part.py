from pydantic import BaseModel, Field
from typing import Optional

class PartCreate(BaseModel):
    name: str = Field(..., description="Name of the part")
    URL: Optional[str] = Field(None, description="URL of the part")
    unit: str = Field(..., description="Unit of the part")
    stock: int = Field(..., description="Stock quantity of the part")
    is_deleted: bool = Field(default=False, description="Logical deletion flag")
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "name": "Part Name",
                "URL": "http://example.com/part",
                "unit": "pcs",
                "stock": 100,
                "is_deleted": False
            }
        }

class PartUpdate(BaseModel):
    name: Optional[str] = Field(None, description="Name of the part")
    URL: Optional[str] = Field(None, description="URL of the part")
    unit: Optional[str] = Field(None, description="Unit of the part")
    stock: Optional[int] = Field(None, description="Stock quantity of the part")
    is_deleted: Optional[bool] = Field(None, description="Logical deletion flag")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "name": "Updated Part Name",
                "URL": "http://example.com/updated_part",
                "unit": "pcs",
                "stock": 150,
                "is_deleted": False
            }
        }

class PartResponse(BaseModel):
    part_id: int = Field(..., description="Unique identifier for the part")
    name: str = Field(..., description="Name of the part")
    URL: Optional[str] = Field(..., description="URL of the part")
    unit: str = Field(..., description="Unit of the part")
    stock: int = Field(..., description="Stock quantity of the part")
    is_deleted: bool = Field(..., description="Logical deletion flag")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "part_id": 1,
                "name": "Part Name",
                "URL": "http://example.com/part",
                "unit": "pcs",
                "stock": 100,
                "is_deleted": False
            }
        }