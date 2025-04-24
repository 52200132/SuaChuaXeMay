from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from sqlalchemy.exc import IntegrityError
from utils.logger import get_logger
from db.session import get_db
from schemas.order import OrderCreate, OrderUpdate, OrderResponse
from crud import order as order_crud
from .url import URLS

router = APIRouter()

logger = get_logger(__name__)

@router.get(URLS['ORDER']['GET_ALL_ORDERS'], response_model=List[OrderResponse])
async def get_all_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Lấy danh sách đơn hàng"""
    db_order = await order_crud.get_all(db, skip=skip, limit=limit)
    return db_order

@router.get(URLS['ORDER']['GET_ORDER_BY_ID'], response_model=OrderResponse)
async def get_orders_by_id(order_id: int, db: Session = Depends(get_db)):
    db_order = await order_crud.get_order_by_id(db, order_id=order_id)
    if db_order is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng")
    return OrderResponse.from_orm(db_order)

@router.post(URLS['ORDER']['CREATE_ORDER'], response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_new_order(order: OrderCreate, db: Session = Depends(get_db)):
    try:
        db_order = await order_crud.create_order(db=db, order=order)
        return OrderResponse.from_orm(db_order)
    except IntegrityError as e:
        await db.rollback()
        logger.error(f"Lỗi khi tạo đơn hàng: {str(e)}")
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Thông tin không hợp lệ")
    except Exception as e:
        logger.error(f"Lỗi khi tạo đơn hàng: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.put(URLS['ORDER']['UPDATE_ORDER'], response_model=OrderResponse)
async def update_order(order_id: int, order: OrderUpdate, db: Session = Depends(get_db)):
    try:
        db_order = await order_crud.update_order(db, order_id=order_id, order=order)
        return OrderResponse.from_orm(db_order)
    except IntegrityError as e:
        await db.rollback()
        logger.error(f"Lỗi khi cập nhật đơn hàng: {str(e)}")
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Thông tin không hợp lệ")
    except Exception as e:
        logger.error(f"Lỗi khi cập nhật đơn hàng: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    
