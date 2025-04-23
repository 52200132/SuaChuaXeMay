from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from sqlalchemy.exc import IntegrityError
from utils.logger import get_logger
from db.session import get_db
from schemas.part import PartCreate, PartUpdate, PartResponse
from crud import part as part_crud
from .url import URLS

router = APIRouter()

logger = get_logger(__name__)

@router.post(URLS['PART']['CREATE_PART'], response_model=PartResponse)
async def create_part(part: PartCreate, db: Session = Depends(get_db)):
    """
    Tạo một phần mới trong cơ sở dữ liệu.
    """
    try:
        db_part = await part_crud.create_part(db=db, part=part)
        return db_part
    except IntegrityError:
        await db.rollback()
        logger.error("IntegrityError: Part already exists")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Part already exists")
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating part: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")

@router.get(URLS['PART']['GET_ALL_PARTS'], response_model=List[PartResponse])
async def get_all_parts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Lấy danh sách đơn hàng"""
    db_part = await part_crud.get_all_parts(db, skip=skip, limit=limit)
    return db_part

