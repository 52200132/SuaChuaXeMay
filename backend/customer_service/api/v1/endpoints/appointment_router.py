from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from datetime import datetime, timedelta

from db.session import get_db
from crud import appointment as appointment_crud
from schemas.appointment import (
    AppointmentCreate, AppointmentUpdate, AppointmentResponse, AppointmentStatusEnum
)
from utils.logger import get_logger
from .url import URLS


logger = get_logger(__name__)

router = APIRouter()

@router.post(URLS['APPOINTMENT']['CREATE'], response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def create_appointment(appointment_data: AppointmentCreate, db: AsyncSession = Depends(get_db)):
    """
    Tạo lịch hẹn mới.
    
    - **customer_id**: ID của khách hàng
    - **service_type_id**: ID của loại dịch vụ chính
    - **appointment_date**: Ngày giờ hẹn (phải là thời điểm trong tương lai)
    - **status**: Trạng thái lịch hẹn (mặc định là 'pending')
    - **note**: Ghi chú về lịch hẹn (tùy chọn)
    - **service_id**: ID dịch vụ
    """
    try:
        new_appointment = await appointment_crud.create_appointment(db, appointment_data)
        return AppointmentResponse.from_orm(new_appointment)
    except IntegrityError as e:
        await db.rollback()
        logger.error(f"Lỗi khi tạo lịch hẹn: {str(e)}")
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Thông tin không hợp lệ")
    except Exception as e:
        logger.error(f"Lỗi khi tạo lịch hẹn: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get(URLS['APPOINTMENT']['GET_ALL_TODAY'], response_model=List[AppointmentResponse])
async def get_appointments_today(db: AsyncSession = Depends(get_db)):
    """
    Lấy danh sách lịch hẹn trong ngày hôm nay.
    
    - Trả về danh sách các lịch hẹn có ngày giờ hẹn trong khoảng thời gian từ đầu ngày đến cuối ngày hôm nay.
    """
    today = datetime.utcnow().date()
    tomorrow = today + timedelta(days=1)
    
    appointments = await appointment_crud.get_appointments_by_date_range(db, today, tomorrow)
    
    return appointments

@router.get(URLS['APPOINTMENT']['GET_APPOINTMENTS_BY_DATE_RANGE'], response_model=List[AppointmentResponse])
async def get_appointments_by_date_range(
    start_date: datetime = Query(..., description="Ngày bắt đầu"),
    end_date: datetime = Query(..., description="Ngày kết thúc"),
    db: AsyncSession = Depends(get_db)
):
    """
    Lấy danh sách lịch hẹn trong khoảng thời gian từ start_date đến end_date.
    
    - **start_date**: Ngày bắt đầu (bao gồm)
    - **end_date**: Ngày kết thúc (không bao gồm)
    """
    if start_date >= end_date:
        logger.error("Ngày bắt đầu phải trước ngày kết thúc")
        raise HTTPException(status_code=400, detail="Ngày bắt đầu phải trước ngày kết thúc")
    
    appointments = await appointment_crud.get_appointments_by_date_range(db, start_date, end_date)
    
    return appointments

@router.get(URLS['APPOINTMENT']['GET_ALL'], response_model=List[AppointmentResponse])
async def get_all_appointments(db: AsyncSession = Depends(get_db)):
    """
    Lấy danh sách tất cả lịch hẹn.
    
    - Trả về danh sách các lịch hẹn trong cơ sở dữ liệu.
    """
    appointments = await appointment_crud.get_all_appointments(db)
    logger.info("Fetched all appointments successfully")

    return appointments

@router.get(URLS['APPOINTMENT']['FILTER'], response_model=List[AppointmentResponse])
async def read_appointments(
    skip: int = Query(0, ge=0, description="Số bản ghi bỏ qua"),
    limit: int = Query(100, ge=1, le=100, description="Số bản ghi lấy tối đa"),
    customer_id: Optional[int] = Query(None, description="Lọc theo ID khách hàng"),
    status: Optional[AppointmentStatusEnum] = Query(None, description="Lọc theo trạng thái"),
    start_date: Optional[datetime] = Query(None, description="Ngày bắt đầu"),
    end_date: Optional[datetime] = Query(None, description="Ngày kết thúc"),
    db: AsyncSession = Depends(get_db)
):
    """
    Lấy danh sách lịch hẹn với các tùy chọn lọc.
    
    - Có thể lọc theo ID khách hàng, trạng thái, hoặc khoảng thời gian.
    - Có thể phân trang kết quả với tham số skip và limit.
    """
    # if customer_id is not None:
    #     appointments = await appointment_crud.get_appointments_by_customer(
    #         db, customer_id, skip=skip, limit=limit
    #     )
    # elif start_date is not None and end_date is not None:
    #     status_list = [status.value] if status else None
    #     appointments = await appointment_crud.get_appointments_by_date_range(
    #         db, start_date, end_date, status=status_list, skip=skip, limit=limit
    #     )
    # else:
    #     appointments = await appointment_crud.get_all_appointments(db, skip=skip, limit=limit)
        
    #     # Lọc theo trạng thái nếu có
    #     if status is not None:
    #         appointments = [a for a in appointments if a.status == status.value]
    appointments = await appointment_crud.get_appointment_with_filter(
        db, skip=skip, limit=limit, customer_id=customer_id, status=status, start_date=start_date, end_date=end_date
    )

    logger.info("Fetched appointments with filters successfully")

    return appointments

# @router.get("/{appointment_id}")
# async def read_appointment(
#     appointment_id: int = Path(..., ge=1, description="ID của lịch hẹn"),
#     db: AsyncSession = Depends(get_db)
# ):
#     """
#     Lấy thông tin chi tiết của một lịch hẹn theo ID.
    
#     Bao gồm thông tin cơ bản và danh sách các dịch vụ đã đăng ký.
#     """
#     result = await appointment_crud.get_appointment_with_services(db, appointment_id)
#     if not result:
#         raise HTTPException(status_code=404, detail="Không tìm thấy lịch hẹn")
    
#     # Kết hợp dữ liệu để phù hợp với schema AppointmentDetailResponse
#     appointment_data = result["appointment"]
#     services_data = result["services"]
    
#     # Tạo đối tượng response
#     return {
#         **appointment_data.__dict__,
#         "services": services_data
#     }

# @router.put("/{appointment_id}", response_model=AppointmentResponse)
# async def update_appointment(
#     appointment_data: AppointmentUpdate,
#     appointment_id: int = Path(..., ge=1, description="ID của lịch hẹn"),
#     db: AsyncSession = Depends(get_db)
# ):
#     """
#     Cập nhật thông tin lịch hẹn.
    
#     Các trường có thể cập nhật:
#     - **service_type_id**: ID của loại dịch vụ chính
#     - **appointment_date**: Ngày giờ hẹn (phải là thời điểm trong tương lai)
#     - **status**: Trạng thái lịch hẹn
#     - **note**: Ghi chú về lịch hẹn
#     """
#     try:
#         updated_appointment = await appointment_crud.update_appointment(
#             db, appointment_id, appointment_data
#         )
#         if not updated_appointment:
#             raise HTTPException(status_code=404, detail="Không tìm thấy lịch hẹn")
#         return updated_appointment
#     except ValueError as e:
#         raise HTTPException(status_code=400, detail=str(e))

# @router.patch("/{appointment_id}/status", response_model=AppointmentResponse)
# async def update_appointment_status(
#     status: AppointmentStatusEnum,
#     appointment_id: int = Path(..., ge=1, description="ID của lịch hẹn"),
#     db: AsyncSession = Depends(get_db)
# ):
#     """
#     Cập nhật trạng thái lịch hẹn.
    
#     - **status**: Trạng thái mới của lịch hẹn (pending, confirmed, cancelled)
#     """
#     try:
#         updated_appointment = await appointment_crud.update_appointment_status(
#             db, appointment_id, status.value
#         )
#         if not updated_appointment:
#             raise HTTPException(status_code=404, detail="Không tìm thấy lịch hẹn")
#         return updated_appointment
#     except ValueError as e:
#         raise HTTPException(status_code=400, detail=str(e))

# @router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
# async def delete_appointment(
#     appointment_id: int = Path(..., ge=1, description="ID của lịch hẹn"),
#     db: AsyncSession = Depends(get_db)
# ):
#     """
#     Xóa lịch hẹn và các dịch vụ liên quan.
#     """
#     try:
#         is_deleted = await appointment_crud.delete_appointment(db, appointment_id)
#         if not is_deleted:
#             raise HTTPException(status_code=404, detail="Không tìm thấy lịch hẹn")
#     except ValueError as e:
#         raise HTTPException(status_code=400, detail=str(e))
    
#     return None

@router.get(URLS['APPOINTMENT']['GET_APPOINTMENT_BY_ID'], response_model=AppointmentResponse)
async def get_appointment_by_id(appointment_id: int, db: AsyncSession = Depends(get_db)):
    """
    Lấy thông tin chi tiết của một lịch hẹn theo ID.
    
    - **appointment_id**: ID của lịch hẹn
    """
    appointment = await appointment_crud.get_appointment_by_id(db, appointment_id)
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Không tìm thấy lịch hẹn")
    
    return AppointmentResponse.from_orm(appointment)
