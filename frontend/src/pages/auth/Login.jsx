import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert, Card } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Lấy URL từ location state hoặc mặc định là trang chủ
    const from = location.state?.from?.pathname || '/';

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setError('');
            setLoading(true);

            await login(formData.email, formData.password);

            // Chuyển hướng người dùng đến trang họ định truy cập trước đó
            navigate(from, { replace: true });
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="py-5">
            <Row className="justify-content-center">
                <Col md={6}>
                    <Card className="shadow-sm">
                        <Card.Body className="p-4">
                            <h2 className="text-center mb-4 text-primary-red">Đăng nhập</h2>

                            {error && <Alert variant="danger">{error}</Alert>}

                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
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
                                        required
                                    />
                                </Form.Group>

                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <Form.Check
                                        type="checkbox"
                                        id="remember-me"
                                        label="Ghi nhớ đăng nhập"
                                    />
                                    <Link to="/forgot-password" className="text-decoration-none">Quên mật khẩu?</Link>
                                </div>

                                <Button
                                    type="submit"
                                    className="btn-primary-red w-100 py-2"
                                    disabled={loading}
                                >
                                    {loading ? 'Đang xử lý...' : 'Đăng nhập'}
                                </Button>

                                <div className="text-center mt-3">
                                    <p>Chưa có tài khoản? <Link to="/register" className="text-decoration-none">Đăng ký ngay</Link></p>
                                </div>
                            </Form>

                            <Alert variant="info" className="mt-3">
                                <strong>Thông tin đăng nhập demo:</strong>
                                <p className="mb-0">Email: user@example.com</p>
                                <p className="mb-0">Mật khẩu: password</p>
                            </Alert>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Login;
