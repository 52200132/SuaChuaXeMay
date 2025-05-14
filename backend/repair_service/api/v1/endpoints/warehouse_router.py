from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel
import json

from api.v1.endpoints.url import URLS
from services import warehouse_services
from db.session import get_db
from utils.logger import get_logger
from schemas.dto.part_lot_export import PartLotExport
from schemas.dto.warehouse_info import WarehouseInfo

router = APIRouter()

log = get_logger(__name__)

@router.post(URLS['WAREHOUSE']['EXPORT_PART_LOTS'])
async def export_part_lots(part_lots: list[PartLotExport], order_id: int, db: AsyncSession = Depends(get_db)):
    """
    Xuất các lô phụ tùng theo danh sách ID.
    """
    try:
        await warehouse_services.export_part_lots(db, part_lots, order_id)
        return {"message": "Xuất lô phụ tùng thành công."}
    except IntegrityError as e:
        log.error(f"Lỗi toàn vẹn dữ liệu khi xuất lô phụ tùng: {e}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Lỗi toàn vẹn dữ liệu khi xuất lô phụ tùng: {str(e)}"
        )
    except ValueError as e:
        log.error(f"Không đủ số lượng trong kho cho lô phụ tùng: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{str(e)}"
        )
    except Exception as e:
        log.error(f"Lỗi khi xuất lô phụ tùng: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi xuất lô phụ tùng: {str(e)}"
        )

class ListWarehouseInfo(BaseModel):
    part_lots: list[PartLotExport]

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "part_lots": [
                    {
                        "part_lot_id": 1,
                        "quantity": 50,
                        "price": 100000,
                        "location": "Kho A",
                        "supplier_name": "Nhà cung cấp A",
                        "unit": "Cái"
                    }
                ]
            }
        }

@router.get(URLS['WAREHOUSE']['GET_WAREHOUSE_INFO'])
async def get_warehouse_info(part_lots_json: str, db: AsyncSession = Depends(get_db)) -> list[WarehouseInfo]:
    """
    Lấy thông tin kho hàng.
    """
    try:
        print(part_lots_json)
        part_lots = ListWarehouseInfo(part_lots=json.loads(part_lots_json)).part_lots
        print(part_lots)
        warehouse_info = await warehouse_services.get_warehouse_info(db, part_lots)
        return warehouse_info
    except IntegrityError as e:
        log.error(f"Lỗi toàn vẹn dữ liệu khi lấy thông tin kho hàng: {e}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Lỗi toàn vẹn dữ liệu khi lấy thông tin kho hàng: {str(e)}"
        )
    except Exception as e:
        log.error(f"Lỗi khi lấy thông tin kho hàng: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi lấy thông tin kho hàng: {str(e)}"
        )

