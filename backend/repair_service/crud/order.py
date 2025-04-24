from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete
from sqlalchemy.exc import IntegrityError, MultipleResultsFound
from sqlalchemy.orm import selectinload

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
