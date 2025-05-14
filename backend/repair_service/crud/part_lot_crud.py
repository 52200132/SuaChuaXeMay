from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, List
from ..models.models_2 import PartLot
from ..schemas.part_lot_schemas import PartLotCreate, PartLotUpdate

def get_part_lot(db: Session, part_lot_id: int):
    return db.query(PartLot).filter(PartLot.part_lot_id == part_lot_id).first()

def get_part_lots(db: Session, skip: int = 0, limit: int = 100):
    return db.query(PartLot).offset(skip).limit(limit).all()

def get_part_lots_by_part(db: Session, part_id: int, skip: int = 0, limit: int = 100):
    return db.query(PartLot).filter(PartLot.part_id == part_id).offset(skip).limit(limit).all()

def create_part_lot(db: Session, part_lot: PartLotCreate):
    db_part_lot = PartLot(
        part_id=part_lot.part_id,
        import_date=part_lot.import_date or datetime.now(),
        quantity=part_lot.quantity,
        unit=part_lot.unit,
        price=part_lot.price
    )
    db.add(db_part_lot)
    db.commit()
    db.refresh(db_part_lot)
    return db_part_lot

def update_part_lot(db: Session, part_lot_id: int, part_lot: PartLotUpdate):
    db_part_lot = get_part_lot(db, part_lot_id)
    if db_part_lot:
        update_data = part_lot.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_part_lot, key, value)
        db.commit()
        db.refresh(db_part_lot)
    return db_part_lot

def delete_part_lot(db: Session, part_lot_id: int):
    db_part_lot = get_part_lot(db, part_lot_id)
    if db_part_lot:
        db.delete(db_part_lot)
        db.commit()
        return True
    return False
