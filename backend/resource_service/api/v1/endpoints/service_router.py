from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from db.session import get_db
from crud import service as service_crud
from schemas.service import ServiceResponse, ServiceCreate, ServiceResponse
from utils.logger import get_logger
from .url import URLS

logger = get_logger(__name__)

router = APIRouter(tags=["Service"])
# router = APIRouter()

@router.get(URLS['SERVICE']['GET_ALL_SERVICES'], response_model=list[ServiceResponse])
async def get_all_services(db: AsyncSession, skip: int = 0, limit: int = 100) -> list[ServiceResponse]:
    """Lấy tất cả Service từ cơ sở dữ liệu."""

    db_service = await service_crud.get_all_services(db, skip=skip, limit=limit)
    return db_service


@router.get(URLS['SERVICE']['GET_SERVICES_BY_SERVICE_TYPE_ID'])
async def get_services_by_service_type(service_type_id: int, db: AsyncSession = Depends(get_db)) -> list[ServiceResponse]:
    """
        Lấy tất cả Service theo loại từ cơ sở dữ liệu bằng id được cung cấp.
    """
    try:
        service = await service.get_services_by_service_type_id(db, service_type_id=service_type_id)
        return service
    except IntegrityError as e:
        logger.error(f"Integrity error while fetching all service types: {e}")
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Integrity Error")
    except Exception as e:
        logger.error(f"Error while fetching all service types: {e}")
        raise HTTPException(status_code=500, detail=f"{e}")

@router.post("/create", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
async def create_service_type(service_type_in: ServiceCreate, db: AsyncSession = Depends(get_db)) -> ServiceResponse:
    """
    Tạo một Service mới.
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

@router.get(URLS['SERVICE']['GET_SERVICES_BY_SERVICE_TYPE_ID'], response_model=ServiceResponse)
async def get_service_type_by_id(service_type_id: int, db: AsyncSession = Depends(get_db)) -> ServiceResponse:
    """
        Lấy Service theo id từ cơ sở dữ liệu.
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