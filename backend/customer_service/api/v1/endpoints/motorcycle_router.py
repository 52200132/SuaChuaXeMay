from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from typing import List, Optional

from db.session import get_db
from crud import motorcycle_type as motorcycle_type_crud
from crud import motorcycle as motorcycle_crud
from schemas.motocycle_type import MotocycleTypeResponse
from schemas.motocycle import MotocycleResponse
from utils.logger import get_logger
from .url import URLS

logger = get_logger(__name__)

router = APIRouter()

@router.get(URLS['MOTORCYCLE']['GET_ALL_MOTORCYCLE_TYPES'], response_model=List[MotocycleTypeResponse])
async def get_all_motorcycle_types(db: AsyncSession = Depends(get_db)):
    """Lấy danh sách tất cả các loại xe máy."""
    try:
        # Giả sử bạn có một hàm trong crud để lấy danh sách loại xe máy
        motorcycle_types = await motorcycle_type_crud.get_all_motorcycle_types(db)
        return [MotocycleTypeResponse.from_orm(moto_type) for moto_type in motorcycle_types]
    except Exception as e:
        logger.error(f"Lỗi khi lấy danh sách loại xe máy: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Lỗi hệ thống"
        )

@router.get(URLS['MOTORCYCLE']['GET_MOTORCYCLE_BY_ID'], response_model=MotocycleResponse)
async def get_motorcycle_by_id(
    motorcycle_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Lấy thông tin loại xe máy theo ID."""
    try:
        motorcycle_type = await motorcycle_crud.get_motorcycle_by_id(db, motorcycle_id)
        if not motorcycle_type:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy loại xe máy")
        return MotocycleResponse.from_orm(motorcycle_type)
    except IntegrityError as e:
        logger.error(f"Lỗi khi lấy thông tin xe máy: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Lỗi khi lấy thông tin xe máy: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )