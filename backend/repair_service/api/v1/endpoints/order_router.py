from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from db.session import get_db
from schemas.order import OrderCreate, OrderUpdate, OrderResponse
from crud import order as order_crud
from .url import URLS

router = APIRouter()

@router.get(URLS['ORDER']['GET_ALL_ORDERS'], response_model=List[OrderResponse])
async def read_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Lấy danh sách đơn hàng"""
    orders = await order_crud.get_all_orders(db, skip=skip, limit=limit)
    return orders

@router.get(URLS['ORDER']['GET_ORDER_BY_ID'], response_model=OrderResponse)
async def read_order(order_id: int, db: Session = Depends(get_db)):
    db_order = await order_crud.get_order_by_id(db, order_id=order_id)
    if db_order is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng")
    return db_order

@router.post(URLS['ORDER']['CREATE_ORDER'], response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_new_order(order: OrderCreate, db: Session = Depends(get_db)):
    new_order = await order_crud.create_order(db=db, order=order)
    return new_order

@router.put("/{order_id}", response_model=OrderResponse)
async def update_order(order_id: int, order: OrderUpdate, db: Session = Depends(get_db)):
    db_order = order_crud.update_order(db, order_id=order_id, order=order)
    if db_order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return db_order
