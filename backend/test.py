from db.session import init_db, get_db
from models.models import *
import asyncio

async def main():
    await init_db()

    # Lấy session từ async generator
    db_gen = get_db()
    db = await anext(db_gen)

    try:
        new_customer = Customer(
            fullname="Nguyễn Văn An",
            phone_num="0912347678",
            email="nguyen.an@example.com",
            is_guest=False,
            password="hashed_password_here"
        )
        
        db.add(new_customer)    
        await db.commit()
        await db.refresh(new_customer)

        print(f"New customer created: {new_customer.fullname} with ID: {new_customer.customer_id}")
    finally:
        # Đảm bảo đóng session
        await db.close()

if __name__ == "__main__":
    asyncio.run(main())
