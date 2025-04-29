import React, { createContext, useContext, useState, useEffect } from 'react';
import { customerService, resourceService } from '../services/api';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

// TODO: Xử lý thuộc tính hình đại diện của người dùng 
export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Kiểm tra xem người dùng đã đăng nhập trước đó không
    useEffect(() => {
        const checkAuthStatus = () => {
            try {
                const user = localStorage.getItem('user');
                if (user) {
                    setCurrentUser(JSON.parse(user));
                }
            } catch (err) {
                console.error("Error checking auth status:", err);
            } finally {
                setLoading(false);
            }
        };
        
        checkAuthStatus();
    }, []);

    // Hàm đăng nhập
    const login = async (email, password) => {
        setError('');
        try {
            const response = await customerService.login(email, password);
            const userData = response.data;
            console.log("Đăng nhập thành công:", userData);
            const user = {
                id: userData.customer_id,
                email: userData.email,
                displayName: userData.fullname || userData.email.split('@')[0],
                phone: userData.phone_num,
                photoURL: null,
                role: email === 'admin@example.com' ? 'admin' : (email === 'employee@example.com' ? 'employee' : 'customer')
            };
            setCurrentUser(user);
            localStorage.setItem('user', JSON.stringify(user));
            return user;
        } catch (error) {
            if (error.response && error.response.status === 401) {
                const errorMessage = error.response.data.detail || 'Đăng nhập thất bại';
                setError(errorMessage);
                throw new Error(errorMessage);
            }
            const errorMessage = 'Đăng nhập thất bại. Vui lòng thử lại sau.';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    };

    // Hàm đăng nhập dành cho nhân viên
    const loginEmployee = async (email, password) => {
        setError('');
        try {
            const response = await resourceService.staff.login(email, password);
            const userData = response.data;
            const user = {
                id: userData.customer_id,
                email: userData.email,
                displayName: userData.fullname || userData.email.split('@')[0],
                photoURL: null,
                role: userData.role,
                accsess_token: userData.access_token,
                token_type: userData.token_type,
            };
            setCurrentUser(user);
            localStorage.setItem('user', JSON.stringify(user));
            return user;
        } catch (error) {
            if (error.response && error.response.status === 401) {
                const errorMessage = error.response.data.detail || 'Đăng nhập thất bại';
                setError(errorMessage);
                throw new Error(errorMessage);
            }
            const errorMessage = 'Đăng nhập thất bại. Vui lòng thử lại sau.';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    };

    // Hàm đăng ký
    const register = async (email, password, displayName, customerFromData) => {

        try {
            const result = await customerService.createCustomer(customerFromData);
            if (result.status === 201) {
                const userData = result.data;
                const user = {
                    id: userData.customer_id,
                    email: userData.email,
                    displayName: userData.fullname,
                    photoURL: null,
                    role: 'customer'
                };
                setCurrentUser(user);
                localStorage.setItem('user', JSON.stringify(user));
                return user;
            }
        } catch (error) {
            if (error.status === 400) {
                // Xử lý lỗi từ server
                const errorMessage = error.response.data['detail'] || 'Đăng ký thất bại!';
                throw new Error(errorMessage);
            }
            // console.error("Error during registration:", error);
            throw new Error('Đăng ký thất bại!');
        }
    };

    // Hàm đăng xuất
    const logout = async () => {
        setError('');
        return new Promise((resolve) => {
            try {
                setCurrentUser(null);
                localStorage.removeItem('user');
                
                // Thêm cookie đã hết hạn
                document.cookie = "user_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                
                resolve();
            } catch (error) {
                setError('Đăng xuất thất bại');
                throw error;
            }
        });
    };

    // Hàm cập nhật thông tin người dùng
    const updateProfile = async (userData) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const updatedUser = { ...currentUser, ...userData };
                setCurrentUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
                resolve(updatedUser);
            }, 1000);
        });
    };

    // Function to set the current user role
    const setCurrentUserRole = (role) => {
        if (currentUser) {
            setCurrentUser({
                ...currentUser,
                role
            });
        }
    };

    const value = {
        currentUser,
        login,
        loginEmployee,
        register,
        logout,
        updateProfile,
        loading,
        error,
        setCurrentUserRole
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
