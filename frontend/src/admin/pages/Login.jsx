import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useStaffAuth } from '../contexts/StaffAuthContext';
import './Login.css';

const StaffLogin = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, currentStaff, error: authError } = useStaffAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Redirect to dashboard after login
    let from = location.state?.from?.pathname || '/admin/dashboard';

    // Set error from auth context if available
    useEffect(() => {
        if (authError) {
            setError(authError);
        }
    }, [authError]);

    // If already logged in, redirect to admin dashboard
    useEffect(() => {
        console.log("Current staff:", currentStaff);
        if (currentStaff) {
            // return;
            navigate('/admin', { replace: true });
        }       
    }, [currentStaff]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.email || !formData.password) {
            setError('Vui lòng nhập đầy đủ thông tin đăng nhập');
            return;
        }

        try {
            setError('');
            setLoading(true);

            // Call the staff authentication service to login
            await login(formData.email, formData.password);
            
            // Save user credentials in localStorage if "Remember me" is checked
            if (formData.rememberMe) {
                localStorage.setItem('rememberedStaffEmail', formData.email);
            } else {
                localStorage.removeItem('rememberedStaffEmail');
            }

            // Navigate to the dashboard or previous intended page
            from = from.includes('admin/login') || from.includes('/admin') ? '/admin/dashboard' : from;
            console.log("Redirecting to:", from);
            navigate(from, { replace: true });
        } catch (error) {
            console.error("Login error:", error);
            const errorMessage = error.message || 'Đăng nhập thất bại. Vui lòng thử lại sau.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Load remembered email on component mount
    useEffect(() => {
        const rememberedEmail = localStorage.getItem('rememberedStaffEmail');
        if (rememberedEmail) {
            setFormData(prev => ({
                ...prev,
                email: rememberedEmail,
                rememberMe: true
            }));
        }
    }, []);

    return (
        <div className="staff-login-page">
            <Container>
                <Row className="justify-content-center align-items-center min-vh-100">
                    <Col md={8} lg={6} xl={5}>
                        <div className="text-center mb-4">
                            <h2 className="brand-name">
                                <i className="bi bi-tools me-2"></i>
                                Sửa Chữa Xe Máy
                            </h2>
                            <p className="text-muted">Hệ thống quản lý dành cho nhân viên</p>
                        </div>
                        
                        <Card className="shadow-sm">
                            <Card.Body className="p-4">
                                <h4 className="text-center mb-4">Đăng nhập</h4>
                                
                                {error && <Alert variant="danger">{error}</Alert>}
                                
                                <Form onSubmit={handleSubmit}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Email</Form.Label>
                                        <Form.Control
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="Nhập email của bạn"
                                            required
                                        />
                                    </Form.Group>
                                    
                                    <Form.Group className="mb-3">
                                        <Form.Label>Mật khẩu</Form.Label>
                                        <Form.Control
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="Nhập mật khẩu"
                                            required
                                        />
                                    </Form.Group>
                                    
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <Form.Check
                                            type="checkbox"
                                            id="remember-me"
                                            label="Ghi nhớ đăng nhập"
                                            name="rememberMe"
                                            checked={formData.rememberMe}
                                            onChange={handleChange}
                                        />
                                        <Link to="/admin/forgot-password" className="text-decoration-none">Quên mật khẩu?</Link>
                                    </div>
                                    
                                    <Button 
                                        type="submit" 
                                        className="w-100 staff-login-btn" 
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                                                <span className="ms-2">Đang xử lý...</span>
                                            </>
                                        ) : (
                                            "Đăng nhập"
                                        )}
                                    </Button>
                                </Form>
                            </Card.Body>
                        </Card>
                        
                        <div className="text-center mt-4">
                            <p className="mb-0">
                                <Link to="/" className="text-decoration-none">
                                    <i className="bi bi-arrow-left me-1"></i> Về trang chủ
                                </Link>
                            </p>
                        </div>
                        
                        <div className="mt-5">
                            <Alert variant="info">
                                <h5>Thông tin đăng nhập demo:</h5>
                                <hr />
                                <div className="row">
                                    <div className="col-md-6">
                                        <p className="mb-1"><strong>Nhân viên:</strong></p>
                                        <p className="mb-1">Email: employee@example.com</p>
                                        <p className="mb-0">Mật khẩu: employee123</p>
                                    </div>
                                    <div className="col-md-6">
                                        <p className="mb-1"><strong>Quản lý/Chủ cửa hàng:</strong></p>
                                        <p className="mb-1">Email: admin@example.com</p>
                                        <p className="mb-0">Mật khẩu: admin123</p>
                                    </div>
                                </div>
                            </Alert>
                        </div>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default StaffLogin;
