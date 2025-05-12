from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete, func, and_
from typing import List, Optional, Dict, Any
from sqlalchemy.exc import IntegrityError

from models.models_2 import Service, ServiceType
from schemas.service import ServiceCreate, ServiceUpdate
from utils.logger import get_logger

log = get_logger(__name__)

async def create_service(db: AsyncSession, service: ServiceCreate) -> Service:
    """Tạo mới một dịch vụ"""
    try:
        db_service = Service(
            name=service.name,
            service_type_id=service.service_type_id,
            is_deleted=service.is_deleted
        )
        db.add(db_service)
        await db.commit()
        await db.refresh(db_service)
        return db_service
    except IntegrityError as e:
        await db.rollback()
        log.error(f"Lỗi toàn vẹn dữ liệu khi tạo dịch vụ: {e}")
        raise e
    except Exception as e:
        await db.rollback()
        log.error(f"Lỗi khi tạo dịch vụ: {e}")
        raise e

async def get_service(db: AsyncSession, service_id: int) -> Optional[Service]:
    """Lấy thông tin dịch vụ theo ID"""
    try:
        query = select(Service).where(
            and_(
                Service.service_id == service_id, 
                Service.is_deleted == False
            )
        )
        result = await db.execute(query)
        return result.scalars().first()
    except IntegrityError as e:
        log.error(f"Lỗi toàn vẹn dữ liệu khi lấy dịch vụ ID {service_id}: {e}")
        raise e
    except Exception as e:
        log.error(f"Lỗi khi lấy dịch vụ ID {service_id}: {e}")
        raise e

async def get_services(db: AsyncSession) -> List[Service]:
    """Lấy danh sách tất cả dịch vụ không phân trang"""
    try:
        query = select(Service).where(Service.is_deleted == False)
        result = await db.execute(query)
        return result.scalars().all()
    except IntegrityError as e:
        log.error(f"Lỗi toàn vẹn dữ liệu khi lấy danh sách dịch vụ: {e}")
        raise e
    except Exception as e:
        log.error(f"Lỗi khi lấy danh sách dịch vụ: {e}")
        raise e

async def update_service(db: AsyncSession, service_id: int, service_update: ServiceUpdate) -> Optional[Service]:
    """Cập nhật thông tin dịch vụ"""
    try:
        service = await get_service(db, service_id)
        if not service:
            return None
            
        update_data = service_update.dict(exclude_unset=True)
        
        for key, value in update_data.items():
            setattr(service, key, value)
            
        await db.commit()
        await db.refresh(service)
        return service
    except IntegrityError as e:
        await db.rollback()
        log.error(f"Lỗi toàn vẹn dữ liệu khi cập nhật dịch vụ ID {service_id}: {e}")
        raise e
    except Exception as e:
        await db.rollback()
        log.error(f"Lỗi khi cập nhật dịch vụ ID {service_id}: {e}")
        raise e

async def delete_service(db: AsyncSession, service_id: int) -> bool:
    """Xóa mềm dịch vụ (đánh dấu là đã xóa)"""
    try:
        service = await get_service(db, service_id)
        if not service:
            return False
        
        service.is_deleted = True
        await db.commit()
        return True
    except IntegrityError as e:
        await db.rollback()
        log.error(f"Lỗi toàn vẹn dữ liệu khi xóa dịch vụ ID {service_id}: {e}")
        raise e
    except Exception as e:
        await db.rollback()
        log.error(f"Lỗi khi xóa dịch vụ ID {service_id}: {e}")
        raise e
    
async def get_service_with_type_details(db: AsyncSession, service_id: int) -> Dict[str, Any]:
    """Lấy thông tin chi tiết dịch vụ và loại dịch vụ tương ứng"""
    try:
        query = select(Service, ServiceType).join(
            ServiceType, Service.service_type_id == ServiceType.service_type_id
        ).where(
            and_(
                Service.service_id == service_id,
                Service.is_deleted == False
            )
        )
        
        result = await db.execute(query)
        service_data = result.first()
        
        if not service_data:
            return None
            
        service, service_type = service_data
        
        service_dict = {
            "service_id": service.service_id,
            "name": service.name,
            "service_type_id": service.service_type_id,
            "is_deleted": service.is_deleted,
            "service_type": {
                "service_type_id": service_type.service_type_id,
                "name": service_type.name
            }
        }
        
        return service_dict
    except IntegrityError as e:
        log.error(f"Lỗi toàn vẹn dữ liệu khi lấy chi tiết dịch vụ ID {service_id}: {e}")
        raise e
    except Exception as e:
        log.error(f"Lỗi khi lấy chi tiết dịch vụ ID {service_id}: {e}")
        raise e
