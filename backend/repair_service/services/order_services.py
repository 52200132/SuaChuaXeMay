from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_, func
from sqlalchemy.orm import Bundle

from utils.logger import get_logger
from models.models_2 import Order, Customer, Motocycle, MotocycleType
from schemas.views.order import OrderViewForTable

logger = get_logger(__name__)

async def get_order_views_for_table(db: AsyncSession, skip: int = 0, limit: int = 1000) -> list[OrderViewForTable]:
    """
    Lấy danh sách đơn hàng để hiển thị trên bảng
    """
    try:
        query = (
            select(
                Bundle(
                    "order",
                    Order.order_id,
                    Order.status,
                    Order.created_at,
                    Order.is_exported,
                    Bundle(
                        "customer",
                        Customer.customer_id,
                        Customer.fullname,
                        Customer.phone_num,
                    ).label("customer"),
                    Bundle(
                        "motocycle",
                        Motocycle.motocycle_id,
                        Motocycle.license_plate,
                        MotocycleType.brand,
                        MotocycleType.model,
                        MotocycleType.type,
                    ).label("motocycle"),
                )
            )
            .join(Motocycle, Order.motocycle_id == Motocycle.motocycle_id)
            .join(Customer, Motocycle.customer_id == Customer.customer_id)
            .join(MotocycleType, Motocycle.moto_type_id == MotocycleType.moto_type_id)
            .order_by(Order.order_id.desc())
            .offset(skip)
            .limit(limit)
        )

        result = await db.execute(query)
        orders = result.scalars().all()
        return orders
    except IntegrityError as e:
        logger.error(f"Lỗi toàn vẹn: {str(e)}")
        raise e
    except Exception as e:
        logger.error(f"Lỗi khi lấy danh sách đơn hàng: {str(e)}")
        raise e
