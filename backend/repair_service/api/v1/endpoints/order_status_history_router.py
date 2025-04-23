from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from sqlalchemy.exc import IntegrityError
from utils.logger import get_logger
from db.session import get_db
from schemas.order_status_history import OrderStatusHistoryCreate, OrderStatusHistoryResponse
from crud import order_status_history as crud
from .url import URLS

router = APIRouter()

logger = get_logger(__name__)

@router.get(URLS['ORDER_STATUS_HISTORY']['GET_STATUS_HISTORY_BY_ID'], response_model=OrderStatusHistoryResponse)
async def get_order_status_history_by_id(history_id: int, db: Session = Depends(get_db)):
    db_status_history = await crud.get_order_status_history_by_id(db, history_id=history_id)
    
    if db_status_history is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy lịch sử trạng thái đơn hàng với ID này",
        )
    return OrderStatusHistoryResponse.from_orm(db_status_history)

@router.get(URLS['ORDER_STATUS_HISTORY']['GET_ALL_STATUS_HISTORY_BY_ORDER'], response_model=List[OrderStatusHistoryResponse])
async def get_all_status_history_by_order(order_id: int, db: Session = Depends(get_db)):
    db_status_history = await crud.get_status_history_by_order(db, order_id=order_id)
    return db_status_history

@router.post(URLS['ORDER_STATUS_HISTORY']['CREATE_STATUS_HISTORY'], response_model=OrderStatusHistoryResponse, status_code=status.HTTP_201_CREATED)
async def create_status_history(status_history: OrderStatusHistoryCreate, db: Session = Depends(get_db)):
    
    try:
        db_status_history = await crud.create_order_status_history(db=db, status_history=status_history)
        return OrderStatusHistoryResponse.from_orm(db_status_history)
    except IntegrityError as e:
        await db.rollback()
        logger.error(f"Lỗi toàn vẹn dữ liệu khi tạo lịch sửa trạng thái đơn hàng: {str(e)} | Dữ liệu: {status_history.dict()}")
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Lỗi toàn vẹn dữ liệu: {str(e)}")

    except Exception as e:
        await db.rollback()
        logger.error(f"Lỗi không xác định khi tạo lịch sửa trạng thái đơn hàng: {str(e)} | Dữ liệu: {status_history.dict()}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Lỗi không xác định")
