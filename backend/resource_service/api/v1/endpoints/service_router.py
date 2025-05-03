from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from db.session import get_db
from crud import service as service_crud
from schemas.service import ServiceResponse, ServiceCreate, ServiceUpdate
from utils.logger import get_logger
from .url import URLS

logger = get_logger(__name__)

router = APIRouter(tags=["Service"])
# router = APIRouter()

from typing import List

@router.get(URLS['SERVICE']['GET_ALL_SERVICES'], response_model=List[ServiceResponse])
async def get_all_services(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    """API lấy tất cả Service từ cơ sở dữ liệu."""
    services = await service_crud.get_all_services(db, skip=skip, limit=limit)
    return services


@router.get(URLS['SERVICE']['GET_SERVICES_BY_SERVICE_TYPE_ID'])
async def get_services_by_service_type(service_type_id: int, db: AsyncSession = Depends(get_db)) -> list[ServiceResponse]:
    """
        Lấy tất cả Service theo loại từ cơ sở dữ liệu bằng id được cung cấp.
    """
    try:
        service = await service_crud.get_services_by_service_type_id(db, service_type_id=service_type_id)
        return service
    except Exception as e:
        logger.error(f"Error while fetching all service types: {e}")
        raise HTTPException(status_code=500, detail=f"{e}")

@router.post(URLS['SERVICE']['CREATE_SERVICE'], response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
async def create_service(service: ServiceCreate, db: AsyncSession = Depends(get_db)):
    """
    Tạo một Service mới.
    """
    try:
        new_service = await service_crud.create_service(db=db, service=service)
        return new_service
    except IntegrityError as e:
        logger.error(f"Integrity error while creating service type: {e}")
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Service type already exists or violates constraints.")
    except Exception as e:
        logger.error(f"Error while creating service type: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not create service type.")

@router.put(URLS['SERVICE']['UPDATE_SERVICE'], response_model=ServiceResponse)
async def update_service(service_id: int, service: ServiceUpdate, db: AsyncSession = Depends(get_db)):
    """
    Cập nhật một Service theo ID.
    """
    try:
        updated_service = await service_crud.update_service(db=db, service_id=service_id, service=service)
        return updated_service
    except IntegrityError as e:
        logger.error(f"Integrity error while updating service type: {e}")
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Service type already exists or violates constraints.")
    except Exception as e:
        logger.error(f"Error while updating service type: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not update service type.")
    
# @router.delete(URLS['SERVICE']['DELETE_SERVICE'], status_code=status.HTTP_200_OK)
# async def delete_service(service_id: int, db: AsyncSession = Depends(get_db)):
#     """
#     Xóa một Service theo ID.
#     """
#     try:
#         # Gọi hàm CRUD để xóa Service
#         await service_crud.delete_service(db=db, service_id=service_id)
#         return {"detail": f"Service with ID {service_id} deleted successfully."}
#     except HTTPException as e:
#         # Nếu Service không tồn tại
#         logger.error(f"Error while deleting service: {e.detail}")
#         raise e
#     except Exception as e:
#         # Lỗi không xác định
#         logger.error(f"Error while deleting service: {str(e)}")
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Could not delete service due to an internal error."
#         )