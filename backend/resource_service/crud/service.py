from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException

from schemas.service import ServiceCreate, ServiceResponse
from models.models import Service
from utils.logger import get_logger

logger = get_logger(__name__)

async def get_all_services(db: AsyncSession, skip: int = 0, limit: int = 100) -> list[Service]:
    """Lấy tất cả Service từ cơ sở dữ liệu."""
    result = await db.execute(select(Service).order_by(Service.service_id.asc()).offset(skip).limit(limit))
    return result.scalars().all()

async def get_services_by_service_type_id(db: AsyncSession, service_type_id) -> list[Service]:
    """Lấy tất cả Service theo loại từ cơ sở dữ liệu bằng id được cung cấp."""
    try:
        query = select(Service).where(Service.service_type_id == service_type_id)
        result = await db.execute(query)
        services = result.scalars().all()
        logger.info(f"Fetched {len(services)} services from the database for service type ID {service_type_id}.")
        return services
    except Exception as e:
        logger.error(f"Error while fetching services by service type ID {service_type_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {e}")
    
async def create_service(db: AsyncSession, service: ServiceCreate) -> ServiceResponse:
    """Tạo một Service mới."""
    try:
        new_service = Service(**service.dict())
        db.add(new_service)
        await db.commit()
        await db.refresh(new_service)
        logger.info(f"Created new service with ID {new_service.service_id}.")
        return ServiceResponse.from_orm(new_service)
    except IntegrityError as e:
        logger.error(f"Integrity error while creating service: {e}")
        raise HTTPException(status_code=409, detail="Service already exists or violates constraints.")
    except Exception as e:
        logger.error(f"Error while creating service: {e}")
        raise HTTPException(status_code=500, detail="Could not create service.")
    
async def update_service(db: AsyncSession, service_id: int, service: ServiceCreate) -> Service:
    """Cập nhật một Service theo ID."""

    query = select(Service).where(Service.service_id == service_id)
    result = await db.execute(query)
    existing_service = result.scalar_one_or_none()
    if existing_service is None:
        raise HTTPException(status_code=404, detail="Service not found")
    
    for key, value in service.dict(exclude_unset=True).items():
        setattr(existing_service, key, value)
    await db.commit()
    await db.refresh(existing_service)
    logger.info(f"Updated service with ID {service_id}.")
    return existing_service

async def delete_service(db: AsyncSession, service_id: int) -> None:
    """Xóa một Service theo ID."""
    query = select(Service).where(Service.service_id == service_id)
    result = await db.execute(query)
    existing_service = result.scalar_one_or_none()
    
    if existing_service is None:
        logger.error(f"Service with ID {service_id} not found.")
        raise HTTPException(status_code=404, detail="Service not found")
    
    await db.delete(existing_service)
    await db.commit()
    logger.info(f"Deleted service with ID {service_id}.")