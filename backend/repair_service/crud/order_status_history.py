from pymysql import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from sqlalchemy.future import select
from utils.logger import get_logger

from models.models import OrderStatusHistory
from schemas.order_status_history import OrderStatusHistoryCreate, OrderStatusHistoryResponse

logger = get_logger(__name__)

async def get_order_status_history_by_id(db: AsyncSession, history_id: int) -> Optional[OrderStatusHistory]:
    """Lấy lịch sử trạng thái đơn hàng theo ID"""
    result = await db.execute(select(OrderStatusHistory).where(OrderStatusHistory.history_id == history_id))
    db_status_history = result.scalar_one_or_none()
    return db_status_history

async def get_status_history_by_order(db: AsyncSession, order_id: int) -> List[OrderStatusHistory]:
    """Lấy lịch sử trạng thái đơn hàng theo order_id"""
    result = await db.execute(select(OrderStatusHistory).where(OrderStatusHistory.order_id == order_id))
    db_status_history = result.scalars().all()
    return db_status_history

async def create_order_status_history(db: AsyncSession, status_history: OrderStatusHistoryCreate) -> OrderStatusHistory:
    """Tạo lịch sử thay đổi trạng thái đơn hàng mới trong cơ sở dữ liệu"""
    db_status_history = OrderStatusHistory(**status_history.dict())
    try:
        logger.info(f"Creating order status history: {db_status_history}")
        db.add(db_status_history)
        await db.commit()
        await db.refresh(db_status_history)
        return db_status_history

    except Exception as e:
        await db.rollback()
        logger.error(f"Lỗi không xác định khi tạo trạng thái: {str(e)}")
        raise ValueError("Lỗi không xác định khi tạo trạng thái")
    