from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timedelta

from utils.logger import get_logger
from db.session import get_db
from schemas.supplier import SupplierCreate, SupplierUpdate, SupplierResponse
from crud import supplier as supplierr_crud
from .url import URLS

router = APIRouter()

logger = get_logger(__name__)

@router.get(URLS['SUPPLIER']['GET_ALL_SUPPLIERS'], response_model=List[SupplierResponse])
async def get_all_suppliers(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    """Lấy danh sách tất cả nhà cung cấp"""
    db_suppliers = await supplierr_crud.get_all(db, skip=skip, limit=limit)
    return db_suppliers

@router.get(URLS['SUPPLIER']['GET_SUPPLIER_BY_ID'], response_model=SupplierResponse)
async def get_supplier_by_id(supplier_id: int, db: AsyncSession = Depends(get_db)):
    """Lấy thông tin nhà cung cấp theo ID"""
    db_supplier = await supplierr_crud.get_supplier_by_id(db, supplier_id=supplier_id)
    if db_supplier is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy nhà cung cấp")
    return SupplierResponse.from_orm(db_supplier)

@router.post(URLS['SUPPLIER']['CREATE_SUPPLIER'], response_model=SupplierResponse)
async def create_supplier(supplier: SupplierCreate, db: AsyncSession = Depends(get_db)):
    """Tạo nhà cung cấp mới"""
    try:
        db_supplier = await supplierr_crud.create(db, supplier)
        return SupplierResponse.from_orm(db_supplier)
    except IntegrityError:
        raise HTTPException(status_code=400, detail="Nhà cung cấp đã tồn tại")
    
@router.put(URLS['SUPPLIER']['UPDATE_SUPPLIER'], response_model=SupplierResponse)
async def update_supplier(supplier_id: int, supplier: SupplierUpdate, db: AsyncSession = Depends(get_db)):
    """Cập nhật thông tin nhà cung cấp"""
    db_supplier = await supplierr_crud.get_supplier_by_id(db, supplier_id=supplier_id)
    if db_supplier is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy nhà cung cấp")
    
    try:
        updated_supplier = await supplierr_crud.update(db, db_supplier, supplier)
        return SupplierResponse.from_orm(updated_supplier)
    except IntegrityError:
        raise HTTPException(status_code=400, detail="Nhà cung cấp đã tồn tại")