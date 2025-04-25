import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const UserPrivateRoute = ({ children }) => {
    const { currentUser, loading } = useAuth();
    const location = useLocation();

    // Login path for user routes
    const loginPath = '/login';

    // Verify user auth on the server side
    useEffect(() => {
        // Server-side verification could be added here
        // const verifyUserAuth = async () => {
        //     try {
        //         console.log("Verifying user authentication with server...");
        //     } catch (error) {
        //         console.error("Error verifying user auth:", error);
        //     }
        // };

        if (currentUser) {
            // verifyUserAuth();
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
        // Redirect to login and save current location
        return <Navigate to={loginPath} state={{ from: location }} replace />;
    }

    return children;
};

export default UserPrivateRoute;
