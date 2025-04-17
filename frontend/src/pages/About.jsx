import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';

const About = () => {
    const team = [
        {
            id: 1,
            name: 'Nguyễn Văn A',
            position: 'Chủ cửa hàng',
            bio: 'Hơn 15 năm kinh nghiệm trong ngành sửa chữa xe máy. Chuyên gia về động cơ và các dòng xe phân khối lớn.',
            image: 'https://placehold.co/400x400/e83737/ffffff?text=Nguyễn+Văn+A'
        },
        {
            id: 2,
            name: 'Trần Văn B',
            position: 'Kỹ thuật viên trưởng',
            bio: 'Hơn 10 năm kinh nghiệm sửa chữa. Chuyên sâu về hệ thống điện và phun xăng điện tử.',
            image: 'https://placehold.co/400x400/e83737/ffffff?text=Trần+Văn+B'
        },
        {
            id: 3,
            name: 'Phạm Thị C',
            position: 'Quản lý dịch vụ',
            bio: 'Phụ trách điều phối lịch hẹn và chăm sóc khách hàng. Đảm bảo mọi dịch vụ được thực hiện đúng tiến độ.',
            image: 'https://placehold.co/400x400/e83737/ffffff?text=Phạm+Thị+C'
        }
    ];

    return (
        <>
            <div className="page-banner">
                <Container>
                    <h1 className="text-center">Giới thiệu về chúng tôi</h1>
                    <p className="text-center text-dark">
                        Tìm hiểu thêm về cửa hàng và đội ngũ của chúng tôi
                    </p>
                </Container>
            </div>

            <Container className="py-5">
                <Row className="align-items-center mb-5">
                    <Col lg={6}>
                        <h2 className="section-title">Câu chuyện của chúng tôi</h2>
                        <p className="mt-4">
                            Được thành lập vào năm 2010, cửa hàng sửa chữa xe máy của chúng tôi bắt đầu từ một tiệm nhỏ với niềm đam mê
                            và sự tận tâm đối với xe máy. Trải qua hơn 10 năm phát triển, chúng tôi đã trở thành một trong những cửa hàng
                            sửa chữa xe máy uy tín nhất trong khu vực.
                        </p>
                        <p>
                            Chúng tôi luôn đặt chất lượng dịch vụ và sự hài lòng của khách hàng lên hàng đầu. Với đội ngũ kỹ thuật viên
                            giàu kinh nghiệm, được đào tạo chuyên sâu và trang thiết bị hiện đại, chúng tôi cam kết mang đến những dịch vụ
                            tốt nhất cho xe của bạn.
                        </p>
                    </Col>
                    <Col lg={6} className="mt-4 mt-lg-0">
                        <img
                            src="https://placehold.co/600x400/e83737/ffffff?text=Câu+chuyện+của+chúng+tôi"
                            alt="Câu chuyện của chúng tôi"
                            className="img-fluid rounded shadow"
                        />
                    </Col>
                </Row>

                <Row className="mb-5">
                    <Col>
                        <h2 className="section-title text-center">Sứ mệnh và tầm nhìn</h2>
                        <Row className="mt-4 g-4">
                            <Col md={6}>
                                <div className="bg-light p-4 rounded shadow-sm h-100">
                                    <h4 className="text-primary-red mb-3">Sứ mệnh</h4>
                                    <p>
                                        Chúng tôi cam kết cung cấp dịch vụ sửa chữa xe máy chất lượng cao với giá cả hợp lý,
                                        giúp khách hàng an tâm và tiết kiệm thời gian. Mọi dịch vụ đều được thực hiện bởi đội ngũ
                                        kỹ thuật viên giàu kinh nghiệm và tận tâm với công việc.
                                    </p>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className="bg-light p-4 rounded shadow-sm h-100">
                                    <h4 className="text-primary-red mb-3">Tầm nhìn</h4>
                                    <p>
                                        Trở thành cửa hàng sửa chữa xe máy hàng đầu trong khu vực, nổi tiếng với chất lượng dịch vụ xuất sắc
                                        và sự hài lòng cao từ khách hàng. Chúng tôi hướng đến việc mở rộng quy mô và đa dạng hóa các dịch vụ
                                        để đáp ứng tốt hơn nhu cầu ngày càng cao của khách hàng.
                                    </p>
                                </div>
                            </Col>
                        </Row>
                    </Col>
                </Row>

                <Row>
                    <Col>
                        <h2 className="section-title text-center">Đội ngũ của chúng tôi</h2>
                        <Row className="mt-4 g-4">
                            {team.map(member => (
                                <Col key={member.id} md={6} lg={4}>
                                    <Card className="text-center border-0 shadow">
                                        <div className="py-3">
                                            <img
                                                src={member.image}
                                                alt={member.name}
                                                className="rounded-circle shadow-sm"
                                                style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                                            />
                                        </div>
                                        <Card.Body>
                                            <Card.Title className="text-primary-red">{member.name}</Card.Title>
                                            <Card.Subtitle className="mb-2 text-muted">{member.position}</Card.Subtitle>
                                            <Card.Text className="mt-3">{member.bio}</Card.Text>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </Col>
                </Row>
            </Container>
        </>
    );
};

export default About;
