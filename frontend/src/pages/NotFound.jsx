import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <Container className="py-5 text-center">
            <Row className="justify-content-center">
                <Col md={6}>
                    <div className="not-found py-5">
                        <h1 className="display-1 text-primary-red fw-bold">404</h1>
                        <h2 className="mb-4">Không tìm thấy trang</h2>
                        <p className="mb-4">Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.</p>
                        
                        <img 
                            src="https://placehold.co/600x300/e83737/ffffff?text=404+Not+Found" 
                            alt="404 Not Found"
                            className="img-fluid rounded shadow mb-4"
                        />
                        
                        <div className="d-flex justify-content-center gap-3">
                            <Button as={Link} to="/" className="btn-primary-red px-4">
                                <i className="bi bi-house-door me-2"></i>
                                Về trang chủ
                            </Button>
                            <Button as={Link} to="/contact" variant="outline-secondary">
                                <i className="bi bi-envelope me-2"></i>
                                Liên hệ hỗ trợ
                            </Button>
                        </div>
                    </div>
                </Col>
            </Row>
        </Container>
    );
};

export default NotFound;
