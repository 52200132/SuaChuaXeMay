from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
# from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

from models.models_2 import Base
from utils.logger import get_logger

logger = get_logger(__name__)

load_dotenv()

MAGENTA = "\033[35m"
RESET = "\033[0m"

DB_USERNAME = os.getenv("DB_USERNAME")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_NAME")
DB_PORT = os.getenv("DB_PORT")

# Cấu hình kết nối bất đồng bộ cho MySQL
SQLALCHEMY_DATABASE_URL = f"mysql+aiomysql://{DB_USERNAME}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Tạo engine bất đồng bộ
engine = create_async_engine(SQLALCHEMY_DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession)

async def get_db():
    async with AsyncSessionLocal() as db:
        try:
            yield db
        finally:
            await db.close()

async def init_db():
    try:
        # Khởi tạo cơ sở dữ liệu bất đồng bộ
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info(f"Database initialized successfully")
        print(f"{MAGENTA}Database initialized successfully.{RESET}")
        print(f"{MAGENTA}Connection established successfully.{RESET}")
    except Exception as e:
        print(f"{MAGENTA}Database Error: {e}{RESET}")

# Không chạy init_db() ở đây nữa, vì init_db là hàm bất đồng bộ và cần được gọi từ nơi khác