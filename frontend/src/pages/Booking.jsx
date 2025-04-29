import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { customerService } from '../services/api';
import { set } from 'date-fns';

const Booking = () => {
    const { currentUser } = useAuth();
    const { timeSlots, serviceTypes, motorcycleTypes } = useData(); // lấy dữ liệu từ DataContext
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        customer_id: '',
        service_type_id: '',
        appointment_date: '',
        note: '',
        date: '',
        time: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Điền thông tin từ người dùng đã đăng nhập
    useEffect(() => {
        if (currentUser) {
            console.log("currentUser:", currentUser); // Log currentUser để kiểm tra
            setFormData(prevState => ({
                ...prevState,
                customer_id: currentUser.id || '',
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

        setLoading(true);
        setError('');

        customerService.appointment.createAppointment(formData)
        .then((response) => {
            // console.log('Đặt lịch thành công:', response.data);
            handleBookingSuccess(response);
            // alert('Đặt lịch thành công!');
        })
        .catch((error) => {
            const errorMessage = error.response?.data?.detail || 'Đặt lịch thất bại. Vui lòng thử lại sau.';
            console.error('Lỗi khi đặt lịch:', error);  
            // console.log('errorMessage:', errorMessage); // Log errorMessage để kiểm tra
            alert(errorMessage);
            setError(errorMessage);
        })
        .finally(() => {
            // setLoading(false);
        });
    };

    const handleBookingSuccess = async (response) => {
        
        setSubmitted(true);
        setError('');   
        
        // Hiển thị thông báo thành công
        alert("Đăng ký lịch hẹn thành công!");
        
        // Lưu ID lịch hẹn vào localStorage 
        localStorage.setItem("lastBookingId", response.data.appointment_id);
        console.log("Lịch hẹn ID:", localStorage.getItem("lastBookingId"));
        // TODO: Cần publish sự kiện thông báo cho nhân viên
        
        // Chuyển đến trang xác nhận
        // navigate(`/booking-confirmation/${response.data.appointment_id}`);
        setTimeout(() => {
            // Reset trạng thái loading
            setLoading(false);
            navigate('/')
        }, 3000); // Chuyển hướng sau 2 giây       
        // Reset form
        setValidated(false);
        setFormData({
            name: currentUser?.displayName || '',
            phone: currentUser?.phone || '',
            email: currentUser?.email || '',
            date: '',
            time: '',
            service_type_id: '',
            note: ''
        });
    }

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

                        {/* {error && <Alert variant="danger">{error.map(e => (e))}</Alert>} */}

                        <div className="booking-form">
                            <h3 className="text-primary-red mb-4">Thông tin đặt lịch</h3>
                            <Form noValidate validated={validated} onSubmit={handleSubmit}>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Họ và tên *</Form.Label>
                                            <Form.Control
                                                disabled={currentUser ? true : false}
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
                                                disabled={currentUser ? true : false}
                                                required
                                                type="tel"
                                                name="phone"
                                                value={formData.phone || formData.phone_num}
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
                                        disabled={currentUser ? true : false}
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
                                                {timeSlots.map(slot => (
                                                    <option key={slot.value} value={slot.value}>
                                                        {slot.value}
                                                    </option>
                                                ))}
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
                                        name="service_type_id"
                                        value={formData.service_type_id}
                                        onChange={handleChange}
                                    >
                                        <option value="">Chọn dịch vụ</option>
                                        {serviceTypes.map(service => (
                                            <option key={service.service_type_id} value={service.service_type_id}>
                                                {service.name}
                                            </option>
                                        ))}
                                        {/* <option value="">Chọn dịch vụ</option>
                                        <option value="bao-duong">Bảo dưỡng định kỳ</option>
                                        <option value="sua-chua-dong-co">Sửa chữa động cơ</option>
                                        <option value="thay-the-phu-tung">Thay thế phụ tùng</option>
                                        <option value="sua-he-thong-dien">Sửa hệ thống điện</option>
                                        <option value="ve-sinh-xe">Vệ sinh xe</option>
                                        <option value="khac">Dịch vụ khác</option> */}
                                    </Form.Control>
                                    <Form.Control.Feedback type="invalid">
                                        Vui lòng chọn dịch vụ.
                                    </Form.Control.Feedback>
                                </Form.Group>

                                {/* <Form.Group className="mb-3">
                                            <Form.Label>Loại xe *</Form.Label>
                                            <Form.Control
                                                required
                                                as="select"
                                                // type='text'
                                                name="vehicleModel"
                                                value={formData.vehicleModel}
                                                onChange={handleChange}
                                            >
                                                <option value="">Chọn loại xe</option>
                                                {motorcycleTypes.map(type => (
                                                    <option key={type.motorcycle_type_id} value={type.name}>
                                                        {type.name}
                                                    </option>
                                                ))}
                                            </Form.Control>
                                            <Form.Control.Feedback type="invalid">
                                                Vui lòng nhập loại xe.
                                            </Form.Control.Feedback>
                                        </Form.Group> */}
                                {/* <Col md={6}>
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
                                    </Col> */}

                                <Form.Group className="mb-3">
                                    <Form.Label>Mô tả vấn đề</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        name="note"
                                        value={formData.note}
                                        onChange={handleChange}
                                        placeholder="Mô tả ngắn gọn về vấn đề của xe"
                                    />
                                </Form.Group>

                                <div className="text-center mt-4">
                                    <Button type="submit" className="btn-primary-red px-5 py-2" disabled={loading}>
                                        {/* {loading? "Dàng" : "Đặt lịch nga"} */}
                                        {loading ? "Đang xử lý..." : "Đặt lịch ngay"}
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
