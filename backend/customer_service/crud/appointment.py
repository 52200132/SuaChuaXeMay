from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete, and_, or_
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timedelta
from typing import List, Optional, Union, Dict, Any
from fastapi import HTTPException, status

from utils.logger import get_logger
from models.models import Appointment, Customer
from schemas.appointment import AppointmentCreate, AppointmentUpdate, AppointmentStatusEnum, AppointmentResponse

logger = get_logger(__name__)

# CRUD for Appointment

async def create_appointment(db: AsyncSession, appointment: AppointmentCreate) -> Appointment:
    """Tạo một lịch hẹn mới"""
    try:

        # Tạo đối tượng lịch hẹn
        db_appointment = Appointment(
            customer_id=appointment.customer_id,
            service_type_id=appointment.service_type_id,
            appointment_date=appointment.appointment_date,
            status=appointment.status,
            note=appointment.note,
            # created_at=datetime.utcnow()
        )
        
        db.add(db_appointment)
        # await db.flush()  # Để lấy được ID của lịch hẹn mới tạo
        
        await db.commit()
        await db.refresh(db_appointment)
        # logger.info(f"{(db_appointment.status)}") 
        return db_appointment
    except IntegrityError as e:
        await db.rollback()
        logger.error(f"Lỗi khi tạo lịch hẹn: {str(e)}")
        raise IntegrityError(f"{str(e)}")
    except Exception as e:
        await db.rollback()
        logger.error(f"Lỗi khi tạo lịch hẹn: {str(e)}")
        # raise ValueError(f"Không thể tạo lịch hẹn: {str(e)}")
        raise Exception(f"{str(e)}")

async def get_appointment_by_id(db: AsyncSession, appointment_id: int) -> Optional[Appointment]:
    """Lấy thông tin một lịch hẹn theo ID"""
    result = await db.execute(
        select(Appointment).where(Appointment.appointment_id == appointment_id)
    )
    return result.scalar_one_or_none()

async def get_appointments_by_customer(
    db: AsyncSession, 
    customer_id: int,
    skip: int = 0,
    limit: int = 100
) -> List[Appointment]:
    """Lấy danh sách lịch hẹn của một khách hàng"""
    result = await db.execute(
        select(Appointment)
        .where(Appointment.customer_id == customer_id)
        .order_by(Appointment.appointment_date.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()

async def get_appointments_by_date_range(db: AsyncSession, start_date: datetime, end_date: datetime, 
    status: Optional[List[str]] = None, 
    skip: int = 0,
    limit: int = 100
) -> List[Appointment]:
    """Lấy danh sách lịch hẹn trong khoảng thời gian"""
    query = select(Appointment).where(
        and_(
            Appointment.appointment_date >= start_date,
            Appointment.appointment_date <= end_date
        )
    )
    
    if status:
        query = query.where(Appointment.status.in_(status))
    
    query = query.order_by(Appointment.appointment_date.asc()).offset(skip).limit(limit)
    result = await db.execute(query)
    db_appointments = result.scalars().all()
    logger.info(f"Found {len(db_appointments)} appointments in the date range")
    return db_appointments

async def get_all_appointments(db: AsyncSession,
    skip: int = 0,
    limit: int = 100
) -> List[Appointment]:
    """Lấy tất cả lịch hẹn"""
    result = await db.execute(
        select(Appointment)
        .order_by(Appointment.appointment_id.asc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()

async def update_appointment(db: AsyncSession,
    appointment_id: int,
    appointment_update: AppointmentUpdate
) -> Optional[Appointment]:
    """Cập nhật thông tin lịch hẹn"""
    try:
        db_appointment = await get_appointment(db, appointment_id)
        if not db_appointment:
            return None
        
        # Chuẩn bị dữ liệu cập nhật
        update_data = appointment_update.dict(exclude_unset=True)
        
        # Cập nhật lịch hẹn
        if update_data:
            stmt = update(Appointment).where(
                Appointment.appointment_id == appointment_id
            ).values(**update_data)
            await db.execute(stmt)
        
        await db.commit()
        return await get_appointment(db, appointment_id)
        
    except Exception as e:
        await db.rollback()
        logger.error(f"Lỗi khi cập nhật lịch hẹn: {str(e)}")
        raise ValueError(f"Không thể cập nhật lịch hẹn: {str(e)}")

async def update_appointment_status(
    db: AsyncSession,
    appointment_id: int,
    status: str
) -> Optional[Appointment]:
    """Cập nhật trạng thái lịch hẹn"""
    try:
        db_appointment = await get_appointment(db, appointment_id)
        if not db_appointment:
            return None
        
        # Kiểm tra trạng thái hợp lệ
        valid_statuses = [status.value for status in AppointmentStatusEnum]
        if status not in valid_statuses:
            raise ValueError(f"Trạng thái không hợp lệ. Các trạng thái hợp lệ: {valid_statuses}")
        
        stmt = update(Appointment).where(
            Appointment.appointment_id == appointment_id
        ).values(status=status)
        await db.execute(stmt)
        await db.commit()
        
        return await get_appointment(db, appointment_id)
        
    except Exception as e:
        await db.rollback()
        logger.error(f"Lỗi khi cập nhật trạng thái lịch hẹn: {str(e)}")
        raise ValueError(f"Không thể cập nhật trạng thái lịch hẹn: {str(e)}")

async def delete_appointment(
    db: AsyncSession,
    appointment_id: int
) -> bool:
    """Xóa lịch hẹn"""
    try:
        db_appointment = await get_appointment(db, appointment_id)
        if not db_appointment:
            return False
        
        # Xóa tất cả dịch vụ của lịch hẹn trước
        await delete_appointment_services(db, appointment_id)
        
        # Xóa lịch hẹn
        stmt = delete(Appointment).where(Appointment.appointment_id == appointment_id)
        await db.execute(stmt)
        await db.commit()
        
        return True
        
    except Exception as e:
        await db.rollback()
        logger.error(f"Lỗi khi xóa lịch hẹn: {str(e)}")
        raise ValueError(f"Không thể xóa lịch hẹn: {str(e)}")

async def get_appointment_with_services(
    db: AsyncSession,
    appointment_id: int
) -> Dict[str, Any]:
    """Lấy thông tin lịch hẹn kèm danh sách dịch vụ"""
    db_appointment = await get_appointment(db, appointment_id)
    if not db_appointment:
        return None
    
    # Lấy danh sách dịch vụ
    db_services = await get_appointment_services(db, appointment_id)
    
    # Tạo đối tượng kết quả
    result = {
        "appointment": db_appointment,
        "services": db_services
    }
    
    return result

async def get_appointment_with_filter(
    db: AsyncSession,
    customer_id: Optional[int] = None,
    appointment_id: Optional[int] = None,
    status: Optional[AppointmentStatusEnum] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 100
) -> List[Appointment]:
    """Lấy danh sách lịch hẹn với các bộ lọc"""
    try:
        query = select(Appointment)
        
        if customer_id:
            query = query.where(Appointment.customer_id == customer_id)
        
        if appointment_id:
            query = query.where(Appointment.appointment_id == appointment_id)
        
        if status:
            query = query.where(Appointment.status == status.value)
        
        # Handle case where only one date is provided
        if start_date and not end_date:
            query = query.where(Appointment.appointment_date >= start_date)
        elif end_date and not start_date:
            query = query.where(Appointment.appointment_date <= end_date)
        elif start_date and end_date:
            query = query.where(
                and_(
                    Appointment.appointment_date >= start_date,
                    Appointment.appointment_date <= end_date
                )
            )
        
        query = query.order_by(Appointment.appointment_id.asc()).offset(skip).limit(limit)
        result = await db.execute(query)

    except IntegrityError as e:
        await db.rollback()
        logger.error(f"Lỗi khi lấy danh sách lịch hẹn: {str(e)}")
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Integrity Error")
    except Exception as e:
        await db.rollback()
        logger.error(f"Lỗi khi lấy danh sách lịch hẹn: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    return result.scalars().all()