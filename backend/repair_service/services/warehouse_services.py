from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_, func, update
from sqlalchemy.orm import Bundle

from utils.logger import get_logger
from db.session import get_db
from models.models_2 import Warehouse, History, Order, PartLot, Part, Supplier
from schemas.dto.part_lot_export import PartLotExport
from schemas.dto.warehouse_info import WarehouseInfo

log = get_logger(__name__)

async def export_part_lots(db: AsyncSession, part_lots: list[PartLotExport], order_id: int):
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
            # Thêm lịch sử xuất kho
            db.add(History(
                part_lot_id=part_lot.part_lot_id,
                date=func.now(),
                quantity=part_lot.quantity,
                type="Xuất",
                note=f"Xuất lô phụ tùng ID {part_lot.part_lot_id} với số lượng {part_lot.quantity}."
            ))
            await db.execute(update_query)
            print(f"Xuất lô phụ tùng ID {part_lot.part_lot_id} với số lượng {part_lot.quantity}.")
        # Cập nhật trạng thái đơn hàng
        await db.execute(update(Order)
            .where(Order.order_id == order_id)
            .values(is_exported=True))
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

async def get_warehouse_info(db: AsyncSession, part_lots: list[PartLotExport]) -> list[WarehouseInfo]:
    """
    Lấy thông tin kho cho danh sách lô phụ tùng.
    """
    try:
        warehouse_info_list = []
        for part_lot in part_lots:
            query = (
                select(
                    Warehouse.part_lot_id,
                    Warehouse.location,
                    Part.name,
                    Supplier.name.label("supplier_name"),
                    PartLot.price,
                    Part.unit,
                )
                .join(PartLot, Warehouse.part_lot_id == PartLot.part_lot_id)
                .join(Part, PartLot.part_id == PartLot.part_id)
                .join(Supplier, Supplier.supplier_id == Part.supplier_id)
                .where(Warehouse.part_lot_id == part_lot.part_lot_id)
            )
            result = await db.execute(query)
            row = result.first()
            if row:
                # Tạo WarehouseInfo từ dữ liệu truy vấn và quantity từ part_lot
                warehouse_info = WarehouseInfo(
                    part_lot_id=row.part_lot_id,
                    location=row.location,
                    name=row.name,
                    supplier_name=row.supplier_name,
                    import_price=row.price,
                    unit=row.unit,
                    quantity=part_lot.quantity
                )
                warehouse_info_list.append(warehouse_info)
            else:
                log.error(f"Không tìm thấy thông tin kho cho lô phụ tùng ID {part_lot.part_lot_id}.")
                raise ValueError(f"Không tìm thấy thông tin kho cho lô phụ tùng ID {part_lot.part_lot_id}.")
        return warehouse_info_list
    except IntegrityError as e:
        log.error(f"Lỗi toàn vẹn dữ liệu khi lấy thông tin kho: {e}")
        raise e
    except Exception as e:
        log.error(f"Lỗi khi lấy thông tin kho: {e}")
        raise e

