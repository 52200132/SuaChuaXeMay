from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from sqlalchemy.exc import IntegrityError
from utils.logger import get_logger
from db.session import get_db
from schemas.service_moto_type import ServiceMotoTypeCreate, ServiceMotoTypeUpdate, ServiceMotoTypeResponse
from crud import service_moto_type as service_moto_type_crud
from .url import URLS

router = APIRouter()

logger = get_logger(__name__)

@router.get(URLS['SERVICE_MOTO_TYPE']['GET_SERVICE_MOTO_TYPE_BY_ID'], response_model=ServiceMotoTypeResponse)
async def get_service_moto_type_by_id(service_mototype_id: int, db:AsyncSession = Depends(get_db)):
    """Lấy thông tin chi tiết của một loại dịch vụ"""
    db_service_moto_type = await service_moto_type_crud.get_service_moto_type_by_id(db, service_mototype_id=service_mototype_id)
    if not db_service_moto_type:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service Moto Type not found")
    return db_service_moto_type

@router.post(URLS['SERVICE_MOTO_TYPE']['CREATE_SERVICE_MOTO_TYPE'], response_model=ServiceMotoTypeResponse)
async def create_service_moto_type(service_moto_type: ServiceMotoTypeCreate, db:AsyncSession = Depends(get_db)):
    """
    Tạo một loại dịch vụ mới trong cơ sở dữ liệu.
    """
    try:
        db_service_moto_type = await service_moto_type_crud.create_service_moto_type(db=db, service_moto_type=service_moto_type)
        return db_service_moto_type
    except IntegrityError:
        await db.rollback()
        logger.error("IntegrityError: Service Moto Type already exists")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Service Moto Type already exists")
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating service moto type: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")
    
@router.get(URLS['SERVICE_MOTO_TYPE']['GET_SERVICE_MOTO_TYPE_BY_SERVICE_ID_AND_MOTOTYPE_ID'], response_model=ServiceMotoTypeResponse)
async def get_service_moto_type_by_service_id_and_mototype_id(service_id: int, moto_type_id: int, db:AsyncSession = Depends(get_db)):
    """
    Lấy thông tin loại dịch vụ theo ID dịch vụ và ID loại xe máy.
    """
    try:
        db_service_moto_type = await service_moto_type_crud.get_service_moto_type_by_service_id_and_mototype_id(db=db, service_id=service_id, moto_type_id=moto_type_id)
        if not db_service_moto_type:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service Moto Type not found")
        return db_service_moto_type
    except Exception as e:
        logger.error(f"Error getting service moto type: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")

@router.get(URLS['SERVICE_MOTO_TYPE']['GET_ALL_SERVICE_MOTO_TYPES'], response_model=List[ServiceMotoTypeResponse])
async def get_all_service_moto_types(skip: int = 0, limit: int = 100, db:AsyncSession = Depends(get_db)):
    """Lấy danh sách tất cả các loại dịch vụ"""
    db_service_moto_type = await service_moto_type_crud.get_all_service_moto_types(db, skip=skip, limit=limit)
    return db_service_moto_type

@router.get(URLS['SERVICE_MOTO_TYPE']['GET_ALL_SERVICE_MOTO_TYPES_BY_MOTOTYPE_ID'], response_model=List[ServiceMotoTypeResponse])
async def get_all_service_moto_types_by_mototype_id(moto_type_id: int, skip: int = 0, limit: int = 100, db:AsyncSession = Depends(get_db)):
    """Lấy danh sách tất cả các loại dịch vụ theo ID loại xe máy"""
    db_service_moto_type = await service_moto_type_crud.get_all_service_moto_types_by_mototype_id(db, moto_type_id=moto_type_id, skip=skip, limit=limit)
    return db_service_moto_type

@router.put(URLS['SERVICE_MOTO_TYPE']['UPDATE_SERVICE_MOTO_TYPE'], response_model=ServiceMotoTypeResponse)
async def update_service_moto_type(service_mototype_id: int, service_moto_type: ServiceMotoTypeUpdate, db:AsyncSession = Depends(get_db)):
    """Cập nhật thông tin của một loại dịch vụ"""
    try:
        db_service_moto_type = await service_moto_type_crud.update_service_moto_type(db, service_mototype_id=service_mototype_id, service_moto_type=service_moto_type)
        if not db_service_moto_type:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service Moto Type not found")
        return db_service_moto_type
    except Exception as e:
        logger.error(f"Error updating service moto type: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")

@router.put(URLS['SERVICE_MOTO_TYPE']['UPDATE_SERVICE_MOTO_TYPE_BY_SERVICE_ID_AND_MOTOTYPE_ID'], response_model=ServiceMotoTypeResponse)
async def update_service_moto_type_by_service_id_and_mototype_id(service_id: int, moto_type_id: int, service_moto_type: ServiceMotoTypeUpdate, db:AsyncSession = Depends(get_db)):
    """Cập nhật thông tin của một loại dịch vụ"""
    try:
        db_service_moto_type = await service_moto_type_crud.update_service_moto_type_by_service_id_and_mototype_id(db, service_id=service_id, moto_type_id=moto_type_id, service_moto_type=service_moto_type)
        if not db_service_moto_type:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service Moto Type not found")
        return db_service_moto_type
    except Exception as e:
        logger.error(f"Error updating service moto type: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")
    
@router.delete(URLS['SERVICE_MOTO_TYPE']['DELETE_SERVICE_MOTO_TYPE'], status_code=status.HTTP_200_OK)
async def delete_service_moto_type(service_mototype_id: int, db:AsyncSession = Depends(get_db)):
    """Xóa một loại dịch vụ"""
    try:
        # Gọi hàm CRUD để xóa Service Moto Type
        await service_moto_type_crud.delete_service_moto_type(db, service_mototype_id=service_mototype_id)
        return {"detail": f"Service Moto Type with ID {service_mototype_id} deleted successfully."}
    except HTTPException as e:
        # Nếu Service Moto Type không tồn tại
        logger.error(f"Error while deleting service moto type: {e.detail}")
        raise e
    except Exception as e:
        # Lỗi không xác định
        logger.error(f"Error while deleting service moto type: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")