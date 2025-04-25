import React, { useState } from 'react';
import { Container, Row, Col, Nav, Button, Navbar, NavDropdown } from 'react-bootstrap';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';

import { useStaffAuth } from '../contexts/StaffAuthContext';    
import { receptionistRoutes, technicianRoutes, cashierRoutes, managerRoutes } from '../routes';
import './AdminLayout.css';

const AdminLayout = () => {
    const { currentStaff, logout } = useStaffAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);

    // Chọn routes dựa trên vai trò của nhân viên
    const getRoutesForRole = () => {
        switch(currentStaff?.role) {
            case 'manager':
            case 'admin':
            case 'owner':
                return managerRoutes;
            case 'receptionist':
                return receptionistRoutes;
            case 'technician':
                return technicianRoutes;
            case 'cashier':
                return cashierRoutes;
            default:
                return []; // Fallback nếu vai trò không hợp lệ
        }
    };
    
    const routes = getRoutesForRole();

    // Hiển thị vai trò người dùng bằng tiếng Việt
    const getRoleDisplay = () => {
        switch(currentStaff?.role) {
            case 'manager':
            case 'admin':
            case 'owner':
                return 'Quản lý';
            case 'receptionist':
                return 'Tiếp nhận viên';
            case 'technician':
                return 'Kỹ thuật viên';
            case 'cashier':
                return 'Thu ngân';
            default:
                return 'Nhân viên';
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/admin/login', { replace: true });
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    return (
        <div className={`admin-layout ${collapsed ? 'sidebar-collapsed' : ''}`}>
            {/* Sidebar */}
            <div className="sidebar">
                <div className="sidebar-header">
                    <h3 className={collapsed ? 'd-none' : ''}>
                        <i className="bi bi-tools me-2"></i>
                        {!collapsed && <span>Sửa Chữa Xe Máy</span>}
                    </h3>
                    <Button 
                        variant="link" 
                        className="sidebar-toggle" 
                        onClick={() => setCollapsed(!collapsed)}
                    >
                        <i className={`bi ${collapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`}></i>
                    </Button>
                </div>
                
                <div className="sidebar-user">
                    <div className={`user-avatar ${collapsed ? 'small' : ''}`}>
                        {currentStaff?.photoURL ? (
                            <img src={currentStaff.photoURL} alt="User" className="rounded-circle" />
                        ) : (
                            <i className="bi bi-person-circle"></i>
                        )}
                    </div>
                    {!collapsed && (
                        <div className="user-info">
                            <p className="user-name">{currentStaff?.displayName || 'User'}</p>
                            <span className="user-role">{getRoleDisplay()}</span>
                        </div>
                    )}
                </div>
                
                <Nav className="sidebar-nav flex-column">
                    {routes.map((route) => (
                        <Nav.Item key={route.path}>
                            <Nav.Link 
                                as={Link} 
                                to={route.path}
                                className={location.pathname === route.path ? 'active' : ''}
                            >
                                <i className={route.icon}></i>
                                {!collapsed && <span>{route.name}</span>}
                            </Nav.Link>
                        </Nav.Item>
                    ))}
                </Nav>
            </div>

            {/* Main content */}
            <div className="main-content">
                {/* Top navbar */}
                <Navbar bg="white" expand="lg" className="topbar">
                    <Container fluid>
                        <div className="d-flex align-items-center">
                            <h4 className="page-title mb-0">
                                {routes.find(route => route.path === location.pathname)?.name || 'Dashboard'}
                            </h4>
                        </div>
                        
                        <Navbar.Collapse className="justify-content-end">
                            <Nav>
                                <NavDropdown 
                                    title={
                                        <div className="d-inline-block">
                                            <i className="bi bi-bell me-2"></i>
                                            <span className="notification-badge">3</span>
                                        </div>
                                    } 
                                    id="notifications-dropdown"
                                >
                                    <NavDropdown.Item>Đơn đặt lịch mới</NavDropdown.Item>
                                    <NavDropdown.Item>Nhắc nhở bảo dưỡng</NavDropdown.Item>
                                    <NavDropdown.Item>Cập nhật hệ thống</NavDropdown.Item>
                                    <NavDropdown.Divider />
                                    <NavDropdown.Item>Xem tất cả thông báo</NavDropdown.Item>
                                </NavDropdown>
                                
                                <Nav.Link as={Link} to="/" target="_blank">
                                    <i className="bi bi-house-door"></i>
                                </Nav.Link>
                                
                                <NavDropdown 
                                    align="end"
                                    title={
                                        <span>
                                            <i className="bi bi-person-circle me-1"></i>
                                            {currentStaff?.displayName || 'User'}
                                        </span>
                                    } 
                                    id="user-dropdown"
                                >
                                    <NavDropdown.Item as={Link} to="/admin/profile">Hồ sơ cá nhân</NavDropdown.Item>
                                    <NavDropdown.Item as={Link} to="/admin/settings">Cài đặt</NavDropdown.Item>
                                    <NavDropdown.Divider />
                                    <NavDropdown.Item onClick={handleLogout}>Đăng xuất</NavDropdown.Item>
                                </NavDropdown>
                            </Nav>
                        </Navbar.Collapse>
                    </Container>
                </Navbar>

                {/* Page content */}
                <div className="page-content">
                    <Container fluid>
                        <Outlet />
                    </Container>
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;
