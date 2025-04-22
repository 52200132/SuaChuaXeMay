from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete
from sqlalchemy.exc import IntegrityError, MultipleResultsFound
from sqlalchemy.orm import selectinload

from utils.logger import get_logger
from models.models import PartOrderDetail
from schemas.part_order_detail import PartOrderDetailCreate, PartOrderDetailUpdate, PartOrderDetailResponse

logger = get_logger(__name__)

async def create_part_order_detail(db: AsyncSession, part_order_detail: PartOrderDetailCreate) -> PartOrderDetailResponse:
    """Tạo mới một chi tiết đơn hàng phụ tùng"""
    try:
        new_part_order_detail = PartOrderDetail(**part_order_detail.dict())
        db.add(new_part_order_detail)
        await db.commit()
        await db.refresh(new_part_order_detail)
        return PartOrderDetailResponse.from_orm(new_part_order_detail)
    except IntegrityError as e:
        logger.error(f"IntegrityError: {e}")
        await db.rollback()
        raise e
    except Exception as e:
        logger.error(f"Error creating part order detail: {e}")
        await db.rollback()
        raise e

async def get_part_order_detail_by_id(db: AsyncSession, part_detail_ID: int) -> PartOrderDetailResponse:
    """Lấy thông tin chi tiết đơn hàng phụ tùng theo ID"""
    try:
        result = await db.execute(select(PartOrderDetail).where(PartOrderDetail.part_detail_ID == part_detail_ID))
        part_order_detail = result.scalars().first()
        if part_order_detail:
            return PartOrderDetailResponse.from_orm(part_order_detail)
        else:
            logger.warning(f"Part order detail with ID {part_detail_ID} not found.")
            return None
    except Exception as e:
        logger.error(f"Error retrieving part order detail: {e}")
        raise e