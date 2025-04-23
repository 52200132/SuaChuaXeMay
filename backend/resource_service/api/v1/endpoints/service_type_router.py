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
        