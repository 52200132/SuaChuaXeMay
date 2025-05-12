from sqlalchemy import Column, Integer, Unicode, String, Boolean, ForeignKey, DateTime, Text, Enum, CheckConstraint
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()

class Customer(Base):
    __tablename__ = 'customer'
    
    customer_id = Column(Integer, primary_key=True, autoincrement=True)
    fullname = Column(Unicode(255), nullable=False)
    phone_num = Column(String(10), unique=True, nullable=False)
    email = Column(String(255))
    is_guest = Column(Boolean, default=True)
    password = Column(String(255))
    
    # Relationships
    motocycles = relationship("Motocycle", back_populates="customer")
    appointments = relationship("Appointment", back_populates="customer")

class MotocycleType(Base):
    __tablename__ = 'motocycletype'
    
    moto_type_id = Column(Integer, primary_key=True, autoincrement=True)
    brand = Column(String(50), nullable=False)
    model = Column(String(50), nullable=False)
    type = Column(Enum('Xe số', 'Xe tay ga', name='motocycle_type'), nullable=False)
    
    # Relationships
    motocycles = relationship("Motocycle", back_populates="moto_type")
    compatible_parts = relationship("Compatible", back_populates="moto_type")

class Motocycle(Base):
    __tablename__ = 'motocycle'
    
    motocycle_id = Column(Integer, primary_key=True, autoincrement=True)
    customer_id = Column(Integer, ForeignKey('customer.customer_id'))
    moto_type_id = Column(Integer, ForeignKey('motocycletype.moto_type_id'))
    license_plate = Column(String(20), nullable=False)
    
    # Relationships
    customer = relationship("Customer", back_populates="motocycles")
    moto_type = relationship("MotocycleType", back_populates="motocycles")
    reception_forms = relationship("ReceptionForm", back_populates="motocycle")
    orders = relationship("Order", back_populates="motocycle")

class ServiceType(Base):
    __tablename__ = 'servicetype'
    
    service_type_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Unicode(255), nullable=False)
    
    # Relationships
    services = relationship("Service", back_populates="service_type")
    appointments = relationship("Appointment", back_populates="service_type")

class Service(Base):
    __tablename__ = 'service'
    
    service_id = Column(Integer, primary_key=True, autoincrement=True)
    service_type_id = Column(Integer, ForeignKey('servicetype.service_type_id'))
    name = Column(Unicode(255), nullable=False)
    is_deleted = Column(Boolean, default=False)
    
    # Relationships
    service_type = relationship("ServiceType", back_populates="services")
    service_moto_types = relationship("ServiceMotoType", back_populates="service")
    service_order_details = relationship("ServiceOrderDetail", back_populates="service")

class ServiceMotoType(Base):
    __tablename__ = 'servicemototype'
    
    service_mototype_id = Column(Integer, primary_key=True, autoincrement=True)
    type = Column(Enum('Xe số', 'Xe tay ga'))
    service_id = Column(Integer, ForeignKey('service.service_id'))
    price = Column(Integer, nullable=False)
    
    # Relationships
    service = relationship("Service", back_populates="service_moto_types")

class Supplier(Base):
    __tablename__ = 'supplier'
    
    supplier_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Unicode(255), nullable=False)
    phone_num = Column(String(10))
    address = Column(Unicode(255))
    email = Column(String(255))
    website = Column(String(255))
    
    # Relationships
    parts = relationship("Part", back_populates="supplier")

class Part(Base):
    __tablename__ = 'part'
    
    part_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Unicode(255), nullable=False)
    URL = Column(String(255))
    unit = Column(Unicode(20), nullable=False)
    is_deleted = Column(Boolean, default=False)
    supplier_id = Column(Integer, ForeignKey('supplier.supplier_id'))
    price = Column(Integer)
    
    # Relationships
    supplier = relationship("Supplier", back_populates="parts")
    part_order_details = relationship("PartOrderDetail", back_populates="part")
    part_lots = relationship("PartLot", back_populates="part")
    compatible_moto_types = relationship("Compatible", back_populates="part")

class PartLot(Base):
    __tablename__ = 'partlot'
    
    part_lot_id = Column(Integer, primary_key=True, autoincrement=True)
    part_id = Column(Integer, ForeignKey('part.part_id'))
    import_date = Column(DateTime)
    quantity = Column(Integer, nullable=False)
    unit = Column(Unicode(20), nullable=False)
    price = Column(Integer)
    
    # Relationships
    part = relationship("Part", back_populates="part_lots")
    warehouse = relationship("Warehouse", uselist=False, back_populates="part_lot")
    histories = relationship("History", back_populates="part_lot")

class Warehouse(Base):
    __tablename__ = 'warehouse'
    
    part_lot_id = Column(Integer, ForeignKey('partlot.part_lot_id'), primary_key=True)
    stock = Column(Integer, nullable=False)
    location = Column(String(20), nullable=False)
    
    # Relationships
    part_lot = relationship("PartLot", back_populates="warehouse")

class History(Base):
    __tablename__ = 'history'
    
    history_id = Column(Integer, primary_key=True, autoincrement=True)
    part_lot_id = Column(Integer, ForeignKey('partlot.part_lot_id'))
    date = Column(DateTime, default=datetime.now)
    quantity = Column(Integer, nullable=False)
    type = Column(Enum('Xuất', 'Nhập', name='history_type'), nullable=False)
    note = Column(Text)
    
    # Relationships
    part_lot = relationship("PartLot", back_populates="histories")

class Staff(Base):
    __tablename__ = 'staff'
    
    staff_id = Column(Integer, primary_key=True, autoincrement=True)
    fullname = Column(Unicode(255), nullable=False)
    role = Column(Enum('receptionist', 'technician', 'cashier', 'manager', name='staff_role'), nullable=False)
    status = Column(Enum('active', 'inactive', name='staff_status'), default='active')
    email = Column(String(50), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    
    # Relationships
    reception_forms = relationship("ReceptionForm", back_populates="staff")
    orders = relationship("Order", back_populates="staff")
    invoices = relationship("Invoice", back_populates="staff")
    status_changes = relationship("OrderStatusHistory", back_populates="changed_by_staff")

class Appointment(Base):
    __tablename__ = 'appointment'
    
    appointment_id = Column(Integer, primary_key=True, autoincrement=True)
    customer_id = Column(Integer, ForeignKey('customer.customer_id'))
    service_type_id = Column(Integer, ForeignKey('servicetype.service_type_id'))
    appointment_date = Column(DateTime)
    status = Column(Enum('pending', 'confirmed', 'cancelled', name='appointment_status'), default='pending')
    note = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    
    # Relationships
    customer = relationship("Customer", back_populates="appointments")
    service_type = relationship("ServiceType", back_populates="appointments")

class ReceptionForm(Base):
    __tablename__ = 'receptionform'
    
    form_id = Column(Integer, primary_key=True, autoincrement=True)
    motocycle_id = Column(Integer, ForeignKey('motocycle.motocycle_id'))
    staff_id = Column(Integer, ForeignKey('staff.staff_id'))
    created_at = Column(DateTime, default=datetime.now)
    initial_conditon = Column(Unicode(255))
    note = Column(Text)
    is_returned = Column(Boolean)
    returned_at = Column(DateTime)
    
    # Relationships
    motocycle = relationship("Motocycle", back_populates="reception_forms")
    staff = relationship("Staff", back_populates="reception_forms")
    reception_images = relationship("ReceptionImage", back_populates="form")
    diagnoses = relationship("Diagnosis", back_populates="form")

class ReceptionImage(Base):
    __tablename__ = 'receptionimage'
    
    img_id = Column(Integer, primary_key=True, autoincrement=True)
    form_id = Column(Integer, ForeignKey('receptionform.form_id'))
    URL = Column(String(255))
    decription = Column(Unicode(255))
    
    # Relationships
    form = relationship("ReceptionForm", back_populates="reception_images")

class Diagnosis(Base):
    __tablename__ = 'diagnosis'
    
    diagnosis_id = Column(Integer, primary_key=True, autoincrement=True)
    form_id = Column(Integer, ForeignKey('receptionform.form_id'))
    problem = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    estimated_cost = Column(Integer)
    order_id = Column(Integer, ForeignKey('order.order_id'))
    
    # Relationships
    form = relationship("ReceptionForm", back_populates="diagnoses")
    order = relationship("Order", back_populates="diagnosis")

class Order(Base):
    __tablename__ = 'order'
    
    order_id = Column(Integer, primary_key=True, autoincrement=True)
    motocycle_id = Column(Integer, ForeignKey('motocycle.motocycle_id'))
    created_at = Column(DateTime, default=datetime.now)
    staff_id = Column(Integer, ForeignKey('staff.staff_id'))
    status = Column(Enum('received', 'checking', 'wait_confirm', 'cancelled', 'repairing', 'wait_delivery', 'delivered', name='order_status'), default='received')
    total_price = Column(Integer, default=0)
    
    # Relationships
    motocycle = relationship("Motocycle", back_populates="orders")
    staff = relationship("Staff", back_populates="orders")
    service_details = relationship("ServiceOrderDetail", back_populates="order")
    part_details = relationship("PartOrderDetail", back_populates="order")
    invoices = relationship("Invoice", back_populates="order")
    status_history = relationship("OrderStatusHistory", back_populates="order")
    diagnosis = relationship("Diagnosis", back_populates="order")

class ServiceOrderDetail(Base):
    __tablename__ = 'serviceorderdetail'
    
    service_detail_ID = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey('order.order_id'))
    service_id = Column(Integer, ForeignKey('service.service_id'))
    is_selected = Column(Boolean, default=False)
    price = Column(Integer, nullable=False)
    
    # Check constraint for positive price
    __table_args__ = (
        CheckConstraint('price > 0', name='check_service_order_price_positive'),
    )
    
    # Relationships
    order = relationship("Order", back_populates="service_details")
    service = relationship("Service", back_populates="service_order_details")

class PartOrderDetail(Base):
    __tablename__ = 'partorderdetail'
    
    part_detail_ID = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey('order.order_id'))
    part_id = Column(Integer, ForeignKey('part.part_id'))
    is_selected = Column(Boolean, default=False)
    quantity = Column(Integer, default=1)
    price = Column(Integer, nullable=False)
    
    # Check constraint for positive price
    __table_args__ = (
        CheckConstraint('price > 0', name='check_part_order_price_positive'),
    )
    
    # Relationships
    order = relationship("Order", back_populates="part_details")
    part = relationship("Part", back_populates="part_order_details")

class Invoice(Base):
    __tablename__ = 'invoice'
    
    invoice_id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey('order.order_id'))
    staff_id = Column(Integer, ForeignKey('staff.staff_id'))
    create_at = Column(DateTime)
    total_price = Column(Integer, default=0)
    payment_method = Column(Unicode(50))
    is_paid = Column(Boolean, default=False)
    
    # Relationships
    order = relationship("Order", back_populates="invoices")
    staff = relationship("Staff", back_populates="invoices")

class OrderStatusHistory(Base):
    __tablename__ = 'orderstatushistory'
    
    history_id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey('order.order_id'), nullable=False)
    status = Column(Enum(
        'received',
        'checking',
        'wait_confirm',
        'cancelled',
        'repairing',
        'wait_delivery',
        'delivered',
        name='order_status_enum'
    ), nullable=False)
    changed_at = Column(DateTime, default=datetime.now)
    changed_by = Column(Integer, ForeignKey('staff.staff_id'))
    
    # Relationships
    order = relationship("Order", back_populates="status_history")
    changed_by_staff = relationship("Staff", back_populates="status_changes")

class Compatible(Base):
    __tablename__ = 'compatible'
    
    compatible_id = Column(Integer, primary_key=True, autoincrement=True) # thêm để không lỗi
    part_id = Column(Integer, ForeignKey('part.part_id'))
    moto_type_id = Column(Integer, ForeignKey('motocycletype.moto_type_id'))
    
    # Relationships
    part = relationship("Part", back_populates="compatible_moto_types")
    moto_type = relationship("MotocycleType", back_populates="compatible_parts")