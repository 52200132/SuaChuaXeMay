from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete
from sqlalchemy.exc import IntegrityError

from utils.logger import get_logger
from models.models import MotocycleType

logger = get_logger(__name__)

async def get_all_motorcycle_types(db: AsyncSession) -> list[MotocycleType]:
    try:
        """Lấy danh sách tất cả các loại xe máy."""
        result = await db.execute(select(MotocycleType))
        logger.info("Fetching all motorcycle types from the database.")
        return result.scalars().all()
    except IntegrityError as e:
        await db.rollback()
        logger.error(f"Lỗi khi lấy danh sách loại xe máy: {str(e)}")
        raise IntegrityError("Lỗi khi lấy danh sách loại xe máy")
    except Exception as e:
        logger.error(f"Lỗi không xác định: {str(e)}")
        raise e