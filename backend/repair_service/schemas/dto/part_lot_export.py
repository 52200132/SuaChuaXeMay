from pydantic import BaseModel    

class PartLotExport(BaseModel):
    part_lot_id: int
    quantity: int

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "part_lot_id": 1,
                "quantity": 50,
            }
        }