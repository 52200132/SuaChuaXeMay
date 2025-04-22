from sqlalchemy.orm import Session
from typing import List, Optional

from models.models import OrderStatusHistory
from schemas.order_status_history import OrderStatusHistoryCreate, OrderStatusHistoryUpdate, OrderStatusHistoryResponse


def get_order_all_status_histories(db: Session, skip: int = 0, limit: int = 100) -> List[OrderStatusHistory]:
    return db.query(OrderStatusHistory).offset(skip).limit(limit).all()

def get_order_status_history_by_id(db: Session, history_id: int) -> Optional[OrderStatusHistory]:
    return db.query(OrderStatusHistory).filter(OrderStatusHistory.history_id == history_id).first()

def get_status_history_by_order(db: Session, order_id: int) -> List[OrderStatusHistory]:
    return db.query(OrderStatusHistory).filter(OrderStatusHistory.order_id == order_id).order_by(OrderStatusHistory.changed_at.desc()).all()

def create_order_status_history(db: Session, status_history: OrderStatusHistoryCreate) -> OrderStatusHistory:
    db_status_history = OrderStatusHistory(
        order_id=status_history.order_id,
        status=status_history.status,
        changed_by=status_history.changed_by
    )
    db.add(db_status_history)
    db.commit()
    db.refresh(db_status_history)
    return db_status_history

# def update_order_status_history(db: Session, history_id: int, status_history: OrderStatusHistoryUpdate) -> Optional[OrderStatusHistory]:
#     db_status_history = get_order_status_history(db, history_id)
#     if not db_status_history:
#         return None
    
#     update_data = status_history.dict(exclude_unset=True)
#     for key, value in update_data.items():
#         setattr(db_status_history, key, value)
    
#     db.commit()
#     db.refresh(db_status_history)
#     return db_status_history

# def delete_order_status_history(db: Session, history_id: int) -> bool:
#     db_status_history = get_order_status_history(db, history_id)
#     if not db_status_history:
#         return False
    
#     db.delete(db_status_history)
#     db.commit()
#     return True
