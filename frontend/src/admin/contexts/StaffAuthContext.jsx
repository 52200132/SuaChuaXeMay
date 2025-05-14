import React, { createContext, useContext, useState, useEffect } from 'react';
import { resourceService } from '../../services/api';

const StaffAuthContext = createContext();

export function useStaffAuth() {
    return useContext(StaffAuthContext);
}

export function StaffAuthProvider({ children }) {
    const [currentStaff, setCurrentStaff] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Check if staff member is already logged in
    useEffect(() => {
        const checkAuthStatus = () => {
            try {
                const staff = localStorage.getItem('staff');
                if (staff) {
                    setCurrentStaff(JSON.parse(staff));
                }
            } catch (err) {
                console.error("Error checking staff auth status:", err);
            } finally {
                setLoading(false);
            }
        };
        
        checkAuthStatus();
    }, []);

    // Staff login function
    const login = async (email, password) => {
        setError('');
        try {
            const response = await resourceService.staff.login(email, password);
            const userData = response.data;
            const staff = {
                staff_id: userData.staff_id,
                email: userData.email,
                displayName: userData.fullname || userData.email.split('@')[0],
                phoneNumber: userData.phone_num,
                photoURL: userData.avatar || null,
                role: userData.role,
                access_token: userData.access_token,
                token_type: userData.token_type,
                originData: userData,
            };
            setCurrentStaff(staff);
            localStorage.setItem('staff', JSON.stringify(staff));
            return staff;
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

    // Staff logout function
    const logout = async () => {
        setError('');
        return new Promise((resolve) => {
            try {
                setCurrentStaff(null);
                localStorage.removeItem('staff');
                
                // Expire auth cookies
                document.cookie = "staff_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                
                resolve();
            } catch (error) {
                setError('Đăng xuất thất bại');
                throw error;
            }
        });
    };

    // Update staff profile
    const updateProfile = async (userData) => {
        try {
            // Here you would have an API call to update staff profile
            // For now, we'll just update the local state
            const updatedStaff = { ...currentStaff, ...userData };
            setCurrentStaff(updatedStaff);
            localStorage.setItem('staff', JSON.stringify(updatedStaff));
            return updatedStaff;
        } catch (error) {
            setError('Cập nhật thông tin thất bại');
            throw error;
        }
    };

    // Check if the current staff has a certain role
    const hasRole = (requiredRole) => {
        if (!currentStaff) return false;
        if (Array.isArray(requiredRole)) {
            return requiredRole.includes(currentStaff.role);
        }
        return currentStaff.role === requiredRole;
    };

    const value = {
        currentStaff,
        login,
        logout,
        updateProfile,
        loading,
        error,
        hasRole
    };

    return (
        <StaffAuthContext.Provider value={value}>
            {!loading && children}
        </StaffAuthContext.Provider>
    );
}
