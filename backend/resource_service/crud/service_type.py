from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from pydantic import ValidationInfo

from models.models import ServiceType
from schemas.service_type import ServiceTypeResponse
from utils.logger import get_logger

logger = get_logger(__name__)

async def get_all_service(db: AsyncSession) -> list[ServiceTypeResponse]:
    """Lấy tất cả ServiceType từ cơ sở dữ liệu."""
    try:
        query = select(ServiceType)
        result = await db.execute(query)
        service = result.scalars().all()
        service = [ServiceTypeResponse.from_orm(service_type) for service_type in service]
        logger.info(f"Fetched {len(service)} service types from the database.")
        return service
    except IntegrityError as e:
        logger.error(f"Integrity error while fetching all service types: {e}")
        raise IntegrityError(f"Integrity Error: {e}")
    except Exception as e:
        logger.error(f"Error while fetching all service types: {e}")
        # raise HTTPException(f"Internal Server Error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {e}")

async def get_service_type_by_id(db: AsyncSession, service_type_id: int) -> ServiceTypeResponse:
    """Lấy ServiceType từ cơ sở dữ liệu bằng id được cung cấp."""
    try:
        query = select(ServiceType).where(ServiceType.service_type_id == service_type_id)
        result = await db.execute(query)
        service_type = result.scalar_one_or_none()
        if service_type is None:
            raise HTTPException(status_code=404, detail="Service type not found")
        logger.info(f"Fetched service type with ID {service_type_id} from the database.")
        return ServiceTypeResponse.from_orm(service_type)
    except IntegrityError as e:
        logger.error(f"Integrity error while fetching service type by ID {service_type_id}: {e}")
        raise IntegrityError(f"Integrity Error: {e}")
    except Exception as e:
        logger.error(f"Error while fetching service type by ID {service_type_id}: {e}")
        # raise HTTPException(f"Internal Server Error: {e}")
        raise HTTPException(status_code=500, detail=f"{e}")