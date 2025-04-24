from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import insert, update, delete, and_, or_
from sqlalchemy.exc import IntegrityError
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import selectinload

from utils.logger import get_logger
from models.models import ReceptionForm, ReceptionImage, Motocycle, Customer
from schemas.reception_from import (
    ReceptionFormCreate, 
    ReceptionFormUpdate, 
    ReceptionFormCreate2, 
    ReceptionFormCreateNoCustomerIdNoMotoCycleId, 
    ReceptionImageCreate
    )

logger = get_logger(__name__)

# CRUD for ReceptionForm
async def create_reception_form(db: AsyncSession, reception_form: ReceptionFormCreate) -> ReceptionForm:
    """Tạo một biểu mẫu tiếp nhận mới"""
    try:
        # Tạo đối tượng biểu mẫu tiếp nhận
        db_reception_form = ReceptionForm(
            motocycle_id=reception_form.motocycle_id,
            customer_id=reception_form.customer_id,
            staff_id=reception_form.staff_id,
            is_returned=reception_form.is_returned,
            initial_conditon=reception_form.initial_conditon,
            note=reception_form.note,
        )
        
        db.add(db_reception_form)
        await db.flush()  # Để lấy được ID của biểu mẫu mới tạo
        
        # Thêm các hình ảnh (nếu có)
        if reception_form.images:
            for image in reception_form.images:
                db_image = ReceptionImage(
                    form_id=db_reception_form.form_id,
                    URL=image.URL,
                    decription=image.decription
                )
                db.add(db_image)
        
        await db.commit()
        await db.refresh(db_reception_form)
        return db_reception_form
    except IntegrityError as e:
        await db.rollback()
        logger.error(f"Lỗi khi tạo biểu mẫu tiếp nhận: {str(e)}")
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Lỗi toàn vẹn dữ liệu: {str(e)}")
    except Exception as e:
        await db.rollback()
        logger.error(f"Lỗi khi tạo biểu mẫu tiếp nhận: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Không thể tạo biểu mẫu tiếp nhận: {str(e)}")

async def create_reception_form_without_motorcycle_id(
    db: AsyncSession, 
    reception_form: ReceptionFormCreate2
) -> ReceptionForm:
    """Tạo một biểu mẫu tiếp nhận mới mà không cần ID xe máy"""
    try:
        # Tạo đối tượng biểu mẫu tiếp nhận
        # Tạo câu lệnh insert với returning
        # ...existing code...

        stmt = insert(Motocycle).values(
            moto_type_id=reception_form.moto_type_id,
            customer_id=reception_form.customer_id,
            brand=reception_form.brand,
            model=reception_form.model,
            license_plate=reception_form.license_plate
        )

        # Thực thi câu lệnh INSERT
        await db.execute(stmt)

        # Lấy ID của xe máy vừa được chèn
        result = await db.execute(select(Motocycle.motocycle_id).order_by(Motocycle.motocycle_id.desc()).limit(1))
        motocycle_id = result.scalar_one()

        # ...existing code...
        
        db_reception_form = ReceptionForm(
            customer_id=reception_form.customer_id,
            motocycle_id=motocycle_id,
            staff_id=reception_form.staff_id,
            is_returned=reception_form.is_returned,
            initial_conditon=reception_form.initial_conditon,
            note=reception_form.note
        )
        
        db.add(db_reception_form)
        await db.flush()  # Để lấy được ID của biểu mẫu mới tạo
        
        # Thêm các hình ảnh (nếu có)
        if reception_form.images:
            for image in reception_form.images:
                db_image = ReceptionImage(
                    form_id=db_reception_form.form_id,
                    URL=image.URL,
                    decription=image.decription
                )
                db.add(db_image)
        
        await db.commit()
        await db.refresh(db_reception_form)
        return db_reception_form
    except IntegrityError as e:
        await db.rollback()
        logger.error(f"Lỗi khi tạo biểu mẫu tiếp nhận: {str(e)}")
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Lỗi toàn vẹn dữ liệu: {str(e)}")
    except Exception as e:
        await db.rollback()
        logger.error(f"Lỗi khi tạo biểu mẫu tiếp nhận: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Không thể tạo biểu mẫu tiếp nhận: {str(e)}")

async def create_reception_form_without_customer_id_and_without_motorcycle_id(
    db: AsyncSession, 
    reception_form: ReceptionFormCreateNoCustomerIdNoMotoCycleId
) -> ReceptionForm:
    """Tạo một biểu mẫu tiếp nhận mới mà không cần ID khách hàng và ID xe máy"""
    # Tạo customer
    customer = Customer(
        fullname=reception_form.fullname,
        phone_num=reception_form.phone_num,
        email=reception_form.email
    )
    db.add(customer)
    await db.flush()  # Để lấy được ID của khách hàng mới tạo
    customer_id = customer.customer_id

    # Tạo motocycle
    motocycle = Motocycle(
        customer_id=customer_id,
        moto_type_id=reception_form.moto_type_id,
        brand=reception_form.brand,
        model=reception_form.model,
        license_plate=reception_form.license_plate
    )
    db.add(motocycle)
    await db.flush()  # Để lấy được ID của xe máy mới tạo
    motocycle_id = motocycle.motocycle_id

    db_reception_form = await create_reception_form(
        db,
        ReceptionFormCreate(
            customer_id=customer_id,
            motocycle_id=motocycle_id,
            staff_id=reception_form.staff_id,
            is_returned=reception_form.is_returned,
            initial_conditon=reception_form.initial_conditon,
            note=reception_form.note,
            images=reception_form.images
        )
    )

    # logger.info(f"Đã tạo biểu mẫu tiếp nhận mới với ID: {db_reception_form.form_id}")

    return db_reception_form

async def get_reception_form_today(db: AsyncSession) -> List[ReceptionForm]:
    """Lấy danh sách biểu mẫu tiếp nhận trong ngày hôm nay"""
    result = await db.execute(
        select(ReceptionForm).options(selectinload(ReceptionForm.reception_images)).where(
            and_(
                ReceptionForm.created_at >= datetime.today().replace(hour=0, minute=0, second=0),
                ReceptionForm.created_at <= datetime.today().replace(hour=23, minute=59, second=59)
            )
        )
    )
    return result.scalars().all()

async def get_reception_form_by_range_date(
    db: AsyncSession, 
    start_date: datetime, 
    end_date: datetime
) -> List[ReceptionForm]:
    """Lấy danh sách biểu mẫu tiếp nhận trong khoảng thời gian"""
    result = await db.execute(
        select(ReceptionForm).options(selectinload(ReceptionForm.reception_images)).where(
            and_(
                ReceptionForm.created_at >= start_date,
                ReceptionForm.created_at <= end_date
            )
        )
    )
    return result.scalars().all()

async def get_reception_form_by_id(db: AsyncSession, form_id: int):
    result = await db.execute(
        select(ReceptionForm).options(selectinload(ReceptionForm.reception_images)).where(ReceptionForm.form_id == form_id)
    )
    return result.scalar_one_or_none()

async def get_reception_forms_by_customer(
    db: AsyncSession, 
    customer_id: int,
    skip: int = 0,
    limit: int = 100
) -> List[ReceptionForm]:
    """Lấy danh sách biểu mẫu tiếp nhận của một khách hàng"""
    result = await db.execute(
        select(ReceptionForm)
        .where(ReceptionForm.customer_id == customer_id)
        .order_by(ReceptionForm.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()

async def get_reception_forms_by_motorcycle(
    db: AsyncSession, 
    motocycle_id: int,
    skip: int = 0,
    limit: int = 100
) -> List[ReceptionForm]:
    """Lấy danh sách biểu mẫu tiếp nhận của một xe máy"""
    result = await db.execute(
        select(ReceptionForm)
        .where(ReceptionForm.motocycle_id == motocycle_id)
        .order_by(ReceptionForm.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()

async def get_all_reception_forms(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100
) -> List[ReceptionForm]:
    """Lấy tất cả biểu mẫu tiếp nhận"""
    try:
        result = await db.execute(
        select(ReceptionForm)
        .options(selectinload(ReceptionForm.reception_images))
        .order_by(ReceptionForm.form_id.asc())  
        .offset(skip)
        .limit(limit)
    )
    except IntegrityError as e:
        await db.rollback()
        logger.error(f"Lỗi khi lấy danh sách biểu mẫu tiếp nhận: {str(e)}")
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Lỗi toàn vẹn dữ liệu: {str(e)}")
    except Exception as e:
        await db.rollback()
        logger.error(f"Lỗi khi lấy danh sách biểu mẫu tiếp nhận: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Lỗi khi lấy danh sách biểu mẫu tiếp nhận: {str(e)}")
    return result.scalars().all()

async def update_reception_form(
    db: AsyncSession,
    form_id: int,
    reception_form_update: ReceptionFormUpdate
) -> Optional[ReceptionForm]:
    """Cập nhật thông tin biểu mẫu tiếp nhận"""
    try:
        db_reception_form = await get_reception_form_by_id(db, form_id)
        if not db_reception_form:
            return None
        
        # Chuẩn bị dữ liệu cập nhật
        update_data = reception_form_update.dict(exclude_unset=True)
        
        # Cập nhật biểu mẫu tiếp nhận
        if update_data:
            stmt = update(ReceptionForm).where(
                ReceptionForm.form_id == form_id
            ).values(**update_data)
            await db.execute(stmt)
        
        await db.commit()
        return await get_reception_form_by_id(db, form_id)
        
    except Exception as e:
        await db.rollback()
        logger.error(f"Lỗi khi cập nhật biểu mẫu tiếp nhận: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Không thể cập nhật biểu mẫu tiếp nhận: {str(e)}")

async def update_return_status(
    db: AsyncSession,
    form_id: int,
    is_returned: bool
) -> Optional[ReceptionForm]:
    """Cập nhật trạng thái trả xe"""
    try:
        db_reception_form = await get_reception_form_by_id(db, form_id)
        if not db_reception_form:
            raise ValueError(f"Không tìm phiếu tiếp nhận với ID: {form_id}")
        
        stmt = update(ReceptionForm).where(
            ReceptionForm.form_id == form_id
        ).values(is_returned=is_returned)
        await db.execute(stmt)
        await db.commit()
        
        return await get_reception_form_by_id(db, form_id)
        
    except Exception as e:
        await db.rollback()
        logger.error(f"Lỗi khi cập nhật trạng thái trả xe: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Không thể cập nhật trạng thái trả xe: {str(e)}")

async def delete_reception_form(
    db: AsyncSession,
    form_id: int
) -> bool:
    """Xóa biểu mẫu tiếp nhận"""
    try:
        db_reception_form = await get_reception_form_by_id(db, form_id)
        if not db_reception_form:
            return False
        
        # Xóa hình ảnh liên quan
        await delete_reception_images_by_form(db, form_id)
        
        # Xóa biểu mẫu tiếp nhận
        stmt = delete(ReceptionForm).where(ReceptionForm.form_id == form_id)
        await db.execute(stmt)
        await db.commit()
        
        return True
        
    except Exception as e:
        await db.rollback()
        logger.error(f"Lỗi khi xóa biểu mẫu tiếp nhận: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Không thể xóa biểu mẫu tiếp nhận: {str(e)}")

# CRUD for ReceptionImage
async def create_reception_image(db: AsyncSession, form_id: int, image: ReceptionImageCreate) -> ReceptionImage:
    """Tạo một hình ảnh mới cho biểu mẫu tiếp nhận"""
    try:
        db_image = ReceptionImage(
            form_id=form_id,
            URL=image.URL,
            decription=image.decription
        )
        
        db.add(db_image)
        await db.commit()
        await db.refresh(db_image)
        return db_image
    except Exception as e:
        await db.rollback()
        logger.error(f"Lỗi khi tạo hình ảnh: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Không thể tạo hình ảnh: {str(e)}")

async def get_reception_images_by_form(db: AsyncSession, form_id: int) -> List[ReceptionImage]:
    """Lấy danh sách hình ảnh của một biểu mẫu tiếp nhận"""
    result = await db.execute(
        select(ReceptionImage).where(ReceptionImage.form_id == form_id)
    )
    return result.scalars().all()

async def delete_reception_image(db: AsyncSession, img_id: int) -> bool:
    """Xóa một hình ảnh"""
    try:
        stmt = delete(ReceptionImage).where(ReceptionImage.img_id == img_id)
        result = await db.execute(stmt)
        await db.commit()
        return result.rowcount > 0
    except Exception as e:
        await db.rollback()
        logger.error(f"Lỗi khi xóa hình ảnh: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Không thể xóa hình ảnh: {str(e)}")

async def delete_reception_images_by_form(db: AsyncSession, form_id: int) -> bool:
    """Xóa tất cả hình ảnh của một biểu mẫu tiếp nhận"""
    try:
        stmt = delete(ReceptionImage).where(ReceptionImage.form_id == form_id)
        await db.execute(stmt)
        await db.commit()
        return True
    except Exception as e:
        await db.rollback()
        logger.error(f"Lỗi khi xóa hình ảnh: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Không thể xóa hình ảnh: {str(e)}")

async def get_reception_form_with_images(db: AsyncSession, form_id: int) -> Dict[str, Any]:
    """Lấy thông tin biểu mẫu tiếp nhận kèm danh sách hình ảnh"""
    db_reception_form = await get_reception_form_by_id(db, form_id)
    if not db_reception_form:
        return None
    
    # Lấy danh sách hình ảnh
    db_images = await get_reception_images_by_form(db, form_id)
    
    # Tạo đối tượng kết quả
    result = {
        "reception_form": db_reception_form,
        "images": db_images
    }
    
    return result
