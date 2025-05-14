from pydantic import BaseModel    

class WarehouseInfo(BaseModel):
    part_lot_id: int
    quantity: int
    name: str
    import_price: int
    location: str
    supplier_name: str
    unit: str

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "part_lot_id": 1,
                "quantity": 50,
                "name": "Phụ tùng A",
                "import_price": 100000,
                "location": "Kho A",
                "supplier_name": "Nhà cung cấp A",
                "unit": "Cái"
            }
        }