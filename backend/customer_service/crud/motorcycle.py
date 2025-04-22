from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete
from sqlalchemy.exc import IntegrityError

from utils.logger import get_logger
from models.models import Motocycle
from schemas.motocycle import MotocycleResponse, MotocycleCreate, MotocycleUpdate
from utils.logger import get_logger


logger = get_logger(__name__)

async def get_motorcycle_by_id(db: AsyncSession, motorcycle_id: int) -> Motocycle:
    """Lấy thông tin loại xe máy theo ID."""
    try:
        result = await db.get(Motocycle, motorcycle_id)
        logger.info(f"Lấy thông tin loại xe máy với ID {motorcycle_id} thành công")
        return result
    except IntegrityError as e:
        logger.error(f"Lỗi khi lấy thông tin loại xe máy: {str(e)}")
        raise IntegrityError("Lỗi khi lấy thông tin loại xe máy")
    except Exception as e:
        logger.error(f"Lỗi không xác định: {str(e)}")
        raise e

