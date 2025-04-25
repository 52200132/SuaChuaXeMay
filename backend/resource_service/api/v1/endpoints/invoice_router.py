from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from datetime import datetime, timedelta

from db.session import get_db
from crud import invoice as invoice_crud
from schemas.invoice import InvoiceCreate, InvoiceUpdate, InvoiceResponse
from utils.logger import get_logger
from .url import URLS

router = APIRouter()

logger = get_logger(__name__)

@router.post(URLS['INVOICE']['CREATE'], response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
async def create_invoice(invoice_data: InvoiceCreate, db: AsyncSession = Depends(get_db)):
    """
    Tạo hóa đơn mới.
    
    - **order_id**: ID của đơn hàng
    - **total_price**: Tổng tiền của hóa đơn
    """
    try:
        new_invoice = await invoice_crud.create_invoice(db, invoice_data)
        return InvoiceResponse.from_orm(new_invoice)
    except Exception as e:
        logger.error(f"Lỗi khi tạo hóa đơn: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get(URLS['INVOICE']['GET_ALL_INVOICES'], response_model=List[InvoiceResponse])
async def get_all_invoices(
    skip: int = Query(0, ge=0, description="Số bản ghi bỏ qua"),
    limit: int = Query(100, ge=1, le=100, description="Số bản ghi lấy tối đa"),
    db: AsyncSession = Depends(get_db)
):
    """
    Lấy danh sách tất cả hóa đơn.
    
    - Trả về danh sách các hóa đơn trong cơ sở dữ liệu.
    """
    invoices = await invoice_crud.get_all_invoices(db, skip=skip, limit=limit)
    logger.info("Fetched all invoices successfully")
    
    return invoices

@router.get(URLS['INVOICE']['GET_INVOICES_BY_DATE_RANGE'], response_model=List[InvoiceResponse])
async def get_invoices_by_date_range(
    start_date: datetime = Query(..., description="Ngày bắt đầu"),
    end_date: datetime = Query(..., description="Ngày kết thúc"),
    skip: int = Query(0, ge=0, description="Số bản ghi bỏ qua"),
    limit: int = Query(100, ge=1, le=100, description="Số bản ghi lấy tối đa"),
    db: AsyncSession = Depends(get_db)
):
    """
    Lấy danh sách hóa đơn trong khoảng thời gian từ start_date đến end_date.
    
    - **start_date**: Ngày bắt đầu (bao gồm)
    - **end_date**: Ngày kết thúc (bao gồm)
    """
    if start_date >= end_date:
        logger.error("Ngày bắt đầu phải trước ngày kết thúc")
        raise HTTPException(status_code=400, detail="Ngày bắt đầu phải trước ngày kết thúc")
    
    invoices = await invoice_crud.get_invoices_by_date_range(db, start_date, end_date, skip=skip, limit=limit)
    logger.info(f"Fetched {len(invoices)} invoices in date range successfully")
    
    return invoices

@router.get(URLS['INVOICE']['GET_ALL_TODAY'], response_model=List[InvoiceResponse])
async def get_invoices_today(
    skip: int = Query(0, ge=0, description="Số bản ghi bỏ qua"),
    limit: int = Query(100, ge=1, le=100, description="Số bản ghi lấy tối đa"),
    db: AsyncSession = Depends(get_db)
):
    """
    Lấy danh sách hóa đơn được tạo trong ngày hôm nay.
    """
    today = datetime.now().date()
    tomorrow = today + timedelta(days=1)
    today_start = datetime.combine(today, datetime.min.time())
    today_end = datetime.combine(tomorrow, datetime.min.time())
    
    invoices = await invoice_crud.get_invoices_by_date_range(db, today_start, today_end, skip=skip, limit=limit)
    logger.info(f"Fetched {len(invoices)} invoices for today successfully")
    
    return invoices

@router.get(URLS['INVOICE']['FILTER'], response_model=List[InvoiceResponse])
async def filter_invoices(
    skip: int = Query(0, ge=0, description="Số bản ghi bỏ qua"),
    limit: int = Query(100, ge=1, le=100, description="Số bản ghi lấy tối đa"),
    staff_id: Optional[int] = Query(None, description="Lọc theo ID nhân viên"),
    start_date: Optional[datetime] = Query(None, description="Ngày bắt đầu"),
    end_date: Optional[datetime] = Query(None, description="Ngày kết thúc"),
    db: AsyncSession = Depends(get_db)
):
    """
    Lấy danh sách hóa đơn với các tùy chọn lọc.
    
    - Có thể lọc theo ID nhân viên, ID đơn hàng hoặc khoảng thời gian.
    - Có thể phân trang kết quả với tham số skip và limit.
    """
    invoices = await invoice_crud.get_invoice_with_filter(
        db, 
        staff_id=staff_id, 
        start_date=start_date, 
        end_date=end_date,
        skip=skip,
        limit=limit
    )
    
    logger.info("Fetched invoices with filters successfully")
    
    return invoices

# @router.get("/staff/{staff_id}", response_model=List[InvoiceResponse])
# async def get_invoices_by_staff(
#     staff_id: int = Path(..., ge=1, description="ID của nhân viên"),
#     skip: int = Query(0, ge=0, description="Số bản ghi bỏ qua"),
#     limit: int = Query(100, ge=1, le=100, description="Số bản ghi lấy tối đa"),
#     db: AsyncSession = Depends(get_db)
# ):
#     """
#     Lấy danh sách hóa đơn được tạo bởi một nhân viên cụ thể.
    
#     - **staff_id**: ID của nhân viên
#     """
#     invoices = await invoice_crud.get_invoices_by_staff(db, staff_id, skip=skip, limit=limit)
#     logger.info(f"Fetched invoices for staff ID {staff_id} successfully")
    
#     return invoices

# @router.get("/order/{order_id}", response_model=List[InvoiceResponse])
# async def get_invoices_by_order(
#     order_id: int = Path(..., ge=1, description="ID của đơn hàng"),
#     skip: int = Query(0, ge=0, description="Số bản ghi bỏ qua"),
#     limit: int = Query(100, ge=1, le=100, description="Số bản ghi lấy tối đa"),
#     db: AsyncSession = Depends(get_db)
# ):
#     """
#     Lấy danh sách hóa đơn của một đơn hàng cụ thể.
    
#     - **order_id**: ID của đơn hàng
#     """
#     invoices = await invoice_crud.get_invoices_by_order(db, order_id, skip=skip, limit=limit)
#     logger.info(f"Fetched invoices for order ID {order_id} successfully")
    
#     return invoices

@router.get(URLS['INVOICE']['GET_INVOICE_BY_ID'], response_model=InvoiceResponse)
async def get_invoice_by_id(
    invoice_id: int = Path(..., ge=1, description="ID của hóa đơn"),
    db: AsyncSession = Depends(get_db)
):
    """
    Lấy thông tin chi tiết của một hóa đơn theo ID.
    
    - **invoice_id**: ID của hóa đơn
    """
    invoice = await invoice_crud.get_invoice_by_id(db, invoice_id)
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Không tìm thấy hóa đơn")
    
    return InvoiceResponse.from_orm(invoice)

@router.put(URLS['INVOICE']['UPDATE_INVOICE'], response_model=InvoiceResponse)
async def update_invoice(
    invoice_data: InvoiceUpdate,
    invoice_id: int = Path(..., ge=1, description="ID của hóa đơn"),
    db: AsyncSession = Depends(get_db)
):
    """
    Cập nhật thông tin hóa đơn.
    
    Các trường có thể cập nhật:
    - **total_price**: Tổng tiền của hóa đơn
    - **payment_method**: Phương thức thanh toán
    """
    try:
        updated_invoice = await invoice_crud.update_invoice(
            db, invoice_id, invoice_data
        )
        if not updated_invoice:
            raise HTTPException(status_code=404, detail="Không tìm thấy hóa đơn")
        return updated_invoice
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# @router.delete("/{invoice_id}", status_code=status.HTTP_204_NO_CONTENT)
# async def delete_invoice(
#     invoice_id: int = Path(..., ge=1, description="ID của hóa đơn"),
#     db: AsyncSession = Depends(get_db)
# ):
#     """
#     Xóa hóa đơn.
#     """
#     try:
#         is_deleted = await invoice_crud.delete_invoice(db, invoice_id)
#         if not is_deleted:
#             raise HTTPException(status_code=404, detail="Không tìm thấy hóa đơn")
#     except ValueError as e:
#         raise HTTPException(status_code=400, detail=str(e))
    
#     return None

@router.get(URLS['INVOICE']['GET_INVOICE_BY_ORDER_ID'], response_model=InvoiceResponse)
async def get_invoice_by_order_id(
    order_id: int = Path(..., ge=1, description="ID của đơn hàng"),
    db: AsyncSession = Depends(get_db)
):
    """
    Lấy thông tin hóa đơn theo ID đơn hàng.
    
    - **order_id**: ID của đơn hàng
    """
    invoice = await invoice_crud.get_invoice_by_order_id(db, order_id)
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Không tìm thấy hóa đơn")
    
    return InvoiceResponse.from_orm(invoice)