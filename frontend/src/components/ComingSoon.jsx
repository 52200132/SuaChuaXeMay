import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import ComingSoonImage from '../assets/images/pngtree-coming-soon-banner.png'; // Placeholder image for coming soon

const ComingSoon = ({ 
    title = "Tính năng đang phát triển", 
    description = "Chúng tôi đang phát triển tính năng này. Vui lòng quay lại sau.", 
    returnPath = "/",
    returnText = "Quay lại trang chủ"
}) => {
    return (
        <Container className="py-5 text-center">
            <Row className="justify-content-center">
                <Col md={8} lg={6}>
                    <div className="coming-soon p-4">
                        <h2 className="mb-3">{title}</h2>
                        <p className="mb-4">{description}</p>
                        <img 
                            src={ComingSoonImage} 
                            alt="Tính năng đang phát triển"
                            className="img-fluid mb-4"
                        />
                        <div>
                            <Button as={Link} to={returnPath} className="btn-primary-red px-4">
                                <i className="bi bi-arrow-left me-2"></i>
                                {returnText}
                            </Button>
                        </div>
                    </div>
                </Col>
            </Row>
        </Container>
    );
};

export default ComingSoon;
