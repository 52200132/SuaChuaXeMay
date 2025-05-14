from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class InvoiceView(BaseModel):
    invoice_id: int
    order_id: Optional[int] = None
    staff_id: Optional[int] = None
    total_price: Optional[int] = None
    is_paid: Optional[bool] = None
    pay_at: Optional[datetime] = None
    payment_method: Optional[str] = None

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "invoice_id": 1,
                "order_id": 1,
                "staff_id": 1,
                "total_price": 1000000,
                "is_paid": True,
                "pay_at": "2023-10-01T12:00:00",
                "payment_method": "Cash"
            }
        }