# SuaChuaXeMay - Hệ Thống Quản Lý Cửa Hàng Sửa Chữa Xe Máy

## Giới thiệu
Hệ thống quản lý toàn diện cho cửa hàng sửa chữa xe máy với các chức năng quản lý khách hàng, đặt lịch hẹn, tiếp nhận xe, quản lý phụ tùng, dịch vụ và theo dõi đơn hàng sửa chữa.

## Kiến trúc hệ thống
Hệ thống được xây dựng theo kiến trúc microservices, bao gồm:

- **Frontend**: React.js + Bootstrap
- **Backend Microservices**:
  - **Resource Service**: Quản lý tài nguyên (nhân viên, phụ tùng, dịch vụ)
  - **Customer Service**: Quản lý khách hàng, xe máy, lịch hẹn, tiếp nhận xe
  - **Repair Service**: Quản lý đơn hàng sửa chữa, chẩn đoán, theo dõi quy trình

## Công nghệ sử dụng
- **Frontend**: React.js, React Router, Bootstrap, Chart.js
- **Backend**: FastAPI (Python), SQLAlchemy, MySQL
- **Realtime Communication**: Pusher
- **Containerization**: Docker (tùy chọn)

## Hướng dẫn cài đặt trên Windows

### Yêu cầu hệ thống
- Node.js 16.x trở lên
- Python 3.9 trở lên
- MySQL Server
- Git

### Tạo cơ sở dữ liệu có data
- Tạo một cơ sở dữ liệu có tên giống với `DB_NAME` trong file `.env` bên dưới
- Chạy `databasecuahangsuaxe.sql` để tạo bảng và dữ liệu

### Cài đặt Backend

#### Chuẩn bị môi trường cho mỗi service
1. Di chuyển vào thư mục service:
   ```bash
   cd backend/resource_service   # Hoặc customer_service hoặc repair_service
   ```

2. Cài đặt môi trường ảo:
   ```bash
   python -m venv venv
   venv\\Scripts\\activate
   ```

3. Cài đặt các dependency:
   ```bash
   pip install -r requirements.txt
   ```

4. Tạo file `.env` với nội dung:
   ```
   DB_USERNAME=your_db_username
   DB_PASSWORD=your_db_password
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=suachuaxemay_db
   ```

5. Khởi động service:
   ```bash
   python main.py
   ```

6. Mở một terminal để chạy thêm các dịch vụ
- Phải đảm bảo bạn đã chạy 3 dịch vụ: `resource_service`, `customer_service`, `repair_service`

Các service sẽ hoạt động trên các cổng sau:
- Resource Service: http://localhost:8000
- Customer Service: http://localhost:8001
- Repair Service: http://localhost:8002

### Cài đặt Frontend

1. Di chuyển vào thư mục frontend:
   ```bash
   cd frontend
   ```

2. Cài đặt các dependency:
   ```bash
   npm install
   ```

3. Khởi động ứng dụng:
   ```bash
   npm start
   ```

Frontend sẽ hoạt động tại http://localhost:3000

### Cài đặt WebSocket Pusher Server

1. Di chuyển vào thư mục pusher_server:
   ```bash
   cd pusher_server
   ```

2. Cài đặt các dependency:
   ```bash
   npm install
   ```

3. Khởi động server:
   ```bash
   node server.js
   ```

WebSocket server sẽ hoạt động tại http://localhost:4000

## 🌟 Tính năng chính

### Quản lý khách hàng
- Đăng ký và quản lý thông tin khách hàng
- Lưu trữ thông tin xe máy của khách hàng
- Lịch sử sửa chữa và bảo dưỡng

### Đặt lịch và tiếp nhận
- Khách hàng đặt lịch trực tuyến
- Nhân viên quản lý lịch hẹn
- Quy trình tiếp nhận xe

### Sửa chữa và bảo dưỡng
- Chẩn đoán và báo giá
- Phân công kỹ thuật viên
- Theo dõi trạng thái sửa chữa
- Thông báo cho khách hàng

### Quản lý kho và phụ tùng
- Quản lý tồn kho phụ tùng
- Nhập và xuất phụ tùng

### Thanh toán và hóa đơn
- Tạo hóa đơn
- Quản lý thanh toán
- Báo cáo doanh thu

### Phân quyền người dùng
- Admin
- Quản lý
- Nhân viên tiếp nhận
- Kỹ thuật viên
- Kỹ thuật viên trưởng
- Thu ngân
- Nhân viên kho

## 📊 Báo cáo và thống kê
- Thống kê doanh thu
- Báo cáo sửa chữa
- Phân tích hiệu suất kỹ thuật viên

## 🔗 API Documentation
- Resource Service: http://localhost:8000/docs
- Customer Service: http://localhost:8001/docs
- Repair Service: http://localhost:8002/docs