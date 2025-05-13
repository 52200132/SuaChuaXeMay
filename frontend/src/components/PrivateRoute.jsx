import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useStaffAuth } from '../admin/contexts/StaffAuthContext';

const PrivateRoute = ({ children }) => {
    const { currentStaff, loading } = useStaffAuth();
    const location = useLocation();

    // Xác định đường dẫn đăng nhập dựa trên vai trò người dùng
    const isAdminRoute = location.pathname.startsWith('/admin');
    const loginPath = isAdminRoute ? '/admin/login' : '/login';

    // Add logic for role-based access
    const hasRequiredRole = () => {
        if (!currentStaff) return false;
        
        // For admin routes, user must have a valid staff role
        if (isAdminRoute) {
            const validRoles = ['receptionist', 'head technician', 'technician', 'warehouse worker', 'cashier', 'manager', 'admin', 'owner'];
            
            // Kiểm tra vai trò hợp lệ
            if (!validRoles.includes(currentStaff.role)) {
                return false;
            }
            
            // Kiểm tra truy cập vào các trang chỉ dành cho manager
            const managerOnlyPaths = [
                '/admin/users', 
                '/admin/reports', 
                '/admin/settings',
                '/admin/services'
            ];
            
            if (managerOnlyPaths.some(path => location.pathname.startsWith(path)) && 
                !['manager', 'admin', 'owner'].includes(currentStaff.role)) {
                return false;
            }
            
            // Kiểm tra truy cập trang technician
            if (location.pathname.includes('/technician-dashboard') && 
                !['head technician', 'technician', 'manager', 'admin', 'owner'].includes(currentStaff.role)) {
                return false;
            }

            // Kiểm tra truy cập warehouse (kho hàng)
            if (location.pathname.includes('/warehouse') && 
                !['warehouse worker', 'manager', 'admin', 'owner'].includes(currentStaff.role)) {
                return false;
            }
            
            // Kiểm tra truy cập trang cashier (hóa đơn)
            if (location.pathname.includes('/invoices') && 
                !['cashier', 'manager', 'admin', 'owner'].includes(currentStaff.role)) {
                return false;
            }
            
            // Kiểm tra truy cập trang receptionist
            if ((location.pathname.includes('/bookings') || location.pathname.includes('/receipts')) && 
                !['receptionist', 'manager', 'admin', 'owner'].includes(currentStaff.role)) {
                return false;
            }
            
            return true;
        }
        
        // For customer routes, any authenticated user can access
        return true;
    };

    // Thêm logic server side
    useEffect(() => {
        // Có thể gửi yêu cầu đến server để xác thực token ở đây
        // trong triển khai thực sự với multipage
        // const verifyAuthStatus = async () => {
        //     try {
        //         // Mô phỏng việc kiểm tra xác thực trên server
        //         console.log("Verifying authentication with server...");
        //     } catch (error) {
        //         console.error("Error verifying auth:", error);
        //     }
        // };

        if (currentStaff) {
            // verifyAuthStatus();
        }
    }, [currentStaff]);

    if (loading) {
        return (
            <div className="d-flex justify-content-center p-5">
                <div className="spinner-border text-primary-red" role="status">
                    <span className="visually-hidden">Đang tải...</span>
                </div>
            </div>
        );
    }

    if (!currentStaff || !hasRequiredRole()) {
        // Chuyển hướng đến trang đăng nhập phù hợp và lưu URL hiện tại
        return <Navigate to={loginPath} state={{ from: location }} replace />;
    }

    return children;
};

export default PrivateRoute;
