from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete
from sqlalchemy.exc import IntegrityError, MultipleResultsFound
from sqlalchemy.orm import selectinload

from utils.logger import get_logger
from models.models import Diagnosis
from schemas.diagnosis import DiagnosisCreate, DiagnosisUpdate, DiagnosisResponse

logger = get_logger(__name__)

async def create_diagnosis(db: AsyncSession, diagnosis: DiagnosisCreate) -> Diagnosis:
    """Tạo một bản chẩn đoán mới trong cơ sở dữ liệu"""
    try:
        db_diagnosis = Diagnosis(
            form_id=diagnosis.form_id,
            problem=diagnosis.problem,
            created_at=diagnosis.created_at,
            estimated_cost=diagnosis.estimated_cost
        )
        db.add(db_diagnosis)
        await db.commit()
        await db.refresh(db_diagnosis)
        return DiagnosisResponse.from_orm(db_diagnosis)
    except IntegrityError as e:
        await db.rollback()
        logger.error(f"Lỗi khi tạo bảng chẩn đoán: {str(e)}")
        raise ValueError("Chuỗi chẩn đoán đã tồn tại")
    except Exception as e:
        await db.rollback()
        logger.error(f"Lỗi không xác định khi tạo bảng chẩn đoán: {str(e)}")
        raise ValueError("Lỗi không xác định khi tạo bảng chẩn đoán")
async def get_diagnosis_by_id(db: AsyncSession, diagnosis_id: int) -> Diagnosis:
    """Lấy thông tin chẩn đoán theo ID"""
    result = await db.execute(select(Diagnosis).where(Diagnosis.diagnosis_id == diagnosis_id))
    db_diagnosis = result.scalar_one_or_none()
    return db_diagnosis
async def get_diagnosis_by_order_id (db: AsyncSession, order_id: int) -> Diagnosis:
    """Lấy thông tin chẩn đoán theo ID đơn hàng"""
    result = await db.execute(select(Diagnosis).where(Diagnosis.order_id == order_id))
    db_diagnosis = result.scalar_one_or_none()
    return db_diagnosis

async def update_diagnosis(db: AsyncSession, diagnosis_id: int, diagnosis: DiagnosisUpdate) -> Diagnosis:
    """Cập nhật thông tin chẩn đoán"""
    try:
        db_diagnosis = await get_diagnosis_by_id(db, diagnosis_id)
        if not db_diagnosis:
            return None

        update_data = diagnosis.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_diagnosis, key, value)

        await db.commit()
        await db.refresh(db_diagnosis)
        return DiagnosisResponse.from_orm(db_diagnosis)
    except IntegrityError as e:
        await db.rollback()
        logger.error(f"Lỗi khi cập nhật bảng chẩn đoán: {str(e)}")
        raise ValueError("Chuỗi chẩn đoán đã tồn tại")
    except Exception as e:
        await db.rollback()
        logger.error(f"Lỗi không xác định khi cập nhật bảng chẩn đoán: {str(e)}")
        raise ValueError("Lỗi không xác định khi cập nhật bảng chẩn đoán")
async def delete_diagnosis(db: AsyncSession, diagnosis_id: int) -> bool:
    """Xóa một bản chẩn đoán"""
    try:
        db_diagnosis = await get_diagnosis_by_id(db, diagnosis_id)
        if not db_diagnosis:
            return False

        await db.delete(db_diagnosis)
        await db.commit()
        return True
    except IntegrityError as e:
        await db.rollback()
        logger.error(f"Lỗi khi xóa bảng chẩn đoán: {str(e)}")
        raise ValueError("Chuỗi chẩn đoán đã tồn tại")
    except Exception as e:
        await db.rollback()
        logger.error(f"Lỗi không xác định khi xóa bảng chẩn đoán: {str(e)}")
        raise ValueError("Lỗi không xác định khi xóa bảng chẩn đoán")