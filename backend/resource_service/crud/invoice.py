from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete
from sqlalchemy.exc import IntegrityError, MultipleResultsFound
from sqlalchemy.orm import selectinload
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import status


from utils.logger import get_logger
from models.models import Invoice
from schemas.invoice import InvoiceCreate, InvoiceUpdate, InvoiceResponse

logger = get_logger(__name__)

# CRUD for Invoice

async def create_invoice(db: AsyncSession, invoice: InvoiceCreate) -> Invoice:
    """Tạo một hóa đơn mới"""
    try:
        # Tạo đối tượng hóa đơn
        db_invoice = Invoice(
            order_id=invoice.order_id,
            total_price=invoice.total_price,
            is_paid=invoice.is_paid,
            # create_at sẽ tự động lấy thời gian hiện tại
        )
        
        db.add(db_invoice)
        await db.commit()
        await db.refresh(db_invoice)
        
        return db_invoice
    except IntegrityError as e:
        await db.rollback()
        logger.error(f"Lỗi khi tạo hóa đơn: {str(e)}")
        raise IntegrityError(f"{str(e)}")
    except Exception as e:
        await db.rollback()
        logger.error(f"Lỗi khi tạo hóa đơn: {str(e)}")
        raise Exception(f"{str(e)}")

async def get_invoice_by_id(db: AsyncSession, invoice_id: int) -> Optional[Invoice]:
    """Lấy thông tin một hóa đơn theo ID"""
    result = await db.execute(
        select(Invoice).where(Invoice.invoice_id == invoice_id)
    )
    return result.scalar_one_or_none()

async def get_invoices_by_order(
    db: AsyncSession, 
    order_id: int,
    skip: int = 0,
    limit: int = 100
) -> List[Invoice]:
    """Lấy danh sách hóa đơn của một đơn hàng"""
    result = await db.execute(
        select(Invoice)
        .where(Invoice.order_id == order_id)
        .order_by(Invoice.create_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()

async def get_invoices_by_staff(
    db: AsyncSession, 
    staff_id: int,
    skip: int = 0,
    limit: int = 100
) -> List[Invoice]:
    """Lấy danh sách hóa đơn của một nhân viên"""
    result = await db.execute(
        select(Invoice)
        .where(Invoice.staff_id == staff_id)
        .order_by(Invoice.create_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()

async def get_invoices_by_date_range(
    db: AsyncSession, 
    start_date: datetime, 
    end_date: datetime,
    skip: int = 0,
    limit: int = 100
) -> List[Invoice]:
    """Lấy danh sách hóa đơn trong khoảng thời gian"""
    result = await db.execute(
        select(Invoice)
        .where(
            Invoice.create_at >= start_date,
            Invoice.create_at <= end_date
        )
        .order_by(Invoice.create_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()

async def get_all_invoices(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100
) -> List[Invoice]:
    """Lấy tất cả hóa đơn"""
    result = await db.execute(
        select(Invoice)
        .order_by(Invoice.invoice_id.asc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()

async def update_invoice(
    db: AsyncSession,
    invoice_id: int,
    invoice_update: InvoiceUpdate
) -> Optional[Invoice]:
    """Cập nhật thông tin hóa đơn"""
    try:
        db_invoice = await get_invoice_by_id(db, invoice_id)
        if not db_invoice:
            return None
        
        # Chuẩn bị dữ liệu cập nhật
        update_data = invoice_update.dict(exclude_unset=True)
        
        # Cập nhật hóa đơn
        if update_data:
            stmt = update(Invoice).where(
                Invoice.invoice_id == invoice_id
            ).values(**update_data)
            await db.execute(stmt)
        
        await db.commit()
        return await get_invoice_by_id(db, invoice_id)
        
    except Exception as e:
        await db.rollback()
        logger.error(f"Lỗi khi cập nhật hóa đơn: {str(e)}")
        raise ValueError(f"Không thể cập nhật hóa đơn: {str(e)}")

async def delete_invoice(
    db: AsyncSession,
    invoice_id: int
) -> bool:
    """Xóa hóa đơn"""
    try:
        db_invoice = await get_invoice_by_id(db, invoice_id)
        if not db_invoice:
            return False
        
        # Xóa hóa đơn
        stmt = delete(Invoice).where(Invoice.invoice_id == invoice_id)
        await db.execute(stmt)
        await db.commit()
        
        return True
        
    except Exception as e:
        await db.rollback()
        logger.error(f"Lỗi khi xóa hóa đơn: {str(e)}")
        raise ValueError(f"Không thể xóa hóa đơn: {str(e)}")

async def get_invoice_with_filter(
    db: AsyncSession,
    staff_id: Optional[int] = None,
    invoice_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 100
) -> List[Invoice]:
    """Lấy danh sách hóa đơn với các bộ lọc"""
    try:
        query = select(Invoice)
        
        if staff_id:
            query = query.where(Invoice.staff_id == staff_id)
        
        if invoice_id:
            query = query.where(Invoice.invoice_id == invoice_id)
        
        # Handle case where only one date is provided
        if start_date and not end_date:
            query = query.where(Invoice.create_at >= start_date)
        elif end_date and not start_date:
            query = query.where(Invoice.create_at <= end_date)
        elif start_date and end_date:
            query = query.where(
                Invoice.create_at >= start_date,
                Invoice.create_at <= end_date
            )
        
        query = query.order_by(Invoice.create_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        
    except IntegrityError as e:
        await db.rollback()
        logger.error(f"Lỗi khi lấy danh sách hóa đơn: {str(e)}")
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Integrity Error")
    except Exception as e:
        logger.error(f"Lỗi khi lấy danh sách hóa đơn: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
        
    return result.scalars().all()