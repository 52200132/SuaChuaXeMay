from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional

class InvoiceCreate(BaseModel):
    order_id: int = Field(..., description="ID of the order associated with the invoice")
    is_paid: bool = Field(False, description="Indicates if the invoice has been paid")
    total_price: int = Field(..., description="Total price of the invoice")
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "order_id": 1,
                "total_price": 1000
            }
        }

class InvoiceUpdate(BaseModel):
    is_paid: bool = Field(default=True, description="Indicates if the invoice has been paid")
    create_at: datetime = Field(default= datetime.now(), description="Timestamp when the invoice was paied")
    payment_method: str = Field(..., description="Payment method used for the invoice")
    staff_id: int = Field(..., description="ID of the staff member who created the invoice")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "payment_method": "credit_card",
                "staff_id": 1
            }
        }

class InvoiceResponse(BaseModel):
    invoice_id: int = Field(..., description="ID of the invoice")
    order_id: int = Field(..., description="ID of the order associated with the invoice")
    staff_id: Optional[int] = Field(default=None, description="ID of the staff member who created the invoice")
    create_at: Optional[datetime] = Field(default=None, description="Timestamp when the invoice was paied")
    total_price: int = Field(..., description="Total price of the invoice")
    payment_method: Optional[str] = Field(default=None, description="Payment method used for the invoice")
    is_paid: bool = Field(..., description="Indicates if the invoice has been paid")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "order_id": 1,
                "staff_id": 1,
                "create_at": "2023-10-01T12:00:00Z",
                "total_price": 1000,
                "payment_method": "credit_card",
                "is_paid": True
            }
        }