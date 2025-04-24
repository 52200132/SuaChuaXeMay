from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete
from sqlalchemy.exc import IntegrityError, MultipleResultsFound
from sqlalchemy.orm import selectinload

from utils.logger import get_logger
from models.models import PartMotoType
from schemas.part_moto_type import PartMotoTypeCreate, PartMotoTypeUpdate, PartMotoTypeResponse

logger = get_logger(__name__)

async def create_part_moto_type(db: AsyncSession, part_moto_type: PartMotoTypeCreate) -> PartMotoType:
    """Tạo mới một loại phụ tùng"""
    try:
        db_part_moto_type = PartMotoType(**part_moto_type.dict())
        db.add(db_part_moto_type)
        await db.commit()
        await db.refresh(db_part_moto_type)
        return db_part_moto_type
    except IntegrityError as e:
        logger.error(f"IntegrityError: {e}")
        await db.rollback()
        raise e
    except Exception as e:
        logger.error(f"Error creating part moto type: {e}")
        await db.rollback()
        raise e
    
async def get_part_moto_type_by_part_id_and_mototype_id(db: AsyncSession, part_id: int, moto_type_id: int) -> PartMotoType:
    """Lấy thông tin loại phụ tùng theo ID phụ tùng và ID loại xe máy"""
    result = await db.execute(
        select(PartMotoType).where(
            PartMotoType.part_id == part_id,
            PartMotoType.moto_type_id == moto_type_id
        )
    )
    part_moto_type = result.scalars().one_or_none()
    return part_moto_type
    
async def get_all_part_moto_types(db: AsyncSession, skip: int = 0, limit: int = 100) -> list[PartMotoType]:
    """Lấy danh sách tất cả các loại phụ tùng"""
    result = await db.execute(
        select(PartMotoType).order_by(PartMotoType.part_mototype_id.asc()).offset(skip).limit(limit)
    )
    return result.scalars().all()

async def get_all_part_moto_types_by_mototype_id(db: AsyncSession, moto_type_id: int, skip: int = 0, limit: int = 100) -> list[PartMotoType]:
    """Lấy danh sách tất cả các loại phụ tùng theo ID loại xe máy"""
    result = await db.execute(
        select(PartMotoType).where(PartMotoType.moto_type_id == moto_type_id).order_by(PartMotoType.part_mototype_id.asc()).offset(skip).limit(limit)
    )
    return result.scalars().all()