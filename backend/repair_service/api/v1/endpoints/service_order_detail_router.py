from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from db.session import get_db
from schemas.service_order_detail import ServiceOrderDetailCreate, ServiceOrderDetailUpdate, ServiceOrderDetailResponse
from crud import service_order_detail as crud
from .url import URLS

router = APIRouter()

@router.get("/", response_model=List[ServiceOrderDetailResponse])
def read_service_order_details(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_service_order_details(db, skip=skip, limit=limit)

@router.get("/{service_detail_id}", response_model=ServiceOrderDetailResponse)
def read_service_order_detail(service_detail_id: int, db: Session = Depends(get_db)):
    db_service_detail = crud.get_service_order_detail(db, service_detail_id=service_detail_id)
    if db_service_detail is None:
        raise HTTPException(status_code=404, detail="Service order detail not found")
    return db_service_detail

@router.get("/order/{order_id}", response_model=List[ServiceOrderDetailResponse])
def read_service_details_by_order(order_id: int, db: Session = Depends(get_db)):
    return crud.get_service_details_by_order(db, order_id=order_id)

@router.post("/", response_model=ServiceOrderDetailResponse, status_code=status.HTTP_201_CREATED)
def create_service_order_detail(service_detail: ServiceOrderDetailCreate, db: Session = Depends(get_db)):
    """Create a new service order detail"""
    return crud.create_service_order_detail(db=db, service_detail=service_detail)

@router.put("/{service_detail_id}", response_model=ServiceOrderDetailResponse)
def update_service_order_detail(service_detail_id: int, service_detail: ServiceOrderDetailUpdate, db: Session = Depends(get_db)):
    db_service_detail = crud.update_service_order_detail(db, service_detail_id=service_detail_id, service_detail=service_detail)
    if db_service_detail is None:
        raise HTTPException(status_code=404, detail="Service order detail not found")
    return db_service_detail

@router.delete("/{service_detail_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_service_order_detail(service_detail_id: int, db: Session = Depends(get_db)):
    result = crud.delete_service_order_detail(db, service_detail_id=service_detail_id)
    if not result:
        raise HTTPException(status_code=404, detail="Service order detail not found")
    return None

@router.put("/select/{service_detail_id}", response_model=ServiceOrderDetailResponse)
def toggle_service_selection(service_detail_id: int, db: Session = Depends(get_db)):
    db_service_detail = crud.toggle_service_selection(db, service_detail_id=service_detail_id)
    if db_service_detail is None:
        raise HTTPException(status_code=404, detail="Service order detail not found")
    return db_service_detail
