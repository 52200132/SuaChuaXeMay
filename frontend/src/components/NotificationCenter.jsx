import React, { useState } from 'react';
import { Dropdown, Badge, ListGroup } from 'react-bootstrap';
import { usePusher } from '../contexts/PusherContext';
import './NotificationCenter.css';

const NotificationCenter = () => {
    const { notifications, markAsRead, clearNotifications } = usePusher();
    const [isOpen, setIsOpen] = useState(false);

    const unreadCount = notifications.filter(notification => !notification.read).length;

    const handleToggle = (isOpen) => {
        setIsOpen(isOpen);
        if (isOpen) {
            // Đánh dấu tất cả đã đọc khi mở dropdown
            notifications.forEach(notification => {
                if (!notification.read) {
                    markAsRead(notification.id);
                }
            });
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <Dropdown onToggle={handleToggle} show={isOpen}>
            <Dropdown.Toggle variant="link" className="notification-bell text-decoration-none">
                <i className="bi bi-bell fs-5"></i>
                {unreadCount > 0 && (
                    <Badge pill bg="danger" className="notification-badge">
                        {unreadCount}
                    </Badge>
                )}
            </Dropdown.Toggle>

            <Dropdown.Menu className="notification-menu">
                <div className="notification-header d-flex justify-content-between align-items-center px-3 py-2">
                    <h6 className="mb-0">Thông báo</h6>
                    {notifications.length > 0 && (
                        <button
                            className="btn btn-sm text-primary"
                            onClick={clearNotifications}
                        >
                            Xóa tất cả
                        </button>
                    )}
                </div>

                <ListGroup variant="flush" className="notification-list">
                    {notifications.length > 0 ? (
                        notifications.map((notification, index) => (
                            <ListGroup.Item
                                key={notification.id || index}
                                className={`notification-item ${!notification.read ? 'unread' : ''}`}
                            >
                                <div className="d-flex">
                                    <div className={`notification-icon ${notification.type || 'info'}`}>
                                        <i className={`bi ${notification.type === 'success' ? 'bi-check-circle' :
                                                notification.type === 'warning' ? 'bi-exclamation-triangle' :
                                                    notification.type === 'error' ? 'bi-x-circle' :
                                                        'bi-info-circle'
                                            }`}></i>
                                    </div>
                                    <div className="notification-content">
                                        <div className="notification-title">{notification.title}</div>
                                        <div className="notification-text">{notification.message}</div>
                                        <div className="notification-time">
                                            {formatTime(notification.timestamp)}
                                        </div>
                                    </div>
                                </div>
                            </ListGroup.Item>
                        ))
                    ) : (
                        <div className="no-notifications text-center py-3">
                            <i className="bi bi-bell-slash fs-4 text-muted"></i>
                            <p className="text-muted mb-0">Không có thông báo nào</p>
                        </div>
                    )}
                </ListGroup>
            </Dropdown.Menu>
        </Dropdown>
    );
};

export default NotificationCenter;
