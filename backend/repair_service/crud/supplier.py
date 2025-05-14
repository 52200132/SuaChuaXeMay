from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete
from sqlalchemy.exc import IntegrityError, MultipleResultsFound
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta

from utils.logger import get_logger
from models.models_2 import Supplier
from schemas.supplier import SupplierCreate, SupplierUpdate, SupplierResponse

logger = get_logger(__name__)

async def create(db: AsyncSession, supplier: SupplierCreate) -> Supplier:
    """Tạo nhà cung cấp mới trong cơ sở dữ liệu"""
    try:
        logger.info(f"Tạo nhà cung cấp mới với thông tin: {supplier}")
        db_supplier = Supplier(name=supplier.name, address=supplier.address, phone_number=supplier.phone_number)
        
        db.add(db_supplier)
        await db.commit()
        await db.refresh(db_supplier)
        return db_supplier
    except IntegrityError as e:
        await db.rollback()
        logger.error(f"Lỗi khi tạo nhà cung cấp: {str(e)}")
        raise ValueError("Nhà cung cấp đã tồn tại")
    except Exception as e:
        await db.rollback()
        logger.error(f"Lỗi không xác định khi tạo nhà cung cấp: {str(e)}")
        raise ValueError("Lỗi không xác định khi tạo nhà cung cấp")

async def get_all(db: AsyncSession, skip: int = 0, limit: int = 100) -> list[Supplier]:
    """Lấy danh sách nhà cung cấp với phân trang"""
    result = await db.execute(select(Supplier).order_by(Supplier.supplier_id.desc()).offset(skip).limit(limit))
    return result.scalars().all()

async def get_supplier_by_id(db: AsyncSession, supplier_id: int) -> Supplier:
    """Lấy thông tin nhà cung cấp theo ID"""
    result = await db.execute(select(Supplier).where(Supplier.supplier_id == supplier_id))
    db_supplier = result.scalar_one_or_none()
    return db_supplier

async def update(db: AsyncSession, db_supplier: Supplier, supplier: SupplierUpdate) -> Supplier:
    """Cập nhật thông tin nhà cung cấp"""
    try:
        update_data = supplier.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_supplier, key, value)
        
        await db.commit()
        await db.refresh(db_supplier)
        return db_supplier
    except IntegrityError as e:
        await db.rollback()
        logger.error(f"Lỗi khi cập nhật nhà cung cấp: {str(e)}")
        raise ValueError("Nhà cung cấp đã tồn tại")
    except Exception as e:
        await db.rollback()
        logger.error(f"Lỗi không xác định khi cập nhật nhà cung cấp: {str(e)}")
        raise ValueError("Lỗi không xác định khi cập nhật nhà cung cấp")