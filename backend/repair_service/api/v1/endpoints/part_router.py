from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from api.v1.endpoints.url import URLS
from db.session import get_db
from crud import part as crud
from services import part_services
from utils.logger import get_logger
from schemas.part import PartCreate, PartUpdate, PartResponse, BulkPartLotCreate, BulkPartLotResponse
from schemas.views.part import PartView, PartWarehouseView

log = get_logger(__name__)

router = APIRouter()

@router.post(URLS['PART']['CREATE_PART'], response_model=PartResponse)
async def create_part(part: PartCreate, db: AsyncSession = Depends(get_db)):
    """Tạo mới một phụ tùng xe máy"""
    try:
        return await crud.create_part(db, part)
    except IntegrityError as e:
        log.error(f"Lỗi toàn vẹn dữ liệu khi tạo phụ tùng: {e}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Lỗi toàn vẹn dữ liệu khi tạo phụ tùng: {str(e)}"
        )
    except Exception as e:
        log.error(f"Lỗi khi tạo phụ tùng: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi tạo phụ tùng: {str(e)}"
        )

@router.get(URLS['PART']['GET_ALL_PARTS'], response_model=List[PartResponse])
async def get_all_parts(db: AsyncSession = Depends(get_db)):
    """Lấy danh sách tất cả phụ tùng xe máy"""
    try:
        return await crud.get_all(db)
    except IntegrityError as e:
        log.error(f"Lỗi toàn vẹn dữ liệu khi lấy danh sách phụ tùng: {e}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Lỗi toàn vẹn dữ liệu khi lấy danh sách phụ tùng: {str(e)}"
        )
    except Exception as e:
        log.error(f"Lỗi khi lấy danh sách phụ tùng: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi lấy danh sách phụ tùng: {str(e)}"
        )

@router.get(URLS['PART']['GET_PART_BY_ID'], response_model=PartResponse)
async def get_part_by_id(part_id: int, db: AsyncSession = Depends(get_db)):
    """Lấy thông tin phụ tùng theo ID"""
    try:
        part = await crud.get_part_by_id(db, part_id)
        if not part:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Không tìm thấy phụ tùng với ID: {part_id}"
            )
        return part
    except IntegrityError as e:
        log.error(f"Lỗi toàn vẹn dữ liệu khi lấy phụ tùng: {e}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Lỗi toàn vẹn dữ liệu khi lấy phụ tùng: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Lỗi khi lấy phụ tùng: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi lấy phụ tùng: {str(e)}"
        )

@router.get(URLS['PART']['GET_PARTS_VIEWS_BY_MOTO_TYPE_ID'], response_model=List[PartView])
async def get_parts_views_by_moto_type(moto_type_id: int, db: AsyncSession = Depends(get_db)):
    """Lấy danh sách phụ tùng theo loại xe máy"""
    try:
        return await part_services.get_part_views_by_moto_type_id(db, moto_type_id)
    except IntegrityError as e:
        log.error(f"Lỗi toàn vẹn dữ liệu khi lấy danh sách phụ tùng theo loại xe: {e}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Lỗi toàn vẹn dữ liệu khi lấy danh sách phụ tùng theo loại xe: {str(e)}"
        )
    except Exception as e:
        log.error(f"Lỗi khi lấy danh sách phụ tùng theo loại xe: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi lấy danh sách phụ tùng theo loại xe: {str(e)}"
        )

@router.get(URLS['PART']['GET_PARTS_VIEWS_BY_ORDER_ID'], response_model=List[PartWarehouseView])
async def get_parts_views_by_order_id(order_id: int, db: AsyncSession = Depends(get_db)):
    """Lấy danh sách phụ tùng trong kho theo ID đơn hàng"""
    try:
        return await part_services.get_part_views_by_order_id(db, order_id)
    except IntegrityError as e:
        log.error(f"Lỗi toàn vẹn dữ liệu khi lấy danh sách phụ tùng theo đơn hàng: {e}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Lỗi toàn vẹn dữ liệu khi lấy danh sách phụ tùng theo đơn hàng: {str(e)}"
        )
    except Exception as e:
        log.error(f"Lỗi khi lấy danh sách phụ tùng theo đơn hàng: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi lấy danh sách phụ tùng theo đơn hàng: {str(e)}"
        )

@router.post(URLS['PART']['GET_PARTS_VIEWS_BY_PART_ID_LIST'], response_model=List[PartWarehouseView])
async def get_parts_views_by_part_id_list(part_id_list: List[int], db: AsyncSession = Depends(get_db)):
    """Lấy danh sách phụ tùng trong kho theo danh sách ID phụ tùng"""
    try:
        return await part_services.get_part_warehouse_views_by_part_id_list(db, part_id_list)
    except IntegrityError as e:
        log.error(f"Lỗi toàn vẹn dữ liệu khi lấy danh sách phụ tùng theo danh sách ID: {e}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Lỗi toàn vẹn dữ liệu khi lấy danh sách phụ tùng theo danh sách ID: {str(e)}"
        )
    except Exception as e:
        log.error(f"Lỗi khi lấy danh sách phụ tùng theo danh sách ID: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi lấy danh sách phụ tùng theo danh sách ID: {str(e)}"
        )

@router.put(URLS['PART']['UPDATE_PART'], response_model=PartResponse)
async def update_part(part_id: int, part: PartUpdate, db: AsyncSession = Depends(get_db)):
    """Cập nhật thông tin phụ tùng"""
    try:
        db_part = await crud.update_part(db, part_id, part)
        if not db_part:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Không tìm thấy phụ tùng với ID: {part_id}"
            )
        return db_part
    except IntegrityError as e:
        log.error(f"Lỗi toàn vẹn dữ liệu khi cập nhật phụ tùng: {e}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Lỗi toàn vẹn dữ liệu khi cập nhật phụ tùng: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Lỗi khi cập nhật phụ tùng: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi cập nhật phụ tùng: {str(e)}"
        )

@router.post(URLS['PART']['BULK_RECEIVE_PARTS'], response_model=BulkPartLotResponse)
async def bulk_receive_parts(data: BulkPartLotCreate, db: AsyncSession = Depends(get_db)):
    """Nhập kho hàng loạt nhiều phụ tùng cùng lúc"""
    try:
        result = await crud.bulk_receive_parts(db, data)
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["message"]
            )
        return result
    except IntegrityError as e:
        log.error(f"Lỗi toàn vẹn dữ liệu khi nhập kho hàng loạt: {e}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Lỗi toàn vẹn dữ liệu khi nhập kho hàng loạt: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Lỗi khi nhập kho hàng loạt: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi nhập kho hàng loạt: {str(e)}"
        )

