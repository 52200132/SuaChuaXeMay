from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from sqlalchemy.exc import IntegrityError
from utils.logger import get_logger
from db.session import get_db
from schemas.part_moto_type import PartMotoTypeCreate, PartMotoTypeUpdate, PartMotoTypeResponse
from crud import part_moto_type as part_moto_type_crud
from .url import URLS

router = APIRouter()

logger = get_logger(__name__)

@router.post(URLS['PART_MOTO_TYPE']['CREATE_PART_MOTO_TYPE'], response_model=PartMotoTypeResponse)
async def create_part_moto_type(part_moto_type: PartMotoTypeCreate, db: Session = Depends(get_db)):
    """
    Tạo một loại phụ tùng mới trong cơ sở dữ liệu.
    """
    try:
        db_part_moto_type = await part_moto_type_crud.create_part_moto_type(db=db, part_moto_type=part_moto_type)
        return db_part_moto_type
    except IntegrityError:
        await db.rollback()
        logger.error("IntegrityError: Part Moto Type already exists")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Part Moto Type already exists")
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating part moto type: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")
    
@router.get(URLS['PART_MOTO_TYPE']['GET_PART_MOTO_TYPE_BY_PART_ID_AND_MOTOTYPE_ID'], response_model=PartMotoTypeResponse)
async def get_part_moto_type_by_part_id_and_mototype_id(part_id: int, moto_type_id: int, db: Session = Depends(get_db)):
    """
    Lấy thông tin loại phụ tùng theo ID phụ tùng và ID loại xe máy.
    """
    try:
        db_part_moto_type = await part_moto_type_crud.get_part_moto_type_by_part_id_and_mototype_id(db=db, part_id=part_id, moto_type_id=moto_type_id)
        if not db_part_moto_type:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Part Moto Type not found")
        return db_part_moto_type
    except Exception as e:
        logger.error(f"Error getting part moto type: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")

@router.get(URLS['PART_MOTO_TYPE']['GET_ALL_PART_MOTO_TYPES'], response_model=List[PartMotoTypeResponse])
async def get_all_part_moto_types(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Lấy danh sách tất cả các loại phụ tùng"""
    db_part_moto_type = await part_moto_type_crud.get_all_part_moto_types(db, skip=skip, limit=limit)
    return db_part_moto_type

@router.get(URLS['PART_MOTO_TYPE']['GET_ALL_PART_MOTO_TYPES_BY_MOTOTYPE_ID'], response_model=List[PartMotoTypeResponse])
async def get_all_part_moto_types_by_mototype_id(moto_type_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Lấy danh sách tất cả các loại phụ tùng theo ID loại xe máy"""
    db_part_moto_type = await part_moto_type_crud.get_all_part_moto_types_by_mototype_id(db, moto_type_id=moto_type_id, skip=skip, limit=limit)
    return db_part_moto_type

@router.post(URLS['PART_MOTO_TYPE']['CREATE_PART_MOTO_TYPE'], response_model=PartMotoTypeResponse)