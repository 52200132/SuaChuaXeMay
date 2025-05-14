from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class SupplierBase(BaseModel):
    name: str
    address: str
    phone_num: str
    email: Optional[EmailStr] = None
    website: Optional[str] = None

class SupplierCreate(SupplierBase):
    pass
    class Config:
        attribute_from = True
        json_schema_extra = {
            "example": {
                "name": "Nhà cung cấp A",
                "address": "123 Đường ABC, Quận 1, TP.HCM",
                "phone_num": "0123456789",
                "email": "nhacungcapa@gmail.com",
                "website": "https://www.nhacungcapA.com"
            }
        }

class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    phone_num: Optional[str] = None
    email: Optional[EmailStr] = None
    website: Optional[str] = None
    
    class Config:
        attribute_from = True
        json_schema_extra = {
            "example": {
                "name": "Nhà cung cấp B",
                "address": "123 Đường ABC, Quận 1, TP.HCM",
                "phone_num": "0123456789",
                "email": "nhacungcapb@gmail.com",
                "website": "https://www.nhacungcapB.com"
            }
        }
