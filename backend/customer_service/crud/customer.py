from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete
from sqlalchemy.exc import IntegrityError, MultipleResultsFound

from utils.logger import get_logger
from models.models import Customer
from schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse

logger = get_logger(__name__)

async def create_customer(db: AsyncSession, customer: CustomerCreate) -> Customer:
    """Tạo khách hàng mới trong cơ sở dữ liệu"""
    try:
        db_customer = Customer(
            fullname=customer.fullname,
            phone_num=customer.phone_num,
            email=customer.email,
            is_guest=customer.is_guest,
            password=customer.password
        )
        db.add(db_customer)
        await db.commit()
        await db.refresh(db_customer)
        return CustomerResponse.from_orm(db_customer)
    except IntegrityError as e:
        await db.rollback()
        logger.error(f"Lỗi khi tạo khách hàng: {str(e)}")
        raise ValueError("Số điện thoại đã tồn tại")

async def get_customer_by_id(db: AsyncSession, customer_id: int) -> Customer:
    """Lấy thông tin khách hàng theo ID"""
    result = await db.execute(select(Customer).where(Customer.customer_id == customer_id))
    db_customer = result.scalar_one_or_none()
    return db_customer

async def get_customer_by_phone(db: AsyncSession, phone_num: str) -> Customer:
    """Lấy thông tin khách hàng theo số điện thoại"""
    result = await db.execute(select(Customer).where(Customer.phone_num == phone_num))
    return result.scalar_one_or_none()

async def get_all_customers(db: AsyncSession, skip: int = 0, limit: int = 100) -> list[Customer]:
    """Lấy danh sách khách hàng với phân trang"""
    result = await db.execute(select(Customer).offset(skip).limit(limit))
    return result.scalars().all()

async def update_customer(db: AsyncSession, customer_id: int, customer: CustomerUpdate) -> Customer:
    """Cập nhật thông tin khách hàng"""
    try:
        db_customer = await get_customer(db, customer_id)
        if not db_customer:
            return None
        
        # Xây dựng dictionary chỉ với các trường cần cập nhật
        update_data = customer.dict(exclude_unset=True)
        
        stmt = update(Customer).where(Customer.customer_id == customer_id).values(**update_data)
        await db.execute(stmt)
        await db.commit()
        return await get_customer(db, customer_id)
    except IntegrityError:
        await db.rollback()
        logger.error("Lỗi khi cập nhật khách hàng")
        raise ValueError("Số điện thoại đã tồn tại")

async def delete_customer(db: AsyncSession, customer_id: int) -> bool:
    """Xóa khách hàng khỏi cơ sở dữ liệu"""
    db_customer = await get_customer(db, customer_id)
    if not db_customer:
        return False
    
    stmt = delete(Customer).where(Customer.customer_id == customer_id)
    await db.execute(stmt)
    await db.commit()
    return True

async def get_customer_by_email_and_password(db: AsyncSession, email: str, password: str) -> Customer:
    """Lấy thông tin khách hàng theo email và mật khẩu"""
    try:
        # logger.info(f"Đang tìm kiếm khách hàng với email: {email} và mật khẩu: {password}")
        query = select(Customer).where(
            Customer.email == email,
            Customer.password == password
        )
        result = await db.execute(query)
        customer_db = result.scalar_one_or_none()
        # logger.info(f"Đã tìm thấy khách hàng: {CustomerResponse.from_orm(customer_db)} với email: {email} và mật khẩu: {password}")
        return customer_db
    except MultipleResultsFound:
        logger.error("Nhiều kết quả được tìm thấy với email và mật khẩu này")
        return None
    except Exception as e:
        logger.error(f"Lỗi khi lấy thông tin khách hàng: {str(e)}")

