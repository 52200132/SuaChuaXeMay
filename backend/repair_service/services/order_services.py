from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_, func
from sqlalchemy.orm import Bundle

from utils.logger import get_logger
from models.models_2 import Order, Customer, Motocycle, MotocycleType, Staff
from schemas.views.order import OrderViewForTable, OrderDetailView
from services import service_servies, part_services

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

async def get_order_details_by_id(db: AsyncSession, order_id: int) -> OrderDetailView:
    """
    Lấy thông tin chi tiết của một đơn hàng theo ID.
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
                    Order.total_price,
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
                    Bundle(
                        "staff",
                        Staff.staff_id,
                        Staff.fullname,
                    ).label("staff"),
                )
            )
            .join(Staff, Order.staff_id == Staff.staff_id)
            .join(Motocycle, Order.motocycle_id == Motocycle.motocycle_id)
            .join(Customer, Motocycle.customer_id == Customer.customer_id)
            .join(MotocycleType, Motocycle.moto_type_id == MotocycleType.moto_type_id)
            .where(Order.order_id == order_id)
        )

        result = await db.execute(query)
        order = result.scalars().one_or_none()
        print("Dữ liệu của đơn hàng:", order.motocycle)
        print("Dữ liệu của khách hàng:", order.customer)
        if not order:
            raise Exception(f"Không tìm thấy đơn hàng với ID: {order_id}")

        # Lấy danh sách dịch vụ và phụ tùng
        services = await service_servies.get_service_order_detail_views_by_service_order_id(db, order_id)
        parts = await part_services.get_part_order_detail_views_by_order_id(db, order_id)
        # print("Dữ liệu của dịch vụ:", services)
        # print("Dữ liệu của phụ tùng:", parts.get("part_order_details"))
        order_dict = {
            "order_id": order.order_id,
            "status": order.status,
            "created_at": order.created_at,
            "is_exported": order.is_exported,
            "total_price": order.total_price,
            "customer": dict(
                customer_id=order.customer.customer_id,
                fullname=order.customer.fullname,
                phone_num=order.customer.phone_num,
            ),
            "motocycle": dict(
                motocycle_id=order.motocycle.motocycle_id,
                license_plate=order.motocycle.license_plate,
                brand=order.motocycle.brand,
                model=order.motocycle.model,
                type=order.motocycle.type,
            ),
            "staff": dict(staff_id=order.staff.staff_id, fullname=order.staff.fullname),
            "part_order_detail": dict(
                part_order_details=parts.get("part_order_details"),
                total_amount_for_part=parts.get("total_amount_for_part"),
            ),
            "service_order_detail": dict(
                service_order_details=services.get("service_order_details"),
                total_amount_for_service=services.get("total_amount_for_service"),
            ),
        }

        return order_dict
    except IntegrityError as e:
        logger.error(f"Lỗi toàn vẹn: {str(e)}")
        raise e
    except Exception as e:
        logger.error(f"Lỗi khi lấy thông tin chi tiết đơn hàng: {str(e)}")
        raise e
