import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-dark text-white py-4 mt-5">
            <Container>
                <Row>
                    <Col md={4} className="mb-4 mb-md-0">
                        <h5 className="text-primary-red">Sửa Chữa Xe Máy</h5>
                        <p className="mt-3">
                            Dịch vụ sửa chữa xe máy chuyên nghiệp, uy tín với hơn 10 năm kinh nghiệm trong ngành.
                        </p>
                    </Col>

                    <Col md={3} className="mb-4 mb-md-0">
                        <h5 className="text-primary-red">Liên kết</h5>
                        <ul className="list-unstyled mt-3">
                            <li><Link to="/" className="text-white text-decoration-none">Trang chủ</Link></li>
                            <li><Link to="/services" className="text-white text-decoration-none">Dịch vụ</Link></li>
                            <li><Link to="/booking" className="text-white text-decoration-none">Đặt lịch</Link></li>
                            <li><Link to="/about" className="text-white text-decoration-none">Giới thiệu</Link></li>
                            <li><Link to="/contact" className="text-white text-decoration-none">Liên hệ</Link></li>
                        </ul>
                    </Col>

                    <Col md={5}>
                        <h5 className="text-primary-red">Thông tin liên hệ</h5>
                        <ul className="list-unstyled mt-3">
                            <li className="mb-2">
                                <i className="bi bi-geo-alt-fill me-2"></i>
                                123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh
                            </li>
                            <li className="mb-2">
                                <i className="bi bi-telephone-fill me-2"></i>
                                (+84) 123 456 789
                            </li>
                            <li className="mb-2">
                                <i className="bi bi-envelope-fill me-2"></i>
                                contact@suachuaxemay.com
                            </li>
                            <li className="mb-2">
                                <i className="bi bi-clock-fill me-2"></i>
                                Thứ 2 - Thứ 7: 7h30 - 17h30
                            </li>
                        </ul>
                    </Col>
                </Row>

                <hr className="my-3 bg-secondary" />

                <Row>
                    <Col className="text-center">
                        <p className="mb-0">&copy; {new Date().getFullYear()} Sửa Chữa Xe Máy. Tất cả quyền được bảo lưu.</p>
                    </Col>
                </Row>
            </Container>
        </footer>
    );
};

export default Footer;
