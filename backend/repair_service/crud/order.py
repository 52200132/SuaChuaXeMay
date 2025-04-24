from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete
from sqlalchemy.exc import IntegrityError, MultipleResultsFound
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta

from utils.logger import get_logger
from models.models import Order
from schemas.order import OrderCreate, OrderUpdate, OrderResponse

logger = get_logger(__name__)

async def create_order(db: AsyncSession, order: OrderCreate) -> Order:
    """Tạo đơn hàng mới trong cơ sở dữ liệu"""
    try:
        logger.info(f"Tạo đơn hàng mới với thông tin: {order}")
        db_order = None
        if order.staff_id == 0:
            db_order = Order(motocycle_id=order.motocycle_id, status=order.status)
        else:
            db_order = Order(motocycle_id=order.motocycle_id, staff_id=order.staff_id, status=order.status)
        
        db.add(db_order)
        await db.commit()
        await db.refresh(db_order)
        return db_order
    except Exception as e:
        await db.rollback()
        logger.error(f"Lỗi không xác định khi tạo đơn hàng: {str(e)}")
        raise ValueError("Lỗi không xác định khi tạo đơn hàng")
    
async def get_all(db: AsyncSession, skip: int = 0, limit: int = 100) -> list[Order]:
    """Lấy danh sách đơn hàng với phân trang"""
    result = await db.execute(select(Order).order_by(Order.order_id.asc()).offset(skip).limit(limit))
    return result.scalars().all()

async def get_order_by_id(db: AsyncSession, order_id: int) -> Order:
    """Lấy thông tin đơn hàng theo ID"""
    result = await db.execute(select(Order).where(Order.order_id == order_id))
    db_order = result.scalar_one_or_none()
    return db_order

async def update_order(db: AsyncSession, order_id: int, order: OrderUpdate) -> Order:
    """Cập nhật thông tin đơn hàng"""
    db_order = await get_order_by_id(db, order_id)
    if not db_order:
        raise ValueError(f"Không tìm thấy đơn hàng với ID: {order_id}")

    update_data = order.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_order, key, value)

    await db.commit()
    await db.refresh(db_order)
    return db_order

async def delete_order(db: AsyncSession, order_id: int) -> str:
    """Xóa đơn hàng khỏi cơ sở dữ liệu"""
    db_order = await get_order_by_id(db, order_id)
    if not db_order:
        raise ValueError(f"Không tìm thấy đơn hàng với ID: {order_id}")

    await db.delete(db_order)
    await db.commit()

    return f"Đơn hàng với ID {order_id} đã được xóa thành công."

async def get_orders_with_filters(db: AsyncSession, staff_id: int = None, status: str = None, start_date: datetime = None, end_date: datetime = None, date: datetime.date = None, skip: int = 0, limit: int = 100) -> list[Order]:
    """Lấy danh sách đơn hàng với các bộ lọc"""
    try:
        query = select(Order).order_by(Order.order_id.asc()).offset(skip).limit(limit)

        if staff_id:
            query = query.where(Order.staff_id == staff_id)
        if status:
            query = query.where(Order.status == status)
        if date:
            # Tạo khoảng thời gian từ 00:00:00 đến 23:59:59 của ngày được chọn
            start_datetime = datetime.combine(date, datetime.min.time())
            end_datetime = datetime.combine(date, datetime.max.time())
            # Áp dụng bộ lọc
            query = query.where(Order.created_at.between(start_datetime, end_datetime))
        elif start_date and end_date:
            query = query.where(Order.created_at.between(start_date, end_date))
        elif start_date:
            query = query.where(Order.created_at >= start_date)
        elif end_date:
            query = query.where(Order.created_at <= end_date)

        result = await db.execute(query)
        logger.info("Lấy thành công các đơn hàng với bộ lọc")
        return result.scalars().all()
    except IntegrityError as e:
        await db.rollback()
        logger.error(f"IntegrityError: {e}")
        raise e
    except Exception as e:
        await db.rollback()
        logger.error(f"Error getting orders with filters: {e}")
        raise e