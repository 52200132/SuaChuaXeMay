from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from sqlalchemy.exc import IntegrityError
from utils.logger import get_logger
from db.session import get_db
from schemas.service_order_detail import ServiceOrderDetailCreate, ServiceOrderDetailUpdate, ServiceOrderDetailResponse
from crud import service_order_detail as crud
from .url import URLS

router = APIRouter()

logger = get_logger(__name__)

@router.get(URLS['SERVICE_ORDER_DETAIL']['GET_ALL_SERVICE_ORDER_DETAILS'], response_model=List[ServiceOrderDetailResponse])
async def get_all_service_order_details(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    db_service_detail = await crud.get_all_service_order_details(db, skip=skip, limit=limit)
    return db_service_detail

@router.get(URLS['SERVICE_ORDER_DETAIL']['GET_SERVICE_ORDER_DETAIL_BY_ID'], response_model=ServiceOrderDetailResponse)
async def get_service_order_detail_by_id(service_detail_ID: int, db: Session = Depends(get_db)):
    db_service_detail = await crud.get_service_order_detail_by_id(db, service_detail_ID=service_detail_ID)
    if db_service_detail is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy chi tiết dịch vụ đơn hàng")
    return db_service_detail

@router.get(URLS['SERVICE_ORDER_DETAIL']['GET_SERVICE_ORDER_DETAILS_BY_ORDER'], response_model=List[ServiceOrderDetailResponse])
async def get_all_service_details_by_order(order_id: int, db: Session = Depends(get_db)):
    db_service_detail = await crud.get_all_service_details_by_order_id(db, order_id=order_id)
    return db_service_detail

@router.post(URLS['SERVICE_ORDER_DETAIL']['CREATE_SERVICE_ORDER_DETAIL'], response_model=ServiceOrderDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_service_order_detail(service_detail: ServiceOrderDetailCreate, db: Session = Depends(get_db)):
    """Create a new service order detail"""
    try:
        db_service_detail = await crud.create_service_order_detail(db=db, service_detail=service_detail)
        return db_service_detail
    except IntegrityError as e:
        await db.rollback()
        logger.error(f"Lỗi toàn vẹn dữ liệu khi tạo chi tiết phụ tùng đơn hàng: {str(e)} | Dữ liệu: {service_detail.dict()}")
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Lỗi toàn vẹn dữ liệu: {str(e)}")

    except Exception as e:
        await db.rollback()
        logger.error(f"Lỗi không xác định khi tạo chi tiết phụ tùng đơn hàng: {str(e)} | Dữ liệu: {service_detail.dict()}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Lỗi không xác định")


@router.put(URLS['SERVICE_ORDER_DETAIL']['UPDATE_SERVICE_ORDER_DETAIL'], response_model=ServiceOrderDetailResponse)
async def update_service_order_detail(service_detail_ID: int, service_detail: ServiceOrderDetailUpdate, db: Session = Depends(get_db)):
    db_service_detail = await crud.update_service_order_detail(db, service_detail_ID=service_detail_ID, service_detail=service_detail)
    if db_service_detail is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy chi tiết dịch vụ đơn hàng")
    return db_service_detail

# @router.delete("/{service_detail_id}", status_code=status.HTTP_204_NO_CONTENT)
# def delete_service_order_detail(service_detail_id: int, db: Session = Depends(get_db)):
#     result = crud.delete_service_order_detail(db, service_detail_id=service_detail_id)
#     if not result:
#         raise HTTPException(status_code=404, detail="Service order detail not found")
#     return None

