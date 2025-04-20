import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert, Card } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Register = () => {
    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        agree: false
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Kiểm tra mật khẩu xác nhận
        if (formData.password !== formData.confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }

        // Kiểm tra đồng ý điều khoản
        if (!formData.agree) {
            setError('Bạn phải đồng ý với Điều khoản dịch vụ và Chính sách bảo mật');
            return;
        }

        try {
            setError('');
            setLoading(true);

            await register(formData.email, formData.password, formData.displayName, formData);
            alert('Đăng ký thành công!');
            // Chuyển hướng đến trang chủ sau khi đăng ký thành công
            navigate('/');
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="py-5">
            <Row className="justify-content-center">
                <Col md={8}>
                    <Card className="shadow-sm">
                        <Card.Body className="p-4">
                            <h2 className="text-center mb-4 text-primary-red">Đăng ký tài khoản</h2>

                            {error && <Alert variant="danger">{error}</Alert>}

                            <Form onSubmit={handleSubmit}>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Họ và tên</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="displayName"
                                                value={formData.displayName}
                                                onChange={handleChange}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Số điện thoại</Form.Label>
                                            <Form.Control
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

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

                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Mật khẩu</Form.Label>
                                            <Form.Control
                                                type="password"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                required
                                            />
                                            <Form.Text className="text-muted">
                                                Mật khẩu phải có ít nhất 6 ký tự
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Xác nhận mật khẩu</Form.Label>
                                            <Form.Control
                                                type="password"
                                                name="confirmPassword"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-3">
                                    <Form.Check
                                        type="checkbox"
                                        id="agree-terms"
                                        label={
                                            <span>
                                                Tôi đồng ý với <Link to="#" className="text-decoration-none">Điều khoản dịch vụ</Link> và <Link to="#" className="text-decoration-none">Chính sách bảo mật</Link>
                                            </span>
                                        }
                                        name="agree"
                                        checked={formData.agree}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>

                                <Button
                                    type="submit"
                                    className="btn-primary-red w-100 py-2"
                                    disabled={loading}
                                >
                                    {loading ? 'Đang xử lý...' : 'Đăng ký'}
                                </Button>

                                <div className="text-center mt-3">
                                    <p>Đã có tài khoản? <Link to="/login" className="text-decoration-none">Đăng nhập</Link></p>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Register;
