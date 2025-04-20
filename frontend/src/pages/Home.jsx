import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { resourceService } from '../services/api';

const Home = () => {
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
            // console.log('formattedServices', formattedServices);
            setError(null);
        } catch (err) {
            console.error('Lỗi khi gọi hàm fetchServices:', err);
            setError('Không thể tải dữ liệu từ server. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Hàm lấy dữ liệu dịch vụ từ API
        const fetchServices = async () => {
            try {
                setLoading(true);
                // Gọi API lấy danh sách dịch vụ
                const data = await resourceService.getAllServiceTypes();
                
                // Chuyển đổi dữ liệu từ API sang định dạng hiển thị trên UI
                const formattedServices = data.map(item => ({
                    id: item.id,
                    title: item.name, // Giả sử API trả về trường "name"
                    description: item.description,
                    image: `https://placehold.co/600x400/e83737/ffffff?text=${encodeURIComponent(item.name)}`
                }));
                
                // Lấy 3 dịch vụ đầu tiên để hiển thị ở trang chủ
                setServices(formattedServices.slice(0, 3));
                setError(null);
            } catch (err) {
                console.error('Lỗi khi lấy dữ liệu:', err);
                // Trong trường hợp lỗi, sử dụng dữ liệu mẫu để hiển thị
                setServices([
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
                    }
                ]);
                setError('Không thể tải dữ liệu từ server. Đang hiển thị dữ liệu mẫu.');
            } finally {
                setLoading(false);
            }
        };

        // fetchServices();
        fetchData();
    }, []);

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

            {/* Hiển thị 3 dịch vụ trong trang chủ */}
            <section className="py-5">
                <Container>
                    <h2 className="section-title">Dịch vụ của chúng tôi</h2>
                    
                    {loading ? (
                        <div className="text-center py-4">
                            <Spinner animation="border" variant="danger" size="sm" />
                            <p className="mt-2">Đang tải dịch vụ...</p>
                        </div>
                    ) : (
                        <>
                            {error && <Alert variant="warning" className="mb-3">{error}</Alert>}
                            
                            <Row className="mt-4 g-4">
                                {services.map(service => (
                                    <Col key={service.id} md={6} lg={4}>
                                        <Card className="service-card">
                                            <Card.Img variant="top" src={service.image} />
                                            <Card.Body>
                                                <Card.Title>{service.title}</Card.Title>
                                                <Card.Text>{service.description}</Card.Text>
                                                <Button as={Link} to={`/services/${service.id}`} variant="outline-danger">Chi tiết</Button>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        </>
                    )}
                    
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
