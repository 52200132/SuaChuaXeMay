from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from sqlalchemy.exc import IntegrityError
from utils.logger import get_logger
from db.session import get_db
from schemas.diagnosis import DiagnosisCreate, DiagnosisUpdate, DiagnosisResponse
from crud import diagnosis as crud
from .url import URLS

router = APIRouter()

logger = get_logger(__name__)

# @router.get("/", response_model=List[DiagnosisResponse])
# def read_diagnoses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
#     """Get all diagnoses"""
#     return crud.get_diagnoses(db, skip=skip, limit=limit)

@router.get(URLS['DIAGNOSIS']['GET_DIAGNOSIS_BY_ID'], response_model=DiagnosisResponse)
async def get_diagnosis_by_id(diagnosis_id: int, db: Session = Depends(get_db)):
    """Get a specific diagnosis by ID"""
    db_diagnosis = await crud.get_diagnosis_by_id(db, diagnosis_id=diagnosis_id)
    if db_diagnosis is None:
        raise HTTPException(status_code=404, detail="Diagnosis not found")
    return DiagnosisResponse.from_orm(db_diagnosis)

@router.get(URLS['DIAGNOSIS']['GET_DIAGNOSIS_BY_ORDER_ID'], response_model=DiagnosisResponse)
async def get_diagnosis_by_order_id(order_id: int, db: Session = Depends(get_db)):
    """Get a specific diagnosis by order ID"""
    db_diagnosis = await crud.get_diagnosis_by_order_id(db, order_id=order_id)
    if db_diagnosis is None:
        raise HTTPException(status_code=404, detail="Diagnosis not found")
    return DiagnosisResponse.from_orm(db_diagnosis)

@router.post(URLS['DIAGNOSIS']['CREATE_DIAGNOSIS'], response_model=DiagnosisResponse, status_code=status.HTTP_201_CREATED)
async def create_diagnosis(diagnosis: DiagnosisCreate, db: Session = Depends(get_db)):
    """Create a new diagnosis"""

    try:
        db_diagnosis = await crud.create_diagnosis(db=db, diagnosis=diagnosis)
        return DiagnosisResponse.from_orm(db_diagnosis)
    except IntegrityError as e:
        await db.rollback()
        logger.error(f"Lỗi khi tạo chẩn đoán: {str(e)}")
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Thông tin không hợp lệ")
    except Exception as e:
        logger.error(f"Lỗi khi tạo chẩn đoán: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# @router.put("/{diagnosis_id}", response_model=DiagnosisResponse)
# def update_diagnosis(diagnosis_id: int, diagnosis: DiagnosisUpdate, db: Session = Depends(get_db)):
#     """Update an existing diagnosis"""
#     db_diagnosis = crud.update_diagnosis(db, diagnosis_id=diagnosis_id, diagnosis=diagnosis)
#     if db_diagnosis is None:
#         raise HTTPException(status_code=404, detail="Diagnosis not found")
#     return db_diagnosis

# @router.delete("/{diagnosis_id}", status_code=status.HTTP_204_NO_CONTENT)
# def delete_diagnosis(diagnosis_id: int, db: Session = Depends(get_db)):
#     """Delete a diagnosis"""
#     result = crud.delete_diagnosis(db, diagnosis_id=diagnosis_id)
#     if not result:
#         raise HTTPException(status_code=404, detail="Diagnosis not found")
#     return None
