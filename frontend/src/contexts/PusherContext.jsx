import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import pusher, { subscribeToChannel, unsubscribeFromChannel } from '../services/pusher';
import { useStaffAuth } from '../admin/contexts/StaffAuthContext';
import { useAuth } from './AuthContext';

const PusherContext = createContext();

// Các key cho localStorage
const NOTIFICATIONS_STORAGE_KEY = 'app_notifications';
const MAX_NOTIFICATIONS = 20; // Số lượng thông báo tối đa lưu trữ

export const PusherProvider = ({ children }) => {
    const { currentStaff } = useStaffAuth();
    const { currentUser } = useAuth();

    // Khởi tạo state từ localStorage
    const [notifications, setNotifications] = useState(() => {
        try {
            const storedNotifications = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
            return storedNotifications ? JSON.parse(storedNotifications) : [];
        } catch (error) {
            console.error('Lỗi khi đọc thông báo từ localStorage:', error);
            return [];
        }
    });

    // Theo dõi thông báo đã xử lý để tránh trùng lặp
    const processedNotifications = useRef(new Set());

    // Cập nhật localStorage khi notifications thay đổi
    useEffect(() => {
        try {
            localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
        } catch (error) {
            console.error('Lỗi khi lưu thông báo vào localStorage:', error);
        }
    }, [notifications]);

    // Hàm xử lý thông báo mới nhận
    const handleNotification = (data) => {
        // Tạo ID duy nhất cho thông báo
        const notificationId = data.id || `${data.title}-${data.message}-${data.timestamp || Date.now()}`;

        // Kiểm tra xem thông báo đã được xử lý chưa
        if (processedNotifications.current.has(notificationId)) {
            console.log('Bỏ qua thông báo trùng lặp:', notificationId);
            return;
        }

        // Thêm vào danh sách đã xử lý
        processedNotifications.current.add(notificationId);

        // Giới hạn kích thước Set
        if (processedNotifications.current.size > 100) {
            const firstItem = Array.from(processedNotifications.current)[0];
            processedNotifications.current.delete(firstItem);
        }

        // Thêm thông báo và cập nhật state
        setNotifications(prev => {
            // Kiểm tra trùng lặp
            const exists = prev.some(notif =>
                notif.id === data.id ||
                (notif.title === data.title && notif.message === data.message && notif.timestamp === data.timestamp)
            );

            if (exists) return prev;

            // Thêm thông báo mới và giới hạn số lượng
            return [{ ...data, read: false, id: data.id || notificationId }, ...prev].slice(0, MAX_NOTIFICATIONS);
        });
    };

    // Đăng ký kênh khách hàng
    useEffect(() => {
        let customerChannel = null;

        if (currentUser?.customer_id) {
            const channelName = `customer-${currentUser.customer_id}`;
            console.log(`Đăng ký kênh khách hàng: ${channelName}`);

            customerChannel = subscribeToChannel(channelName, 'notification', handleNotification);
        }

        return () => {
            if (currentUser?.customer_id) {
                unsubscribeFromChannel(`customer-${currentUser.customer_id}`);
            }
        };
    }, [currentUser]);

    // Đăng ký kênh nhân viên
    useEffect(() => {
        let staffChannel = null;

        if (currentStaff?.staff_id) {
            const channelName = `staff-${currentStaff.staff_id}`;
            console.log(`Đăng ký kênh nhân viên: ${channelName}`);

            staffChannel = subscribeToChannel(channelName, 'notification', handleNotification);
        }

        // Cleanup
        return () => {
            if (currentStaff?.staff_id) {
                unsubscribeFromChannel(`staff-${currentStaff.staff_id}`);
            }
        };
    }, [currentStaff]);

    // Đăng ký kênh broadcast
    useEffect(() => {
        console.log('Đăng ký kênh broadcast');
        const broadcastChannel = subscribeToChannel('broadcast', 'notification', handleNotification);

        // Cleanup
        return () => {
            unsubscribeFromChannel('broadcast');
        };
    }, []);

    // Đánh dấu thông báo là đã đọc
    const markAsRead = (notificationId) => {
        setNotifications(prev =>
            prev.map(notification =>
                notification.id === notificationId
                    ? { ...notification, read: true }
                    : notification
            )
        );
    };

    // Đánh dấu tất cả thông báo là đã đọc
    const markAllAsRead = () => {
        setNotifications(prev =>
            prev.map(notification => ({ ...notification, read: true }))
        );
    };

    // Xóa một thông báo cụ thể
    const removeNotification = (notificationId) => {
        setNotifications(prev =>
            prev.filter(notification => notification.id !== notificationId)
        );
    };

    // Xóa tất cả thông báo
    const clearNotifications = () => {
        setNotifications([]);
        // Xóa khỏi localStorage
        localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
    };

    return (
        <PusherContext.Provider
            value={{
                notifications,
                markAsRead,
                markAllAsRead,
                removeNotification,
                clearNotifications
            }}
        >
            {children}
        </PusherContext.Provider>
    );
};

export const usePusher = () => useContext(PusherContext);

export default PusherContext;
