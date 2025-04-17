import React, { useState } from 'react';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);
            await logout();
            navigate('/');
        } catch (error) {
            console.error("Failed to log out", error);
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <Navbar bg="white" expand="lg" className="header-shadow" sticky="top">
            <Container>
                <Navbar.Brand as={NavLink} to="/" className="text-primary-red fw-bold">
                    <i className="bi bi-tools me-2"></i>
                    Sửa Chữa Xe Máy
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="ms-auto">
                        <Nav.Link as={NavLink} to="/" end>Trang chủ</Nav.Link>
                        <Nav.Link as={NavLink} to="/services">Dịch vụ</Nav.Link>
                        <Nav.Link as={NavLink} to="/booking">Đặt lịch</Nav.Link>
                        <Nav.Link as={NavLink} to="/about">Giới thiệu</Nav.Link>
                        <Nav.Link as={NavLink} to="/contact">Liên hệ</Nav.Link>
                    </Nav>
                    <Nav className="ms-lg-3">
                        {currentUser ? (
                            <NavDropdown
                                title={
                                    <span>
                                        <i className="bi bi-person-circle me-1"></i>
                                        {currentUser.displayName || currentUser.email}
                                    </span>
                                }
                                id="user-dropdown"
                            >
                                <NavDropdown.Item as={NavLink} to="/profile">Tài khoản của tôi</NavDropdown.Item>
                                <NavDropdown.Item as={NavLink} to="/booking">Lịch đặt của tôi</NavDropdown.Item>
                                <NavDropdown.Divider />
                                <NavDropdown.Item onClick={handleLogout}>
                                    {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                                </NavDropdown.Item>
                            </NavDropdown>
                        ) : (
                            <>
                                <Nav.Link as={NavLink} to="/login" className="me-2">Đăng nhập</Nav.Link>
                                <Nav.Link as={NavLink} to="/register" className="btn btn-primary-red px-3">Đăng ký</Nav.Link>
                            </>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default Header;
