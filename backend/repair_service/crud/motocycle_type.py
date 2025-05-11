from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from models.models_2 import MotocycleType
from schemas.motocycle_type import MotocycleTypeCreate, MotocycleTypeUpdate, MotocycleTypeResponse
from utils.logger import get_logger

log = get_logger(__name__)

async def get_all(db: AsyncSession) -> list[MotocycleTypeResponse]:
    """
    Lấy tất cả các loại xe máy từ cơ sở dữ liệu.
    """
    try:
        result = await db.execute(select(MotocycleType))
        return result.scalars().all()
    except IntegrityError as e:
        await db.rollback()
        log.error(f"Lỗi toàn vẹn dữ liệu khi lấy tất cả các loại xe máy: {e}")
        raise e
    except Exception as e:
        await db.rollback()
        log.error(f"Lỗi khi lấy tất cả các loại xe máy: {e}")
        raise e

async def get_brands(db: AsyncSession) -> list[str]:
    """
    Lấy tất cả các thương hiệu xe máy từ cơ sở dữ liệu.
    """
    try:
        result = await db.execute(select(MotocycleType.brand).distinct())
        return result.scalars().all()
    except IntegrityError as e:
        await db.rollback()
        log.error(f"Lỗi toàn vẹn dữ liệu khi lấy tất cả các thương hiệu: {e}")
        raise e
    except Exception as e:
        log.error(f"Lỗi khi lấy tất cả các thương hiệu: {e}")
        raise e

async def get_motocycle_types_by_brand(db: AsyncSession, brand: str) -> list[MotocycleTypeResponse]:
    """
    Lấy tất cả các loại xe máy theo thương hiệu từ cơ sở dữ liệu.
    """
    try:
        result = await db.execute(select(MotocycleType).where(MotocycleType.brand == brand))
        return result.scalars().all()
    except IntegrityError as e:
        await db.rollback()
        log.error(f'Lỗi toàn vẹn dữ liệu khi lấy các loại xe máy theo thương hiệu: {e}')
        raise e
    except Exception as e:
        log.error(f'Lỗi khi lấy các loại xe máy theo thương hiệu: {e}')
        raise e

async def create_motocycle_type(db: AsyncSession, moto_type: MotocycleTypeCreate) -> MotocycleType:
    """Tạo mới một loại xe máy"""
    try:
        db_moto_type = MotocycleType(
            brand=moto_type.brand,
            model=moto_type.model,
            type=moto_type.type
        )
        db.add(db_moto_type)
        await db.commit()
        await db.refresh(db_moto_type)
        return db_moto_type
    except IntegrityError as e:
        await db.rollback()
        log.error(f"Lỗi toàn vẹn dữ liệu khi tạo loại xe máy: {e}")
        raise e
    except Exception as e:
        await db.rollback()
        log.error(f"Lỗi khi tạo loại xe máy: {e}")
        raise e

async def get_motocycle_type_by_id(db: AsyncSession, moto_type_id: int) -> MotocycleType:
    """Lấy thông tin loại xe máy theo ID"""
    try:
        result = await db.get(MotocycleType, moto_type_id)
        if not result:
            return None
        return result
    except IntegrityError as e:
        log.error(f"Lỗi toàn vẹn dữ liệu khi lấy loại xe máy theo ID: {e}")
        raise e
    except Exception as e:
        log.error(f"Lỗi khi lấy loại xe máy theo ID: {e}")
        raise e

async def update_motocycle_type(db: AsyncSession, moto_type_id: int, moto_type: MotocycleTypeUpdate) -> MotocycleType:
    """Cập nhật thông tin loại xe máy"""
    try:
        db_moto_type = await get_motocycle_type_by_id(db, moto_type_id)
        if not db_moto_type:
            return None
            
        update_data = moto_type.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_moto_type, key, value)
            
        await db.commit()
        await db.refresh(db_moto_type)
        return db_moto_type
    except IntegrityError as e:
        await db.rollback()
        log.error(f"Lỗi toàn vẹn dữ liệu khi cập nhật loại xe máy: {e}")
        raise e
    except Exception as e:
        await db.rollback()
        log.error(f"Lỗi khi cập nhật loại xe máy: {e}")
        raise e

async def delete_motocycle_type(db: AsyncSession, moto_type_id: int) -> bool:
    """Xóa một loại xe máy"""
    try:
        db_moto_type = await get_motocycle_type_by_id(db, moto_type_id)
        if not db_moto_type:
            return False
            
        await db.delete(db_moto_type)
        await db.commit()
        return True
    except IntegrityError as e:
        await db.rollback()
        log.error(f"Lỗi toàn vẹn dữ liệu khi xóa loại xe máy: {e}")
        raise e
    except Exception as e:
        await db.rollback()
        log.error(f"Lỗi khi xóa loại xe máy: {e}")
        raise e
