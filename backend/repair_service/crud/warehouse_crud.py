from sqlalchemy.orm import Session
from typing import Optional, List
from ..models.models_2 import Warehouse
from ..schemas.warehouse_schemas import WarehouseCreate, WarehouseUpdate

def get_warehouse(db: Session, part_lot_id: int):
    return db.query(Warehouse).filter(Warehouse.part_lot_id == part_lot_id).first()

def get_warehouses(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Warehouse).offset(skip).limit(limit).all()

def create_warehouse(db: Session, warehouse: WarehouseCreate):
    db_warehouse = Warehouse(
        part_lot_id=warehouse.part_lot_id,
        stock=warehouse.stock,
        location=warehouse.location
    )
    db.add(db_warehouse)
    db.commit()
    db.refresh(db_warehouse)
    return db_warehouse

def update_warehouse(db: Session, part_lot_id: int, warehouse: WarehouseUpdate):
    db_warehouse = get_warehouse(db, part_lot_id)
    if db_warehouse:
        update_data = warehouse.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_warehouse, key, value)
        db.commit()
        db.refresh(db_warehouse)
    return db_warehouse

def delete_warehouse(db: Session, part_lot_id: int):
    db_warehouse = get_warehouse(db, part_lot_id)
    if db_warehouse:
        db.delete(db_warehouse)
        db.commit()
        return True
    return False

def get_warehouses_by_location(db: Session, location: str, skip: int = 0, limit: int = 100):
    return db.query(Warehouse).filter(Warehouse.location == location).offset(skip).limit(limit).all()

def get_warehouses_with_stock_below(db: Session, stock_threshold: int, skip: int = 0, limit: int = 100):
    return db.query(Warehouse).filter(Warehouse.stock < stock_threshold).offset(skip).limit(limit).all()
