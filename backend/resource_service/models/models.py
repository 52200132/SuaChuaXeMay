from sqlalchemy import Column, Integer, Unicode, String, Boolean, ForeignKey, DateTime, Text, Enum, CheckConstraint
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()

class ServiceType(Base):
    __tablename__ = 'ServiceType'
    
    service_type_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Unicode(255), nullable=False)
    
    # Relationships
    services = relationship("Service", back_populates="service_type")
    appointments = relationship("Appointment", back_populates="service_type")
    appointment_services = relationship("AppointmentService", back_populates="service_type")

class Service(Base):
    __tablename__ = 'Service'
    
    service_id = Column(Integer, primary_key=True, autoincrement=True)
    service_type_id = Column(Integer, ForeignKey('ServiceType.service_type_id'))
    name = Column(Unicode(255), nullable=False)
    
    # Relationships
    service_type = relationship("ServiceType", back_populates="services")
    service_moto_types = relationship("ServiceMotoType", back_populates="service")
    service_order_details = relationship("ServiceOrderDetail", back_populates="service")

class ServiceMotoType(Base):
    __tablename__ = 'ServiceMotoType'
    
    service_mototype_id = Column(Integer, primary_key=True, autoincrement=True)
    moto_type_id = Column(Integer, ForeignKey('MotocycleType.moto_type_id'))
    service_id = Column(Integer, ForeignKey('Service.service_id'))
    price = Column(Integer, nullable=False)
    
    # Check constraint với tên duy nhất
    __table_args__ = (
        CheckConstraint('price > 0', name='check_service_mototype_price_positive'),
    )
    
    # Relationships
    service = relationship("Service", back_populates="service_moto_types")
    moto_type = relationship("MotocycleType", back_populates="service_moto_types")

class Part(Base):
    __tablename__ = 'Part'
    
    part_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Unicode(255), nullable=False)
    URL = Column(String(255))
    unit = Column(Unicode(20), nullable=False)  # Đơn vị tính: "cái", "bộ", etc.
    stock = Column(Integer)
    
    # Relationships
    part_moto_types = relationship("PartMotoType", back_populates="part")
    part_order_details = relationship("PartOrderDetail", back_populates="part")

class PartMotoType(Base):
    __tablename__ = 'PartMotoType'
    
    part_mototype_id = Column(Integer, primary_key=True, autoincrement=True)
    moto_type_id = Column(Integer, ForeignKey('MotocycleType.moto_type_id'))
    part_id = Column(Integer, ForeignKey('Part.part_id'))
    price = Column(Integer, nullable=False)
    
    # Check constraint với tên duy nhất
    __table_args__ = (
        CheckConstraint('price > 0', name='check_part_mototype_price_positive'),
    )
    
    # Relationships
    part = relationship("Part", back_populates="part_moto_types")
    moto_type = relationship("MotocycleType", back_populates="part_moto_types")

class Staff(Base):
    __tablename__ = 'Staff'
    
    staff_id = Column(Integer, primary_key=True, autoincrement=True)
    fullname = Column(Unicode(255), nullable=False)
    role = Column(Enum('Receptionist', 'Technician', 'Cashier', 'Manager', name='staff_role'), nullable=False)
    status = Column(Enum('Idle', 'Busy', 'Off', 'None', name='staff_status'), default='None')
    email = Column(String(50), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    
    # Relationships
    reception_forms = relationship("ReceptionForm", back_populates="staff")
    orders = relationship("Order", back_populates="staff")
    invoices = relationship("Invoice", back_populates="staff")
    status_changes = relationship("OrderStatusHistory", back_populates="changed_by_staff")

class Invoice(Base):
    __tablename__ = 'Invoice'
    
    invoice_id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey('Order.order_id'))
    staff_id = Column(Integer, ForeignKey('Staff.staff_id'))
    create_at = Column(DateTime, default=datetime.utcnow)
    total_price = Column(Integer, default=0)
    payment_method = Column(Unicode(50))
    
    # Relationships
    order = relationship("Order", back_populates="invoices")
    staff = relationship("Staff", back_populates="invoices")


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