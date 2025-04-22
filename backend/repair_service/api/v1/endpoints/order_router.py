from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from db.session import get_db
from schemas.order import OrderCreate, OrderUpdate, OrderResponse
from crud import order as crud

router = APIRouter(
    prefix="/orders",
    tags=["orders"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=List[OrderResponse])
def read_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_orders(db, skip=skip, limit=limit)

@router.get("/{order_id}", response_model=OrderResponse)
def read_order(order_id: int, db: Session = Depends(get_db)):
    db_order = crud.get_order(db, order_id=order_id)
    if db_order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return db_order

@router.get("/diagnosis/{diagnosis_id}", response_model=List[OrderResponse])
def read_orders_by_diagnosis(diagnosis_id: int, db: Session = Depends(get_db)):
    return crud.get_orders_by_diagnosis(db, diagnosis_id=diagnosis_id)

@router.get("/staff/{staff_id}", response_model=List[OrderResponse])
def read_orders_by_staff(staff_id: int, db: Session = Depends(get_db)):
    return crud.get_orders_by_staff(db, staff_id=staff_id)

@router.get("/status/{status}", response_model=List[OrderResponse])
def read_orders_by_status(status: str, db: Session = Depends(get_db)):
    return crud.get_orders_by_status(db, status=status)

@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    return crud.create_order(db=db, order=order)

@router.put("/{order_id}", response_model=OrderResponse)
def update_order(order_id: int, order: OrderUpdate, db: Session = Depends(get_db)):
    db_order = crud.update_order(db, order_id=order_id, order=order)
    if db_order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return db_order

@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    result = crud.delete_order(db, order_id=order_id)
    if not result:
        raise HTTPException(status_code=404, detail="Order not found")
    return None
