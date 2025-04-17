from sqlalchemy import Column, Integer, Unicode, String, Boolean, ForeignKey, DateTime, Text, Enum, CheckConstraint
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()

class Diagnosis(Base):
    __tablename__ = 'Diagnosis'
    
    diagnosis_id = Column(Integer, primary_key=True, autoincrement=True)
    form_id = Column(Integer, ForeignKey('ReceptionForm.form_id'))
    problem = Column(Text(collation='utf8mb4_unicode_ci'))  # Unicode text support for detailed problem descriptions
    created_at = Column(DateTime, default=datetime.utcnow)
    estimated_cost = Column(Integer)
    
    # Relationships
    form = relationship("ReceptionForm", back_populates="diagnoses")
    orders = relationship("Order", back_populates="diagnosis")

class Order(Base):
    __tablename__ = 'Order'
    
    order_id = Column(Integer, primary_key=True, autoincrement=True)
    diagnosis_id = Column(Integer, ForeignKey('Diagnosis.diagnosis_id'))
    moto_type_id = Column(Integer, ForeignKey('MotocycleType.moto_type_id'))
    created_at = Column(DateTime, default=datetime.utcnow)
    staff_id = Column(Integer, ForeignKey('Staff.staff_id'))
    status = Column(Enum('pending', 'in_progress', 'completed', 'cancelled', name='order_status'))
    total_price = Column(Integer, default=0)
    
    # Relationships
    diagnosis = relationship("Diagnosis", back_populates="orders")
    staff = relationship("Staff", back_populates="orders")
    moto_type = relationship("MotocycleType", back_populates="orders")
    service_details = relationship("ServiceOrderDetail", back_populates="order")
    part_details = relationship("PartOrderDetail", back_populates="order")
    invoices = relationship("Invoice", back_populates="order")
    status_history = relationship("OrderStatusHistory", back_populates="order")

class ServiceOrderDetail(Base):
    __tablename__ = 'ServiceOrderDetail'
    
    service_detail_ID = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey('Order.order_id'))
    service_id = Column(Integer, ForeignKey('Service.service_id'))
    is_selected = Column(Boolean, default=False)
    price = Column(Integer, nullable=False)
    
    # Check constraint với tên duy nhất
    __table_args__ = (
        CheckConstraint('price > 0', name='check_service_order_price_positive'),
    )
    
    # Relationships
    order = relationship("Order", back_populates="service_details")
    service = relationship("Service", back_populates="service_order_details")

class PartOrderDetail(Base):
    __tablename__ = 'PartOrderDetail'
    
    part_detail_ID = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey('Order.order_id'))
    part_id = Column(Integer, ForeignKey('Part.part_id'))
    is_selected = Column(Boolean, default=False)
    quantity = Column(Integer, default=1)
    price = Column(Integer, nullable=False)
    
    # Check constraint với tên duy nhất
    __table_args__ = (
        CheckConstraint('price > 0', name='check_part_order_price_positive'),
    )
    
    # Relationships
    order = relationship("Order", back_populates="part_details")
    part = relationship("Part", back_populates="part_order_details")

class OrderStatusHistory(Base):
    __tablename__ = 'OrderStatusHistory'
    
    history_id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey('Order.order_id'), nullable=False)
    status = Column(Enum(
        'received',
        'checking',
        'wait_confirm',
        'repairing',
        'wait_delivery',
        'delivered',
        name='order_status_enum'
    ), nullable=False)
    changed_at = Column(DateTime, default=datetime.utcnow)
    changed_by = Column(Integer, ForeignKey('Staff.staff_id'))
    
    # Relationships
    order = relationship("Order", back_populates="status_history")
    changed_by_staff = relationship("Staff", back_populates="status_changes")