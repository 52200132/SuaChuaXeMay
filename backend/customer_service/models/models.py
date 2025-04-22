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
    is_guest = Column(Boolean, default=True)
    password = Column(String(255))
    
    # Relationships
    motocycles = relationship("Motocycle", back_populates="customer") # checked
    appointments = relationship("Appointment", back_populates="customer") # checked
    reception_forms = relationship("ReceptionForm", back_populates="customer")

class MotocycleType(Base):
    __tablename__ = 'MotocycleType'
    
    moto_type_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Unicode(255), nullable=False)
    
    # Relationships
    motocycles = relationship("Motocycle", back_populates="moto_type") # checked
    # service_moto_types = relationship("ServiceMotoType", back_populates="moto_type")
    # part_moto_types = relationship("PartMotoType", back_populates="moto_type")
    # orders = relationship("Order", back_populates="moto_type")

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

class Appointment(Base):
    __tablename__ = 'Appointment'
    
    appointment_id = Column(Integer, primary_key=True, autoincrement=True)
    customer_id = Column(Integer, ForeignKey('Customer.customer_id'))
    # service_type_id = Column(Integer, ForeignKey('ServiceType.service_type_id'))
    service_type_id = Column(Integer)
    appointment_date = Column(DateTime)
    status = Column(Enum('pending', 'confirmed', 'cancelled', name='appointment_status'), default='pending')
    note = Column(Text(collation='utf8mb4_unicode_ci'))
    created_at = Column(DateTime, default=datetime.now)
    
    # Relationships
    customer = relationship("Customer", back_populates="appointments") # checked
    # service_type = relationship("ServiceType", back_populates="appointment")
    # appointment_services = relationship("AppointmentService", back_populates="appointment") # checked

# class AppointmentService(Base):
#     __tablename__ = 'Appointment_Service'
    
#     appointment_id = Column(Integer, ForeignKey('Appointment.appointment_id'), primary_key=True)
#     # service_type_id = Column(Integer, ForeignKey('ServiceType.service_type_id'), primary_key=True)
#     service_type_id = Column(Integer, primary_key=True)
    
#     # Relationships
#     appointment = relationship("Appointment", back_populates="appointment_services") # checked
#     # service_type = relationship("ServiceType", back_populates="appointment_services")

class ReceptionForm(Base):
    __tablename__ = 'ReceptionForm'
    
    form_id = Column(Integer, primary_key=True, autoincrement=True)
    motocycle_id = Column(Integer, ForeignKey('Motocycle.motocycle_id'))
    customer_id = Column(Integer, ForeignKey('Customer.customer_id'))
    # staff_id = Column(Integer, ForeignKey('Staff.staff_id'))
    staff_id = Column(Integer)
    created_at = Column(DateTime, default=datetime.now)
    initial_conditon = Column(Unicode(255))  # Tình trạng ban đầu do khách mô tả
    note = Column(Text(collation='utf8mb4_unicode_ci'))  # Ghi chú của nhân viên tiếp nhận
    is_returned = Column(Boolean, default=False)  # Xe được bàn giao lại cho khách hay chưa
    
    # Relationships
    motocycle = relationship("Motocycle", back_populates="reception_forms") # checked
    customer = relationship("Customer", back_populates="reception_forms") # checked
    # staff = relationship("Staff", back_populates="reception_forms") 
    reception_images = relationship("ReceptionImage", back_populates="form") # checked
    # diagnoses = relationship("Diagnosis", back_populates="form")

class ReceptionImage(Base):
    __tablename__ = 'ReceptionImage'
    
    img_id = Column(Integer, primary_key=True, autoincrement=True)
    form_id = Column(Integer, ForeignKey('ReceptionForm.form_id'))
    URL = Column(String(255))
    decription = Column(Unicode(255))
    
    # Relationships
    form = relationship("ReceptionForm", back_populates="reception_images")