import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    });

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
        console.log('Contact form submitted:', formData);
        setSubmitted(true);
        setValidated(false);
        setFormData({
            name: '',
            email: '',
            phone: '',
            subject: '',
            message: ''
        });
    };

    return (
        <>
            <div className="page-banner">
                <Container>
                    <h1 className="text-center">Liên hệ với chúng tôi</h1>
                    <p className="text-center text-dark">
                        Chúng tôi luôn sẵn sàng hỗ trợ bạn
                    </p>
                </Container>
            </div>

            <Container className="py-5">
                <Row>
                    <Col lg={5} className="mb-4 mb-lg-0">
                        <h3 className="text-primary-red mb-4">Thông tin liên hệ</h3>
                        <div className="mb-4">
                            <h5>Địa chỉ cửa hàng</h5>
                            <p className="mb-0">123 Đường ABC, Quận XYZ</p>
                            <p>TP. Hồ Chí Minh</p>
                        </div>

                        <div className="mb-4">
                            <h5>Thông tin liên lạc</h5>
                            <p className="mb-2">
                                <i className="bi bi-telephone-fill me-2"></i>
                                (+84) 123 456 789
                            </p>
                            <p className="mb-2">
                                <i className="bi bi-envelope-fill me-2"></i>
                                contact@suachuaxemay.com
                            </p>
                            <p className="mb-0">
                                <i className="bi bi-globe me-2"></i>
                                www.suachuaxemay.com
                            </p>
                        </div>

                        <div className="mb-4">
                            <h5>Giờ làm việc</h5>
                            <p className="mb-0">Thứ 2 - Thứ 6: 7h30 - 17h30</p>
                            <p className="mb-0">Thứ 7: 7h30 - 16h00</p>
                            <p>Chủ nhật: Nghỉ</p>
                        </div>

                        <div className="mb-4">
                            <h5>Theo dõi chúng tôi</h5>
                            <div className="d-flex gap-3 mt-2">
                                <a href="#" className="text-dark fs-4">
                                    <i className="bi bi-facebook"></i>
                                </a>
                                <a href="#" className="text-dark fs-4">
                                    <i className="bi bi-instagram"></i>
                                </a>
                                <a href="#" className="text-dark fs-4">
                                    <i className="bi bi-youtube"></i>
                                </a>
                                <a href="#" className="text-dark fs-4">
                                    <i className="bi bi-tiktok"></i>
                                </a>
                            </div>
                        </div>
                    </Col>

                    <Col lg={7}>
                        <div className="booking-form">
                            <h3 className="text-primary-red mb-4">Gửi tin nhắn cho chúng tôi</h3>

                            {submitted && (
                                <Alert variant="success" onClose={() => setSubmitted(false)} dismissible>
                                    <Alert.Heading>Gửi tin nhắn thành công!</Alert.Heading>
                                    <p>
                                        Cảm ơn bạn đã liên hệ với chúng tôi. Chúng tôi sẽ phản hồi trong thời gian sớm nhất.
                                    </p>
                                </Alert>
                            )}

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
                                            <Form.Label>Email *</Form.Label>
                                            <Form.Control
                                                required
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                Vui lòng nhập email hợp lệ.
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Số điện thoại</Form.Label>
                                            <Form.Control
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Tiêu đề *</Form.Label>
                                            <Form.Control
                                                required
                                                type="text"
                                                name="subject"
                                                value={formData.subject}
                                                onChange={handleChange}
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                Vui lòng nhập tiêu đề.
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-3">
                                    <Form.Label>Tin nhắn *</Form.Label>
                                    <Form.Control
                                        required
                                        as="textarea"
                                        rows={5}
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        Vui lòng nhập nội dung tin nhắn.
                                    </Form.Control.Feedback>
                                </Form.Group>

                                <div className="text-end mt-4">
                                    <Button type="submit" className="btn-primary-red px-4 py-2">
                                        Gửi tin nhắn
                                    </Button>
                                </div>
                            </Form>
                        </div>
                    </Col>
                </Row>

                <Row className="mt-5">
                    <Col>
                        <h3 className="text-primary-red mb-4">Bản đồ cửa hàng</h3>
                        <div className="map-container" style={{ height: '400px', backgroundColor: '#e9ecef' }}>
                            <div className="d-flex justify-content-center align-items-center h-100">
                                <div className="text-center">
                                    <i className="bi bi-map fs-1"></i>
                                    <p className="mt-2">Bản đồ cửa hàng</p>
                                </div>
                            </div>
                        </div>
                    </Col>
                </Row>
            </Container>
        </>
    );
};

export default Contact;
