from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
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
async def create_part(part: PartCreate, db:AsyncSession = Depends(get_db)):
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
async def get_all_parts(skip: int = 0, limit: int = 100, db:AsyncSession = Depends(get_db)):
    """Lấy danh sách đơn hàng"""
    db_part = await part_crud.get_all_parts(db, skip=skip, limit=limit)
    return db_part

@router.get(URLS['PART']['GET_PART_BY_ID'], response_model=PartResponse)
async def get_part_by_id(part_id: int, db:AsyncSession = Depends(get_db)):
    """Lấy thông tin chi tiết của một phần"""
    db_part = await part_crud.get_part_by_id(db, part_id=part_id)
    if not db_part:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy phụ tùng")
    return db_part

@router.put(URLS['PART']['UPDATE_PART'], response_model=PartResponse)
async def update_part(part_id: int, part: PartUpdate, db:AsyncSession = Depends(get_db)):
    """Cập nhật thông tin của một phần"""
    db_part = await part_crud.update_part(db, part_id=part_id, part=part)
    if not db_part:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy phụ tùng")
    return db_part

# @router.delete(URLS['PART']['DELETE_PART'], status_code=status.HTTP_200_OK)
# async def delete_part(part_id: int, db:AsyncSession = Depends(get_db)):
#     """Xóa một phần"""
#     try:
#         # Gọi hàm CRUD để xóa Part
#         await part_crud.delete_part(db, part_id=part_id)
#         return {"detail": f"Part with ID {part_id} deleted successfully."}
#     except HTTPException as e:
#         # Nếu Part không tồn tại
#         logger.error(f"Error while deleting service: {e.detail}")
#         raise e
#     except Exception as e:
#         # Lỗi không xác định
#         logger.error(f"Error while deleting service: {str(e)}")
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Could not delete service due to an internal error."
#         )
