from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from db.session import get_db
from schemas.order_status_history import OrderStatusHistoryCreate, OrderStatusHistoryUpdate, OrderStatusHistoryResponse
from crud import order_status_history as crud

router = APIRouter()

@router.get("/", response_model=List[OrderStatusHistoryResponse])
def read_order_status_histories(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_order_status_histories(db, skip=skip, limit=limit)

@router.get("/{history_id}", response_model=OrderStatusHistoryResponse)
def read_order_status_history(history_id: int, db: Session = Depends(get_db)):
    db_status_history = crud.get_order_status_history(db, history_id=history_id)
    if db_status_history is None:
        raise HTTPException(status_code=404, detail="Order status history not found")
    return db_status_history

@router.get("/order/{order_id}", response_model=List[OrderStatusHistoryResponse])
def read_status_history_by_order(order_id: int, db: Session = Depends(get_db)):
    return crud.get_status_history_by_order(db, order_id=order_id)

@router.post("/", response_model=OrderStatusHistoryResponse, status_code=status.HTTP_201_CREATED)
def create_status_history(status_history: OrderStatusHistoryCreate, db: Session = Depends(get_db)):
    return crud.create_order_status_history(db=db, status_history=status_history)

@router.put("/{history_id}", response_model=OrderStatusHistoryResponse)
def update_status_history(history_id: int, status_history: OrderStatusHistoryUpdate, db: Session = Depends(get_db)):
    db_status_history = crud.update_order_status_history(db, history_id=history_id, status_history=status_history)
    if db_status_history is None:
        raise HTTPException(status_code=404, detail="Order status history not found")
    return db_status_history

@router.delete("/{history_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_status_history(history_id: int, db: Session = Depends(get_db)):
    result = crud.delete_order_status_history(db, history_id=history_id)
    if not result:
        raise HTTPException(status_code=404, detail="Order status history not found")
    return None
