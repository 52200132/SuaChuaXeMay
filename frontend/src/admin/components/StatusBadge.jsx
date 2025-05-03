import React from 'react';
import { Badge } from 'react-bootstrap';

const StatusBadge = ({ status }) => {
    const statusToBootstrapColor = {
        // Order Statuses
        'received': 'primary',
        'checking': 'warning',
        'wait_confirm': 'info',
        'repairing': 'danger',
        'wait_delivery': 'success',
        'delivered': 'dark',

        'đã tiếp nhận': 'primary',
        'đang kiểm tra': 'warning',
        'chờ xác nhận': 'info', 
        'đang sửa chữa': 'danger',
        'chờ giao xe': 'success',
        'đã giao xe': 'dark',

        // Booking Statuses
        'pending': 'warning',
        'confirmed': 'info',
        'completed': 'success',
        'cancelled': 'danger',

        'chờ xử lý': 'warning',
        'đã xác nhận': 'info',
        'hoàn thành': 'success',
        'đã hủy': 'danger',

        'đã trả khách': 'success',
    };


    return (
        <Badge bg={statusToBootstrapColor[status?.toLowerCase()] || 'secondary'} className="py-1 px-2">
            {status}
        </Badge>
    );
};

export default StatusBadge;
