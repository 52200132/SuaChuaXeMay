import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute = ({ children }) => {
    const { currentUser, loading } = useAuth();
    const location = useLocation();

    // Thêm logic server side
    useEffect(() => {
        // Có thể gửi yêu cầu đến server để xác thực token ở đây
        // trong triển khai thực sự với multipage
        const verifyAuthStatus = async () => {
            try {
                // Mô phỏng việc kiểm tra xác thực trên server
                console.log("Verifying authentication with server...");
            } catch (error) {
                console.error("Error verifying auth:", error);
            }
        };

        if (currentUser) {
            verifyAuthStatus();
        }
    }, [currentUser]);

    if (loading) {
        return (
            <div className="d-flex justify-content-center p-5">
                <div className="spinner-border text-primary-red" role="status">
                    <span className="visually-hidden">Đang tải...</span>
                </div>
            </div>
        );
    }

    if (!currentUser) {
        // Chuyển hướng đến trang đăng nhập và lưu URL hiện tại
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default PrivateRoute;
