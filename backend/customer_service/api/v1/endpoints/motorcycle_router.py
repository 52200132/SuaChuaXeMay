from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from typing import List, Optional

from db.session import get_db
from crud import motorcycle_type as motorcycle_type_crud
from crud import motorcycle as motorcycle_crud
from schemas.motocycle_type import MotocycleTypeResponse
from schemas.motocycle import MotocycleResponse, MotocycleCreate, MotocycleUpdate
from utils.logger import get_logger
from .url import URLS

logger = get_logger(__name__)

router = APIRouter()


@router.get(URLS['MOTORCYCLE']['GET_ALL_MOTORCYCLE_BY_CUSTOMER_ID'], response_model=List[MotocycleResponse])
async def get_all_motorcycle_by_customer_id(
    customer_id : int,
    db: AsyncSession = Depends(get_db)):
    """Lấy danh sách tất cả xe máy theo mã khách hàng."""
    db_motorcycles = await motorcycle_crud.get_all_motorcycle_by_customer_id(db, customer_id)
    return db_motorcycles

@router.get(URLS['MOTORCYCLE']['GET_ALL_MOTORCYCLE_TYPES'], response_model=List[MotocycleTypeResponse])
async def get_all_motorcycle_types(db: AsyncSession = Depends(get_db)):
    """Lấy danh sách tất cả loại xe máy."""
    try:
        motorcycle_types = await motorcycle_type_crud.get_all_motorcycle_types(db)
        if not motorcycle_types:
            return []
        return [MotocycleTypeResponse.from_orm(motorcycle_type) for motorcycle_type in motorcycle_types]
    except Exception as e:
        logger.error(f"Lỗi khi lấy thông tin loại xe máy: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Lỗi hệ thống khi lấy danh sách loại xe máy"
        )
@router.get(URLS['MOTORCYCLE']['GET_ALL_MOTORCYCLES'], response_model=List[MotocycleResponse])
async def get_all_motorcycle(db: AsyncSession = Depends(get_db)):
    """Lấy danh sách tất cả xe máy."""
    try:
        motorcycles = await motorcycle_crud.get_all_motorcycles(db)
        if not motorcycles:
            return []
        return [MotocycleResponse.from_orm(motorcycle) for motorcycle in motorcycles]
    except Exception as e:
        logger.error(f"Lỗi khi lấy thông tin xe máy: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Lỗi hệ thống khi lấy danh sách xe máy"
        )
@router.get(URLS['MOTORCYCLE']['GET_MOTORCYCLE_BY_ID'], response_model=MotocycleResponse)
async def get_motorcycle_by_id(
    motorcycle_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Lấy thông tin xe máy theo ID."""
    motorcycle_type = await motorcycle_crud.get_motorcycle_by_id(db, motorcycle_id)
    if not motorcycle_type:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy xe máy")
    return MotocycleResponse.from_orm(motorcycle_type)

@router.post(URLS['MOTORCYCLE']['CREATE_MOTORCYCLE'], response_model=MotocycleResponse)
async def create_motorcycle(
    motorcycle: MotocycleCreate,
    db: AsyncSession = Depends(get_db)
):
    """Tạo một xe máy mới."""
    try:
        # Tạo xe máy mới
        new_motorcycle = await motorcycle_crud.create_motorcycle(db, motorcycle)
        return MotocycleResponse.from_orm(new_motorcycle)
    except Exception as e:
        # Lỗi không xác định
        logger.error(f"Lỗi không xác định khi tạo xe máy: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Lỗi hệ thống, vui lòng thử lại sau"
        )
# @router.put(URLS['MOTORCYCLE']['UPDATE_MOTORCYCLE'], response_model=MotocycleResponse)
# async def update_motorcycle(
#     motorcycle_id: int,
#     motorcycle_update: MotocycleUpdate,
#     db: AsyncSession = Depends(get_db)
# ):
#     """Cập nhật thông tin loại xe máy."""
#     try:
#         updated_motorcycle = await motorcycle_crud.update_motorcycle(db, motorcycle_id, motorcycle_update)
#         if not updated_motorcycle:
#             raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy xe máy")
#         return MotocycleResponse.from_orm(updated_motorcycle)
#     except IntegrityError as e:
#         logger.error(f"Lỗi khi cập nhật xe máy: {str(e)}")
#         raise HTTPException(
#             status_code=status.HTTP_409_CONFLICT,
#             detail=str(e)
#         )
#     except Exception as e:
#         logger.error(f"Lỗi khi cập nhật xe máy: {str(e)}")
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=str(e)
#         )