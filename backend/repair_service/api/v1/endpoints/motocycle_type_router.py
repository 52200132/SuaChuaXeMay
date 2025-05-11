from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from api.v1.endpoints.url import URLS
from db.session import get_db
from schemas.motocycle_type import MotocycleTypeCreate, MotocycleTypeResponse, MotocycleTypeUpdate
from crud import motocycle_type as crud
from utils.logger import get_logger

log = get_logger(__name__)

router = APIRouter()

@router.get(URLS["MOTOCYCLE_TYPE"]["GET_ALL_MOTOCYCLE_TYPES"], response_model=List[MotocycleTypeResponse])
async def get_all_motocycle_types(db: AsyncSession = Depends(get_db)):
    """
    Lấy danh sách tất cả các loại xe máy.
    """
    try:
        return await crud.get_all(db)
    except IntegrityError as e:
        log.error(f"Lỗi toàn vẹn dữ liệu khi lấy danh sách loại xe máy: {e}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Lỗi toàn vẹn dữ liệu khi lấy danh sách loại xe máy: {str(e)}"
        )
    except Exception as e:
        log.error(f"Lỗi khi lấy danh sách loại xe máy: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi lấy danh sách loại xe máy: {str(e)}"
        )

@router.get(URLS["MOTOCYCLE_TYPE"]["GET_ALL_BRANDS"], response_model=List[str])
async def get_all_brands(db: AsyncSession = Depends(get_db)):
    """
    Lấy danh sách tất cả các thương hiệu xe máy.
    """
    try:
        return await crud.get_brands(db)
    except IntegrityError as e:
        log.error(f"Lỗi toàn vẹn dữ liệu khi lấy danh sách thương hiệu xe máy: {e}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Lỗi toàn vẹn dữ liệu khi lấy danh sách thương hiệu xe máy: {str(e)}"
        )
    except Exception as e:
        log.error(f"Lỗi khi lấy danh sách thương hiệu xe máy: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi lấy danh sách thương hiệu xe máy: {str(e)}"
        )

@router.get(URLS["MOTOCYCLE_TYPE"]["GET_MOTOCYCLE_TYPES_BY_BRAND"], response_model=List[MotocycleTypeResponse])
async def get_motocycle_types_by_brand_route(brand: str, db: AsyncSession = Depends(get_db)):
    """
    Lấy danh sách các loại xe máy theo thương hiệu.
    """
    try:
        return await crud.get_motocycle_types_by_brand(db, brand)
    except IntegrityError as e:
        log.error(f"Lỗi toàn vẹn dữ liệu khi lấy danh sách loại xe máy theo thương hiệu: {e}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Lỗi toàn vẹn dữ liệu khi lấy danh sách loại xe máy theo thương hiệu: {str(e)}"
        )
    except Exception as e:
        log.error(f"Lỗi khi lấy danh sách loại xe máy theo thương hiệu: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi lấy danh sách loại xe máy theo thương hiệu: {str(e)}"
        )

@router.post(URLS["MOTOCYCLE_TYPE"]["CREATE_MOTOCYCLE_TYPE"], response_model=MotocycleTypeResponse, status_code=status.HTTP_201_CREATED)
async def create_motocycle_type_route(moto_type: MotocycleTypeCreate, db: AsyncSession = Depends(get_db)):
    """
    Tạo mới một loại xe máy.
    """
    try:
        return await crud.create_motocycle_type(db, moto_type)
    except IntegrityError as e:
        log.error(f"Lỗi toàn vẹn dữ liệu khi tạo mới loại xe máy: {e}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Lỗi toàn vẹn dữ liệu khi tạo mới loại xe máy: {str(e)}"
        )
    except Exception as e:
        log.error(f"Lỗi khi tạo mới loại xe máy: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi tạo mới loại xe máy: {str(e)}"
        )

@router.put(URLS["MOTOCYCLE_TYPE"]["UPDATE_MOTOCYCLE_TYPE"], response_model=MotocycleTypeResponse)
async def update_motocycle_type_route(moto_type_id: int, moto_type: MotocycleTypeUpdate, db: AsyncSession = Depends(get_db)):
    """
    Cập nhật thông tin loại xe máy.
    """
    try:
        db_moto_type = await crud.update_motocycle_type(db, moto_type_id, moto_type)
        if not db_moto_type:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Không tìm thấy loại xe máy với ID: {moto_type_id}"
            )
        return db_moto_type
    except IntegrityError as e:
        log.error(f"Lỗi toàn vẹn dữ liệu khi cập nhật thông tin loại xe máy: {e}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Lỗi toàn vẹn dữ liệu khi cập nhật thông tin loại xe máy: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Lỗi khi cập nhật thông tin loại xe máy: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi cập nhật thông tin loại xe máy: {str(e)}"
        )

@router.delete(URLS["MOTOCYCLE_TYPE"]["DELETE_MOTOCYCLE_TYPE"], status_code=status.HTTP_204_NO_CONTENT)
async def delete_motocycle_type_route(moto_type_id: int, db: AsyncSession = Depends(get_db)):
    """
    Xóa một loại xe máy.
    """
    try:
        success = await crud.delete_motocycle_type(db, moto_type_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Không tìm thấy loại xe máy với ID: {moto_type_id}"
            )
    except IntegrityError as e:
        log.error(f"Lỗi toàn vẹn dữ liệu khi xóa loại xe máy: {e}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Lỗi toàn vẹn dữ liệu khi xóa loại xe máy: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Lỗi khi xóa loại xe máy: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi xóa loại xe máy: {str(e)}"
        )
