import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';

const Booking = () => {
    const { currentUser } = useAuth();

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        date: '',
        time: '',
        service: '',
        vehicleModel: '',
        vehicleYear: '',
        message: ''
    });

    // Điền thông tin từ người dùng đã đăng nhập
    useEffect(() => {
        if (currentUser) {
            setFormData(prevState => ({
                ...prevState,
                name: currentUser.displayName || '',
                email: currentUser.email || '',
                phone: currentUser.phone || ''
            }));
        }
    }, [currentUser]);

    const [validated, setValidated] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const form = e.currentTarget;

        if (form.checkValidity() === false) {
            e.stopPropagation();
            setValidated(true);
            return;
        }

        // Mock API call to submit form
        console.log('Form submitted:', formData);
        setSubmitted(true);
        setValidated(false);
        setFormData({
            name: currentUser?.displayName || '',
            phone: currentUser?.phone || '',
            email: currentUser?.email || '',
            date: '',
            time: '',
            service: '',
            vehicleModel: '',
            vehicleYear: '',
            message: ''
        });
    };

    return (
        <>
            <div className="page-banner">
                <Container>
                    <h1 className="text-center">Đặt lịch sửa chữa</h1>
                    <p className="text-center text-dark">
                        Đặt lịch trước để được phục vụ nhanh chóng và tiết kiệm thời gian
                    </p>
                </Container>
            </div>

            <Container className="py-5">
                <Row className="justify-content-center">
                    <Col lg={8}>
                        {submitted && (
                            <Alert variant="success" onClose={() => setSubmitted(false)} dismissible>
                                <Alert.Heading>Đặt lịch thành công!</Alert.Heading>
                                <p>
                                    Cảm ơn bạn đã đặt lịch sửa chữa. Chúng tôi sẽ liên hệ với bạn để xác nhận lịch hẹn trong thời gian sớm nhất.
                                </p>
                            </Alert>
                        )}

                        <div className="booking-form">
                            <h3 className="text-primary-red mb-4">Thông tin đặt lịch</h3>
                            <Form noValidate validated={validated} onSubmit={handleSubmit}>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Họ và tên *</Form.Label>
                                            <Form.Control
                                                required
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                Vui lòng nhập họ tên.
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Số điện thoại *</Form.Label>
                                            <Form.Control
                                                required
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                Vui lòng nhập số điện thoại.
                                            </Form.Control.Feedback>
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
                                    />
                                </Form.Group>

                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Ngày *</Form.Label>
                                            <Form.Control
                                                required
                                                type="date"
                                                name="date"
                                                value={formData.date}
                                                onChange={handleChange}
                                                min={new Date().toISOString().split('T')[0]}
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                Vui lòng chọn ngày.
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Giờ *</Form.Label>
                                            <Form.Control
                                                required
                                                as="select"
                                                name="time"
                                                value={formData.time}
                                                onChange={handleChange}
                                            >
                                                <option value="">Chọn giờ</option>
                                                <option value="08:00">08:00</option>
                                                <option value="09:00">09:00</option>
                                                <option value="10:00">10:00</option>
                                                <option value="11:00">11:00</option>
                                                <option value="13:30">13:30</option>
                                                <option value="14:30">14:30</option>
                                                <option value="15:30">15:30</option>
                                                <option value="16:30">16:30</option>
                                            </Form.Control>
                                            <Form.Control.Feedback type="invalid">
                                                Vui lòng chọn giờ.
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-3">
                                    <Form.Label>Dịch vụ *</Form.Label>
                                    <Form.Control
                                        required
                                        as="select"
                                        name="service"
                                        value={formData.service}
                                        onChange={handleChange}
                                    >
                                        <option value="">Chọn dịch vụ</option>
                                        <option value="bao-duong">Bảo dưỡng định kỳ</option>
                                        <option value="sua-chua-dong-co">Sửa chữa động cơ</option>
                                        <option value="thay-the-phu-tung">Thay thế phụ tùng</option>
                                        <option value="sua-he-thong-dien">Sửa hệ thống điện</option>
                                        <option value="ve-sinh-xe">Vệ sinh xe</option>
                                        <option value="khac">Dịch vụ khác</option>
                                    </Form.Control>
                                    <Form.Control.Feedback type="invalid">
                                        Vui lòng chọn dịch vụ.
                                    </Form.Control.Feedback>
                                </Form.Group>

                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Loại xe *</Form.Label>
                                            <Form.Control
                                                required
                                                type="text"
                                                name="vehicleModel"
                                                value={formData.vehicleModel}
                                                onChange={handleChange}
                                                placeholder="VD: Honda Wave, Yamaha Exciter..."
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                Vui lòng nhập loại xe.
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Năm sản xuất</Form.Label>
                                            <Form.Control
                                                type="number"
                                                name="vehicleYear"
                                                value={formData.vehicleYear}
                                                onChange={handleChange}
                                                placeholder="VD: 2020"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-3">
                                    <Form.Label>Mô tả vấn đề</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        placeholder="Mô tả ngắn gọn về vấn đề của xe"
                                    />
                                </Form.Group>

                                <div className="text-center mt-4">
                                    <Button type="submit" className="btn-primary-red px-5 py-2">
                                        Đặt lịch ngay
                                    </Button>
                                </div>
                            </Form>
                        </div>
                    </Col>
                </Row>
            </Container>
        </>
    );
};

export default Booking;
