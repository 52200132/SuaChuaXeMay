from pydantic import BaseModel
from typing import Optional

class WarehouseBase(BaseModel):
    stock: int
    location: str

class WarehouseCreate(WarehouseBase):
    part_lot_id: int

class WarehouseUpdate(BaseModel):
    stock: Optional[int] = None
    location: Optional[str] = None

class Warehouse(WarehouseBase):
    part_lot_id: int
    
    class Config:
        orm_mode = True
        from_attributes = True
