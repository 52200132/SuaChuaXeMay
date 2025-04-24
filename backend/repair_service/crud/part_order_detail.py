from typing import List
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete
from sqlalchemy.exc import IntegrityError, MultipleResultsFound
from sqlalchemy.orm import selectinload

from utils.logger import get_logger
from models.models import PartOrderDetail
from schemas.part_order_detail import PartOrderDetailCreate, PartOrderDetailUpdate, PartOrderDetailResponse

logger = get_logger(__name__)

async def create_part_order_details(db: AsyncSession, part_detail: List[PartOrderDetailCreate]) -> list[PartOrderDetail]:
    """Tạo mới một danh sách chi tiết đơn hàng phụ tùng"""
    try:
        db_part_order_details = []
        for part in part_detail:
            # Tạo đối tượng PartOrderDetail từ từng phần tử trong danh sách
            db_part_order_detail = PartOrderDetail(**part.dict())
            db.add(db_part_order_detail)
            db_part_order_details.append(db_part_order_detail)

        # Commit tất cả thay đổi
        await db.commit()

        # Làm mới tất cả các đối tượng đã thêm
        for db_part_order_detail in db_part_order_details:
            await db.refresh(db_part_order_detail)

        return db_part_order_details
    except IntegrityError as e:
        logger.error(f"Lỗi toàn vẹn dữ liệu khi tạo chi tiết phụ tùng đơn hàng: {str(e)}")
        await db.rollback()
        raise e
    except Exception as e:
        logger.error(f"Lỗi không xác định khi tạo chi tiết phụ tùng đơn hàng: {str(e)} | Dữ liệu: {[part.dict() for part in part_detail]}")
        await db.rollback()
        raise e

async def get_all_part_order_details(db: AsyncSession, skip: int = 0, limit: int = 100) -> list[PartOrderDetail]:
    """Lấy tất cả chi tiết đơn hàng phụ tùng"""
    result = await db.execute(select(PartOrderDetail).order_by(PartOrderDetail.part_detail_ID.asc()).offset(skip).limit(limit))
    return result.scalars().all()

async def get_all_part_order_details_by_order_id(db: AsyncSession, order_id: int) -> list[PartOrderDetail]:
    result = await db.execute(select(PartOrderDetail).where(PartOrderDetail.order_id == order_id))
    db_part_order_details = result.scalars().all()
    return db_part_order_details

async def get_part_order_detail_by_id(db: AsyncSession, part_detail_ID: int) -> PartOrderDetail:
    """Lấy thông tin chi tiết đơn hàng phụ tùng theo ID"""
    result = await db.execute(select(PartOrderDetail).where(PartOrderDetail.part_detail_ID == part_detail_ID))
    part_order_detail = result.scalars().one_or_none()
    return  part_order_detail

async def update_part_order_detail(db: AsyncSession, part_detail_ID: int, part_detail: PartOrderDetailUpdate) -> PartOrderDetail:
    """Cập nhật thông tin chi tiết đơn hàng phụ tùng"""
    db_part_order_detail = await get_part_order_detail_by_id(db, part_detail_ID)
    if not db_part_order_detail:
        raise  ValueError(f"Không tìm thấy chi tiết đơn hàng phụ tùng với ID: {part_detail_ID}")
    
    update_data = part_detail.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_part_order_detail, key, value)
    
    await db.commit()
    await db.refresh(db_part_order_detail)
    return db_part_order_detail
        
    