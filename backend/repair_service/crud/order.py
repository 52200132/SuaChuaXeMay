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
        return OrderResponse.from_orm(db_order)
    except IntegrityError as e:
        await db.rollback()
        logger.error(f"Lỗi khi tạo đơn hàng: {str(e)}")
        raise ValueError("Đơn hàng đã tồn tại")
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
    try:
        db_order = await get_order_by_id(db, order_id)
        if not db_order:
            return None

        update_data = order.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_order, key, value)

        await db.commit()
        await db.refresh(db_order)
        return OrderResponse.from_orm(db_order)
    except IntegrityError as e:
        logger.error(f"IntegrityError: {e}")
        await db.rollback()
        raise e
    except Exception as e:
        logger.error(f"Error updating part order detail: {e}")
        await db.rollback()
        raise e

async def delete_order(db: AsyncSession, order_id: int) -> bool:
    """Xóa đơn hàng khỏi cơ sở dữ liệu"""
    try:
        db_order = await get_order_by_id(db, order_id)
        if not db_order:
            return False

        await db.delete(db_order)
        await db.commit()
        return True
    except IntegrityError as e:
        logger.error(f"IntegrityError: {e}")
        await db.rollback()
        raise e
    except Exception as e:
        logger.error(f"Error updating part order detail: {e}")
        await db.rollback()
        raise e
