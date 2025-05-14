from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_, func
from sqlalchemy.orm import Bundle

from utils.logger import get_logger
from models.models_2 import Invoice, Order
from schemas.views.invoice import InvoiceView

logger = get_logger(__name__)


async def get_invoice_views(db: AsyncSession, skip: int = 0, limit: int = 1000) -> list[InvoiceView]:
    """
    Lấy danh sách hóa đơn để hiển thị trên bảng
    """
    try:
        query = (
            select(
                Bundle(
                        "invoice",
                        Invoice.invoice_id,
                        Invoice.create_at.label("pay_at"),
                        Order.total_price,
                        Order.order_id,
                        Invoice.is_paid,
                        Invoice.staff_id,
                    ).label("order")
                )
            .join(Order, Invoice.order_id == Order.order_id)
            .order_by(Invoice.invoice_id.desc())
            .offset(skip)
            .limit(limit)
        )

        result = await db.execute(query)
        invoices = result.scalars().all()
        return invoices
    except IntegrityError as e:
        logger.error(f"Lỗi toàn vẹn: {str(e)}")
        raise e
    except Exception as e:
        logger.error(f"Lỗi khi lấy danh sách hóa đơn: {str(e)}")
        raise e