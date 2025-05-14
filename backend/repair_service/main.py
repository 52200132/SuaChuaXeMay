from fastapi import FastAPI, HTTPException, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError

from db.session import init_db
from api.v1.endpoints.diagnosis_router import router as diagnosis_router
from api.v1.endpoints.order_router import router as order_router
from api.v1.endpoints.order_status_history_router import router as order_status_history_router
from api.v1.endpoints.part_order_detail_router import router as part_order_detail_router
from api.v1.endpoints.service_order_detail_router import router as service_order_detail_router
from api.v1.endpoints.motocycle_type_router import router as motocycle_type_router
from api.v1.endpoints.part_router import router as part_router
from api.v1.endpoints.service_router import router as service_router
from api.v1.endpoints.order_router import router_v2 as order_router_v2
from api.v1.endpoints.warehouse_router import router as warehouse_router
from api.v1.endpoints.supplier_router import router as supplier_router

app = FastAPI(title="Repair Service API", version="1.0.0")

# Đăng ký các router
app.include_router(order_router, prefix="/api/v1", tags=["order"])
app.include_router(diagnosis_router, prefix="/api/v1", tags=["diagnosis"])
app.include_router(order_status_history_router, prefix="/api/v1", tags=["order-status-history"])
app.include_router(part_order_detail_router, prefix="/api/v1", tags=["part-order-detail"])
app.include_router(service_order_detail_router, prefix="/api/v1", tags=["service-order-detail"])
app.include_router(motocycle_type_router, prefix="/api/v1", tags=["motocycle-type"])
app.include_router(part_router, prefix="/api/v2", tags=["part"])
app.include_router(service_router, prefix="/api/v2", tags=["service"])
app.include_router(order_router_v2, prefix="/api/v2", tags=["order-v2"])
app.include_router(warehouse_router, prefix="/api/v2", tags=["warehouse"])
app.include_router(supplier_router, prefix="/api/v2", tags=["supplier"])


# Cấu hình CORS cho phép truy cập từ các nguồn khác nhau
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Thay thế bằng danh sách các nguồn mà bạn muốn cho phép
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     """Khởi động và đóng kết nối đến cơ sở dữ liệu."""
#     # Khởi động
#     await init_db()
#     print("Accset docs: http://localhost:8001/docs")
#     print("Server is running...")
#     yield
#     print("Server is shutting down...")
#     # Dọn dẹp khi đóng ứng dụng
#     # Ví dụ: đóng kết nối DB nếu cần


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    errors = []
    details = []
    for error in exc.errors():
        field = error.get("loc", [])
        msg = error.get("msg", "")
        type = error.get("type", "")
        errors.append({"loc": field, "msg": msg, "type": type})
        details.append(msg.split(", ")[-1] if msg else "")
    
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"errors": errors, "detail": details}
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"satus": exc.status_code, "detail": exc.detail}
    )

@app.exception_handler(OperationalError)
async def operational_error_handler(request, exc):
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"status": status.HTTP_503_SERVICE_UNAVAILABLE, "detail": str(exc)}
    )

@app.on_event("startup")
async def startup_event():
    """Khởi động ứng dụng và kết nối đến cơ sở dữ liệu."""
    await init_db()
    print("Accset docs: http://localhost:8002/docs")
    print("Server is running...")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="localhost", port=8002, log_level="info", reload=True)