from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from api.v1.endpoints.url import URLS
from services import warehouse_services
from db.session import get_db
from utils.logger import get_logger
from schemas.dto.part_lot_export import PartLotExport

router = APIRouter()

log = get_logger(__name__)

@router.post(URLS['WAREHOUSE']['EXPORT_PART_LOTS'])
async def export_part_lots(part_lots: list[PartLotExport], db: AsyncSession = Depends(get_db)):
    """
    Xuất các lô phụ tùng theo danh sách ID.
    """
    try:
        await warehouse_services.export_part_lots(db, part_lots)
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

