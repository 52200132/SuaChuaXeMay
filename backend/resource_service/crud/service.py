from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException

from schemas.service import ServiceCreate, ServiceResponse
from models.models import Service
from utils.logger import get_logger

logger = get_logger(__name__)

async def get_services_by_service_type_id(db: AsyncSession, service_type_id) -> list[Service]:
    """Lấy tất cả Service theo loại từ cơ sở dữ liệu bằng id được cung cấp."""
    try:
        query = select(Service).where(Service.service_type_id == service_type_id)
        result = await db.execute(query)
        services = result.scalars().all()
        logger.info(f"Fetched {len(services)} services from the database for service type ID {service_type_id}.")
        services = [ServiceResponse.from_orm(service) for service in services]
        return services
    except IntegrityError as e:
        logger.error(f"Integrity error while fetching services by service type ID {service_type_id}: {e}")
        raise IntegrityError(f"Integrity Error: {e}")
    except Exception as e:
        logger.error(f"Error while fetching services by service type ID {service_type_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {e}")