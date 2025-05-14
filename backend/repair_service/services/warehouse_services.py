from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_, func, update
from pydantic import BaseModel

from utils.logger import get_logger
from db.session import get_db
from models.models_2 import Warehouse, History
from schemas.dto.part_lot_export import PartLotExport

log = get_logger(__name__)

async def export_part_lots(db: AsyncSession, part_lots: list[PartLotExport]):
    """
    Xuất các lô phụ tùng theo danh sách ID.
    """
    try:
        for part_lot in part_lots:
            query = (
                select(Warehouse.stock)
                .where(Warehouse.part_lot_id == part_lot.part_lot_id)
            )
            stock_result = await db.execute(query)
            stock = stock_result.scalar_one_or_none()
            if part_lot.quantity > stock:
                log.error(f"Không đủ số lượng trong kho cho lô phụ tùng ID {part_lot.part_lot_id}.")
                raise ValueError(f"Không đủ số lượng trong kho cho lô phụ tùng ID {part_lot.part_lot_id}.")
            update_query = (
                update(Warehouse)
                .where(Warehouse.part_lot_id == part_lot.part_lot_id)
                .values(stock=Warehouse.stock - part_lot.quantity)
            )
            db.add(History(
                part_lot_id=part_lot.part_lot_id,
                date=func.now(),
                quantity=part_lot.quantity,
                type="Xuất",
                note=f"Xuất lô phụ tùng ID {part_lot.part_lot_id} với số lượng {part_lot.quantity}."
            ))
            await db.execute(update_query)
            print(f"Xuất lô phụ tùng ID {part_lot.part_lot_id} với số lượng {part_lot.quantity}.")
        await db.commit()
        log.info("Xuất lô phụ tùng thành công.")
    except IntegrityError as e:
        log.error(f"Lỗi toàn vẹn dữ liệu khi xuất lô phụ tùng: {e}")
        await db.rollback()
        raise e
    except Exception as e:
        log.error(f"Lỗi khi xuất lô phụ tùng: {e}")
        await db.rollback()
        raise e
