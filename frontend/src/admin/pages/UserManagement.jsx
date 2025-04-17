import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Pagination, Modal, Form, Row, Col, Badge } from 'react-bootstrap';
import FilterBar from '../components/FilterBar';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [filters, setFilters] = useState({
        search: '',
        role: '',
        status: ''
    });
    
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'view'
    const [currentUser, setCurrentUser] = useState(null);
    const [validated, setValidated] = useState(false);
    const [formData, setFormData] = useState({
        id: '',
        displayName: '',
        email: '',
        phone: '',
        role: 'employee',
        status: 'active',
        joinedDate: '',
        address: '',
        password: '',
        confirmPassword: ''
    });
    
    // Load users data
    useEffect(() => {
        // In a real application, this would be an API call
        const fetchUsers = () => {
            // Mock data
            const mockUsers = [
                {
                    id: 1,
                    displayName: 'Nguyễn Văn A',
                    email: 'nguyenvana@example.com',
                    phone: '0912345678',
                    role: 'owner',
                    status: 'active',
                    joinedDate: '2020-01-01',
                    address: '123 Đường ABC, Quận 1, TP.HCM'
                },
                {
                    id: 2,
                    displayName: 'Trần Thị B',
                    email: 'tranthib@example.com',
                    phone: '0923456789',
                    role: 'admin',
                    status: 'active',
                    joinedDate: '2020-06-15',
                    address: '456 Đường XYZ, Quận 2, TP.HCM'
                },
                {
                    id: 3,
                    displayName: 'Lê Văn C',
                    email: 'levanc@example.com',
                    phone: '0934567890',
                    role: 'employee',
                    status: 'active',
                    joinedDate: '2021-03-10',
                    address: '789 Đường DEF, Quận 3, TP.HCM'
                },
                {
                    id: 4,
                    displayName: 'Phạm Thị D',
                    email: 'phamthid@example.com',
                    phone: '0945678901',
                    role: 'employee',
                    status: 'inactive',
                    joinedDate: '2021-07-20',
                    address: '101 Đường GHI, Quận 4, TP.HCM'
                },
                {
                    id: 5,
                    displayName: 'Hoàng Văn E',
                    email: 'hoangvane@example.com',
                    phone: '0956789012',
                    role: 'employee',
                    status: 'active',
                    joinedDate: '2022-01-05',
                    address: '202 Đường JKL, Quận 5, TP.HCM'
                }
            ];
            
            setUsers(mockUsers);
            setFilteredUsers(mockUsers);
        };
        
        fetchUsers();
    }, []);
    
    // Handle filter application
    const handleApplyFilter = (appliedFilters) => {
        let filtered = [...users];
        
        // Apply search filter
        if (appliedFilters.search) {
            const searchTerm = appliedFilters.search.toLowerCase();
            filtered = filtered.filter(user => 
                user.displayName.toLowerCase().includes(searchTerm) ||
                user.email.toLowerCase().includes(searchTerm) ||
                user.phone.includes(searchTerm)
            );
        }
        
        // Apply role filter
        if (appliedFilters.role) {
            filtered = filtered.filter(user => user.role === appliedFilters.role);
        }
        
        // Apply status filter
        if (appliedFilters.status) {
            filtered = filtered.filter(user => user.status === appliedFilters.status);
        }
        
        setFilteredUsers(filtered);
    };
    
    // Form handling
    const handleShowAddModal = () => {
        setModalMode('add');
        setCurrentUser(null);
        setFormData({
            id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
            displayName: '',
            email: '',
            phone: '',
            role: 'employee',
            status: 'active',
            joinedDate: new Date().toISOString().split('T')[0],
            address: '',
            password: '',
            confirmPassword: ''
        });
        setValidated(false);
        setShowModal(true);
    };
    
    const handleShowEditModal = (user) => {
        setModalMode('edit');
        setCurrentUser(user);
        setFormData({
            ...user,
            password: '',
            confirmPassword: ''
        });
        setValidated(false);
        setShowModal(true);
    };
    
    const handleShowViewModal = (user) => {
        setModalMode('view');
        setCurrentUser(user);
        setFormData({
            ...user,
            password: '',
            confirmPassword: ''
        });
        setShowModal(true);
    };
    
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        
        if (form.checkValidity() === false) {
            e.stopPropagation();
            setValidated(true);
            return;
        }
        
        // Validate passwords match for add mode
        if (modalMode === 'add' && formData.password !== formData.confirmPassword) {
            alert('Mật khẩu xác nhận không khớp');
            return;
        }
        
        if (modalMode === 'add') {
            // Add new user
            const newUsers = [...users, formData];
            setUsers(newUsers);
            setFilteredUsers(newUsers);
        } else if (modalMode === 'edit') {
            // Update existing user
            const updatedUsers = users.map(user => 
                user.id === formData.id ? formData : user
            );
            setUsers(updatedUsers);
            setFilteredUsers(updatedUsers);
        }
        
        setShowModal(false);
    };
    
    const handleToggleStatus = (id) => {
        const updatedUsers = users.map(user => {
            if (user.id === id) {
                const newStatus = user.status === 'active' ? 'inactive' : 'active';
                return { ...user, status: newStatus };
            }
            return user;
        });
        setUsers(updatedUsers);
        setFilteredUsers(updatedUsers);
    };

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0">Quản lý nhân viên</h5>
                <Button 
                    onClick={handleShowAddModal}
                    style={{ backgroundColor: '#d30000', borderColor: '#d30000' }}
                >
                    <i className="bi bi-person-plus me-1"></i>
                    Thêm nhân viên mới
                </Button>
            </div>
            
            <div className="filter-bar bg-white p-3 rounded shadow-sm mb-4">
                <Row className="align-items-end g-3">
                    <Col md={3} sm={6}>
                        <Form.Group>
                            <Form.Label>Tìm kiếm</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Tìm kiếm theo tên, email, SĐT..."
                                name="search"
                                value={filters.search}
                                onChange={(e) => setFilters({...filters, search: e.target.value})}
                            />
                        </Form.Group>
                    </Col>
                    
                    <Col md={2} sm={6}>
                        <Form.Group>
                            <Form.Label>Vai trò</Form.Label>
                            <Form.Select
                                name="role"
                                value={filters.role}
                                onChange={(e) => setFilters({...filters, role: e.target.value})}
                            >
                                <option value="">Tất cả vai trò</option>
                                <option value="owner">Chủ cửa hàng</option>
                                <option value="admin">Quản lý</option>
                                <option value="employee">Nhân viên</option>
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    
                    <Col md={2} sm={6}>
                        <Form.Group>
                            <Form.Label>Trạng thái</Form.Label>
                            <Form.Select
                                name="status"
                                value={filters.status}
                                onChange={(e) => setFilters({...filters, status: e.target.value})}
                            >
                                <option value="">Tất cả trạng thái</option>
                                <option value="active">Đang hoạt động</option>
                                <option value="inactive">Ngưng hoạt động</option>
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    
                    <Col md="auto" className="ms-auto">
                        <div className="d-flex gap-2">
                            <Button 
                                variant="outline-secondary" 
                                onClick={() => {
                                    setFilters({search: '', role: '', status: ''});
                                    setFilteredUsers(users);
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
                                    <th>ID</th>
                                    <th>Họ và tên</th>
                                    <th>Thông tin liên hệ</th>
                                    <th>Vai trò</th>
                                    <th>Ngày tham gia</th>
                                    <th>Trạng thái</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map(user => (
                                        <tr key={user.id}>
                                            <td>{user.id}</td>
                                            <td className="fw-semibold">{user.displayName}</td>
                                            <td>
                                                <div>{user.email}</div>
                                                <small>{user.phone}</small>
                                            </td>
                                            <td>
                                                <Badge bg={
                                                    user.role === 'owner' ? 'danger' : 
                                                    user.role === 'admin' ? 'primary' : 'secondary'
                                                }>
                                                    {user.role === 'owner' ? 'Chủ cửa hàng' : 
                                                     user.role === 'admin' ? 'Quản lý' : 'Nhân viên'}
                                                </Badge>
                                            </td>
                                            <td>{user.joinedDate}</td>
                                            <td>
                                                <Badge bg={user.status === 'active' ? 'success' : 'danger'}>
                                                    {user.status === 'active' ? 'Đang hoạt động' : 'Ngưng hoạt động'}
                                                </Badge>
                                            </td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    <Button 
                                                        variant="outline-primary" 
                                                        size="sm"
                                                        onClick={() => handleShowViewModal(user)}
                                                    >
                                                        <i className="bi bi-eye"></i>
                                                    </Button>
                                                    <Button 
                                                        variant="outline-primary" 
                                                        size="sm"
                                                        style={{ borderColor: '#d30000', color: '#d30000' }}
                                                        onClick={() => handleShowEditModal(user)}
                                                        disabled={user.role === 'owner'}
                                                    >
                                                        <i className="bi bi-pencil"></i>
                                                    </Button>
                                                    <Button 
                                                        variant={user.status === 'active' ? 'outline-danger' : 'outline-success'} 
                                                        size="sm"
                                                        onClick={() => handleToggleStatus(user.id)}
                                                        disabled={user.role === 'owner'}
                                                    >
                                                        <i className={`bi ${user.status === 'active' ? 'bi-person-x' : 'bi-person-check'}`}></i>
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
                                                Không tìm thấy nhân viên nào
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>
            
            {/* Add/Edit/View User Modal */}
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
                        <Modal.Title>
                            {modalMode === 'add' ? 'Thêm nhân viên mới' : 
                             modalMode === 'edit' ? 'Chỉnh sửa thông tin nhân viên' : 
                             'Thông tin chi tiết nhân viên'}
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group controlId="displayName">
                                    <Form.Label>Họ và tên *</Form.Label>
                                    <Form.Control
                                        required
                                        type="text"
                                        name="displayName"
                                        value={formData.displayName}
                                        onChange={handleInputChange}
                                        disabled={modalMode === 'view'}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        Vui lòng nhập họ và tên
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group controlId="email">
                                    <Form.Label>Email *</Form.Label>
                                    <Form.Control
                                        required
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        disabled={modalMode === 'view' || modalMode === 'edit'}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        Vui lòng nhập email hợp lệ
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>
                        
                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group controlId="phone">
                                    <Form.Label>Số điện thoại *</Form.Label>
                                    <Form.Control
                                        required
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        disabled={modalMode === 'view'}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        Vui lòng nhập số điện thoại
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group controlId="role">
                                    <Form.Label>Vai trò *</Form.Label>
                                    <Form.Select
                                        required
                                        name="role"
                                        value={formData.role}
                                        onChange={handleInputChange}
                                        disabled={modalMode === 'view' || formData.role === 'owner'}
                                    >
                                        <option value="admin">Quản lý</option>
                                        <option value="employee">Nhân viên</option>
                                        {formData.role === 'owner' && (
                                            <option value="owner">Chủ cửa hàng</option>
                                        )}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                        
                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group controlId="joinedDate">
                                    <Form.Label>Ngày tham gia *</Form.Label>
                                    <Form.Control
                                        required
                                        type="date"
                                        name="joinedDate"
                                        value={formData.joinedDate}
                                        onChange={handleInputChange}
                                        disabled={modalMode === 'view'}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group controlId="status">
                                    <Form.Label>Trạng thái *</Form.Label>
                                    <Form.Select
                                        required
                                        name="status"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                        disabled={modalMode === 'view' || formData.role === 'owner'}
                                    >
                                        <option value="active">Đang hoạt động</option>
                                        <option value="inactive">Ngưng hoạt động</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                        
                        <Form.Group className="mb-3" controlId="address">
                            <Form.Label>Địa chỉ</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                disabled={modalMode === 'view'}
                            />
                        </Form.Group>
                        
                        {modalMode === 'add' && (
                            <>
                                <hr />
                                <h6>Thông tin đăng nhập</h6>
                                
                                <Row className="mb-3">
                                    <Col md={6}>
                                        <Form.Group controlId="password">
                                            <Form.Label>Mật khẩu *</Form.Label>
                                            <Form.Control
                                                required
                                                type="password"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                Vui lòng nhập mật khẩu
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group controlId="confirmPassword">
                                            <Form.Label>Xác nhận mật khẩu *</Form.Label>
                                            <Form.Control
                                                required
                                                type="password"
                                                name="confirmPassword"
                                                value={formData.confirmPassword}
                                                onChange={handleInputChange}
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                Vui lòng xác nhận mật khẩu
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>
                            {modalMode === 'view' ? 'Đóng' : 'Hủy'}
                        </Button>
                        {modalMode !== 'view' && (
                            <Button 
                                type="submit" 
                                style={{ backgroundColor: '#d30000', borderColor: '#d30000' }}
                            >
                                {modalMode === 'add' ? 'Thêm nhân viên' : 'Cập nhật'}
                            </Button>
                        )}
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    );
};

export default UserManagement;
