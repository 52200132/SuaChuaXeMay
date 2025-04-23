from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from db.session import get_db
from crud import service_type, service
from schemas.service_type import ServiceTypeResponse, ServiceTypeCreate
from utils.logger import get_logger
from .url import URLS

logger = get_logger(__name__)

router = APIRouter(tags=["Service Types"])
# router = APIRouter()

@router.get(URLS['SERVICE']['GET_ALL_SERVICES'], response_model=list[ServiceTypeResponse])
async def get_all_service_types(db: AsyncSession = Depends(get_db)) -> list[ServiceTypeResponse]:
    """
        Lấy tất cả ServiceType từ cơ sở dữ liệu.
    """
    try:
        service_types = await service_type.get_all_service_type(db)
        return service_types
    except IntegrityError as e:
        logger.error(f"Integrity error while fetching all service types: {e}")
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Integrity Error")
    except Exception as e:
        logger.error(f"Error while fetching all service types: {e}")
        raise HTTPException(status_code=500, detail=f"{e}")

@router.get(URLS['SERVICE']['GET_SERVICES_BY_SERVICE_TYPE_ID'])
async def get_services_by_service_type(service_type_id: int, db: AsyncSession = Depends(get_db)) -> list[ServiceTypeResponse]:
    """
        Lấy tất cả Service theo loại từ cơ sở dữ liệu bằng id được cung cấp.
    """
    try:
        service_types = await service.get_services_by_service_type_id(db, service_type_id=service_type_id)
        return service_types
    except IntegrityError as e:
        logger.error(f"Integrity error while fetching all service types: {e}")
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Integrity Error")
    except Exception as e:
        logger.error(f"Error while fetching all service types: {e}")
        raise HTTPException(status_code=500, detail=f"{e}")

@router.post("/create", response_model=ServiceTypeResponse, status_code=status.HTTP_201_CREATED)
async def create_service_type(service_type_in: ServiceTypeCreate, db: AsyncSession = Depends(get_db)) -> ServiceTypeResponse:
    """
    Tạo một ServiceType mới.
    """
    try:
        new_service_type = await service_type.create_service_type(db=db, service_type=service_type_in)
        return new_service_type
    except IntegrityError as e:
        logger.error(f"Integrity error while creating service type: {e}")
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Service type already exists or violates constraints.")
    except Exception as e:
        logger.error(f"Error while creating service type: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not create service type.")

@router.get(URLS['SERVICE']['GET_SERVICES_BY_SERVICE_TYPE_ID'], response_model=ServiceTypeResponse)
async def get_service_type_by_id(service_type_id: int, db: AsyncSession = Depends(get_db)) -> ServiceTypeResponse:
    """
        Lấy ServiceType theo id từ cơ sở dữ liệu.
    """
    try:
        result = await service_type.get_service_type_by_id(db, service_type_id)
        if not result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service type not found.")
        return result
    except IntegrityError as e:
        logger.error(f"Integrity error while fetching service type by ID {service_type_id}: {e}")
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Integrity Error")
    except Exception as e:
        logger.error(f"Error while fetching service type by ID {service_type_id}: {e}")
        raise HTTPException(status_code=500, detail=f"{e}")