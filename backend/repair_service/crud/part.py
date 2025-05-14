from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_, delete
from datetime import datetime
from typing import List, Dict, Any, Tuple

from models.models_2 import Part, Compatible, MotocycleType, Warehouse, PartLot, Supplier, History
from schemas.part import PartCreate, PartUpdate, PartLotCreate, BulkPartLotCreate
from utils.logger import get_logger

log = get_logger(__name__)

async def get_all(db: AsyncSession) -> list[Part]:
    """
    Lấy tất cả phụ tùng xe máy từ cơ sở dữ liệu.
    """
    try:
        result = await db.execute(select(Part))
        return result.scalars().all()
    except IntegrityError as e:
        await db.rollback()
        log.error(f"Lỗi toàn vẹn dữ liệu khi lấy tất cả phụ tùng: {e}")
        raise e
    except Exception as e:
        log.error(f"Lỗi khi lấy tất cả phụ tùng: {e}")
        raise e

async def get_part_by_id(db: AsyncSession, part_id: int) -> Part:
    """
    Lấy thông tin phụ tùng theo ID.
    """
    try:
        result = await db.get(Part, part_id)
        if result and not result.is_deleted:
            return result
        return None
    except IntegrityError as e:
        log.error(f"Lỗi toàn vẹn dữ liệu khi lấy phụ tùng theo ID: {e}")
        raise e
    except Exception as e:
        log.error(f"Lỗi khi lấy phụ tùng theo ID: {e}")
        raise e

async def create_part(db: AsyncSession, part: PartCreate) -> Part:
    """
    Tạo mới một phụ tùng.
    """
    try:
        db_part = Part(
            name=part.name,
            unit=part.unit,
            price=part.price,
            supplier_id=part.supplier_id,
            URL=part.URL
        )
        db.add(db_part)
        await db.commit()
        await db.refresh(db_part)
        return db_part
    except IntegrityError as e:
        await db.rollback()
        log.error(f"Lỗi toàn vẹn dữ liệu khi tạo phụ tùng: {e}")
        raise e
    except Exception as e:
        await db.rollback()
        log.error(f"Lỗi khi tạo phụ tùng: {e}")
        raise e

async def update_part(db: AsyncSession, part_id: int, part_update: PartUpdate) -> Part:
    """
    Cập nhật thông tin phụ tùng.
    """
    try:
        # db_part = await get_part_by_id(db, part_id)
        # if not db_part:
        #     return None

        db_part = await db.get(Part, part_id)
        
        update_data = part_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_part, key, value)
            
        await db.commit()
        await db.refresh(db_part)
        return db_part
    except IntegrityError as e:
        await db.rollback()
        log.error(f"Lỗi toàn vẹn dữ liệu khi cập nhật phụ tùng: {e}")
        raise e
    except Exception as e:
        await db.rollback()
        log.error(f"Lỗi khi cập nhật phụ tùng: {e}")
        raise e

async def delete_part(db: AsyncSession, part_id: int) -> bool:
    """
    Đánh dấu phụ tùng là đã xóa (soft delete).
    """
    try:
        db_part = await get_part_by_id(db, part_id)
        if not db_part:
            return False
        
        db_part.is_deleted = True
        await db.commit()
        return True
    except IntegrityError as e:
        await db.rollback()
        log.error(f"Lỗi toàn vẹn dữ liệu khi xóa phụ tùng: {e}")
        raise e
    except Exception as e:
        await db.rollback()
        log.error(f"Lỗi khi xóa phụ tùng: {e}")
        raise e

async def get_parts_by_moto_type(db: AsyncSession, moto_type_id: int) -> list[Part]:
    """
    Lấy danh sách phụ tùng tương thích với một loại xe máy.
    """
    try:
        result = await db.execute(
            select(Part)
            .join(Compatible, Part.part_id == Compatible.part_id)
            .where(
                and_(
                    Compatible.moto_type_id == moto_type_id,
                    Part.is_deleted == False
                )
            )
        )
        return result.scalars().all()
    except IntegrityError as e:
        log.error(f"Lỗi toàn vẹn dữ liệu khi lấy phụ tùng theo loại xe: {e}")
        raise e
    except Exception as e:
        log.error(f"Lỗi khi lấy phụ tùng theo loại xe: {e}")
        raise e

async def add_compatible_moto_type(db: AsyncSession, part_id: int, moto_type_id: int) -> bool:
    """
    Thêm một loại xe tương thích với phụ tùng.
    """
    try:
        # Kiểm tra xem phụ tùng và loại xe có tồn tại không
        db_part = await get_part_by_id(db, part_id)
        moto_type = await db.get(MotocycleType, moto_type_id)
        
        if not db_part or not moto_type:
            return False
            
        # Kiểm tra xem quan hệ đã tồn tại chưa
        result = await db.execute(
            select(Compatible).where(
                and_(
                    Compatible.part_id == part_id,
                    Compatible.moto_type_id == moto_type_id
                )
            )
        )
        existing = result.first()
        if existing:
            return True  # Quan hệ đã tồn tại
            
        # Thêm mới quan hệ
        compatible = Compatible(part_id=part_id, moto_type_id=moto_type_id)
        db.add(compatible)
        await db.commit()
        return True
    except IntegrityError as e:
        await db.rollback()
        log.error(f"Lỗi toàn vẹn dữ liệu khi thêm loại xe tương thích: {e}")
        raise e
    except Exception as e:
        await db.rollback()
        log.error(f"Lỗi khi thêm loại xe tương thích: {e}")
        raise e

async def remove_compatible_moto_type(db: AsyncSession, part_id: int, moto_type_id: int) -> bool:
    """
    Xóa một loại xe khỏi danh sách tương thích với phụ tùng.
    """
    try:
        result = await db.execute(
            delete(Compatible).where(
                and_(
                    Compatible.part_id == part_id,
                    Compatible.moto_type_id == moto_type_id
                )
            )
        )
        await db.commit()
        return result.rowcount > 0
    except IntegrityError as e:
        await db.rollback()
        log.error(f"Lỗi toàn vẹn dữ liệu khi xóa loại xe tương thích: {e}")
        raise e
    except Exception as e:
        await db.rollback()
        log.error(f"Lỗi khi xóa loại xe tương thích: {e}")
        raise e

async def get_compatible_moto_types(db: AsyncSession, part_id: int) -> list[int]:
    """
    Lấy danh sách ID loại xe tương thích với phụ tùng.
    """
    try:
        result = await db.execute(
            select(Compatible.moto_type_id)
            .where(Compatible.part_id == part_id)
        )
        return result.scalars().all()
    except IntegrityError as e:
        log.error(f"Lỗi toàn vẹn dữ liệu khi lấy danh sách loại xe tương thích: {e}")
        raise e
    except Exception as e:
        log.error(f"Lỗi khi lấy danh sách loại xe tương thích: {e}")
        raise e

async def search_parts(db: AsyncSession, search_term: str) -> list[Part]:
    """
    Tìm kiếm phụ tùng theo tên.
    """
    try:
        search_pattern = f"%{search_term}%"
        result = await db.execute(
            select(Part).where(
                and_(
                    Part.is_deleted == False,
                    Part.name.ilike(search_pattern)
                )
            )
        )
        return result.scalars().all()
    except IntegrityError as e:
        log.error(f"Lỗi toàn vẹn dữ liệu khi tìm kiếm phụ tùng: {e}")
        raise e
    except Exception as e:
        log.error(f"Lỗi khi tìm kiếm phụ tùng: {e}")
        raise e

async def create_part_lot(db: AsyncSession, part_lot: Dict[str, Any]) -> Tuple[PartLot, Warehouse]:
    """
    Tạo một lô phụ tùng mới và cập nhật kho.
    
    Args:
        db: Session cơ sở dữ liệu
        part_lot: Thông tin lô phụ tùng cần tạo
    
    Returns:
        Tuple[PartLot, Warehouse]: Lô phụ tùng và thông tin kho đã tạo
    """
    try:
        # Kiểm tra xem phụ tùng có tồn tại không
        part = await get_part_by_id(db, part_lot["part_id"])
        if not part:
            raise ValueError(f"Không tìm thấy phụ tùng với ID: {part_lot['part_id']}")
        
        # Tạo mới lô phụ tùng
        new_part_lot = PartLot(
            part_id=part_lot["part_id"],
            quantity=part_lot["quantity"],
            import_date=datetime.now(),
            unit=part.unit,
            price=part_lot["price"]
        )
        
        db.add(new_part_lot)
        await db.flush()  # Để lấy ID của lô vừa tạo
        
        # Tạo mới thông tin kho
        new_warehouse = Warehouse(
            part_lot_id=new_part_lot.part_lot_id,
            stock=part_lot["quantity"],
            location=part_lot["location"]
        )
        
        db.add(new_warehouse)
        
        # Tạo mới lịch sử nhập kho
        new_history = History(
            part_lot_id=new_part_lot.part_lot_id,
            date=datetime.now(),
            quantity=part_lot["quantity"],
            type="Nhập",
            note=part_lot.get("note", "Nhập kho mới")
        )
        
        db.add(new_history)
        
        return new_part_lot, new_warehouse
    except IntegrityError as e:
        await db.rollback()
        log.error(f"Lỗi toàn vẹn dữ liệu khi tạo lô phụ tùng: {e}")
        raise e
    except Exception as e:
        await db.rollback()
        log.error(f"Lỗi khi tạo lô phụ tùng: {e}")
        raise e

async def bulk_receive_parts(db: AsyncSession, data: BulkPartLotCreate) -> Dict[str, Any]:
    """
    Nhập kho hàng loạt nhiều phụ tùng cùng lúc.
    
    Args:
        db: Session cơ sở dữ liệu
        data: Dữ liệu nhập kho hàng loạt
    
    Returns:
        Dict[str, Any]: Kết quả của quá trình nhập kho
    """
    created_lots = []
    try:
        # Kiểm tra xem nhà cung cấp có tồn tại không
        supplier = await db.get(Supplier, data.supplier_id)
        if not supplier:
            raise ValueError(f"Không tìm thấy nhà cung cấp với ID: {data.supplier_id}")
        
        # Thêm từng phụ tùng vào cơ sở dữ liệu
        for part_data in data.parts:
            part_lot_data = {
                "part_id": part_data.part_id,
                "quantity": part_data.quantity,
                "price": part_data.price,
                "location": part_data.location,
                "note": data.note
            }
            
            new_part_lot, _ = await create_part_lot(db, part_lot_data)
            created_lots.append(new_part_lot.part_lot_id)
        
        # Commit sau khi tất cả các thay đổi đã được thực hiện
        await db.commit()
        
        return {
            "success": True,
            "message": f"Đã nhập kho thành công {len(created_lots)} loại phụ tùng",
            "created_lots": created_lots
        }
    except IntegrityError as e:
        await db.rollback()
        log.error(f"Lỗi toàn vẹn dữ liệu khi nhập kho hàng loạt: {e}")
        return {
            "success": False,
            "message": f"Lỗi toàn vẹn dữ liệu: {str(e)}",
            "created_lots": created_lots
        }
    except Exception as e:
        await db.rollback()
        log.error(f"Lỗi khi nhập kho hàng loạt: {e}")
        return {
            "success": False,
            "message": f"Lỗi: {str(e)}",
            "created_lots": created_lots
        }

async def get_parts_by_supplier_id(db: AsyncSession, supplier_id: int) -> list[Part]:
    """
    Lấy danh sách phụ tùng từ một nhà cung cấp cụ thể.
    
    Args:
        db: Session cơ sở dữ liệu
        supplier_id: ID của nhà cung cấp
    
    Returns:
        list[Part]: Danh sách phụ tùng từ nhà cung cấp
    """
    try:
        result = await db.execute(
            select(Part).where(
                and_(
                    Part.supplier_id == supplier_id,
                    Part.is_deleted == False
                )
            )
        )
        return result.scalars().all()
    except IntegrityError as e:
        log.error(f"Lỗi toàn vẹn dữ liệu khi lấy phụ tùng theo nhà cung cấp: {e}")
        raise e
    except Exception as e:
        log.error(f"Lỗi khi lấy phụ tùng theo nhà cung cấp: {e}")
        raise e
