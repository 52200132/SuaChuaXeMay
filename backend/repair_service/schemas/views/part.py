from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class PartView(BaseModel):
    """Schema cho việc xem thông tin phụ tùng"""
    part_id: int
    name: str
    unit: str
    price: Optional[int] = None
    total_stock: Optional[int] = None
    supplier_name: Optional[str] = None
    URL: Optional[str] = None
        
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "part_id": 1,
                "name": "Lọc gió Wave Alpha",
                "unit": "cái",
                "price": 65000,
                "stock": 100,
                "supplier_id": 1,
                "URL": "/images/parts/loc-gio-wave-alpha.jpg",
            }
        }

class PartWarehouseView(BaseModel):
    """Schema cho việc xem thông tin kho phụ tùng"""
    part_id: int
    part_warehouse_id: int # cái này cũng là part_lot_id
    name: str
    unit: str
    import_price: Optional[int] = None
    import_date: Optional[datetime] = None
    stock: Optional[int] = None
    quantity: Optional[int] = None
    supplier_name: Optional[str] = None
    location: Optional[str] = None
    URL: Optional[str] = None

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "part_id": 1,
                "part_warehouse_id": 1,
                "name": "Lọc gió Wave Alpha",
                "unit": "cái",
                "import_price": 65000,
                "import_date": "2023-10-01T12:00:00",
                "stock": 100,
                "quantity": 50,
                "supplier_name": "Nhà cung cấp A",
                "location": "Kho A",
                "URL": "/images/parts/loc-gio-wave-alpha.jpg",
            }
        }

class PartOrderDetailView(BaseModel):
    """Schema cho việc xem thông tin chi tiết đơn hàng phụ tùng"""
    part_id: int
    part_order_detail_id: int
    name: str
    unit: str
    price: Optional[int] = None
    quantity: Optional[int] = None
    total_price: Optional[int] = None
    is_selected: Optional[bool] = None

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "part_id": 1,
                "part_order_detail_id": 1,
                "name": "Lọc gió Wave Alpha",
                "unit": "cái",
                "price": 65000,
                "quantity": 2,
                "total_price": 130000,
                "is_selected": True,
            }
        }

class WarehouseView(BaseModel):
    part_lot_id: int # cái này cũng là part_lot_id (part_warehouse_id)
    import_price: Optional[int] = None
    import_date: Optional[datetime] = None
    stock: Optional[int] = None
    quantity: Optional[int] = None
    supplier_name: Optional[str] = None
    location: Optional[str] = None

class PartWarehouseView2(BaseModel):
    """Schema cho việc xem thông tin kho phụ tùng"""
    part_id: int
    name: str
    unit: str
    price: Optional[int] = None
    need_quantity: Optional[int] = None
    URL: Optional[str] = None
    warehouses: list

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "part_id": 1,
                "name": "Lọc gió Wave Alpha",
                "unit": "cái",
                "price": 65000,
                "need_quantity": 100,
                "warehouses": [
                    {
                        "part_lot_id": 1,
                        "import_price": 65000,
                        "import_date": "2023-10-01T12:00:00",
                        "stock": 100,
                        "quantity": 50,
                        "supplier_name": "Nhà cung cấp A",
                        "location": "Kho A",
                    },
                    {
                        "part_lot_id": 2,
                        "import_price": 70000,
                        "import_date": "2023-10-02T12:00:00",
                        "stock": 50,
                        "quantity": 30,
                        "supplier_name": "Nhà cung cấp B",
                        "location": "Kho B",
                    },
                ],
            }
        }   