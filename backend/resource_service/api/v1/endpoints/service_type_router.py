from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from sqlalchemy.exc import IntegrityError
from utils.logger import get_logger
from db.session import get_db
from schemas.service_type import ServiceTypeCreate, ServiceTypeResponse
from crud import service_type as service_type_crud
from .url import URLS

router = APIRouter()

logger = get_logger(__name__)

@router.get(URLS['SERVICE_TYPE']['GET_ALL_SERVICE_TYPES'], response_model=List[ServiceTypeResponse])
async def get_all_service_types(db: Session = Depends(get_db)) -> List[ServiceTypeResponse]:
    """
    Lấy danh sách tất cả các loại dịch vụ
    """
    service_types = await service_type_crud.get_all_service_types(db)
    return service_types

@router.get(URLS['SERVICE_TYPE']['GET_SERVICE_TYPE_BY_ID'], response_model=ServiceTypeResponse)
async def get_service_type_by_id(service_type_id: int, db: Session = Depends(get_db)) -> ServiceTypeResponse:
    """
    Lấy thông tin chi tiết của một loại dịch vụ theo ID
    """
    service_type = await service_type_crud.get_service_type_by_id(db, service_type_id=service_type_id)
    if not service_type:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy loại dịch vụ")
    return service_type