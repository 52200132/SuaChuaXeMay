from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from db.session import get_db
from schemas.part_order_detail import PartOrderDetailCreate, PartOrderDetailUpdate, PartOrderDetailResponse
from crud import part_order_detail as crud

router = APIRouter()

@router.get("/", response_model=List[PartOrderDetailResponse])
def read_part_order_details(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_part_order_details(db, skip=skip, limit=limit)

@router.get("/{part_detail_id}", response_model=PartOrderDetailResponse)
def read_part_order_detail(part_detail_id: int, db: Session = Depends(get_db)):
    db_part_detail = crud.get_part_order_detail(db, part_detail_id=part_detail_id)
    if db_part_detail is None:
        raise HTTPException(status_code=404, detail="Part order detail not found")
    return db_part_detail

@router.get("/order/{order_id}", response_model=List[PartOrderDetailResponse])
def read_part_details_by_order(order_id: int, db: Session = Depends(get_db)):
    return crud.get_part_details_by_order(db, order_id=order_id)

@router.post("/", response_model=PartOrderDetailResponse, status_code=status.HTTP_201_CREATED)
def create_part_order_detail(part_detail: PartOrderDetailCreate, db: Session = Depends(get_db)):
    return crud.create_part_order_detail(db=db, part_detail=part_detail)

@router.put("/{part_detail_id}", response_model=PartOrderDetailResponse)
def update_part_order_detail(part_detail_id: int, part_detail: PartOrderDetailUpdate, db: Session = Depends(get_db)):
    db_part_detail = crud.update_part_order_detail(db, part_detail_id=part_detail_id, part_detail=part_detail)
    if db_part_detail is None:
        raise HTTPException(status_code=404, detail="Part order detail not found")
    return db_part_detail

@router.delete("/{part_detail_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_part_order_detail(part_detail_id: int, db: Session = Depends(get_db)):
    result = crud.delete_part_order_detail(db, part_detail_id=part_detail_id)
    if not result:
        raise HTTPException(status_code=404, detail="Part order detail not found")
    return None

@router.put("/select/{part_detail_id}", response_model=PartOrderDetailResponse)
def toggle_part_selection(part_detail_id: int, db: Session = Depends(get_db)):
    db_part_detail = crud.toggle_part_selection(db, part_detail_id=part_detail_id)
    if db_part_detail is None:
        raise HTTPException(status_code=404, detail="Part order detail not found")
    return db_part_detail
