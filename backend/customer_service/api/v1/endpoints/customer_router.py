from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from typing import List, Optional

from db.session import get_db
from crud import customer as customer_crud
from schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse, CustomerResponseWithMotocycles, CustomerLogin
from utils.logger import get_logger
from .url import URLS


logger = get_logger(__name__)

router = APIRouter()

@router.post(URLS['CUSTOMER']['CREATE_CUSTOMER'], response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
async def create_customer(customer_data: CustomerCreate, db: AsyncSession = Depends(get_db)):
    """Tạo mới khách hàng"""
    try:
        # Kiểm tra xem số điện thoại đã tồn tại
        existing_customer = await customer_crud.get_customer_by_phone(db, customer_data.phone_num)
        if existing_customer:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Số điện thoại đã được đăng ký"
            )
        
        new_customer = await customer_crud.create_customer(db, customer_data)
        return new_customer
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get(URLS['CUSTOMER']['GET_ALL_CUSTOMERS'], response_model=List[CustomerResponse])
async def read_customers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Lấy danh sách khách hàng với phân trang"""
    customers = await customer_crud.get_all_customers(db, skip=skip, limit=limit)
    return customers

@router.get(URLS['CUSTOMER']['GET_CUSTOMER_BY_ID'], response_model=CustomerResponse)
async def get_customer_by_id (customer_id: int, db: AsyncSession = Depends(get_db)):
    """Lấy thông tin chi tiết của một khách hàng theo ID"""
    customer = await customer_crud.get_customer_by_id(db, customer_id)
    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy khách hàng"
        )
    return CustomerResponse.from_orm(customer)

@router.get(URLS['CUSTOMER']['GET_CUSTOMER_BY_PHONE'], response_model=CustomerResponse)
async def read_customer_by_phone(
    phone_num: str,
    db: AsyncSession = Depends(get_db)
):
    """Lấy thông tin khách hàng theo số điện thoại"""
    customer = await customer_crud.get_customer_by_phone(db, phone_num)
    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy khách hàng với số điện thoại này"
        )
    return CustomerResponse.from_orm(customer)

@router.get(URLS['CUSTOMER']['GET_CUSTOMER_WITH_MOTORCYCLES'], response_model=CustomerResponseWithMotocycles)
async def get_customer_with_motorcycles(
    phone_num: str,
    db: AsyncSession = Depends(get_db)
):
    """Lấy thông tin khách hàng theo số điện thoại và bao gồm thông tin xe máy"""
    customer = await customer_crud.get_customer_with_motorcycle_by_phone(db, phone_num)
    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy khách hàng với số điện thoại này"
        )
    logger.info(f"Lấy thành công thông tin xe máy cho khách hàng: {customer}")
    return customer

# @router.put(URLS['CUSTOMER']['UPDATE_CUSTOMER'], response_model=CustomerResponse)
# async def update_customer(
#     customer_id: int,
#     customer_data: CustomerUpdate,
#     db: AsyncSession = Depends(get_db)
# ):
#     """Cập nhật thông tin khách hàng"""
#     try:
#         # Kiểm tra xem khách hàng có tồn tại
#         existing_customer = await customer_crud.get_customer_by_id(db, customer_id)
#         if not existing_customer:
#             raise HTTPException(
#                 status_code=status.HTTP_404_NOT_FOUND,
#                 detail="Không tìm thấy khách hàng"
#             )
        
#         # Nếu số điện thoại được thay đổi, kiểm tra xem có trùng không
#         if customer_data.phone_num and customer_data.phone_num != existing_customer.phone_num:
#             phone_exists = await customer_crud.get_customer_by_phone(db, customer_data.phone_num)
#             if phone_exists:
#                 raise HTTPException(
#                     status_code=status.HTTP_400_BAD_REQUEST,
#                     detail="Số điện thoại đã được đăng ký"
#                 )
        
#         updated_customer = await customer_crud.update_customer(db, customer_id, customer_data)
#         return updated_customer
#     except ValueError as e:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail=str(e)
#         )

# @router.delete(URLS['CUSTOMER']['DELETE_CUSTOMER'], status_code=status.HTTP_204_NO_CONTENT)
# async def delete_customer(
#     customer_id: int,
#     db: AsyncSession = Depends(get_db)
# ):
#     """Xóa khách hàng"""
#     deleted = await customer_crud.delete_customer(db, customer_id)
#     if not deleted:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Không tìm thấy khách hàng"
#         )
#     return None


@router.post(URLS['CUSTOMER']['LOGIN'], response_model=CustomerResponse, status_code=status.HTTP_200_OK)
async def login(login_info: CustomerLogin, db: AsyncSession = Depends(get_db)):
    """Đăng nhập khách hàng"""
    logger.info(f"Đang đăng nhập với email: {login_info.email}")
    customer = await customer_crud.get_customer_by_email_and_password(db, login_info.email, login_info.password)
    # logger.info(f"Đã tìm thấy khách hàng: {customer.phone_num, customer.fullname}")
    if customer is None:
        logger.error(f"Đăng nhập thất bại cho email: {login_info.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email hoặc mật khẩu không đúng"
        )
    return CustomerResponse.from_orm(customer)