import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Row, Col, Alert, Spinner } from 'react-bootstrap';
import FilterBar from '../components/FilterBar';
import { resourceService } from '../../services/api';

const ServiceManagement = () => {
    const [services, setServices] = useState([]);
    const [filteredServices, setFilteredServices] = useState([]);
    const [filters, setFilters] = useState({
        search: '',
        category: ''
    });
    
    const [showModal, setShowModal] = useState(false);
    const [currentService, setCurrentService] = useState(null);
    const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
    const [validated, setValidated] = useState(false);
    const [formData, setFormData] = useState({
        id: '',
        title: '',
        description: '',
        details: '',
        price: '',
        image: '',
        category: '',
        active: true
    });
    
    // Load services data
    useEffect(() => {
        const fetchServices = async () => {
            try {
                // Gọi API để lấy dữ liệu
                const data = await resourceService.getAllServiceTypes();
                
                // Chuyển đổi dữ liệu từ API sang định dạng UI
                const formattedServices = data.map(item => ({
                    id: item.id,
                    title: item.name, // Giả sử API trả về trường "name"
                    description: item.description,
                    details: item.description, // hoặc một trường khác
                    image: `https://placehold.co/600x400/e83737/ffffff?text=${encodeURIComponent(item.name)}`,
                    price: 'Liên hệ', // hoặc một trường từ API
                    category: 'Chưa phân loại', // hoặc một trường từ API
                    active: true // hoặc một trường từ API
                }));
                
                setServices(formattedServices);
                setFilteredServices(formattedServices);
            } catch (error) {
                console.error('Lỗi khi lấy dữ liệu dịch vụ:', error);
                // Nếu lỗi, sử dụng dữ liệu mẫu
                const mockServices = [
                    {
                        id: 1,
                        title: 'Bảo dưỡng định kỳ',
                        description: 'Kiểm tra toàn bộ xe và thay thế các phụ tùng cần thiết để đảm bảo xe luôn trong tình trạng tốt.',
                        details: 'Dịch vụ bao gồm kiểm tra và thay dầu máy, dầu số, bugi, lọc gió, lọc dầu, điều chỉnh xích, kiểm tra phanh, lốp và các hệ thống điện.',
                        image: 'https://placehold.co/600x400/e83737/ffffff?text=Bảo+dưỡng+định+kỳ',
                        price: 'Từ 150.000đ',
                        category: 'Bảo dưỡng',
                        active: true
                    },
                    {
                        id: 2,
                        title: 'Sửa chữa động cơ',
                        description: 'Dịch vụ sửa chữa, đại tu động cơ chuyên nghiệp với đội ngũ kỹ thuật viên giàu kinh nghiệm.',
                        details: 'Kiểm tra, chẩn đoán và khắc phục các vấn đề về động cơ như: kém khởi động, tiêu hao nhiên liệu, mất công suất, tiếng kêu bất thường...',
                        image: 'https://placehold.co/600x400/e83737/ffffff?text=Sửa+chữa+động+cơ',
                        price: 'Từ 300.000đ',
                        category: 'Sửa chữa',
                        active: true
                    },
                    {
                        id: 3,
                        title: 'Thay thế phụ tùng',
                        description: 'Cung cấp và thay thế phụ tùng chính hãng với giá cả hợp lý và bảo hành dài hạn.',
                        details: 'Chúng tôi cung cấp và thay thế các loại phụ tùng như: nhông sên dĩa, phanh, lốp, ắc quy, đèn, còi, gương, nhớt và các phụ tùng khác.',
                        image: 'https://placehold.co/600x400/e83737/ffffff?text=Thay+thế+phụ+tùng',
                        price: 'Theo báo giá',
                        category: 'Phụ tùng',
                        active: true
                    },
                    {
                        id: 4,
                        title: 'Sửa hệ thống điện',
                        description: 'Kiểm tra và sửa chữa toàn bộ hệ thống điện trên xe máy.',
                        details: 'Dịch vụ bao gồm kiểm tra và sửa chữa các vấn đề về hệ thống điện như: hệ thống đèn, còi, IC, cuộn sạc, bình ắc quy và hệ thống khởi động.',
                        image: 'https://placehold.co/600x400/e83737/ffffff?text=Sửa+hệ+thống+điện',
                        price: 'Từ 200.000đ',
                        category: 'Sửa chữa',
                        active: true
                    },
                    {
                        id: 5,
                        title: 'Vệ sinh xe',
                        description: 'Dịch vụ vệ sinh xe chuyên nghiệp giúp xe luôn sạch sẽ và bảo vệ các bộ phận.',
                        details: 'Rửa xe, vệ sinh bình xăng, bộ chế hòa khí, kim phun, buồng đốt và làm đẹp các chi tiết nhựa, kim loại trên xe.',
                        image: 'https://placehold.co/600x400/e83737/ffffff?text=Vệ+sinh+xe',
                        price: 'Từ 100.000đ',
                        category: 'Vệ sinh',
                        active: true
                    },
                    {
                        id: 6,
                        title: 'Sơn và làm đẹp xe',
                        description: 'Dịch vụ sơn xe, phục hồi vỏ xe và làm đẹp các chi tiết trên xe.',
                        details: 'Sơn xe theo yêu cầu, dán decal, phục hồi các bộ phận bị trầy xước, oxy hóa và làm mới vẻ ngoài cho xe của bạn.',
                        image: 'https://placehold.co/600x400/e83737/ffffff?text=Sơn+và+làm+đẹp+xe',
                        price: 'Từ 500.000đ',
                        category: 'Làm đẹp',
                        active: true
                    }
                ];
                
                setServices(mockServices);
                setFilteredServices(mockServices);
            }
        };
        
        fetchServices();
    }, []);
    
    const handleApplyFilter = (appliedFilters) => {
        let filtered = [...services];
        
        // Apply search filter
        if (appliedFilters.search) {
            const searchTerm = appliedFilters.search.toLowerCase();
            filtered = filtered.filter(service => 
                service.title.toLowerCase().includes(searchTerm) ||
                service.description.toLowerCase().includes(searchTerm) ||
                service.category.toLowerCase().includes(searchTerm)
            );
        }
        
        // Apply category filter
        if (appliedFilters.category) {
            filtered = filtered.filter(service => service.category === appliedFilters.category);
        }
        
        setFilteredServices(filtered);
    };
    
    const handleShowAddModal = () => {
        setFormMode('add');
        setCurrentService(null);
        setFormData({
            id: services.length > 0 ? Math.max(...services.map(s => s.id)) + 1 : 1,
            title: '',
            description: '',
            details: '',
            price: '',
            image: 'https://placehold.co/600x400/e83737/ffffff?text=Dịch+vụ+mới',
            category: '',
            active: true
        });
        setValidated(false);
        setShowModal(true);
    };
    
    const handleShowEditModal = (service) => {
        setFormMode('edit');
        setCurrentService(service);
        setFormData({
            id: service.id,
            title: service.title,
            description: service.description,
            details: service.details,
            price: service.price,
            image: service.image,
            category: service.category,
            active: service.active
        });
        setValidated(false);
        setShowModal(true);
    };
    
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        
        if (form.checkValidity() === false) {
            e.stopPropagation();
            setValidated(true);
            return;
        }
        
        try {
            if (formMode === 'add') {
                // Chuẩn bị dữ liệu để gửi lên API
                const serviceData = {
                    name: formData.title, // Chuyển đổi tên trường từ UI sang API
                    description: formData.description
                    // Thêm các trường khác nếu cần
                };
                
                // Gọi API để tạo dịch vụ mới
                const response = await resourceService.createServiceType(serviceData);
                
                // Thêm dịch vụ mới vào state
                const newService = {
                    id: response.id,
                    title: response.name,
                    description: response.description,
                    details: response.description,
                    image: formData.image,
                    price: formData.price,
                    category: formData.category,
                    active: formData.active
                };
                
                const newServices = [...services, newService];
                setServices(newServices);
                setFilteredServices(newServices);
            } else {
                // Cập nhật dịch vụ có thể được thêm sau khi API hỗ trợ
                const updatedServices = services.map(service => 
                    service.id === formData.id ? formData : service
                );
                setServices(updatedServices);
                setFilteredServices(updatedServices);
            }
            
            setShowModal(false);
        } catch (error) {
            console.error('Lỗi khi lưu dịch vụ:', error);
            alert('Có lỗi xảy ra khi lưu dịch vụ. Vui lòng thử lại.');
        }
    };
    
    const handleToggleActive = (id) => {
        const updatedServices = services.map(service => {
            if (service.id === id) {
                return { ...service, active: !service.active };
            }
            return service;
        });
        setServices(updatedServices);
        setFilteredServices(updatedServices);
    };
    
    const categories = [...new Set(services.map(service => service.category))];

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0">Quản lý dịch vụ</h5>
                <Button 
                    onClick={handleShowAddModal}
                    style={{ backgroundColor: '#d30000', borderColor: '#d30000' }}
                >
                    <i className="bi bi-plus-circle me-1"></i>
                    Thêm dịch vụ mới
                </Button>
            </div>
            
            <div className="filter-bar bg-white p-3 rounded shadow-sm mb-4">
                <Row className="align-items-end g-3">
                    <Col md={3} sm={6}>
                        <Form.Group>
                            <Form.Label>Tìm kiếm</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Tìm kiếm dịch vụ..."
                                name="search"
                                value={filters.search}
                                onChange={(e) => setFilters({...filters, search: e.target.value})}
                            />
                        </Form.Group>
                    </Col>
                    
                    <Col md={3} sm={6}>
                        <Form.Group>
                            <Form.Label>Danh mục</Form.Label>
                            <Form.Select
                                name="category"
                                value={filters.category}
                                onChange={(e) => setFilters({...filters, category: e.target.value})}
                            >
                                <option value="">Tất cả danh mục</option>
                                {categories.map((category, index) => (
                                    <option key={index} value={category}>{category}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    
                    <Col md="auto" className="ms-auto">
                        <div className="d-flex gap-2">
                            <Button 
                                variant="outline-secondary" 
                                onClick={() => {
                                    setFilters({search: '', category: ''});
                                    setFilteredServices(services);
                                }}
                            >
                                <i className="bi bi-x-circle me-1"></i>
                                Xóa bộ lọc
                            </Button>
                            <Button 
                                variant="primary" 
                                onClick={() => handleApplyFilter(filters)}
                                style={{ backgroundColor: '#d30000', borderColor: '#d30000' }}
                            >
                                <i className="bi bi-funnel me-1"></i>
                                Lọc
                            </Button>
                        </div>
                    </Col>
                </Row>
            </div>
            
            <Card className="shadow-sm mb-4">
                <Card.Body className="p-0">
                    <div className="table-responsive">
                        <Table hover className="mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th style={{width: '80px'}}>ID</th>
                                    <th style={{width: '120px'}}>Hình ảnh</th>
                                    <th>Tên dịch vụ</th>
                                    <th>Danh mục</th>
                                    <th>Giá</th>
                                    <th style={{width: '100px'}}>Trạng thái</th>
                                    <th style={{width: '150px'}}>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredServices.length > 0 ? (
                                    filteredServices.map(service => (
                                        <tr key={service.id}>
                                            <td>{service.id}</td>
                                            <td>
                                                <img 
                                                    src={service.image} 
                                                    alt={service.title}
                                                    style={{width: '80px', height: '60px', objectFit: 'cover'}}
                                                    className="rounded"
                                                />
                                            </td>
                                            <td>
                                                <div className="fw-semibold">{service.title}</div>
                                                <small className="text-muted">{service.description.substring(0, 60)}...</small>
                                            </td>
                                            <td>{service.category}</td>
                                            <td>{service.price}</td>
                                            <td>
                                                <Form.Check 
                                                    type="switch"
                                                    id={`service-active-${service.id}`}
                                                    label={service.active ? "Hiển thị" : "Ẩn"}
                                                    checked={service.active}
                                                    onChange={() => handleToggleActive(service.id)}
                                                    className="form-switch-sm"
                                                />
                                            </td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    <Button 
                                                        variant="outline-primary" 
                                                        size="sm"
                                                        style={{ borderColor: '#d30000', color: '#d30000' }}
                                                        onClick={() => handleShowEditModal(service)}
                                                    >
                                                        <i className="bi bi-pencil"></i>
                                                    </Button>
                                                    <Button 
                                                        variant={service.active ? "outline-secondary" : "outline-success"} 
                                                        size="sm"
                                                        onClick={() => handleToggleActive(service.id)}
                                                    >
                                                        <i className={`bi ${service.active ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="text-center py-4">
                                            <div className="text-muted">
                                                <i className="bi bi-inbox fs-4 d-block mb-2"></i>
                                                Không tìm thấy dịch vụ nào
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>
            
            {/* Add/Edit Service Modal */}
            <Modal
                show={showModal}
                onHide={() => setShowModal(false)}
                size="lg"
                backdrop="static"
                keyboard={false}
                centered
            >
                <Form noValidate validated={validated} onSubmit={handleSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>{formMode === 'add' ? 'Thêm dịch vụ mới' : 'Chỉnh sửa dịch vụ'}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Row className="mb-3">
                            <Col md={8}>
                                <Form.Group controlId="title">
                                    <Form.Label>Tên dịch vụ *</Form.Label>
                                    <Form.Control
                                        required
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        placeholder="Nhập tên dịch vụ"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        Vui lòng nhập tên dịch vụ
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group controlId="category">
                                    <Form.Label>Danh mục *</Form.Label>
                                    <Form.Control
                                        required
                                        as="select"
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Chọn danh mục</option>
                                        <option value="Bảo dưỡng">Bảo dưỡng</option>
                                        <option value="Sửa chữa">Sửa chữa</option>
                                        <option value="Phụ tùng">Phụ tùng</option>
                                        <option value="Vệ sinh">Vệ sinh</option>
                                        <option value="Làm đẹp">Làm đẹp</option>
                                        <option value="Khác">Khác</option>
                                    </Form.Control>
                                    <Form.Control.Feedback type="invalid">
                                        Vui lòng chọn danh mục
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>
                        
                        <Form.Group className="mb-3" controlId="description">
                            <Form.Label>Mô tả ngắn *</Form.Label>
                            <Form.Control
                                required
                                as="textarea"
                                rows={2}
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Nhập mô tả ngắn về dịch vụ"
                            />
                            <Form.Control.Feedback type="invalid">
                                Vui lòng nhập mô tả
                            </Form.Control.Feedback>
                        </Form.Group>
                        
                        <Form.Group className="mb-3" controlId="details">
                            <Form.Label>Chi tiết dịch vụ *</Form.Label>
                            <Form.Control
                                required
                                as="textarea"
                                rows={3}
                                name="details"
                                value={formData.details}
                                onChange={handleInputChange}
                                placeholder="Nhập chi tiết về dịch vụ"
                            />
                            <Form.Control.Feedback type="invalid">
                                Vui lòng nhập chi tiết dịch vụ
                            </Form.Control.Feedback>
                        </Form.Group>
                        
                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group controlId="price">
                                    <Form.Label>Giá dịch vụ *</Form.Label>
                                    <Form.Control
                                        required
                                        type="text"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        placeholder="VD: Từ 150.000đ"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        Vui lòng nhập giá dịch vụ
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group controlId="image">
                                    <Form.Label>Hình ảnh URL</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="image"
                                        value={formData.image}
                                        onChange={handleInputChange}
                                        placeholder="URL hình ảnh"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        
                        <Form.Group className="mb-3" controlId="status">
                            <Form.Check
                                type="checkbox"
                                label="Hiển thị dịch vụ"
                                name="active"
                                checked={formData.active}
                                onChange={handleInputChange}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>
                            Hủy
                        </Button>
                        <Button 
                            type="submit" 
                            style={{ backgroundColor: '#d30000', borderColor: '#d30000' }}
                        >
                            {formMode === 'add' ? 'Thêm dịch vụ' : 'Cập nhật'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    );
};

export default ServiceManagement;
