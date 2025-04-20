from fastapi import FastAPI, HTTPException, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError

from db.session import init_db
from api.v1.endpoints.customer_router import router as customer_router
from api.v1.endpoints.motorcycle_router import router as motorcycle_router
from api.v1.endpoints.appointment_router import router as appointment_router

app = FastAPI(title="Customer Service API", version="1.0.0")

# Đăng ký các router
app.include_router(customer_router, prefix="/api/v1", tags=["Customer"])
app.include_router(motorcycle_router, prefix="/api/v1", tags=["Motorcycle"])
app.include_router(appointment_router, prefix="/api/v1", tags=["Appointment"])

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
    print("Accset docs: http://localhost:8001/docs")
    print("Server is running...")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="localhost", port=8001, log_level="info", reload=True)