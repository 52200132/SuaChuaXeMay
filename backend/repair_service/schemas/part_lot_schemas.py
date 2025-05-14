from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PartLotBase(BaseModel):
    part_id: int
    import_date: Optional[datetime] = None
    quantity: int
    unit: str
    price: Optional[int] = None

class PartLotCreate(PartLotBase):
    pass

class PartLotUpdate(BaseModel):
    part_id: Optional[int] = None
    import_date: Optional[datetime] = None
    quantity: Optional[int] = None
    unit: Optional[str] = None
    price: Optional[int] = None

class PartLot(PartLotBase):
    part_lot_id: int
    
    class Config:
        orm_mode = True
        from_attributes = True
