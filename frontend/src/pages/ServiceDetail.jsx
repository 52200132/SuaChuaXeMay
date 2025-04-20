import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Breadcrumb } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import ComingSoon from '../components/ComingSoon';
import { resourceService } from '../services/api';

const ServiceDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [serviceTypeId, setServiceTypeId] = useState(id);
    const [service, setService] = useState(null);
    const [serviceFollowType, setServiceFollowType] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isComingSoon, setIsComingSoon] = useState(false);

    useEffect(() => {

        // Simulate API call to get service details
        const fetchService = async () => {
            // This would be an actual API call in a real application
            // const services = [

            //     {
            //         id: 1,
            //         title: 'Bảo dưỡng định kỳ',
            //         description: 'Kiểm tra toàn bộ xe và thay thế các phụ tùng cần thiết để đảm bảo xe luôn trong tình trạng tốt.',
            //         image: 'https://placehold.co/600x400/e83737/ffffff?text=Bảo+dưỡng+định+kỳ',
            //         longDescription: `
            //                     <p>Bảo dưỡng định kỳ là công việc cần thiết giúp xe máy của bạn vận hành trơn tru và kéo dài tuổi thọ. Tại cửa hàng của chúng tôi, dịch vụ bảo dưỡng định kỳ bao gồm các công việc sau:</p>
            //                     <ul>
            //                         <li>Kiểm tra và thay dầu máy, dầu số</li>
            //                         <li>Kiểm tra và làm sạch/thay thế bugi</li>
            //                         <li>Kiểm tra và làm sạch/thay thế lọc gió, lọc dầu</li>
            //                         <li>Điều chỉnh xích, kiểm tra độ mòn của nhông sên dĩa</li>
            //                         <li>Kiểm tra và điều chỉnh hệ thống phanh</li>
            //                         <li>Kiểm tra áp suất lốp và tình trạng lốp</li>
            //                         <li>Kiểm tra hệ thống điện</li>
            //                         <li>Kiểm tra và điều chỉnh chế hòa khí (nếu có)</li>
            //                         <li>Làm sạch và điều chỉnh họng ga</li>
            //                     </ul>
            //                     <p>Chúng tôi khuyến nghị bạn nên bảo dưỡng xe định kỳ mỗi 3.000 km hoặc 3 tháng tùy điều kiện nào đến trước.</p>
            //                 `
            //     }
            //     // Other services would be listed here
            // ];

            // const foundService = services.find(s => s.id === parseInt(id));

            // setTimeout(() => {
            //     if (foundService) {
            //         setService(foundService);
            //         setIsComingSoon(false);
            //     } else {
            //         // Only show actual details for service ID 1
            //         // All other services will show the coming soon page
            //         setIsComingSoon(true);
            //     }
            //     setLoading(false);
            // }, 1000); // Simulate network delay

            const [serviceTypeData, serviceFollowTypeData] = await Promise.all([
                resourceService.getServiceTypeById(id),
                resourceService.getServiceFollowTypeId(id)
            ]);

            const formattedService = {
                id: serviceTypeData.service_type_id,
                title: serviceTypeData.name,
                description: serviceTypeData.description,
                image: serviceTypeData.url || `https://placehold.co/600x400/e83737/ffffff?text=${encodeURIComponent(serviceTypeData.name)}`,
            }

            if (serviceTypeData && serviceFollowTypeData) {
                setService(formattedService);
                setServiceFollowType(serviceFollowTypeData);
                setIsComingSoon(false);
            } else {
                setIsComingSoon(true);
            }
            setLoading(false);

        };

        fetchService();
    }, [id]);

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <div className="spinner-border text-primary-red" role="status">
                    <span className="visually-hidden">Đang tải...</span>
                </div>
            </Container>
        );
    }

    if (isComingSoon) {
        return (
            <ComingSoon
                title="Chi tiết dịch vụ đang được cập nhật"
                description="Chúng tôi đang hoàn thiện thông tin chi tiết cho dịch vụ này. Vui lòng quay lại sau hoặc liên hệ với chúng tôi để biết thêm thông tin."
                returnPath="/services"
                returnText="Quay lại danh sách dịch vụ"
            />
        );
    }

    return (
        <>
            <div className="page-banner">
                <Container>
                    <h1 className="text-center">{service.title}</h1>
                    <Breadcrumb className="justify-content-center bg-transparent">
                        <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/" }}>Trang chủ</Breadcrumb.Item>
                        <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/services" }}>Dịch vụ</Breadcrumb.Item>
                        <Breadcrumb.Item active>{service.title}</Breadcrumb.Item>
                    </Breadcrumb>
                </Container>
            </div>

            <Container className="py-5">
                <Row>
                    <Col lg={6} className="mb-4 mb-lg-0">
                        <img
                            src={service.image}
                            alt={service.title}
                            className="img-fluid rounded shadow-sm"
                        />
                    </Col>
                    <Col lg={6}>
                        <h2 className="text-primary-red mb-3">{service.title}</h2>
                        <p className="fw-bold fs-5 mb-3">{service.description}</p>
                        <p>{service.details}</p>
                        <div className="price-tag mb-4">
                            <p className="mb-2">Giá dịch vụ:</p>
                            <h4 className="text-primary-red">{service.price}</h4>
                        </div>
                        <div className="d-flex gap-3">
                            <Button as={Link} to="/booking" className="btn-primary-red px-4 py-2">
                                Đặt lịch ngay
                            </Button>
                            <Button as={Link} to="/contact" variant="outline-secondary" className="px-4 py-2">
                                Liên hệ tư vấn
                            </Button>
                        </div>
                    </Col>
                </Row>

                <Row className="mt-5">
                    <Col>
                        <Card className="shadow-sm">
                            <Card.Header className="bg-white">
                                <h3 className="mb-0 fs-4">Chi tiết dịch vụ</h3>
                            </Card.Header>
                            <Card.Body>
                                {/* <div dangerouslySetInnerHTML={{ __html: service.longDescription }} /> */}
                                <ul className="">
                                    {serviceFollowType ? (serviceFollowType.map(service => (
                                        <li key={service.service_id} className="">
                                            {/* <i className="bi bi-check-circle-fill text-primary-red me-2"></i> */}
                                            {service.name}
                                        </li>
                                    ))
                                    ) : (
                                        <li className="text-danger">Chưa có dịch vụ nào được cung cấp.</li>
                                    )}
                                </ul>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </>
    );
};

export default ServiceDetail;
