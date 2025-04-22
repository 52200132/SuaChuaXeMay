from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from db.session import get_db
from schemas.diagnosis import DiagnosisCreate, DiagnosisUpdate, DiagnosisResponse
from crud import diagnosis as crud

router = APIRouter(
    prefix="/diagnoses",
    tags=["diagnoses"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=List[DiagnosisResponse])
def read_diagnoses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all diagnoses"""
    return crud.get_diagnoses(db, skip=skip, limit=limit)

@router.get("/{diagnosis_id}", response_model=DiagnosisResponse)
def read_diagnosis(diagnosis_id: int, db: Session = Depends(get_db)):
    """Get a specific diagnosis by ID"""
    db_diagnosis = crud.get_diagnosis(db, diagnosis_id=diagnosis_id)
    if db_diagnosis is None:
        raise HTTPException(status_code=404, detail="Diagnosis not found")
    return db_diagnosis

@router.get("/form/{form_id}", response_model=List[DiagnosisResponse])
def read_diagnoses_by_form(form_id: int, db: Session = Depends(get_db)):
    """Get all diagnoses for a specific reception form"""
    return crud.get_diagnoses_by_form(db, form_id=form_id)

@router.post("/", response_model=DiagnosisResponse, status_code=status.HTTP_201_CREATED)
def create_diagnosis(diagnosis: DiagnosisCreate, db: Session = Depends(get_db)):
    """Create a new diagnosis"""
    return crud.create_diagnosis(db=db, diagnosis=diagnosis)

@router.put("/{diagnosis_id}", response_model=DiagnosisResponse)
def update_diagnosis(diagnosis_id: int, diagnosis: DiagnosisUpdate, db: Session = Depends(get_db)):
    """Update an existing diagnosis"""
    db_diagnosis = crud.update_diagnosis(db, diagnosis_id=diagnosis_id, diagnosis=diagnosis)
    if db_diagnosis is None:
        raise HTTPException(status_code=404, detail="Diagnosis not found")
    return db_diagnosis

@router.delete("/{diagnosis_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_diagnosis(diagnosis_id: int, db: Session = Depends(get_db)):
    """Delete a diagnosis"""
    result = crud.delete_diagnosis(db, diagnosis_id=diagnosis_id)
    if not result:
        raise HTTPException(status_code=404, detail="Diagnosis not found")
    return None
