import React from 'react';
import { Badge } from 'react-bootstrap';

const StatusBadge = ({ status }) => {
    // const getVariant = () => {
    //     switch (status.toLowerCase()) {
    //         case 'pending':
    //         case 'đang sửa chữa':
    //             return 'warning';
    //         case 'đã xác nhận':
    //             return 'info';
    //         case 'in progress':
    //         case 'đang thực hiện':
    //             return 'primary';
    //         case 'completed':
    //         case 'hoàn thành':
    //         case 'đã trả khách':
    //             return 'success';
    //         case 'cancelled':
    //         case 'đã hủy':
    //             return 'danger';
    //         default:
    //             return 'secondary';
    //     }
    // };

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
        'hoan thành': 'success',
        'đã hủy': 'danger',
    };


    return (
        <Badge bg={statusToBootstrapColor[status?.toLowerCase()] || 'secondary'} className="py-1 px-2">
            {status}
        </Badge>
    );
};

export default StatusBadge;
