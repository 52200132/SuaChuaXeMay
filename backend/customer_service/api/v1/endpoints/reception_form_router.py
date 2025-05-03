from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
import os
from datetime import datetime

from crud import reception as reception_crud
from schemas.reception_from import ReceptionFormCreate, ReceptionFormCreate2, ReceptionFormResponse, ReceptionFormUpdate, ReceptionFormCreate2, ReceptionFormCreateNoCustomerIdNoMotoCycleId
from schemas.reception_image import ReceptionImageCreate, ReceptionImageResponse
from db.session import get_db
from utils.logger import get_logger
from .url import URLS

router = APIRouter()

logger = get_logger(__name__)

@router.post(URLS['RECEPTION']['CREATE'], response_model=ReceptionFormResponse)
async def create_reception_form(
    reception_form: ReceptionFormCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Tạo một biểu mẫu tiếp nhận mới.
    """
    try:
        db_reception_form = await reception_crud.create_reception_form(db, reception_form)
        # Tải trước dữ liệu liên quan
        db_reception_form = await reception_crud.get_reception_form_by_id(db, db_reception_form.form_id)
        logger.info(f"Tạo biểu mẫu tiếp nhận thành công với ID: {db_reception_form.reception_images}")
        
        return db_reception_form
    except Exception as e:
        logger.error(f"Lỗi khi tạo biểu mẫu tiếp nhận: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi tạo biểu mẫu tiếp nhận: {str(e)}"
        )

@router.post(URLS['RECEPTION']['CREATE_WITHOUT_MOTORCYCLE_ID'], response_model=ReceptionFormResponse)
async def create_reception_form_without_motorcycle_id(
    reception_form: ReceptionFormCreate2,
    db: AsyncSession = Depends(get_db)
    ):
    """
    Tạo một biểu mẫu tiếp nhận mới mà không cần ID xe máy.
    """
    try:
        # Tạo một biểu mẫu tiếp nhận mới
        db_reception_form = await reception_crud.create_reception_form_without_motorcycle_id(db, reception_form)
        # Tải trước dữ liệu liên quan
        db_reception_form = await reception_crud.get_reception_form_by_id(db, db_reception_form.form_id)
        logger.info(f"Tạo biểu mẫu tiếp nhận thành công với ID: {db_reception_form.reception_images}")
        
        return db_reception_form
    except Exception as e:
        logger.error(f"Lỗi khi tạo biểu mẫu tiếp nhận: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi tạo biểu mẫu tiếp nhận: {str(e)}"
        )
    
    
@router.post(URLS['RECEPTION']['CREATE_WITHOUT_CUSTOMER_ID_AND_WITHOUT_MOTORCYCLE_ID'], response_model=ReceptionFormResponse)
async def create_reception_form_without_customer_id_and_without_motorcycle_id(
    reception_form: ReceptionFormCreateNoCustomerIdNoMotoCycleId,
    db: AsyncSession = Depends(get_db)
    ):
    """
    Tạo một biểu mẫu tiếp nhận mới mà không cần ID khách hàng và ID xe máy.
    """
    try:
        # Tạo một biểu mẫu tiếp nhận mới
        db_reception_form_new = await reception_crud.create_reception_form_without_customer_id_and_without_motorcycle_id(db, reception_form)
        logger.info(f"Tạo biểu mẫu tiếp nhận thành công với ID: {db_reception_form_new.form_id}")
        
        # Tải thêm dữ liệu ảnh liên quan
        db_reception_form = await reception_crud.get_reception_form_by_id(db, db_reception_form_new.form_id)

        return db_reception_form
    except Exception as e:
        logger.error(f"Lỗi khi tạo biểu mẫu tiếp nhận: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi tạo biểu mẫu tiếp nhận: {str(e)}"
        )

@router.get(URLS['RECEPTION']['GET_ALL'], response_model=List[ReceptionFormResponse])
async def get_all_reception_forms(
    staff_id: Optional[int] = Query(None, description="ID nhân viên"),
    motocycle_id: Optional[int] = Query(None, description="ID xe máy"),
    is_returned: Optional[bool] = Query(None, description="Trạng thái trả xe"),
    start_date: Optional[datetime] = Query(None, description="Ngày bắt đầu"),
    end_date: Optional[datetime] = Query(None, description="Ngày kết thúc"),
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """
        Lấy danh sách tất cả biểu mẫu tiếp nhận.
    """

    db_reception_forms = await reception_crud.get_all_reception_forms(
        db, staff_id=staff_id, motocycle_id=motocycle_id, is_returned=is_returned,
        start_date=start_date, end_date=end_date, skip=skip, limit=limit
    )
    return db_reception_forms

@router.get(URLS['RECEPTION']['GET_ALL_TODAY'], response_model=List[ReceptionFormResponse])
async def get_all_reception_forms_today(
    db: AsyncSession = Depends(get_db)
):
    """
        Lấy danh sách tất cả biểu mẫu tiếp nhận trong ngày hôm nay.
    """
    db_reception_forms = await reception_crud.get_reception_form_today(db)
    return db_reception_forms

@router.get(URLS['RECEPTION']['GET_RECEPTION_BY_ID'], response_model=ReceptionFormResponse)
async def get_reception_form(
    form_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Lấy thông tin biểu mẫu tiếp nhận theo ID.
    """
    db_reception_form = await reception_crud.get_reception_form_by_id(db, form_id)
    if db_reception_form is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy biểu mẫu tiếp nhận")
    return db_reception_form

@router.get(URLS['RECEPTION']['GET_RECEPTION_BY_MOTORCYCLE_ID'], response_model=List[ReceptionFormResponse])
async def get_reception_form_by_motorcycle_id(
    motocycle_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Lấy danh sách biểu mẫu tiếp nhận theo ID xe máy.
    """
    db_reception_forms = await reception_crud.get_reception_form_by_motorcycle_id(db, motocycle_id)
    return db_reception_forms

@router.get(URLS['RECEPTION']['GET_RECEPTION_BY_DATE_RANGE'], response_model=List[ReceptionFormResponse])
async def get_reception_form_by_date_range(
    start_date: datetime = Query(..., description="Ngày bắt đầu"),
    end_date: datetime =  Query(..., description="Ngày kết thúc"),
    db: AsyncSession = Depends(get_db)
):
    """
    Lấy danh sách biểu mẫu tiếp nhận theo khoảng thời gian.
    """
    db_reception_forms = await reception_crud.get_reception_form_by_range_date(db, start_date, end_date)
    return db_reception_forms


# @router.get("/", response_model=List[ReceptionFormResponse])
# async def get_reception_forms(
#     customer_id: Optional[int] = None,
#     motocycle_id: Optional[int] = None,
#     skip: int = 0,
#     limit: int = 100,
#     db: AsyncSession = Depends(get_db)
# ):
#     """
#     Lấy danh sách biểu mẫu tiếp nhận.
#     - Lọc theo khách hàng (nếu customer_id được cung cấp)
#     - Lọc theo xe máy (nếu motocycle_id được cung cấp)
#     - Lấy tất cả nếu không có tiêu chí lọc
#     """
#     if customer_id:
#         db_reception_forms = await reception_crud.get_reception_forms_by_customer(db, customer_id, skip, limit)
#     elif motocycle_id:
#         db_reception_forms = await reception_crud.get_reception_forms_by_motorcycle(db, motocycle_id, skip, limit)
#     else:
#         db_reception_forms = await reception_crud.get_all_reception_forms(db, skip, limit)
    
#     return db_reception_forms

@router.put(URLS['RECEPTION']['UPDATE'], response_model=ReceptionFormResponse)
async def update_reception_form(
    form_id: int,
    reception_form_update: ReceptionFormUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Cập nhật thông tin biểu mẫu tiếp nhận.
    """
    db_reception_form = await reception_crud.update_reception_form(db, form_id, reception_form_update)
    if db_reception_form is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy biểu mẫu tiếp nhận")
    return db_reception_form

@router.put(URLS['RECEPTION']['UPDATE_RETURN'], response_model=ReceptionFormResponse)
async def update_return_status(
    form_id: int,
    is_returned: bool,
    db: AsyncSession = Depends(get_db)
):
    """
    Cập nhật trạng thái trả xe của biểu mẫu tiếp nhận.
    """
    db_reception_form = await reception_crud.update_return_status(db, form_id, is_returned)
    if db_reception_form is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy biểu mẫu tiếp nhận")
    return db_reception_form

# @router.delete("/{form_id}", response_model=dict)
# async def delete_reception_form(
#     form_id: int,
#     db: AsyncSession = Depends(get_db)
# ):
#     """
#     Xóa biểu mẫu tiếp nhận.
#     """
#     result = await reception_crud.delete_reception_form(db, form_id)
#     if not result:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy biểu mẫu tiếp nhận")
#     return {"message": "Đã xóa biểu mẫu tiếp nhận thành công"}

@router.post("/{form_id}/images", response_model=ReceptionImageResponse)
async def add_reception_image(
    form_id: int,
    image: ReceptionImageCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Thêm hình ảnh cho biểu mẫu tiếp nhận.
    """
    # Kiểm tra biểu mẫu tiếp nhận tồn tại
    db_reception_form = await reception_crud.get_reception_form_by_id(db, form_id)
    if db_reception_form is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy biểu mẫu tiếp nhận")
    
    # Thêm hình ảnh
    db_image = await reception_crud.create_reception_image(db, form_id, image)
    return db_image

@router.get("/{form_id}/images", response_model=List[ReceptionImageResponse])
async def get_reception_images(
    form_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Lấy danh sách hình ảnh của biểu mẫu tiếp nhận.
    """
    # Kiểm tra biểu mẫu tiếp nhận tồn tại
    db_reception_form = await reception_crud.get_reception_form_by_id(db, form_id)
    if db_reception_form is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy biểu mẫu tiếp nhận")
    
    # Lấy danh sách hình ảnh
    db_images = await reception_crud.get_reception_images_by_form(db, form_id)
    return db_images

@router.delete("/images/{img_id}", response_model=dict)
async def delete_reception_image(
    img_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Xóa hình ảnh của biểu mẫu tiếp nhận.
    """
    result = await reception_crud.delete_reception_image(db, img_id)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy hình ảnh")
    return {"message": "Đã xóa hình ảnh thành công"}

@router.get("/{form_id}/details", response_model=dict)
async def get_reception_form_with_images(
    form_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Lấy chi tiết biểu mẫu tiếp nhận kèm danh sách hình ảnh.
    """
    result = await reception_crud.get_reception_form_with_images(db, form_id)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy biểu mẫu tiếp nhận")
    return result
