from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete
from sqlalchemy.exc import IntegrityError, MultipleResultsFound
from sqlalchemy.orm import selectinload

from utils.logger import get_logger
from models.models import Part
from schemas.part import PartCreate, PartUpdate, PartResponse

logger = get_logger(__name__)

async def create_part(db: AsyncSession, part_create: PartCreate) -> PartResponse:
    """Tạo mới một phần"""
    try:
        part = Part(**part_create.dict())
        db.add(part)
        await db.commit()
        await db.refresh(part)
        return PartResponse.from_orm(part)
    except IntegrityError as e:
        logger.error(f"IntegrityError: {e}")
        await db.rollback()
        raise e
    except Exception as e:
        logger.error(f"Error creating part: {e}")
        await db.rollback()
        raise e

async def get_all_parts(db: AsyncSession, skip: int = 0, limit: int = 100) -> list[PartResponse]:
    """Lấy danh sách tất cả các phần"""
    result = await db.execute(select(Part).order_by(Part.part_id.asc()).offset(skip).limit(limit))
    return result.scalars().all()
    