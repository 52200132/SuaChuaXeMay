from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from db.session import init_db
from api.v1.endpoints import service_router as service
from api.v1.endpoints import staff_router as staff

app = FastAPI(title="Resource Service API", version="1.0.0")

app.include_router(service.router, prefix="/api/v1", tags=["Service Types"])
app.include_router(staff.router, prefix="/api/v1", tags=["Staff"])


# Cấu hình CORS cho phép truy cập từ các nguồn khác nhau
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Thay thế bằng danh sách các nguồn mà bạn muốn cho phép
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    errors = []
    for error in exc.errors():
        field = error.get("loc", [])
        msg = error.get("msg", "")
        errors.append({"field": field, "message": msg})
    
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": errors},
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"satus": exc.status_code, "detail": exc.detail}
    )

@app.on_event("startup")
async def startup_event():
    """Khởi động ứng dụng và kết nối đến cơ sở dữ liệu."""
    await init_db()
    print("Accset docs: http://localhost:8000/docs")
    print("Server is running...")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="localhost", port=8000, reload=True)