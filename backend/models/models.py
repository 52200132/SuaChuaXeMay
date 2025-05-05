from sqlalchemy import Column, Integer, Unicode, String, Boolean, ForeignKey, DateTime, Text, Enum, CheckConstraint
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()

class Customer(Base):
    __tablename__ = 'Customer'
    
    customer_id = Column(Integer, primary_key=True, autoincrement=True)
    fullname = Column(Unicode(255), nullable=False)
    phone_num = Column(String(10), unique=True, nullable=False)
    email = Column(String(255))
    is_guest = Column(Boolean, default=False)
    password = Column(String(255))
    
    # Relationships
    motocycles = relationship("Motocycle", back_populates="customer") # checked
    appointments = relationship("Appointment", back_populates="customer")
    # reception_forms = relationship("ReceptionForm", back_populates="customer")

class MotocycleType(Base):
    __tablename__ = 'MotocycleType'
    
    moto_type_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Unicode(255), nullable=False)
    
    # Relationships
    motocycles = relationship("Motocycle", back_populates="moto_type") # checked
    service_moto_types = relationship("ServiceMotoType", back_populates="moto_type")
    part_moto_types = relationship("PartMotoType", back_populates="moto_type")
    orders = relationship("Order", back_populates="moto_type")

class Motocycle(Base):
    __tablename__ = 'Motocycle'
    
    motocycle_id = Column(Integer, primary_key=True, autoincrement=True)
    customer_id = Column(Integer, ForeignKey('Customer.customer_id'))
    moto_type_id = Column(Integer, ForeignKey('MotocycleType.moto_type_id'))
    license_plate = Column(String(20), nullable=False)
    brand = Column(Unicode(50))
    model = Column(Unicode(50))
    
    # Relationships
    customer = relationship("Customer", back_populates="motocycles") # checked
    moto_type = relationship("MotocycleType", back_populates="motocycles") # checked
    reception_forms = relationship("ReceptionForm", back_populates="motocycle")

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
    role = Column(Enum('receptionist', 'technician', 'cashier', 'manager', name='staff_role'), nullable=False)
    status = Column(Enum('inactive', 'active', name='staff_status'), default='active')
    email = Column(String(50), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    
    # Relationships
    reception_forms = relationship("ReceptionForm", back_populates="staff")
    orders = relationship("Order", back_populates="staff")
    invoices = relationship("Invoice", back_populates="staff")
    status_changes = relationship("OrderStatusHistory", back_populates="changed_by_staff")

class Appointment(Base):
    __tablename__ = 'Appointment'
    
    appointment_id = Column(Integer, primary_key=True, autoincrement=True)
    customer_id = Column(Integer, ForeignKey('Customer.customer_id'))
    service_type_id = Column(Integer, ForeignKey('ServiceType.service_type_id'))
    appointment_date = Column(DateTime)
    status = Column(Enum('pending', 'confirmed', 'cancelled', 'noshow', name='appointment_status'), default='pending')
    note = Column(Text(collation='utf8mb4_unicode_ci'))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    customer = relationship("Customer", back_populates="appointments")
    service_type = relationship("ServiceType", back_populates="appointments")
    appointment_services = relationship("AppointmentService", back_populates="appointment")

class AppointmentService(Base):
    __tablename__ = 'Appointment_Service'
    
    appointment_id = Column(Integer, ForeignKey('Appointment.appointment_id'), primary_key=True)
    service_type_id = Column(Integer, ForeignKey('ServiceType.service_type_id'), primary_key=True)
    
    # Relationships
    appointment = relationship("Appointment", back_populates="appointment_services")
    service_type = relationship("ServiceType", back_populates="appointment_services")

class ReceptionForm(Base):
    __tablename__ = 'ReceptionForm'
    
    form_id = Column(Integer, primary_key=True, autoincrement=True)
    motocycle_id = Column(Integer, ForeignKey('Motocycle.motocycle_id'))
    # customer_id = Column(Integer, ForeignKey('Customer.customer_id'))
    staff_id = Column(Integer, ForeignKey('Staff.staff_id'))
    created_at = Column(DateTime, default=datetime.utcnow)
    initial_conditon = Column(Unicode(255))  # Tình trạng ban đầu do khách mô tả
    
    # Relationships
    motocycle = relationship("Motocycle", back_populates="reception_forms")
    # customer = relationship("Customer", back_populates="reception_forms")
    staff = relationship("Staff", back_populates="reception_forms")
    reception_images = relationship("ReceptionImage", back_populates="form")
    diagnoses = relationship("Diagnosis", back_populates="form")

class ReceptionImage(Base):
    __tablename__ = 'ReceptionImage'
    
    img_id = Column(Integer, primary_key=True, autoincrement=True)
    form_id = Column(Integer, ForeignKey('ReceptionForm.form_id'))
    URL = Column(String(255))
    decription = Column(Unicode(255))
    
    # Relationships
    form = relationship("ReceptionForm", back_populates="reception_images")

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