import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Services = () => {
    const services = [
        {
            id: 1,
            title: 'Bảo dưỡng định kỳ',
            description: 'Kiểm tra toàn bộ xe và thay thế các phụ tùng cần thiết để đảm bảo xe luôn trong tình trạng tốt.',
            details: 'Dịch vụ bao gồm kiểm tra và thay dầu máy, dầu số, bugi, lọc gió, lọc dầu, điều chỉnh xích, kiểm tra phanh, lốp và các hệ thống điện.',
            image: 'https://placehold.co/600x400/e83737/ffffff?text=Bảo+dưỡng+định+kỳ',
            price: 'Từ 150.000đ'
        },
        {
            id: 2,
            title: 'Sửa chữa động cơ',
            description: 'Dịch vụ sửa chữa, đại tu động cơ chuyên nghiệp với đội ngũ kỹ thuật viên giàu kinh nghiệm.',
            details: 'Kiểm tra, chẩn đoán và khắc phục các vấn đề về động cơ như: kém khởi động, tiêu hao nhiên liệu, mất công suất, tiếng kêu bất thường...',
            image: 'https://placehold.co/600x400/e83737/ffffff?text=Sửa+chữa+động+cơ',
            price: 'Từ 300.000đ'
        },
        {
            id: 3,
            title: 'Thay thế phụ tùng',
            description: 'Cung cấp và thay thế phụ tùng chính hãng với giá cả hợp lý và bảo hành dài hạn.',
            details: 'Chúng tôi cung cấp và thay thế các loại phụ tùng như: nhông sên dĩa, phanh, lốp, ắc quy, đèn, còi, gương, nhớt và các phụ tùng khác.',
            image: 'https://placehold.co/600x400/e83737/ffffff?text=Thay+thế+phụ+tùng',
            price: 'Theo báo giá'
        },
        {
            id: 4,
            title: 'Sửa hệ thống điện',
            description: 'Kiểm tra và sửa chữa toàn bộ hệ thống điện trên xe máy.',
            details: 'Dịch vụ bao gồm kiểm tra và sửa chữa các vấn đề về hệ thống điện như: hệ thống đèn, còi, IC, cuộn sạc, bình ắc quy và hệ thống khởi động.',
            image: 'https://placehold.co/600x400/e83737/ffffff?text=Sửa+hệ+thống+điện',
            price: 'Từ 200.000đ'
        },
        {
            id: 5,
            title: 'Vệ sinh xe',
            description: 'Dịch vụ vệ sinh xe chuyên nghiệp giúp xe luôn sạch sẽ và bảo vệ các bộ phận.',
            details: 'Rửa xe, vệ sinh bình xăng, bộ chế hòa khí, kim phun, buồng đốt và làm đẹp các chi tiết nhựa, kim loại trên xe.',
            image: 'https://placehold.co/600x400/e83737/ffffff?text=Vệ+sinh+xe',
            price: 'Từ 100.000đ'
        },
        {
            id: 6,
            title: 'Sơn và làm đẹp xe',
            description: 'Dịch vụ sơn xe, phục hồi vỏ xe và làm đẹp các chi tiết trên xe.',
            details: 'Sơn xe theo yêu cầu, dán decal, phục hồi các bộ phận bị trầy xước, oxy hóa và làm mới vẻ ngoài cho xe của bạn.',
            image: 'https://placehold.co/600x400/e83737/ffffff?text=Sơn+và+làm+đẹp+xe',
            price: 'Từ 500.000đ'
        }
    ];

    return (
        <>
            <div className="page-banner">
                <Container>
                    <h1 className="text-center">Dịch vụ của chúng tôi</h1>
                    <p className="text-center text-dark">
                        Đa dạng dịch vụ chuyên nghiệp với giá cả hợp lý
                    </p>
                </Container>
            </div>

            <Container className="py-5">
                <Row className="g-4">
                    {services.map(service => (
                        <Col key={service.id} md={6} lg={4}>
                            <Card className="service-card">
                                <Card.Img variant="top" src={service.image} />
                                <Card.Body>
                                    <Card.Title>{service.title}</Card.Title>
                                    <Card.Text>{service.description}</Card.Text>
                                    <div className="mt-2 mb-3">
                                        <h6 className="text-primary-red">Chi tiết dịch vụ:</h6>
                                        <p>{service.details}</p>
                                        <p className="fw-bold">Giá: {service.price}</p>
                                    </div>
                                    <Button as={Link} to="/booking" className="btn-primary-red w-100">
                                        Đặt lịch ngay
                                    </Button>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Container>
        </>
    );
};

export default Services;
