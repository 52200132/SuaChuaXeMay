from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete
from sqlalchemy.orm import Bundle

from sqlalchemy.exc import IntegrityError

from utils.logger import get_logger
from models.models import Motocycle, MotocycleType
from schemas.motocycle import MotocycleCreate, MotocycleUpdate, MotocycleResponse2
from utils.logger import get_logger


logger = get_logger(__name__)

async def get_all_motorcycles(db: AsyncSession) -> list[MotocycleResponse2]:
    """Lấy danh sách tất cả các loại xe máy."""
    try:
        result = await db.execute(
            select(
                Bundle("motocycle",
                    Motocycle.motocycle_id,
                    Motocycle.customer_id,
                    Motocycle.license_plate,
                    MotocycleType.brand,
                    MotocycleType.model,
                    MotocycleType.moto_type_id,
                    MotocycleType.type
                )
            )
            .join(MotocycleType, Motocycle.moto_type_id == MotocycleType.moto_type_id)
        )
        motorcycles = result.scalars().all()
        logger.info("Lấy danh sách tất cả các loại xe máy thành công")
        return motorcycles
    except IntegrityError as e:
        logger.error(f"Lỗi khi lấy danh sách loại xe máy: {str(e)}")
        raise IntegrityError("Lỗi khi lấy danh sách loại xe máy")
    except Exception as e:
        logger.error(f"Lỗi không xác định: {str(e)}")
        raise e

async def get_motorcycle_by_id(db: AsyncSession, motorcycle_id: int) -> MotocycleResponse2:
    """Lấy thông tin loại xe máy theo ID."""
    try:
        result = await db.execute(
            select(
                Bundle("motocycle",
                    Motocycle.motocycle_id,
                    Motocycle.customer_id,
                    Motocycle.license_plate,
                    MotocycleType.brand,
                    MotocycleType.model,
                    MotocycleType.moto_type_id,
                    MotocycleType.type
                )
            )
            .join(MotocycleType, Motocycle.moto_type_id == MotocycleType.moto_type_id)
            .where(Motocycle.motocycle_id == motorcycle_id)
        )
        logger.info(f"Lấy thông tin loại xe máy với ID {motorcycle_id} thành công")
        t = result.scalars().one_or_none()
        return t
    except IntegrityError as e:
        logger.error(f"Lỗi khi lấy thông tin loại xe máy: {str(e)}")
        raise IntegrityError("Lỗi khi lấy thông tin loại xe máy")
    except Exception as e:
        logger.error(f"Lỗi không xác định: {str(e)}")
        raise e
    
async def create_motorcycle(db: AsyncSession, motorcycle: MotocycleCreate) -> Motocycle:
    """Tạo một loại xe máy mới."""
    try:
        new_motorcycle = Motocycle(**motorcycle.dict())
        db.add(new_motorcycle)
        await db.commit()
        await db.refresh(new_motorcycle)
        logger.info(f"Tạo loại xe máy mới thành công: {new_motorcycle}")
        return new_motorcycle
    except IntegrityError as e:
        await db.rollback()
        logger.error(f"Lỗi khi tạo loại xe máy: {str(e)}")
        raise IntegrityError("Lỗi khi tạo loại xe máy")
    except Exception as e:
        logger.error(f"Lỗi không xác định: {str(e)}")
        raise e 
async def update_motorcycle(db: AsyncSession, motorcycle_id: int, motorcycle_update: MotocycleUpdate) -> Motocycle:
    """Cập nhật thông tin loại xe máy."""
    try:
        stmt = (
            update(Motocycle)
            .where(Motocycle.motocycle_id == motorcycle_id)
            .values(**motorcycle_update.dict(exclude_unset=True))
        )
        await db.execute(stmt)
        await db.commit()
        logger.info(f"Cập nhật loại xe máy với ID {motorcycle_id} thành công")
        return await get_motorcycle_by_id(db, motorcycle_id)
    except IntegrityError as e:
        await db.rollback()
        logger.error(f"Lỗi khi cập nhật loại xe máy: {str(e)}")
        raise IntegrityError("Lỗi khi cập nhật loại xe máy")
    except Exception as e:
        logger.error(f"Lỗi không xác định: {str(e)}")
        raise e
async def delete_motorcycle(db: AsyncSession, motorcycle_id: int) -> bool:
    """Xóa một loại xe máy."""
    try:
        stmt = delete(Motocycle).where(Motocycle.motocycle_id == motorcycle_id)
        await db.execute(stmt)
        await db.commit()
        logger.info(f"Xóa loại xe máy với ID {motorcycle_id} thành công")
        return True
    except IntegrityError as e:
        await db.rollback()
        logger.error(f"Lỗi khi xóa loại xe máy: {str(e)}")
        raise IntegrityError("Lỗi khi xóa loại xe máy")
    except Exception as e:
        logger.error(f"Lỗi không xác định: {str(e)}")
        raise e
    
async def get_all_motorcycle_by_customer_id(db: AsyncSession, customer_id: int) -> list[Motocycle]:
    """Lấy danh sách tất cả xe máy của một khách hàng."""
    try:
        result = await db.execute(select(Motocycle).where(Motocycle.customer_id == customer_id))
        motorcycles = result.scalars().all()
        logger.info(f"Lấy danh sách xe máy của khách hàng với ID {customer_id} thành công")
        return motorcycles
    except Exception as e:
        logger.error(f"Lỗi không xác định: {str(e)}")
        raise e