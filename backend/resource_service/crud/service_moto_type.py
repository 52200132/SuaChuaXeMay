from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError, MultipleResultsFound
from fastapi import HTTPException
from pydantic import ValidationInfo

from models.models import ServiceMotoType
from schemas.service_moto_type import ServiceMotoTypeResponse, ServiceMotoTypeCreate, ServiceMotoTypeUpdate
from utils.logger import get_logger

logger = get_logger(__name__)

async def create_service_moto_type(db: AsyncSession, service_moto_type: ServiceMotoTypeCreate) -> ServiceMotoType:
    """Tạo mới một loại dịch vụ"""
    try:
        db_service_moto_type = ServiceMotoType(**service_moto_type.dict())
        db.add(db_service_moto_type)
        await db.commit()
        await db.refresh(db_service_moto_type)
        return db_service_moto_type
    except IntegrityError as e:
        logger.error(f"IntegrityError: {e}")
        await db.rollback()
        raise e
    except Exception as e:
        logger.error(f"Error creating service moto type: {e}")
        await db.rollback()
        raise e

async def get_service_moto_type_by_id(db: AsyncSession, service_mototype_id: int) -> ServiceMotoType:
    """Lấy thông tin chi tiết của một loại dịch vụ"""
    try:
        result = await db.execute(
            select(ServiceMotoType).where(ServiceMotoType.service_mototype_id == service_mototype_id)
        )
        service_moto_type = result.scalars().one_or_none()
        if not service_moto_type:
            raise HTTPException(status_code=404, detail="Service Moto Type not found")
        return service_moto_type
    except MultipleResultsFound:
        raise HTTPException(status_code=500, detail="Multiple results found")
    except Exception as e:
        logger.error(f"Error fetching service moto type by ID: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

async def get_service_moto_type_by_service_id_and_mototype_id(db: AsyncSession, service_id: int, moto_type_id: int) -> ServiceMotoType:
    """Lấy thông tin loại dịch vụ theo ID dịch vụ và ID loại xe máy"""
    result = await db.execute(
        select(ServiceMotoType).where(
            ServiceMotoType.service_id == service_id,
            ServiceMotoType.moto_type_id == moto_type_id
        )
    )
    service_moto_type = result.scalars().one_or_none()
    return service_moto_type
    
async def get_all_service_moto_types(db: AsyncSession, skip: int = 0, limit: int = 100) -> list[ServiceMotoType]:
    """Lấy danh sách tất cả các loại dịch vụ"""
    result = await db.execute(
        select(ServiceMotoType).order_by(ServiceMotoType.service_mototype_id.asc()).offset(skip).limit(limit)
    )
    return result.scalars().all()

async def get_all_service_moto_types_by_mototype_id(db: AsyncSession, moto_type_id: int, skip: int = 0, limit: int = 100) -> list[ServiceMotoType]:
    """Lấy danh sách tất cả các loại dịch vụ theo ID loại xe máy"""
    result = await db.execute(
        select(ServiceMotoType).where(ServiceMotoType.moto_type_id == moto_type_id).order_by(ServiceMotoType.service_mototype_id.asc()).offset(skip).limit(limit)
    )
    return result.scalars().all()

async def update_service_moto_type(db: AsyncSession, service_mototype_id: int, service_moto_type: ServiceMotoTypeUpdate) -> ServiceMotoType:
    """Cập nhật thông tin của một loại dịch vụ"""
    db_service_moto_type = await get_service_moto_type_by_id(db, service_mototype_id)
    if not db_service_moto_type:
        return None
    update_data = service_moto_type.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_service_moto_type, key, value)
    await db.commit()
    await db.refresh(db_service_moto_type)
    return db_service_moto_type

async def update_service_moto_type_by_service_id_and_mototype_id(db: AsyncSession, service_id: int, moto_type_id: int, service_moto_type: ServiceMotoTypeUpdate) -> ServiceMotoType:
    """Cập nhật thông tin của một loại dịch vụ"""
    db_service_moto_type = await get_service_moto_type_by_service_id_and_mototype_id(db, service_id, moto_type_id)
    if not db_service_moto_type:
        return None
    update_data = service_moto_type.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_service_moto_type, key, value)
    await db.commit()
    await db.refresh(db_service_moto_type)
    return db_service_moto_type

async def delete_service_moto_type(db: AsyncSession, service_mototype_id: int) -> None:
    """Xóa một loại dịch vụ"""
    try:
        db_service_moto_type = await get_service_moto_type_by_id(db, service_mototype_id)
        if not db_service_moto_type:
            raise HTTPException(status_code=404, detail="Service Moto Type not found")
        await db.delete(db_service_moto_type)
        await db.commit()
    except Exception as e:
        logger.error(f"Error deleting service moto type: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Internal Server Error")