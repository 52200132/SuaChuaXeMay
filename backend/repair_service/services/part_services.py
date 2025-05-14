from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_, func, or_

from utils.logger import get_logger
from models.models_2 import Part, Compatible, Warehouse, Supplier, PartLot, PartOrderDetail
from schemas.views.part import PartView, PartWarehouseView, PartOrderDetailView, PartWarehouseView2

log = get_logger(__name__)

async def get_part_views(db: AsyncSession):
    """
    Lấy danh sách phụ tùng xe máy.
    """
    try:
        # Truy vấn lấy thông tin phụ tùng kèm stock từ warehouse
        query = (
            select(
                Part,
                func.sum(Warehouse.stock).label("total_stock"),
                Supplier.name.label("supplier_name")
            )
            .outerjoin(PartLot, Part.part_id == PartLot.part_id)
            .outerjoin(Warehouse, PartLot.part_lot_id == Warehouse.part_lot_id)
            .outerjoin(Supplier, Part.supplier_id == Supplier.supplier_id)
            .where(
                and_(
                    Part.is_deleted == False,
                    # Warehouse.stock > 0,
                )
            )
            .group_by(
                Part.part_id,
            )
        )
        
        result = await db.execute(query)
        parts_data = result.all()
        
        result_list = []
        for part_info in parts_data:
            part = part_info[0]  # Part object
            total_stock = part_info[1] or 0  # Stock từ warehouse, hoặc 0 nếu là None
            supplier_name = part_info[2]

            part_view = PartView(
                part_id=part.part_id,
                name=part.name,
                unit=part.unit,
                price=part.price,
                total_stock=total_stock,
                supplier_name=supplier_name,
                URL=part.URL
            )
            result_list.append(part_view)
        
        return result_list
    except IntegrityError as e:
        log.error(f"Lỗi toàn vẹn dữ liệu khi lấy thông tin phụ tùng: {e}")
        raise e
    except Exception as e:
        log.error(f"Lỗi khi lấy thông tin phụ tùng: {e}")
        raise e

async def get_part_views_by_moto_type_id(db: AsyncSession, moto_type_id: int):
    """
    Lấy danh sách phụ tùng tương thích với một loại xe máy.
    """
    try:
        # Truy vấn lấy thông tin phụ tùng kèm stock từ warehouse
        query = (
            select(
                Part,
                func.sum(Warehouse.stock).label("total_stock"),
                Supplier.name.label("supplier_name"),
            )
            .outerjoin(Compatible, Part.part_id == Compatible.part_id)
            .outerjoin(PartLot, Part.part_id == PartLot.part_id)
            .outerjoin(Warehouse, PartLot.part_lot_id == Warehouse.part_lot_id)
            .outerjoin(Supplier, Part.supplier_id == Supplier.supplier_id)
            .where(
                and_(
                    Part.is_deleted == False,
                    or_(
                        Compatible.moto_type_id == moto_type_id,
                        Compatible.moto_type_id == None,
                    ),
                    # Warehouse.stock > 0,
                )
            )
            .group_by(
                Part.part_id,
            )
        )

        result = await db.execute(query)
        parts_data = result.all()

        result_list = []
        for part_info in parts_data:
            part = part_info[0]  # Part object
            total_stock = part_info[1] or 0  # Stock từ warehouse, hoặc 0 nếu là None
            supplier_name = part_info[2]

            part_view = PartView(
                part_id=part.part_id,
                name=part.name,
                unit=part.unit,
                price=part.price,
                total_stock=total_stock,
                supplier_name=supplier_name,
                URL=part.URL
            )
            result_list.append(part_view)

        # print(f"result_list: {result_list}")

        return result_list
    except IntegrityError as e:
        log.error(f"Lỗi toàn vẹn dữ liệu khi lấy thông tin phụ tùng: {e}")
        raise e
    except Exception as e:
        log.error(f"Lỗi khi lấy thông tin phụ tùng: {e}")
        raise e

async def get_part_warehouse_views_by_part_id_list(db: AsyncSession, part_id_list: list) -> list[PartWarehouseView]:
    """
    Lấy danh sách thông tin kho của các phụ tùng theo danh sách ID.
    """
    try:
        query = (
            select(
                Part,
                Warehouse,
                Supplier,
                PartLot,
            )
            .outerjoin(PartLot, Part.part_id == PartLot.part_id)
            .outerjoin(Warehouse, PartLot.part_lot_id == Warehouse.part_lot_id)
            .outerjoin(Supplier, Part.supplier_id == Supplier.supplier_id)
            .where(
                and_(
                    Part.is_deleted == False,
                    Part.part_id.in_(part_id_list),
                    Warehouse.stock > 0
                )
            )
        )
        
        result = await db.execute(query)
        part_warehouse_data = result.all()
        
        result_list = []
        for part_info in part_warehouse_data:
            part = part_info[0]  # Part object
            warehouse = part_info[1]  # Warehouse object
            supplier = part_info[2]  # Supplier object
            part_lot = part_info[3]

            part_warehouse_view = PartWarehouseView(
                part_id=part.part_id,
                part_warehouse_id=warehouse.part_lot_id,
                name=part.name,
                unit=part.unit,
                import_price=part_lot.price,
                import_date=part_lot.import_date,
                stock=warehouse.stock if warehouse else 0,
                quantity=part_lot.quantity if part_lot else 0,
                supplier_name=supplier.name if supplier else None,
                URL=part.URL,
                location=warehouse.location,
            )
            result_list.append(part_warehouse_view)
        
        return result_list
    except IntegrityError as e:
        log.error(f"Lỗi toàn vẹn dữ liệu khi lấy thông tin kho phụ tùng: {e}")
        raise e
    except Exception as e:
        log.error(f"Lỗi khi lấy thông tin kho phụ tùng: {e}")
        raise e

async def get_part_warehouse_views_by_order_id(db: AsyncSession, order_id: int) -> list[PartWarehouseView]:
    """
    Lấy danh sách thông tin kho của các phụ tùng theo ID đơn hàng.
    """
    try:
        part_ids = await db.execute(
            select(PartOrderDetail.part_id)
            .where(PartOrderDetail.order_id == order_id)
        )
        part_id_list = part_ids.scalars().all()
        result = await get_part_warehouse_views_by_part_id_list(db, part_id_list)

        log.info(f"Lấy danh sách thông tin kho phụ tùng theo đơn hàng thành công: {order_id}")
        return result
    except IntegrityError as e:
        log.error(f"Lỗi toàn vẹn dữ liệu khi lấy thông tin kho phụ tùng theo đơn hàng: {e}")
        raise e
    except Exception as e:
        log.error(f"Lỗi khi lấy thông tin kho phụ tùng theo đơn hàng: {e}")
        raise e

async def get_part_order_detail_views_by_order_id(db: AsyncSession, order_id: int):
    """
    Lấy danh sách thông tin chi tiết đơn hàng phụ tùng theo ID đơn hàng.
    """
    try:
        query = (
            select(
                PartOrderDetail,
                Part,
            )
            .outerjoin(Part, PartOrderDetail.part_id == Part.part_id)
            .where(
                PartOrderDetail.order_id == order_id,
            )
        )
        
        result = await db.execute(query)
        part_order_details_data = result.all()

        total_amount_for_part = 0
        
        result_list = []
        for part_order_detail_info in part_order_details_data:
            part_order_detail = part_order_detail_info[0]  # PartOrderDetail object
            part = part_order_detail_info[1]  # Part object

            total_amount_for_part += part.price * part_order_detail.quantity if part_order_detail.is_selected else 0

            part_order_detail_view = PartOrderDetailView(
                part_id=part.part_id,
                part_order_detail_id=part_order_detail.part_detail_ID,
                name=part.name,
                unit=part.unit,
                price=part.price,
                quantity=part_order_detail.quantity,
                total_price=part.price * part_order_detail.quantity,
                is_selected=part_order_detail.is_selected,
            )
            result_list.append(part_order_detail_view)
        
        log.info(f"Lấy danh sách chi tiết đơn hàng phụ tùng theo ID đơn hàng thành công: {order_id}")
        return {
            "part_order_details": result_list,
            "total_amount_for_part": total_amount_for_part
        }
    except IntegrityError as e:
        log.error(f"Lỗi toàn vẹn dữ liệu khi lấy danh sách chi tiết đơn hàng phụ tùng: {e}")
        raise e
    except Exception as e:
        log.error(f"Lỗi khi lấy danh sách chi tiết đơn hàng phụ tùng: {e}")
        raise e

async def get_part_warehouse_views_by_order_id_v2(db: AsyncSession, order_id: int) -> list[PartWarehouseView2]:
    """
    Lấy danh sách thông tin kho của các phụ tùng theo danh sách ID.
    """
    try:
        # First query to get part order details and parts
        query = (
            select(
                PartOrderDetail,
                Part,
            )
            .join(Part, PartOrderDetail.part_id == Part.part_id)
            .where(
                PartOrderDetail.order_id == order_id,
                Part.is_deleted == False,
                PartOrderDetail.is_selected == True
            )
        )
        
        result = await db.execute(query)
        part_details = result.all()
        
        result_list = []
        
        # For each part, get warehouse information separately
        for part_detail in part_details:
            part_order_detail = part_detail[0]
            part = part_detail[1]
            
            # Query to get warehouse info for this part
            warehouse_query = (
                select(
                    Warehouse.part_lot_id,
                    PartLot.price,
                    PartLot.import_date,
                    Warehouse.stock,
                    PartLot.quantity,
                    Supplier.name.label("supplier_name"),
                    Warehouse.location
                )
                .join(PartLot, Warehouse.part_lot_id == PartLot.part_lot_id)
                .join(Part, PartLot.part_id == Part.part_id)  # Add this join to include the Part table
                .outerjoin(Supplier, Part.supplier_id == Supplier.supplier_id)
                .where(
                    and_(
                        PartLot.part_id == part.part_id,
                        Warehouse.stock > 0
                    )
                )
                .order_by(PartLot.import_date.asc())
            )
            
            warehouse_result = await db.execute(warehouse_query)
            warehouse_data = warehouse_result.all()
            
            # Convert warehouse data to list of dictionaries
            warehouses = []
            for w in warehouse_data:
                warehouse = {
                    "part_lot_id": w.part_lot_id,
                    "import_price": w.price,
                    "import_date": w.import_date,
                    "stock": w.stock,
                    "quantity": w.quantity,
                    "supplier_name": w.supplier_name,
                    "location": w.location
                }
                warehouses.append(warehouse)
            
            part_warehouse_view = PartWarehouseView2(
                part_id=part.part_id,
                name=part.name,
                unit=part.unit,
                price=part.price,
                need_quantity=part_order_detail.quantity,  # Add the needed quantity from the order
                URL=part.URL,
                warehouses=warehouses
            )
            result_list.append(part_warehouse_view)
        
        log.info(f"Lấy danh sách thông tin kho phụ tùng theo đơn hàng thành công: {order_id}")
        return result_list
    except IntegrityError as e:
        log.error(f"Lỗi toàn vẹn dữ liệu khi lấy thông tin kho phụ tùng: {e}")
        raise e
    except Exception as e:
        log.error(f"Lỗi khi lấy thông tin kho phụ tùng: {e}")
        raise e
    """
    Lấy danh sách thông tin kho của các phụ tùng theo danh sách ID.
    """
    try:
        query = (
            select(
                PartOrderDetail,
                Part,
                # Warehouse,
                # Supplier,
                # PartLot,
                func.array_agg(
                    func.json_build_object(
                        "part_lot_id", Warehouse.part_lot_id,
                        "import_price", PartLot.price,
                        "import_date", PartLot.import_date,
                        "stock", Warehouse.stock,
                        "quantity", PartLot.quantity,
                        "supplier_name", Supplier.name,
                        "location", Warehouse.location
                    )
                ).label("warehouses")
            )
            .where(PartOrderDetail.order_id == order_id)
            .join(Part, PartOrderDetail.part_id == Part.part_id)
            .outerjoin(PartLot, Part.part_id == PartLot.part_id)
            .outerjoin(Warehouse, PartLot.part_lot_id == Warehouse.part_lot_id)
            .outerjoin(Supplier, Part.supplier_id == Supplier.supplier_id)
            .where(
                and_(
                    Part.is_deleted == False,
                    Warehouse.stock > 0
                )
            )
            .group_by(
                Part.part_id,
            )
            .order_by(PartLot.import_date.asc())
        )
        
        result = await db.execute(query)
        part_warehouse_data = result.all()
        
        result_list = []
        for part_info in part_warehouse_data:
            part_order_detail = part_info[0]
            part = part_info[1]
            warehouses = part_info[2]

            part_warehouse_view = PartWarehouseView2(
                part_id=part.part_id,
                name=part.name,
                unit=part.unit,
                price=part.price,
                need_quantity=0,
                URL=part.URL,
                warehouses=warehouses
            )
            result_list.append(part_warehouse_view)
        
        return result_list
    except IntegrityError as e:
        log.error(f"Lỗi toàn vẹn dữ liệu khi lấy thông tin kho phụ tùng: {e}")
        raise e
    except Exception as e:
        log.error(f"Lỗi khi lấy thông tin kho phụ tùng: {e}")
        raise e
