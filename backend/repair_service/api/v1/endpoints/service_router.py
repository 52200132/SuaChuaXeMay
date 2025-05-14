from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
import logging

from db.session import get_db
from schemas.service import ServiceCreate, ServiceResponse, ServiceUpdate, ServicesPage, ServiceDetailResponse
from crud import service as service_crud
from services import service_servies
from schemas.views.service import ServiceView
from api.v1.endpoints.url import URLS

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post(URLS['SERVICE']['CREATE_SERVICE'], response_model=ServiceResponse)
async def create_service(
    service_in: ServiceCreate, 
    db: AsyncSession = Depends(get_db)
):
    """
    Tạo mới một dịch vụ.
    """
    try:
        service = await service_crud.create_service(db, service_in)
        return service
    except IntegrityError as e:
        logger.error(f"Lỗi toàn vẹn dữ liệu khi tạo dịch vụ: {e}")
        raise HTTPException(status_code=400, detail=f"Lỗi toàn vẹn dữ liệu: Có thể dịch vụ đã tồn tại hoặc service_type_id không hợp lệ")
    except Exception as e:
        logger.error(f"Lỗi khi tạo dịch vụ: {e}")
        raise HTTPException(status_code=500, detail=f"Không thể tạo dịch vụ: {str(e)}")

@router.get(URLS['SERVICE']['GET_ALL_SERVICES'], response_model=List[ServiceResponse])
async def get_services(
    db: AsyncSession = Depends(get_db)
):
    """
    Lấy danh sách tất cả dịch vụ.
    """
    try:
        services = await service_crud.get_services(db)
        return services
    except Exception as e:
        logger.error(f"Lỗi khi lấy danh sách dịch vụ: {e}")
        raise HTTPException(status_code=500, detail=f"Không thể lấy danh sách dịch vụ: {str(e)}")

@router.get(URLS['SERVICE']['GET_SERVICE_BY_ID'], response_model=ServiceDetailResponse)
async def get_service_by_id(service_id: int, db: AsyncSession = Depends(get_db)):
    """
    Lấy thông tin chi tiết của một dịch vụ theo ID.
    """
    try:
        service_detail = await service_crud.get_service_with_type_details(db, service_id)
        if not service_detail:
            raise HTTPException(status_code=404, detail=f"Không tìm thấy dịch vụ với ID: {service_id}")
        return service_detail
    except HTTPException:
        raise
    except IntegrityError as e:
        logger.error(f"Lỗi toàn vẹn dữ liệu khi lấy thông tin dịch vụ: {e}")
        raise HTTPException(status_code=400, detail=f"Lỗi toàn vẹn dữ liệu khi truy vấn thông tin dịch vụ")
    except Exception as e:
        logger.error(f"Lỗi khi lấy thông tin dịch vụ ID {service_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Không thể lấy thông tin dịch vụ: {str(e)}")

@router.get(URLS['SERVICE']['GET_SERVICE_VIEWS_BY_PARENT_MOTO_TYPE'], response_model=List[ServiceView])
async def get_service_views_by_moto_type(
    parent_moto_type: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Lấy danh sách dịch vụ tương thích với loại xe máy.
    """
    try:
        services = await service_servies.get_service_views_by_parent_moto_type(db, parent_moto_type)
        return services
    except IntegrityError as e:
        logger.error(f"Lỗi toàn vẹn dữ liệu khi lấy dịch vụ theo loại xe {parent_moto_type}: {e}")
        raise HTTPException(status_code=400, detail=f"Lỗi toàn vẹn dữ liệu khi truy vấn dịch vụ theo loại xe")
    except Exception as e:
        logger.error(f"Lỗi khi lấy dịch vụ theo loại xe {parent_moto_type}: {e}")
        raise HTTPException(status_code=500, detail=f"Không thể lấy dịch vụ theo loại xe: {str(e)}")

@router.put(URLS['SERVICE']['UPDATE_SERVICE'], response_model=ServiceResponse)
async def update_service(
    service_id: int,
    service_update: ServiceUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Cập nhật thông tin dịch vụ.
    """
    try:
        service = await service_crud.update_service(db, service_id, service_update)
        if not service:
            raise HTTPException(status_code=404, detail=f"Không tìm thấy dịch vụ với ID: {service_id}")
        return service
    except HTTPException:
        raise
    except IntegrityError as e:
        logger.error(f"Lỗi toàn vẹn dữ liệu khi cập nhật dịch vụ ID {service_id}: {e}")
        raise HTTPException(status_code=400, detail=f"Lỗi toàn vẹn dữ liệu: Có thể service_type_id không hợp lệ")
    except Exception as e:
        logger.error(f"Lỗi khi cập nhật dịch vụ ID {service_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Không thể cập nhật dịch vụ: {str(e)}")

@router.delete(URLS['SERVICE']['DELETE_SERVICE'], response_model=dict)
async def delete_service(service_id: int, db: AsyncSession = Depends(get_db)):
    """
    Xóa dịch vụ (soft delete).
    """
    try:
        success = await service_crud.delete_service(db, service_id)
        if not success:
            raise HTTPException(status_code=404, detail=f"Không tìm thấy dịch vụ với ID: {service_id}")
        return {"message": "Đã xóa dịch vụ thành công"}
    except HTTPException:
        raise
    except IntegrityError as e:
        logger.error(f"Lỗi toàn vẹn dữ liệu khi xóa dịch vụ ID {service_id}: {e}")
        raise HTTPException(status_code=400, detail=f"Lỗi toàn vẹn dữ liệu: Có thể dịch vụ đang được sử dụng")
    except Exception as e:
        logger.error(f"Lỗi khi xóa dịch vụ ID {service_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Không thể xóa dịch vụ: {str(e)}")

@router.get('/tessss/{order_id}')
async def get_service_order_detail_views_by_service_order_id(
    order_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Lấy danh sách dịch vụ theo ID đơn hàng.
    """
    try:
        services = await service_servies.get_service_order_detail_views_by_service_order_id(db, order_id)
        return services
    except IntegrityError as e:
        logger.error(f"Lỗi toàn vẹn dữ liệu khi lấy dịch vụ theo ID đơn hàng {order_id}: {e}")
        raise HTTPException(status_code=400, detail=f"Lỗi toàn vẹn dữ liệu khi truy vấn dịch vụ theo ID đơn hàng")
    except Exception as e:
        logger.error(f"Lỗi khi lấy dịch vụ theo ID đơn hàng {order_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Không thể lấy dịch vụ theo ID đơn hàng: {str(e)}")