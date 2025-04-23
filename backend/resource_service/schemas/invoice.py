from pydantic import BaseModel, Field
from typing import Optional

class InvoiceCreate(BaseModel):
    order_id: int = Field(..., description="ID of the order associated with the invoice")
    staff_id: int = Field(..., description="ID of the staff member who created the invoice")
    create_at: str = Field(..., description="Timestamp when the invoice was paied")
    total_price: int = Field(..., description="Total price of the invoice")
    payment_method: str = Field(..., description="Payment method used for the invoice")
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "order_id": 1,
                "staff_id": 1,
                "create_at": "2023-10-01T12:00:00Z",
                "total_price": 1000,
                "payment_method": "credit_card"
            }
        }

class InvoiceUpdate(BaseModel):
    order_id: Optional[int] = Field(None, description="ID of the order associated with the invoice")
    staff_id: Optional[int] = Field(None, description="ID of the staff member who created the invoice")
    create_at: Optional[str] = Field(None, description="Timestamp when the invoice was paied")
    total_price: Optional[int] = Field(None, description="Total price of the invoice")
    payment_method: Optional[str] = Field(None, description="Payment method used for the invoice")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "order_id": 1,
                "staff_id": 1,
                "create_at": "2023-10-01T12:00:00Z",
                "total_price": 1000,
                "payment_method": "credit_card"
            }
        }

class InvoiceResponse(BaseModel):
    invoice_id: int = Field(..., description="ID of the invoice")
    order_id: int = Field(..., description="ID of the order associated with the invoice")
    staff_id: int = Field(..., description="ID of the staff member who created the invoice")
    create_at: str = Field(..., description="Timestamp when the invoice was paied")
    total_price: int = Field(..., description="Total price of the invoice")
    payment_method: str = Field(..., description="Payment method used for the invoice")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "order_id": 1,
                "staff_id": 1,
                "create_at": "2023-10-01T12:00:00Z",
                "total_price": 1000,
                "payment_method": "credit_card"
            }
        }