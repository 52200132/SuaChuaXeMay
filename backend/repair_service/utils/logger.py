import logging
import sys
from datetime import datetime
from pathlib import Path
from logging.handlers import RotatingFileHandler
import copy

# Tạo thư mục logs nếu chưa tồn tại
log_dir = Path("logs")
log_dir.mkdir(exist_ok=True)

# Định dạng log cho file
file_formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

class ColoredFormatter(logging.Formatter):
    """Định dạng log với màu sắc cho console"""
    
    COLORS = {
        'DEBUG': '\033[37m',     # Trắng
        'INFO': '\033[32m',      # Xanh lá
        'WARNING': '\033[33m',   # Vàng
        'ERROR': '\033[31m',     # Đỏ
        'CRITICAL': '\033[41m',  # Nền đỏ
    }
    RESET = '\033[0m'

    def format(self, record):
        # Tạo bản sao của record để không ảnh hưởng đến các formatter khác
        colored_record = copy.copy(record)
        levelname = colored_record.levelname
        color = self.COLORS.get(levelname, self.RESET)
        colored_record.msg = f"{color}{colored_record.msg}{self.RESET}"
        return super().format(colored_record)

def setup_logger(name: str, log_file: str = None, allow_propagate: bool = False) -> logging.Logger:
    """Thiết lập logger với tên và file log cụ thể"""
    logger = logging.getLogger(name)
    
    # Nếu logger đã được cấu hình, trả về logger đó
    if logger.handlers:
        return logger
    
    logger.setLevel(logging.DEBUG)
    # Ngăn log được truyền lên logger cha (default logger) để tránh in trùng lặp
    logger.propagate = allow_propagate

    # Handler cho console với màu sắc
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_formatter = ColoredFormatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)

    # Handler cho file nếu được chỉ định
    if log_file:
        file_path = log_dir / f"{log_file}.log"
        file_handler = RotatingFileHandler(
            file_path,
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5,
            encoding='utf-8'
        )
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(file_formatter)
        logger.addHandler(file_handler)

    return logger

# Tạo logger mặc định cho ứng dụng
# default_logger = setup_logger('resource_service', 'app', True)

def get_logger(name: str) -> logging.Logger:
    """Lấy logger theo tên module"""
    return setup_logger(f"{name}", name, False)