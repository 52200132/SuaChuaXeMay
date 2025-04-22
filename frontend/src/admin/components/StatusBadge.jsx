import React from 'react';
import { Badge } from 'react-bootstrap';

const StatusBadge = ({ status }) => {
    const getVariant = () => {
        switch (status.toLowerCase()) {
            case 'pending':
            case 'chờ xác nhận':
            case 'đang sửa chữa':
                return 'warning';
            case 'confirmed':
            case 'đã xác nhận':
                return 'info';
            case 'in progress':
            case 'đang thực hiện':
                return 'primary';
            case 'completed':
            case 'hoàn thành':
            case 'đã trả khách':
                return 'success';
            case 'cancelled':
            case 'đã hủy':
                return 'danger';
            default:
                return 'secondary';
        }
    };

    return (
        <Badge bg={getVariant()} className="py-1 px-2">
            {status}
        </Badge>
    );
};

export default StatusBadge;
