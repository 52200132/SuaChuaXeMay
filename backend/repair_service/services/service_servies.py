from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_, func

from utils.logger import get_logger
from schemas.views.service import ServiceView, ServiceOrderDetailView
from models.models_2 import Service, ServiceMotoType, ServiceOrderDetail

log = get_logger(__name__)

async def get_service_views_by_parent_moto_type(db: AsyncSession, parent_moto_type: str):
    """
    Lấy danh sách dịch vụ tương thích với một loại xe máy cha.
    """
    try:
        # Truy vấn lấy thông tin dịch vụ
        query = (
            select(
                Service,
                ServiceMotoType.price.label("price"),
                # ServiceMotoType.type.label("moto_type"),
            )
            .outerjoin(ServiceMotoType, Service.service_id == ServiceMotoType.service_id)
            .where(
                and_(
                    Service.is_deleted == False,
                    ServiceMotoType.type == parent_moto_type,
                )
            )
        )

        result = await db.execute(query)
        services_data = result.unique().all()

        result_list = []
        for service_info in services_data:
            service = service_info[0]  # Service object
            service_price = service_info[1]
            description = None
            # if service.description:
            #     description = service.description
            # print(service_info[2])

            service_view = ServiceView(
                service_id=service.service_id,
                name=service.name,
                description=description,
                price=service_price,
            )
            result_list.append(service_view)
        
        log.info(f"Lấy danh sách dịch vụ theo loại xe máy cha thành công: {parent_moto_type}")
        return result_list
    except IntegrityError as e:
        log.error(f"Lỗi toàn vẹn dữ liệu khi lấy dịch vụ theo loại xe máy cha: {e}")
        raise e
    except Exception as e:
        log.error(f"Lỗi khi lấy dịch vụ theo loại xe máy cha: {e}")
        raise e
    
async def get_service_order_detail_views_by_service_order_id(db: AsyncSession, order_id: int):
    """
    Lấy danh sách dịch vụ theo ID đơn hàng.
    """
    try:
        # Truy vấn lấy thông tin dịch vụ
        query = (
            select(
                ServiceOrderDetail,
                Service,
                ServiceMotoType.price.label("price"),
            )
            .outerjoin(Service, ServiceOrderDetail.service_id == Service.service_id)
            .outerjoin(ServiceMotoType, Service.service_id == ServiceMotoType.service_id)
            .where(
                ServiceOrderDetail.order_id == order_id,
            )
        )
        result = await db.execute(query)
        services_data = result.all()
        total_amount_for_service = 0

        result_list = []
        for service_info in services_data:
            service_order_detail = service_info[0]
            service = service_info[1]
            service_price = service_info[2]

            total_amount_for_service += service_price if service_order_detail.is_selected else 0

            service_view = ServiceOrderDetailView(
                service_detail_id=service_order_detail.service_order_detail_id,
                service_id=service.service_id,
                name=service.name,
                price=service_price,
                is_selected=service_order_detail.is_selected,
            )
            result_list.append(service_view)
        
        log.info(f"Lấy danh sách dịch vụ theo ID đơn hàng dịch vụ thành công: {order_id}")
        return {
            "service_order_details": result_list,
            "total_amount_for_service": total_amount_for_service
        }
    except IntegrityError as e:
        log.error(f"Lỗi toàn vẹn dữ liệu khi lấy dịch vụ theo ID đơn hàng dịch vụ: {e}")
        raise e
    except Exception as e:
        log.error(f"Lỗi khi lấy dịch vụ theo ID đơn hàng dịch vụ: {e}")
        raise e