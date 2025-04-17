import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Home = () => {
    const services = [
        {
            id: 1,
            title: 'Bảo dưỡng định kỳ',
            description: 'Kiểm tra toàn bộ xe và thay thế các phụ tùng cần thiết để đảm bảo xe luôn trong tình trạng tốt.',
            image: 'https://placehold.co/600x400/e83737/ffffff?text=Bảo+dưỡng+định+kỳ',
        },
        {
            id: 2,
            title: 'Sửa chữa động cơ',
            description: 'Dịch vụ sửa chữa, đại tu động cơ chuyên nghiệp với đội ngũ kỹ thuật viên giàu kinh nghiệm.',
            image: 'https://placehold.co/600x400/e83737/ffffff?text=Sửa+chữa+động+cơ',
        },
        {
            id: 3,
            title: 'Thay thế phụ tùng',
            description: 'Cung cấp và thay thế phụ tùng chính hãng với giá cả hợp lý và bảo hành dài hạn.',
            image: 'https://placehold.co/600x400/e83737/ffffff?text=Thay+thế+phụ+tùng',
        },
    ];

    return (
        <>
            <section className="hero-section">
                <Container>
                    <Row className="align-items-center">
                        <Col lg={6} className="hero-text">
                            <h1>Dịch vụ sửa chữa xe máy chuyên nghiệp</h1>
                            <p className="my-4">
                                Chúng tôi cung cấp dịch vụ sửa chữa, bảo dưỡng xe máy với đội ngũ kỹ thuật viên lành nghề,
                                trang thiết bị hiện đại và phụ tùng chính hãng.
                            </p>
                            <div className="d-flex gap-3">
                                <Button as={Link} to="/booking" className="btn-primary-red px-4 py-2">
                                    Đặt lịch ngay
                                </Button>
                                <Button as={Link} to="/services" variant="outline-dark" className="px-4 py-2">
                                    Xem dịch vụ
                                </Button>
                            </div>
                        </Col>
                        <Col lg={6} className="mt-4 mt-lg-0">
                            <img
                                src="https://placehold.co/600x400/e83737/ffffff?text=Sửa+Chữa+Xe+Máy"
                                alt="Dịch vụ sửa chữa xe máy"
                                className="img-fluid rounded shadow"
                            />
                        </Col>
                    </Row>
                </Container>
            </section>

            <section className="py-5">
                <Container>
                    <h2 className="section-title">Dịch vụ của chúng tôi</h2>
                    <Row className="mt-4 g-4">
                        {services.map(service => (
                            <Col key={service.id} md={6} lg={4}>
                                <Card className="service-card">
                                    <Card.Img variant="top" src={service.image} />
                                    <Card.Body>
                                        <Card.Title>{service.title}</Card.Title>
                                        <Card.Text>{service.description}</Card.Text>
                                        <Button as={Link} to="/services" variant="outline-danger">Chi tiết</Button>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                    <div className="text-center mt-4">
                        <Button as={Link} to="/services" className="btn-primary-red px-4">
                            Xem tất cả dịch vụ
                        </Button>
                    </div>
                </Container>
            </section>

            <section className="py-5 bg-light">
                <Container>
                    <Row className="align-items-center">
                        <Col lg={6}>
                            <h2 className="section-title">Tại sao chọn chúng tôi?</h2>
                            <ul className="list-unstyled mt-4">
                                <li className="mb-3">
                                    <div className="d-flex">
                                        <div className="me-3">
                                            <i className="bi bi-check-circle-fill text-primary-red fs-4"></i>
                                        </div>
                                        <div>
                                            <h5>Đội ngũ kỹ thuật viên giàu kinh nghiệm</h5>
                                            <p>Với hơn 10 năm kinh nghiệm trong ngành, đội ngũ kỹ thuật viên của chúng tôi được đào tạo bài bản.</p>
                                        </div>
                                    </div>
                                </li>
                                <li className="mb-3">
                                    <div className="d-flex">
                                        <div className="me-3">
                                            <i className="bi bi-check-circle-fill text-primary-red fs-4"></i>
                                        </div>
                                        <div>
                                            <h5>Phụ tùng chính hãng</h5>
                                            <p>Chúng tôi cam kết sử dụng phụ tùng chính hãng, đảm bảo chất lượng và an toàn cho xe của bạn.</p>
                                        </div>
                                    </div>
                                </li>
                                <li className="mb-3">
                                    <div className="d-flex">
                                        <div className="me-3">
                                            <i className="bi bi-check-circle-fill text-primary-red fs-4"></i>
                                        </div>
                                        <div>
                                            <h5>Bảo hành dài hạn</h5>
                                            <p>Tất cả dịch vụ đều được bảo hành, giúp bạn yên tâm sử dụng lâu dài.</p>
                                        </div>
                                    </div>
                                </li>
                            </ul>
                        </Col>
                        <Col lg={6} className="mt-4 mt-lg-0">
                            <img
                                src="https://placehold.co/600x400/e83737/ffffff?text=Tại+sao+chọn+chúng+tôi"
                                alt="Tại sao chọn chúng tôi"
                                className="img-fluid rounded shadow"
                            />
                        </Col>
                    </Row>
                </Container>
            </section>
        </>
    );
};

export default Home;
