import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Pagination, Modal, Form, Row, Col, InputGroup, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import StatusBadge from '../components/StatusBadge';
import { useAppData } from '../contexts/AppDataContext';
import './OrderManagement.css';

const OrderManagement = () => {
    // Lấy từ context
    const { getData, getIds, setData, fetchAndStoreData, setMultipleData } = useAppData();
    const ordersById = getData('orders');
    const ordersIds = getIds('ordersIds');
    const customersById = getData('customers');
    const motorcyclesById = getData('motorcycles');

    // State quản lý danh sách đơn hàng
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    
    // State cho filter và phân trang
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        startDate: '',
        endDate: '',
    });

    const tableOrderStatus = {
        // English to Vietnamese mapping
        'received': 'Đã tiếp nhận',
        'checking': 'Đang kiểm tra',        
        'wait_confirm': 'Chờ xác nhận',    
        'repairing': 'Đang sửa chữa',       
        'wait_delivery': 'Chờ giao xe',   
        'delivered': 'Đã giao xe',
        
        // Vietnamese to English mapping
        'Đã tiếp nhận': 'received',
        'Đang kiểm tra': 'checking',
        'Chờ xác nhận': 'wait_confirm',
        'Đang sửa chữa': 'repairing',
        'Chờ giao xe': 'wait_delivery',
        'Đã giao xe': 'delivered'
    };
    
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    // State cho modal
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentOrder, setCurrentOrder] = useState(null);
    
    // State cho form chỉnh sửa
    const [formData, setFormData] = useState({
        status: '',
        note: '',
    });
    
    const [validated, setValidated] = useState(false);
    const [loading, setLoading] = useState(true);
    
    // Load mock data
    useEffect(() => {
        const mockOrders = [
            {
                orderId: 'ORD-2023-001',
                customerName: 'Nguyễn Văn A',
                customerPhone: '0912345678',
                createdDate: '2023-06-15',
                createdTime: '08:30',
                technicianName: 'Kỹ thuật viên 1',
                status: 'Đang xử lý',
                items: [
                    { name: 'Thay nhớt', quantity: 1, price: 150000 },
                    { name: 'Vệ sinh bugi', quantity: 1, price: 50000 }
                ],
                totalAmount: 200000,
                note: 'Khách hẹn lấy xe vào cuối tuần'
            },
            {
                orderId: 'ORD-2023-002',
                customerName: 'Trần Thị B',
                customerPhone: '0987654321',
                createdDate: '2023-06-16',
                createdTime: '10:15',
                technicianName: 'Kỹ thuật viên 2',
                status: 'Hoàn thành',
                items: [
                    { name: 'Thay lốp xe', quantity: 2, price: 400000 },
                    { name: 'Thay bugi', quantity: 1, price: 120000 }
                ],
                totalAmount: 520000,
                note: 'Đã thanh toán đầy đủ'
            },
            {
                orderId: 'ORD-2023-003',
                customerName: 'Lê Văn C',
                customerPhone: '0977123456',
                createdDate: '2023-06-17',
                createdTime: '13:45',
                technicianName: 'Kỹ thuật viên 3',
                status: 'Đang xử lý',
                items: [
                    { name: 'Sửa chữa động cơ', quantity: 1, price: 750000 }
                ],
                totalAmount: 750000,
                note: 'Cần liên hệ với khách khi phát hiện thêm vấn đề'
            },
            {
                orderId: 'ORD-2023-004',
                customerName: 'Phạm Thị D',
                customerPhone: '0909123456',
                createdDate: '2023-06-18',
                createdTime: '09:30',
                technicianName: 'Kỹ thuật viên 1',
                status: 'Hoàn thành',
                items: [
                    { name: 'Bảo dưỡng định kỳ', quantity: 1, price: 350000 },
                    { name: 'Thay dầu số', quantity: 1, price: 120000 }
                ],
                totalAmount: 470000,
                note: 'Khách đã thanh toán qua chuyển khoản'
            },
            {
                orderId: 'ORD-2023-005',
                customerName: 'Hoàng Văn E',
                customerPhone: '0918765432',
                createdDate: '2023-06-19',
                createdTime: '15:20',
                technicianName: 'Kỹ thuật viên 4',
                status: 'Chờ thanh toán',
                items: [
                    { name: 'Thay nhông sên dĩa', quantity: 1, price: 520000 },
                    { name: 'Vệ sinh hệ thống nhiên liệu', quantity: 1, price: 280000 }
                ],
                totalAmount: 800000,
                note: 'Khách hẹn thanh toán khi nhận xe'
            },
            {
                orderId: 'ORD-2023-006',
                customerName: 'Vũ Thị F',
                customerPhone: '0919123456',
                createdDate: '2023-06-20',
                createdTime: '11:00',
                technicianName: 'Kỹ thuật viên 2',
                status: 'Đã hủy',
                items: [
                    { name: 'Sửa chữa hệ thống điện', quantity: 1, price: 320000 }
                ],
                totalAmount: 320000,
                note: 'Khách hủy đơn vì có việc gấp'
            },
            {
                orderId: 'ORD-2023-007',
                customerName: 'Đặng Văn G',
                customerPhone: '0909765432',
                createdDate: '2023-06-21',
                createdTime: '14:15',
                technicianName: 'Kỹ thuật viên 3',
                status: 'Đang xử lý',
                items: [
                    { name: 'Sửa phanh xe', quantity: 2, price: 260000 },
                    { name: 'Thay dây phanh', quantity: 2, price: 180000 }
                ],
                totalAmount: 440000,
                note: 'Cần kiểm tra kỹ hệ thống phanh'
            }
        ];
        
        setOrders(mockOrders);
        setFilteredOrders(mockOrders);
        setTotalPages(Math.ceil(mockOrders.length / 10));
        setLoading(false);

        // TODO: Fetch dữ liệu từ API
        const fetchData = async () => { 
            
        }

        fetchData();
    }, []);
    
    // Xử lý filter
    const handleApplyFilter = () => {
        let filtered = [...orders];
        
        // Filter by search term
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(order => 
                order.orderId.toLowerCase().includes(searchTerm) ||
                order.customerName.toLowerCase().includes(searchTerm) ||
                order.customerPhone.includes(searchTerm) ||
                order.technicianName.toLowerCase().includes(searchTerm)
            );
        }
        
        // Filter by status
        if (filters.status) {
            filtered = filtered.filter(order => order.status === filters.status);
        }
        
        // Filter by date range
        if (filters.startDate) {
            filtered = filtered.filter(order => order.createdDate >= filters.startDate);
        }
        
        if (filters.endDate) {
            filtered = filtered.filter(order => order.createdDate <= filters.endDate);
        }
        
        setFilteredOrders(filtered);
        setTotalPages(Math.ceil(filtered.length / 10));
        setCurrentPage(1);
    };
    
    // Xử lý reset filter
    const handleResetFilter = () => {
        setFilters({
            search: '',
            status: '',
            startDate: '',
            endDate: '',
        });
        setFilteredOrders(orders);
        setTotalPages(Math.ceil(orders.length / 10));
        setCurrentPage(1);
    };
    
    // Xử lý thay đổi filter
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    // Phân trang
    const getCurrentItems = () => {
        const indexOfLastItem = currentPage * 10;
        const indexOfFirstItem = indexOfLastItem - 10;
        return filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
    };
    
    // Xử lý modal xem chi tiết
    const handleShowDetailModal = (order) => {
        setCurrentOrder(order);
        setShowDetailModal(true);
    };
    
    // Xử lý modal chỉnh sửa
    const handleShowEditModal = (order) => {
        setCurrentOrder(order);
        setFormData({
            status: order.status,
            note: order.note,
        });
        setValidated(false);
        setShowEditModal(true);
    };
    
    // Xử lý thay đổi form
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    // Xử lý submit form chỉnh sửa
    const handleEditSubmit = (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        
        if (form.checkValidity() === false) {
            e.stopPropagation();
            setValidated(true);
            return;
        }
        
        // Update order in state
        const updatedOrders = orders.map(order => {
            if (order.orderId === currentOrder.orderId) {
                return {
                    ...order,
                    status: formData.status,
                    note: formData.note,
                };
            }
            return order;
        });
        
        setOrders(updatedOrders);
        setFilteredOrders(updatedOrders);
        setShowEditModal(false);
    };
    
    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };
    
    // Xử lý thay đổi trang
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };
    
    // Pagination component
    const renderPagination = () => {
        if (totalPages <= 1) return null;
        
        let items = [];
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        
        if (startPage > 1) {
            items.push(
                <Pagination.First key="first" onClick={() => handlePageChange(1)} />,
                <Pagination.Prev key="prev" onClick={() => handlePageChange(currentPage - 1)} />
            );
        }
        
        for (let page = startPage; page <= endPage; page++) {
            items.push(
                <Pagination.Item
                    key={page}
                    active={page === currentPage}
                    onClick={() => handlePageChange(page)}
                >
                    {page}
                </Pagination.Item>
            );
        }
        
        if (endPage < totalPages) {
            items.push(
                <Pagination.Next key="next" onClick={() => handlePageChange(currentPage + 1)} />,
                <Pagination.Last key="last" onClick={() => handlePageChange(totalPages)} />
            );
        }
        
        return (
            <Pagination className="justify-content-center mt-4">
                {items}
            </Pagination>
        );
    };

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0">Quản lý đơn hàng</h5>
                <Button
                    as={Link}
                    to="/admin/orders/create"
                    style={{ backgroundColor: '#d30000', borderColor: '#d30000' }}
                >
                    <i className="bi bi-plus-circle me-1"></i>
                    Tạo đơn hàng mới
                </Button>
            </div>

            {/* Filter Section */}
            <Card className="shadow-sm mb-4">
                <Card.Body>
                    <Row className="g-3">
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Tìm kiếm</Form.Label>
                                <InputGroup>
                                    <Form.Control
                                        placeholder="Tìm kiếm theo mã đơn, tên khách, SĐT..."
                                        name="search"
                                        value={filters.search}
                                        onChange={handleFilterChange}
                                    />
                                    <Button variant="outline-secondary">
                                        <i className="bi bi-search"></i>
                                    </Button>
                                </InputGroup>
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group>
                                <Form.Label>Trạng thái</Form.Label>
                                <Form.Select
                                    name="status"
                                    value={filters.status}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">Tất cả</option>
                                    <option value="Đang xử lý">Đang xử lý</option>
                                    <option value="Chờ thanh toán">Chờ thanh toán</option>
                                    <option value="Hoàn thành">Hoàn thành</option>
                                    <option value="Đã hủy">Đã hủy</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Từ ngày</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="startDate"
                                    value={filters.startDate}
                                    onChange={handleFilterChange}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Đến ngày</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="endDate"
                                    value={filters.endDate}
                                    onChange={handleFilterChange}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <div className="d-flex justify-content-end mt-3">
                        <Button
                            variant="outline-secondary"
                            className="me-2"
                            onClick={handleResetFilter}
                        >
                            <i className="bi bi-x-circle me-1"></i> Xóa bộ lọc
                        </Button>
                        <Button
                            variant="primary"
                            style={{ backgroundColor: '#d30000', borderColor: '#d30000' }}
                            onClick={handleApplyFilter}
                        >
                            <i className="bi bi-filter me-1"></i> Lọc
                        </Button>
                    </div>
                </Card.Body>
            </Card>

            {/* Table Section */}
            <Card className="shadow-sm mb-4">
                <Card.Body className="p-0">
                    <div className="table-responsive">
                        <Table hover className="mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Mã đơn</th>
                                    <th>Khách hàng</th>
                                    <th>Kỹ thuật viên</th>
                                    <th>Ngày tạo</th>
                                    <th>Trạng thái</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-4">
                                            <div className="spinner-border text-primary" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                            <p className="mt-2 text-muted">Đang tải dữ liệu...</p>
                                        </td>
                                    </tr>
                                ) : (
                                    getCurrentItems().map(order => (
                                        <tr key={order.orderId}>
                                            <td>{order.orderId}</td>
                                            <td>
                                                <div className="fw-semibold">{order.customerName}</div>
                                                <small className="text-muted">{order.customerPhone}</small>
                                            </td>
                                            <td>{order.technicianName}</td>
                                            <td>
                                                <div>{order.createdDate}</div>
                                                <small className="text-muted">{order.createdTime}</small>
                                            </td>
                                            <td>
                                                <StatusBadge status={order.status} />
                                            </td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        className="btn-icon"
                                                        onClick={() => handleShowDetailModal(order)}
                                                        title="Xem chi tiết"
                                                    >
                                                        <i className="bi bi-eye"></i>
                                                    </Button>
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        className="btn-edit"
                                                        onClick={() => handleShowEditModal(order)}
                                                        style={{ borderColor: '#d30000', color: '#d30000' }}
                                                        title="Chỉnh sửa"
                                                    >
                                                        <i className="bi bi-pencil"></i>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}

                                {!loading && filteredOrders.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="text-center py-4">
                                            <div className="text-muted">
                                                <i className="bi bi-inbox fs-4 d-block mb-2"></i>
                                                Không tìm thấy đơn hàng nào
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            {renderPagination()}

            {/* Modal xem chi tiết */}
            <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Chi tiết đơn hàng</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {currentOrder && (
                        <div>
                            <Row className="mb-4">
                                <Col md={6}>
                                    <h6 className="text-muted mb-3">Thông tin chung</h6>
                                    <p><strong>Mã đơn:</strong> {currentOrder.orderId}</p>
                                    <p><strong>Ngày tạo:</strong> {`${currentOrder.createdDate} ${currentOrder.createdTime}`}</p>
                                    <p>
                                        <strong>Trạng thái:</strong> <StatusBadge status={currentOrder.status} />
                                    </p>
                                </Col>
                                <Col md={6}>
                                    <h6 className="text-muted mb-3">Thông tin khách hàng</h6>
                                    <p><strong>Họ tên:</strong> {currentOrder.customerName}</p>
                                    <p><strong>Số điện thoại:</strong> {currentOrder.customerPhone}</p>
                                    <p><strong>Kỹ thuật viên:</strong> {currentOrder.technicianName}</p>
                                </Col>
                            </Row>

                            <h6 className="text-muted mb-3">Chi tiết dịch vụ/sản phẩm</h6>
                            <div className="table-responsive mb-4">
                                <Table bordered hover>
                                    <thead className="table-light">
                                        <tr>
                                            <th>#</th>
                                            <th>Tên dịch vụ/sản phẩm</th>
                                            <th className="text-center">Số lượng</th>
                                            <th className="text-end">Đơn giá</th>
                                            <th className="text-end">Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentOrder.items.map((item, index) => (
                                            <tr key={index}>
                                                <td>{index + 1}</td>
                                                <td>{item.name}</td>
                                                <td className="text-center">{item.quantity}</td>
                                                <td className="text-end">{formatCurrency(item.price)}</td>
                                                <td className="text-end">{formatCurrency(item.price * item.quantity)}</td>
                                            </tr>
                                        ))}
                                        <tr className="table-light">
                                            <td colSpan="4" className="text-end fw-bold">Tổng cộng:</td>
                                            <td className="text-end fw-bold">{formatCurrency(currentOrder.totalAmount)}</td>
                                        </tr>
                                    </tbody>
                                </Table>
                            </div>

                            <div className="p-3 bg-light rounded">
                                <h6>Ghi chú:</h6>
                                <p className="mb-0">{currentOrder.note || "Không có ghi chú"}</p>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
                        Đóng
                    </Button>
                    <Button
                        variant="primary"
                        style={{ backgroundColor: '#d30000', borderColor: '#d30000' }}
                        onClick={() => {
                            setShowDetailModal(false);
                            handleShowEditModal(currentOrder);
                        }}
                    >
                        Chỉnh sửa
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal chỉnh sửa */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
                <Form noValidate validated={validated} onSubmit={handleEditSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>Cập nhật đơn hàng</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {currentOrder && (
                            <>
                                <div className="mb-3">
                                    <p className="mb-1"><strong>Mã đơn:</strong> {currentOrder.orderId}</p>
                                    <p className="mb-1"><strong>Khách hàng:</strong> {currentOrder.customerName}</p>
                                    <p className="mb-0"><strong>Tổng tiền:</strong> {formatCurrency(currentOrder.totalAmount)}</p>
                                </div>

                                <Form.Group className="mb-3">
                                    <Form.Label>Trạng thái</Form.Label>
                                    <Form.Select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleFormChange}
                                        required
                                    >
                                        <option value="Đang xử lý">Đang xử lý</option>
                                        <option value="Chờ thanh toán">Chờ thanh toán</option>
                                        <option value="Hoàn thành">Hoàn thành</option>
                                        <option value="Đã hủy">Đã hủy</option>
                                    </Form.Select>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Ghi chú</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        name="note"
                                        value={formData.note}
                                        onChange={handleFormChange}
                                    />
                                </Form.Group>
                            </>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            style={{ backgroundColor: '#d30000', borderColor: '#d30000' }}
                        >
                            Lưu thay đổi
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    );
};

export default OrderManagement;
