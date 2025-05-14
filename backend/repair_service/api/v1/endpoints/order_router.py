from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timedelta

from utils.logger import get_logger
from db.session import get_db
from schemas.order import OrderCreate, OrderUpdate, OrderResponse
from schemas.views.order import OrderDetailView
from crud import order as order_crud
from .url import URLS
from services import order_services

router = APIRouter()

logger = get_logger(__name__)

@router.get(URLS['ORDER']['GET_ALL_ORDERS'], response_model=List[OrderResponse])
async def get_all_orders(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    """Lấy danh sách đơn hàng"""
    db_order = await order_crud.get_all(db, skip=skip, limit=limit)
    return db_order

@router.get(URLS['ORDER']['GET_ORDER_BY_ID'], response_model=OrderResponse)
async def get_orders_by_id(order_id: int, db: AsyncSession = Depends(get_db)):
    db_order = await order_crud.get_order_by_id(db, order_id=order_id)
    if db_order is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng")
    return OrderResponse.from_orm(db_order)

@router.get(URLS['ORDER']['GET_ALL_ORDERS_BY_MOTO_ID'], response_model=List[OrderResponse])
async def get_orders_by_moto_id(motocycle_id: int, db: AsyncSession = Depends(get_db)):
    db_orders = await order_crud.get_orders_by_motorcycle_id(db, motocycle_id=motocycle_id)
    return db_orders

@router.post(URLS['ORDER']['CREATE_ORDER'], response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_new_order(order: OrderCreate, db: AsyncSession = Depends(get_db)):
    try:
        db_order = await order_crud.create_order(db=db, order=order)
        return OrderResponse.from_orm(db_order)
    except IntegrityError as e:
        await db.rollback()
        logger.error(f"Lỗi khi tạo đơn hàng: {str(e)}")
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Thông tin không hợp lệ")
    except Exception as e:
        logger.error(f"Lỗi khi tạo đơn hàng: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.put(URLS['ORDER']['UPDATE_ORDER'], response_model=OrderResponse)
async def update_order(order_id: int, order: OrderUpdate, db: AsyncSession = Depends(get_db)):
    try:
        db_order = await order_crud.update_order(db, order_id=order_id, order=order)
        return OrderResponse.from_orm(db_order)
    except IntegrityError as e:
        await db.rollback()
        logger.error(f"Lỗi khi cập nhật đơn hàng: {str(e)}")
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Thông tin không hợp lệ")
    except Exception as e:
        logger.error(f"Lỗi khi cập nhật đơn hàng: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    
@router.put(URLS['ORDER']['ASSIGN_STAFF'], response_model=OrderResponse)
async def assign_staff_to_order(
    order_id: int,
    staff_id: int,
    db: AsyncSession = Depends(get_db)
):
    try:
        order = OrderUpdate(staff_id=staff_id)
        db_order = await order_crud.update_order(db, order_id=order_id, order=order)
        return OrderResponse.from_orm(db_order)
    except IntegrityError as e:
        await db.rollback()
        logger.error(f"Lỗi khi phân công: {str(e)}")
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Phân viên không hợp lệ")
    except Exception as e:
        logger.error(f"Lỗi khi phân công: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get(URLS['ORDER']['GET_ALL_ORDERS_BY_STAFF_ID_TODAY'], response_model=List[OrderResponse])
async def get_all_orders_by_staff_id_today(staff_id: int, db: AsyncSession = Depends(get_db)):
    """Lấy danh sách đơn hàng của nhân viên trong ngày"""
    try:
        date = datetime.now().date()
        db_orders = await order_crud.get_orders_with_filters(db, staff_id=staff_id)
        return db_orders
    except IntegrityError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except Exception as e:
        logger.error(f"Lỗi khi lấy danh sách đơn hàng của nhân viên trong ngày: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))



from schemas.views.order import OrderViewForTable
from services import order_services

router_v2 = APIRouter()
@router_v2.get(URLS['ORDER_V2']['GET_ORDER_VIEWS_FOR_TABLE'], response_model=List[OrderViewForTable])
async def get_order_views_for_table(
    skip: int = 0,
    limit: int = 1000,
    db: AsyncSession = Depends(get_db)
):
    """
    Lấy danh sách đơn hàng để hiển thị trên bảng
    """
    try:
        db_orders = await order_services.get_order_views_for_table(db, skip=skip, limit=limit)
        return db_orders
    except IntegrityError as e:
        logger.error(f"Lỗi toàn vẹn: {str(e)}")
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Lỗi toàn vẹn")
    except Exception as e:
        logger.error(f"Lỗi khi lấy danh sách đơn hàng: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router_v2.get(URLS['ORDER_V2']['GET_ORDER_DETAIL_BY_ID'], response_model=OrderDetailView)
async def get_order_details_by_id(
    order_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Lấy thông tin chi tiết của một đơn hàng theo ID.
    """
    try:
        db_order = await order_services.get_order_details_by_id(db, order_id=order_id)
        if not db_order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy đơn hàng")
        return db_order
    except IntegrityError as e:
        logger.error(f"Lỗi toàn vẹn: {str(e)}")
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Lỗi toàn vẹn")
    except Exception as e:
        logger.error(f"Lỗi khi lấy thông tin chi tiết đơn hàng: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    
# invoice
from schemas.views.invoice import InvoiceView
from services import invoice_services
@router_v2.get(URLS['INVOICE_V2']['GET_INVOICE_VIEWS'], response_model=List[InvoiceView])
async def get_invoice_views(
    skip: int = 0,
    limit: int = 1000,
    db: AsyncSession = Depends(get_db)
):
    """
    Lấy danh sách hóa đơn để hiển thị trên bảng
    """
    try:
        db_invoices = await invoice_services.get_invoice_views(db, skip=skip, limit=limit)
        return db_invoices
    except IntegrityError as e:
        logger.error(f"Lỗi toàn vẹn: {str(e)}")
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Lỗi toàn vẹn")
    except Exception as e:
        logger.error(f"Lỗi khi lấy danh sách hóa đơn: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))