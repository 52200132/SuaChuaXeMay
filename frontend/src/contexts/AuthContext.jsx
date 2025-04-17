import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

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
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (email === 'user@example.com' && password === 'password') {
                    const user = {
                        id: '1',
                        email,
                        displayName: 'Người dùng Demo',
                        photoURL: null
                    };
                    setCurrentUser(user);
                    localStorage.setItem('user', JSON.stringify(user));
                    resolve(user);
                } else {
                    reject(new Error('Email hoặc mật khẩu không đúng!'));
                }
            }, 1000);
        });
    };

    // Hàm đăng ký
    const register = async (email, password, displayName) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const user = {
                    id: Date.now().toString(),
                    email,
                    displayName,
                    photoURL: null
                };
                setCurrentUser(user);
                localStorage.setItem('user', JSON.stringify(user));
                resolve(user);
            }, 1000);
        });
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

    const value = {
        currentUser,
        login,
        register,
        logout,
        updateProfile,
        loading,
        error
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
