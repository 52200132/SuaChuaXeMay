from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete
from sqlalchemy.exc import IntegrityError, MultipleResultsFound
from sqlalchemy.orm import selectinload

from utils.logger import get_logger
from models.models import PartOrderDetail
from schemas.part_order_detail import PartOrderDetailCreate, PartOrderDetailUpdate, PartOrderDetailResponse

logger = get_logger(__name__)

async def create_part_order_detail(db: AsyncSession, part_detail: PartOrderDetailCreate) -> PartOrderDetail:
    """Tạo mới một chi tiết đơn hàng phụ tùng"""
    try:
        db_part_order_details = PartOrderDetail(**part_detail.dict())
        db.add(db_part_order_details)
        await db.commit()
        await db.refresh(db_part_order_details)
        return db_part_order_details
    except IntegrityError as e:
        logger.error(f"IntegrityError: {e}")
        await db.rollback()
        raise e
    except Exception as e:
        logger.error(f"Error creating part order detail: {e}")
        await db.rollback()
        raise e

async def get_all_part_order_details(db: AsyncSession, skip: int = 0, limit: int = 100) -> list[PartOrderDetail]:
    """Lấy tất cả chi tiết đơn hàng phụ tùng"""
    result = await db.execute(select(PartOrderDetail).order_by(PartOrderDetail.part_detail_ID.asc()).offset(skip).limit(limit))
    return result.scalars().all()

async def get_all_part_order_details_by_order_id(db: AsyncSession, order_id: int) -> list[PartOrderDetail]:
    result = await db.execute(select(PartOrderDetail).where(PartOrderDetail.order_id == order_id))
    db_part_order_details = result.scalars().all()
    return db_part_order_details

async def get_part_order_detail_by_id(db: AsyncSession, part_detail_ID: int) -> PartOrderDetail:
    """Lấy thông tin chi tiết đơn hàng phụ tùng theo ID"""
    result = await db.execute(select(PartOrderDetail).where(PartOrderDetail.part_detail_ID == part_detail_ID))
    part_order_detail = result.scalars().one_or_none()
    return  part_order_detail

async def update_part_order_detail(db: AsyncSession, part_detail_ID: int, part_detail: PartOrderDetailUpdate) -> PartOrderDetail:
    """Cập nhật thông tin chi tiết đơn hàng phụ tùng"""
    try:
        db_part_order_detail = await get_part_order_detail_by_id(db, part_detail_ID)
        if not db_part_order_detail:
            return None
        
        update_data = part_detail.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_part_order_detail, key, value)
        
        await db.commit()
        await db.refresh(db_part_order_detail)
        return db_part_order_detail
        
    except IntegrityError as e:
        logger.error(f"IntegrityError: {e}")
        await db.rollback()
        raise e
    except Exception as e:
        logger.error(f"Error updating part order detail: {e}")
        await db.rollback()
        raise e