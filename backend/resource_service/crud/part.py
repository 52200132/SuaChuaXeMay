from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete
from sqlalchemy.exc import IntegrityError, MultipleResultsFound
from sqlalchemy.orm import selectinload

from utils.logger import get_logger
from models.models import Part
from schemas.part import PartCreate, PartUpdate, PartResponse

logger = get_logger(__name__)

async def create_part(db: AsyncSession, part: PartCreate) -> Part:
    """Tạo mới một phần"""
    try:
        db_part = Part(**part.dict())
        db.add(db_part)
        await db.commit()
        await db.refresh(db_part)
        return db_part
    except IntegrityError as e:
        logger.error(f"IntegrityError: {e}")
        await db.rollback()
        raise e
    except Exception as e:
        logger.error(f"Error creating part: {e}")
        await db.rollback()
        raise e

async def get_all_parts(db: AsyncSession, skip: int = 0, limit: int = 100) -> list[Part]:
    """Lấy danh sách tất cả các phần"""
    result = await db.execute(select(Part).order_by(Part.part_id.asc()).offset(skip).limit(limit))
    return result.scalars().all()
    
async def get_part_by_id(db: AsyncSession, part_id: int) -> Part:
    """Lấy thông tin chi tiết của một phần"""
    result = await db.execute(select(Part).where(Part.part_id == part_id))
    part = result.scalars().one_or_none()
    return part

async def update_part(db: AsyncSession, part_id: int, part: PartUpdate) -> Part:
    db_part = await get_part_by_id(db, part_id)
    if not db_part:
        return None
    update_data = part.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_part, key, value)
    await db.commit()
    await db.refresh(db_part)
    return db_part
    
async def delete_part(db: AsyncSession, part_id: int) -> Part:
    """Xóa một phần"""
    db_part = await get_part_by_id(db, part_id)
    if not db_part:
        return None
    await db.delete(db_part)
    await db.commit()
    return db_part