from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete
from sqlalchemy.exc import IntegrityError, MultipleResultsFound
from sqlalchemy.orm import selectinload

from utils.logger import get_logger
from models.models import ServiceOrderDetail
from schemas.service_order_detail import ServiceOrderDetailCreate, ServiceOrderDetailUpdate, ServiceOrderDetailResponse

logger = get_logger(__name__)

async def create_service_order_detail(db: AsyncSession, service_detail: ServiceOrderDetailCreate) -> ServiceOrderDetail:
    """Tạo mới ServiceOrderDetail"""
    try:
        db_service_order_detail = ServiceOrderDetail(**service_detail.dict())
        db.add(db_service_order_detail)
        await db.commit()
        await db.refresh(db_service_order_detail)
        return db_service_order_detail
    except IntegrityError as e:
        logger.error(f"IntegrityError: {e}")
        await db.rollback()
        raise e
    except Exception as e:
        logger.error(f"Error creating service order detail: {e}")
        await db.rollback()
        raise e

async def get_all_service_order_details(db: AsyncSession, skip: int = 0, limit: int = 100) -> list[ServiceOrderDetail]:
    """Lấy tất cả ServiceOrderDetail"""
    result = await db.execute(
        select(ServiceOrderDetail).options(selectinload(ServiceOrderDetail.order)).order_by(ServiceOrderDetail.service_detail_ID.asc()).offset(skip).limit(limit)
    )
    return result.scalars().all()

async def get_service_order_detail_by_id(db: AsyncSession, service_detail_ID: int) -> ServiceOrderDetail:
    """Lấy ServiceOrderDetail theo ID"""
    result = await db.execute(select(ServiceOrderDetail).where(ServiceOrderDetail.service_detail_ID == service_detail_ID))
    service_order_detail = result.scalars().one_or_none()
    return service_order_detail

async def get_all_service_details_by_order_id(db: AsyncSession, order_id: int) -> list[ServiceOrderDetail]:
    """Lấy tất cả ServiceOrderDetail theo order_id"""
    result = await db.execute(select(ServiceOrderDetail).where(ServiceOrderDetail.order_id == order_id))
    service_order_details = result.scalars().all()
    return service_order_details

async def update_service_order_detail(db: AsyncSession, service_detail_ID: int, service_detail: ServiceOrderDetailUpdate) -> ServiceOrderDetail:
    """Cập nhật ServiceOrderDetail"""
    try: 
        db_service_order_detail = await get_service_order_detail_by_id(db, service_detail_ID)
        if not db_service_order_detail:
            return None
        
        update_data = service_detail.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_service_order_detail, key, value)
        
        await db.commit()
        await db.refresh(db_service_order_detail)
        return db_service_order_detail
    except IntegrityError as e:
        logger.error(f"IntegrityError: {e}")
        await db.rollback()
        raise e
    except Exception as e:
        logger.error(f"Error updating service order detail: {e}")
        await db.rollback()
        raise e
    
