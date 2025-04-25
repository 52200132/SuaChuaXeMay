from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from sqlalchemy.exc import IntegrityError
from utils.logger import get_logger
from db.session import get_db
from schemas.part_order_detail import PartOrderDetailCreate, PartOrderDetailUpdate, PartOrderDetailResponse
from crud import part_order_detail as crud
from .url import URLS

router = APIRouter()

logger = get_logger(__name__)

@router.get(URLS['PART_ORDER_DETAIL']['GET_ALL_PART_ORDER_DETAILS'], response_model=List[PartOrderDetailResponse])
async def get_all_part_order_details(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    db_part_order_details = await crud.get_all_part_order_details(db, skip=skip, limit=limit)
    return db_part_order_details

@router.get(URLS['PART_ORDER_DETAIL']['GET_ALL_PART_ORDER_DETAILS_BY_ORDER'], response_model=List[PartOrderDetailResponse])
async def get_all_part_order_details_by_order(order_id: int, db: AsyncSession = Depends(get_db)):
    db_part_order_details = await crud.get_all_part_order_details_by_order_id(db, order_id=order_id)
    return db_part_order_details

@router.get(URLS['PART_ORDER_DETAIL']['GET_PART_ORDER_DETAIL_BY_ID'], response_model=PartOrderDetailResponse)
async def get_part_order_detail_by_id(part_detail_ID: int, db: AsyncSession = Depends(get_db)):
    db_part_detail = await crud.get_part_order_detail_by_id(db, part_detail_ID=part_detail_ID)
    if db_part_detail is None:
        raise HTTPException(status_code=404, detail="Không tim thấy chi tiết đơn hàng phụ tùng")
    return PartOrderDetailResponse.from_orm(db_part_detail)

@router.post(URLS['PART_ORDER_DETAIL']['CREATE_PART_ORDER_DETAILS'], response_model=List[PartOrderDetailResponse], status_code=status.HTTP_201_CREATED)
async def create_part_order_detail(part_detail: List[PartOrderDetailCreate], db: AsyncSession = Depends(get_db)):
    try:
        db_part_detail = await crud.create_part_order_details(db=db, part_detail=part_detail)
        return [PartOrderDetailResponse.from_orm(part) for part in db_part_detail]
    except IntegrityError as e:
        await db.rollback()
        logger.error(f"Lỗi toàn vẹn dữ liệu khi tạo chi tiết phụ tùng đơn hàng: {str(e)} | Dữ liệu: {part_detail.dict()}")
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Lỗi toàn vẹn dữ liệu: {str(e)}")

    except Exception as e:
        await db.rollback()
        logger.error(f"Lỗi không xác định khi tạo chi tiết phụ tùng đơn hàng: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Lỗi không xác định")

@router.put(URLS['PART_ORDER_DETAIL']['UPDATE_PART_ORDER_DETAIL'], response_model=PartOrderDetailResponse)
async def update_part_order_detail(part_detail_ID: int, part_detail: PartOrderDetailUpdate, db: AsyncSession = Depends(get_db)):
    try:
        db_part_detail = await crud.update_part_order_detail(db, part_detail_ID=part_detail_ID, part_detail=part_detail)
        return db_part_detail
    except IntegrityError as e:
        await db.rollback()
        logger.error(f"Lỗi khi cập nhật phụ tùng đơn hàng: {str(e)}")
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Thông tin không hợp lệ")
    except Exception as e:
        logger.error(f"Lỗi khi cập nhật phụ tùng đơn hàng: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# @router.delete("/{part_detail_id}", status_code=status.HTTP_204_NO_CONTENT)
# def delete_part_order_detail(part_detail_id: int, db: AsyncSession = Depends(get_db)):
#     result = crud.delete_part_order_detail(db, part_detail_id=part_detail_id)
#     if not result:
#         raise HTTPException(status_code=404, detail="Part order detail not found")
#     return None