from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete
from sqlalchemy.exc import IntegrityError, MultipleResultsFound
from sqlalchemy.orm import selectinload

from utils.logger import get_logger
from models.models import ServiceOrderDetail
from schemas.service_order_detail import ServiceOrderDetailCreate, ServiceOrderDetailUpdate, ServiceOrderDetailResponse

logger = get_logger(__name__)

async def create_service_order_detail(db: AsyncSession, service_detail: List[ServiceOrderDetailCreate]) -> List[ServiceOrderDetail]:
    """Tạo mới ServiceOrderDetail"""
    
    try:
        db_service_order_details = []
        for service in service_detail:
            service_order_detail = await db.execute(
                select(ServiceOrderDetail).where(
                    ServiceOrderDetail.service_id == service.service_id,
                    ServiceOrderDetail.order_id == service.order_id,
                )
            )
            existing_service_order_detail = service_order_detail.scalars().one_or_none()
            # Nếu đã tồn tại chi tiết đơn hàng dịch vụ với cùng mã dịch vụ và mã đơn hàng, bỏ qua
            if existing_service_order_detail:
                continue
            # Tạo đối tượng PartOrderDetail từ từng phần tử trong danh sách
            db_service_order_detail = ServiceOrderDetail(**service.dict())
            db.add(db_service_order_detail)
            db_service_order_details.append(db_service_order_detail)

        # Commit tất cả thay đổi
        await db.commit()

        # Làm mới tất cả các đối tượng đã thêm
        for db_service_order_detail in db_service_order_details:
            await db.refresh(db_service_order_detail)

        return db_service_order_details
    except IntegrityError as e:
        logger.error(f"Lỗi toàn vẹn dữ liệu khi tạo chi tiết phụ tùng đơn hàng: {str(e)}")
        await db.rollback()
        raise e
    except Exception as e:
        logger.error(f"Lỗi không xác định khi tạo chi tiết phụ tùng đơn hàng: {str(e)}")
        await db.rollback()
        raise e

    
    # try:
    #     db_part_order_details = []
    #     for part in part_detail:
    #         # Tạo đối tượng PartOrderDetail từ từng phần tử trong danh sách
    #         db_part_order_detail = PartOrderDetail(**part.dict())
    #         db.add(db_part_order_detail)
    #         db_part_order_details.append(db_part_order_detail)

    #     # Commit tất cả thay đổi
    #     await db.commit()

    #     # Làm mới tất cả các đối tượng đã thêm
    #     for db_part_order_detail in db_part_order_details:
    #         await db.refresh(db_part_order_detail)

    #     return db_part_order_details
    # except IntegrityError as e:
    #     logger.error(f"Lỗi toàn vẹn dữ liệu khi tạo chi tiết phụ tùng đơn hàng: {str(e)}")
    #     await db.rollback()
    #     raise e
    # except Exception as e:
    #     logger.error(f"Lỗi không xác định khi tạo chi tiết phụ tùng đơn hàng: {str(e)} | Dữ liệu: {[part.dict() for part in part_detail]}")
    #     await db.rollback()
    #     raise e

async def get_all_service_order_details(db: AsyncSession, skip: int = 0, limit: int = 100) -> list[ServiceOrderDetail]:
    """Lấy tất cả ServiceOrderDetail"""
    result = await db.execute(
        select(ServiceOrderDetail).options(selectinload(ServiceOrderDetail.order)).order_by(ServiceOrderDetail.service_detail_ID.asc()).offset(skip).limit(limit)
    )
    return result.scalars().all()

async def get_service_order_detail_by_id(db: AsyncSession, service_detail_ID: int) -> ServiceOrderDetail:
    """Lấy ServiceOrderDetail theo ID"""
    result = await db.execute(select(ServiceOrderDetail).where(ServiceOrderDetail.service_detail_ID == service_detail_ID))
    service_order_detail = result.scalars().one_or_none()
    return service_order_detail

async def get_all_service_details_by_order_id(db: AsyncSession, order_id: int) -> list[ServiceOrderDetail]:
    """Lấy tất cả ServiceOrderDetail theo order_id"""
    result = await db.execute(select(ServiceOrderDetail).where(ServiceOrderDetail.order_id == order_id))
    service_order_details = result.scalars().all()
    return service_order_details

async def update_service_order_detail(db: AsyncSession, service_detail_ID: int, service_detail: ServiceOrderDetailUpdate) -> ServiceOrderDetail:
    """Cập nhật ServiceOrderDetail""" 
    db_service_order_detail = await get_service_order_detail_by_id(db, service_detail_ID)
    if not db_service_order_detail:
        raise ValueError(f"Không tìm dịch vụ với ID: {service_detail_ID}")
        
    update_data = service_detail.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_service_order_detail, key, value)
        
    await db.commit()
    await db.refresh(db_service_order_detail)
    return db_service_order_detail

    
