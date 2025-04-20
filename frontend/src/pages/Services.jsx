import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { resourceService } from '../services/api';

const Services = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Hàm lấy dữ liệu dịch vụ từ API
    const fetchData = async () => {
        try {
            setLoading(true);
            const [serviceTypeData] = await Promise.all([
                resourceService.getAllServiceTypes()
            ]);
            const formattedServices = serviceTypeData.slice(0, 3).map(item => ({
                id: item.service_type_id,
                title: item.name,
                description: item.description,
                image: item.url || `https://placehold.co/600x400/e83737/ffffff?text=${encodeURIComponent(item.name)}`
            }));
            setServices(formattedServices);
            console.log('formattedServices', formattedServices);
            setError(null);
        } catch (err) {
            console.error('Lỗi khi gọi hàm fetchServices:', err);
            setError('Không thể tải dữ liệu từ server. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <>
            <div className="page-banner">
                <Container>
                    <h1 className="text-center">Dịch vụ của chúng tôi</h1>
                    <p className="text-center text-dark">
                        Các dịch vụ sửa chữa và bảo dưỡng xe máy chuyên nghiệp
                    </p>
                </Container>
            </div>

            <Container className="py-5">
                {loading ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="danger" />
                        <p className="mt-3">Đang tải dữ liệu...</p>
                    </div>
                ) : error ? (
                    <Alert variant="danger">{error}</Alert>
                ) : (
                    <Row className="g-4">
                        {services.length > 0 ? (
                            services.map(service => (
                                <Col key={service.id} lg={4} md={6}>
                                    <Card className="service-card h-100 shadow-sm">
                                        <Card.Img variant="top" src={service.image} />
                                        <Card.Body>
                                            <Card.Title className="fw-bold text-primary-red">{service.title}</Card.Title>
                                            <Card.Text>{service.description}</Card.Text>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <span className="fw-bold">{service.price}</span>
                                                <Button
                                                    as={Link}
                                                    to={`/services/${service.id}`}
                                                    variant="outline-danger"
                                                >
                                                    Chi tiết
                                                </Button>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))
                        ) : (
                            <Col>
                                <Alert variant="info">Chưa có dịch vụ nào được cung cấp.</Alert>
                            </Col>
                        )}
                    </Row>
                )}
            </Container>
        </>
    );
};

export default Services;
