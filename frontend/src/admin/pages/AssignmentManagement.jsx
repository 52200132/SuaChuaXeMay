import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Row, Col, InputGroup, Badge, Tabs, Tab, Dropdown } from 'react-bootstrap';
import './AssignmentManagement.css';

// Import Chart.js components for visualizations
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';

// Register Chart.js components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AssignmentManagement = ({ 
    pendingOrders = [],
    assignedOrders = [],
    technicians = [],
    dashboardStats = {
        pending: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0
    },
    onAssignOrder,
    onUnassignOrder,
    loading = false
}) => {
    // Local state
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [currentOrder, setCurrentOrder] = useState(null);
    const [selectedTechnician, setSelectedTechnician] = useState('');
    const [assignmentNote, setAssignmentNote] = useState('');
    const [startTime, setStartTime] = useState('');
    const [estimatedEndTime, setEstimatedEndTime] = useState('');
    const [validated, setValidated] = useState(false);
    
    // Remove filter state

    // Technician search state
    const [technicianSearch, setTechnicianSearch] = useState('');
    const [filteredTechnicians, setFilteredTechnicians] = useState([]);
    
    // State for showing technician workload details
    const [showWorkloadModal, setShowWorkloadModal] = useState(false);
    const [selectedTechnicianDetail, setSelectedTechnicianDetail] = useState(null);
    
    // State for technician performance metrics
    const [technicianPerformance, setTechnicianPerformance] = useState([]);
    
    // Calculate technician performance and filter technicians when data changes
    useEffect(() => {
        calculateTechnicianPerformance();
        setFilteredTechnicians(technicians);
    }, [technicians, assignedOrders]);
    
    // Filter technicians when search changes
    useEffect(() => {
        if (technicianSearch.trim() === '') {
            setFilteredTechnicians(technicians);
        } else {
            const searchTerm = technicianSearch.toLowerCase();
            const filtered = technicians.filter(tech => 
                tech.fullname?.toLowerCase().includes(searchTerm) || 
                tech.expertise?.toLowerCase().includes(searchTerm) ||
                tech.phone?.includes(searchTerm)
            );
            setFilteredTechnicians(filtered);
        }
    }, [technicianSearch, technicians]);
    
    // Calculate technician performance
    const calculateTechnicianPerformance = () => {
        const performance = technicians.map(tech => {
            // Filter completed orders by this technician
            const completedOrders = assignedOrders.filter(order => 
                order.technicianId === tech.staff_id && 
                ['Chờ giao xe', 'Đã giao xe'].includes(order.status)
            );
            
            // Filter in-progress orders by this technician
            const inProgressOrders = assignedOrders.filter(order => 
                order.technicianId === tech.staff_id && 
                ['Đang sửa chữa'].includes(order.status)
            );
            
            // Calculate average completion time (mock data)
            const avgCompletionTime = completedOrders.length > 0 ? 
                Math.floor(Math.random() * 120) + 30 : 0; // 30-150 minutes, mock data
            
            return {
                id: tech.staff_id,
                name: tech.fullname,
                completedCount: completedOrders.length,
                inProgressCount: inProgressOrders.length,
                avgCompletionTime: avgCompletionTime,
                efficiency: Math.min(100, Math.max(50, Math.floor(Math.random() * 50) + 50)) // 50-100%, mock data
            };
        });
        
        setTechnicianPerformance(performance);
    };
    
    // Show technician assignment modal
    const handleShowAssignModal = (order) => {
        setCurrentOrder(order);
        setSelectedTechnician(order.technicianId || '');
        setAssignmentNote('');
        setStartTime('');
        setEstimatedEndTime('');
        setValidated(false);
        setShowAssignModal(true);
    };
    
    // Handle assignment form submission
    const handleAssignOrder = async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        
        if (form.checkValidity() === false) {
            e.stopPropagation();
            setValidated(true);
            return;
        }
        
        try {
            // If assignment is successful
            if (onAssignOrder) {
                await onAssignOrder(
                    currentOrder.orderId,
                    selectedTechnician,
                    assignmentNote,
                    startTime || '08:00',
                    estimatedEndTime || '10:00'
                );
            }
            
            // Close modal
            setShowAssignModal(false);
            
        } catch (error) {
            console.error('Lỗi khi phân công đơn hàng:', error);
            alert('Có lỗi xảy ra khi phân công đơn hàng. Vui lòng thử lại!');
        }
    };
    
    // Handle unassign order
    const handleUnassignOrder = (order) => {
        // Confirm before unassigning
        if (!window.confirm(`Bạn có chắc muốn hủy phân công đơn hàng ${order.orderId}?`)) {
            return;
        }
        
        if (onUnassignOrder) {
            onUnassignOrder(order.orderId);
        }
    };
    
    // Show technician workload details
    const showTechnicianWorkload = (techId) => {
        const technician = technicians.find(tech => tech.staff_id === techId);
        const techOrders = assignedOrders.filter(order => order.technicianId === techId);
        
        if (technician) {
            setSelectedTechnicianDetail({
                ...technician,
                orders: techOrders
            });
            setShowWorkloadModal(true);
        }
    };
    
    // Remove handleFilterChange function
    
    // Remove applyFilters function
    
    // Render technician schedule
    const renderTechnicianSchedule = () => {
        if (!selectedTechnicianDetail) return null;
        
        return (
            <div className="technician-schedule">
                <h6 className="mb-3">Lịch làm việc hôm nay</h6>
                <div className="timeline">
                    {selectedTechnicianDetail.orders.length > 0 ? (
                        selectedTechnicianDetail.orders.map((order) => (
                            <div key={order.orderId} className="timeline-item">
                                <div className="time-block">
                                    <span className="start-time">{order.startTime}</span>
                                    <span className="end-time">{order.estimatedEndTime}</span>
                                </div>
                                <div className="order-info">
                                    <h6>{order.orderId}</h6>
                                    <p className="mb-1">Xe: {order.motorcycleInfo?.model || ''} - {order.motorcycleInfo?.plate || ''}</p>
                                    <p className="mb-0">
                                        <Badge bg={
                                            order.status === 'Đang sửa chữa' ? 'info' :
                                            order.status === 'Chờ giao xe' ? 'warning' : 'success'
                                        }>
                                            {order.status}
                                        </Badge>
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-muted">Không có công việc nào được phân công cho hôm nay</p>
                    )}
                </div>
            </div>
        );
    };
    
    // Render dashboard overview with stats and charts
    const renderDashboardOverview = () => {
        // Prepare data for work distribution chart
        const workDistributionData = {
            labels: technicians.map(tech => tech.fullname),
            datasets: [
                {
                    label: 'Số đơn hàng đang thực hiện',
                    data: technicians.map(tech => 
                        assignedOrders.filter(order => order.technicianId === tech.staff_id).length
                    ),
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                }
            ]
        };
        
        // Prepare data for order status chart
        const orderStatusData = {
            labels: ['Chờ xử lý', 'Đang sửa chữa', 'Hoàn thành', 'Đã hủy'],
            datasets: [
                {
                    data: [
                        dashboardStats.pending,
                        dashboardStats.inProgress,
                        dashboardStats.completed,
                        dashboardStats.cancelled
                    ],
                    backgroundColor: [
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(255, 99, 132, 0.6)'
                    ],
                    borderColor: [
                        'rgba(255, 206, 86, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(255, 99, 132, 1)'
                    ],
                    borderWidth: 1,
                }
            ]
        };
        
        return { workDistributionData, orderStatusData };
    };
    
    const { workDistributionData, orderStatusData } = renderDashboardOverview();

    // Render orders tabs
    const renderOrdersTabs = () => {
        return (
            <div className="orders-tabs-container">
                <Tabs defaultActiveKey="pending" className="mb-0 nav-tabs-custom">
                    <Tab eventKey="pending" title={<><i className="bi bi-hourglass me-1"></i>Đơn chờ phân công ({pendingOrders.length})</>}>
                        <Card className="shadow-sm orders-list-card">
                            <Card.Body className="p-0 orders-list-container">
                                <div className="table-responsive">
                                    <Table hover className="mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Mã đơn</th>
                                                <th>Khách hàng</th>
                                                <th>Thông tin xe</th>
                                                <th>Ngày tạo</th>
                                                <th>Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loading ? (
                                                <tr>
                                                    <td colSpan="5" className="text-center py-4">
                                                        <div className="spinner-border text-primary" role="status">
                                                            <span className="visually-hidden">Đang tải...</span>
                                                        </div>
                                                        <p className="mt-2 text-muted">Đang tải dữ liệu...</p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                pendingOrders.map(order => (
                                                    <tr key={order.orderId}>
                                                        <td>{order.orderId}</td>
                                                        <td>
                                                            <div className="fw-semibold">{order.customerName}</div>
                                                            <small className="text-muted">{order.customerPhone}</small>
                                                        </td>
                                                        <td>
                                                            <div>{order.motorcycleInfo?.model || ''}</div>
                                                            <small className="text-muted">{order.motorcycleInfo?.plate || ''}</small>
                                                        </td>
                                                        <td>
                                                            <div>{order.createdDate}</div>
                                                            <small className="text-muted">{order.createdTime}</small>
                                                        </td>
                                                        <td>
                                                            <Button
                                                                variant="outline-primary"
                                                                size="sm"
                                                                onClick={() => handleShowAssignModal(order)}
                                                                className="btn-assign"
                                                            >
                                                                <i className="bi bi-person-check me-1"></i>
                                                                Phân công
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}

                                            {!loading && pendingOrders.length === 0 && (
                                                <tr>
                                                    <td colSpan="5" className="text-center py-4">
                                                        <div className="text-muted">
                                                            <i className="bi bi-inbox fs-4 d-block mb-2"></i>
                                                            Không có đơn hàng nào chờ phân công
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </div>
                            </Card.Body>
                        </Card>
                    </Tab>
                    
                    <Tab eventKey="assigned" title={<><i className="bi bi-check2-all me-1"></i>Đơn đã phân công ({assignedOrders.length})</>}>
                        <Card className="shadow-sm orders-list-card">
                            <Card.Body className="p-0 orders-list-container">
                                <div className="table-responsive">
                                    <Table hover className="mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Mã đơn</th>
                                                <th>Khách hàng</th>
                                                <th>Thông tin xe</th>
                                                <th>Thợ phụ trách</th>
                                                <th>Trạng thái</th>
                                                <th>Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loading ? (
                                                <tr>
                                                    <td colSpan="6" className="text-center py-4">
                                                        <div className="spinner-border text-primary" role="status">
                                                            <span className="visually-hidden">Đang tải...</span>
                                                        </div>
                                                        <p className="mt-2 text-muted">Đang tải dữ liệu...</p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                assignedOrders.map(order => (
                                                    <tr key={order.orderId}>
                                                        <td>{order.orderId}</td>
                                                        <td>
                                                            <div className="fw-semibold">{order.customerName}</div>
                                                            <small className="text-muted">{order.customerPhone}</small>
                                                        </td>
                                                        <td>
                                                            <div>{order.motorcycleInfo?.model || ''}</div>
                                                            <small className="text-muted">{order.motorcycleInfo?.plate || ''}</small>
                                                        </td>
                                                        <td>{order.technicianName}</td>
                                                        <td>
                                                            <Badge bg={
                                                                order.status === 'Đang sửa chữa' ? 'info' :
                                                                order.status === 'Chờ giao xe' ? 'warning' : 'primary'
                                                            }>
                                                                {order.status}
                                                            </Badge>
                                                        </td>
                                                        <td>
                                                            <div className="d-flex gap-2">
                                                                <Dropdown>
                                                                    <Dropdown.Toggle variant="outline-secondary" size="sm" id={`dropdown-${order.orderId}`}>
                                                                        <i className="bi bi-three-dots"></i>
                                                                    </Dropdown.Toggle>
                                                                    <Dropdown.Menu>
                                                                        <Dropdown.Item onClick={() => handleShowAssignModal(order)}>
                                                                            <i className="bi bi-arrow-repeat me-2"></i>
                                                                            Phân công lại
                                                                        </Dropdown.Item>
                                                                        <Dropdown.Item onClick={() => handleUnassignOrder(order)}>
                                                                            <i className="bi bi-x-circle me-2"></i>
                                                                            Hủy phân công
                                                                        </Dropdown.Item>
                                                                        <Dropdown.Divider />
                                                                        <Dropdown.Item>
                                                                            <i className="bi bi-check-circle me-2"></i>
                                                                            Đánh dấu hoàn thành
                                                                        </Dropdown.Item>
                                                                    </Dropdown.Menu>
                                                                </Dropdown>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}

                                            {!loading && assignedOrders.length === 0 && (
                                                <tr>
                                                    <td colSpan="6" className="text-center py-4">
                                                        <div className="text-muted">
                                                            <i className="bi bi-inbox fs-4 d-block mb-2"></i>
                                                            Không có đơn hàng nào đã phân công
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </div>
                            </Card.Body>
                        </Card>
                    </Tab>
                </Tabs>
            </div>
        );
    };

    // Render technicians as cards
    const renderTechnicianCards = () => {
        return (
            <Card className="shadow-sm mb-4 technician-list-card">
                <Card.Header className="bg-light">
                    <h6 className="mb-0 text-center">Danh sách thợ sửa chữa</h6>
                </Card.Header>
                <div className="p-3 border-bottom">
                    <InputGroup>
                        <Form.Control
                            placeholder="Tìm thợ theo tên, số điện thoại..."
                            value={technicianSearch}
                            onChange={(e) => setTechnicianSearch(e.target.value)}
                        />
                        <Button variant="outline-secondary">
                            <i className="bi bi-search"></i>
                        </Button>
                    </InputGroup>
                </div>
                <Card.Body className="technician-cards-container">
                    {loading ? (
                        <div className="text-center py-4">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Đang tải...</span>
                            </div>
                            <p className="mt-2 text-muted">Đang tải dữ liệu...</p>
                        </div>
                    ) : (
                        <Row xs={1} className="g-3">
                            {filteredTechnicians.map(tech => {
                                const assignedCount = assignedOrders.filter(order => order.technicianId === tech.staff_id).length;
                                const availability = Math.max(0, 100 - (assignedCount * 20));
                                const status = availability > 70 ? 'available' : (availability > 30 ? 'busy' : 'overloaded');
                                
                                return (
                                    <Col key={tech.staff_id}>
                                        <Card 
                                            className="technician-card h-100" 
                                            onClick={() => showTechnicianWorkload(tech.staff_id)}
                                            style={{cursor: 'pointer'}}
                                        >
                                            <Card.Body>
                                                <div className="d-flex align-items-center mb-2">
                                                    <div className="technician-avatar me-2">
                                                        <i className="bi bi-person-circle fs-3"></i>
                                                    </div>
                                                    <div>
                                                        <h6 className="mb-0">{tech.fullname}</h6>
                                                        <small className="text-muted">{tech.expertise || 'Tổng hợp'}</small>
                                                    </div>
                                                </div>
                                                <p className="mb-2 small">
                                                    <i className="bi bi-telephone me-1"></i>
                                                    {tech.phone}
                                                </p>
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <Badge bg={
                                                        status === 'available' ? 'success' :
                                                        status === 'busy' ? 'warning' : 'danger'
                                                    }>
                                                        {status === 'available' ? 'Sẵn sàng' :
                                                         status === 'busy' ? 'Bận' : 'Quá tải'}
                                                        ({assignedCount} đơn)
                                                    </Badge>
                                                    <Button 
                                                        variant="outline-primary" 
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            showTechnicianWorkload(tech.staff_id);
                                                        }}
                                                    >
                                                        <i className="bi bi-calendar-check me-1"></i>
                                                        Lịch
                                                    </Button>
                                                </div>
                                                <div className="mt-2">
                                                    <div className="progress" style={{ height: '6px' }}>
                                                        <div 
                                                            className={`progress-bar ${availability > 70 ? 'bg-success' : (availability > 30 ? 'bg-warning' : 'bg-danger')}`}
                                                            role="progressbar" 
                                                            style={{ width: `${availability}%` }} 
                                                            aria-valuenow={availability} 
                                                            aria-valuemin="0" 
                                                            aria-valuemax="100"
                                                        />
                                                    </div>
                                                    <small className="text-muted">{availability}% khả dụng</small>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                );
                            })}
                            
                            {filteredTechnicians.length === 0 && (
                                <Col xs={12}>
                                    <div className="text-center py-4">
                                        <i className="bi bi-search fs-4 d-block mb-2 text-muted"></i>
                                        <p className="text-muted">Không tìm thấy thợ sửa chữa nào</p>
                                    </div>
                                </Col>
                            )}
                        </Row>
                    )}
                </Card.Body>
            </Card>
        );
    };

    return (
        <>
            {/* Thẻ thống kê - đưa lên đầu trang */}
            <Row className="mb-4">
                <Col md={3}>
                    <Card className="shadow-sm dashboard-card">
                        <Card.Body>
                            <div className="stat-item">
                                <div className="stat-icon bg-warning-subtle">
                                    <i className="bi bi-hourglass-split text-warning"></i>
                                </div>
                                <div className="stat-details">
                                    <h3>{dashboardStats.pending}</h3>
                                    <p>Chờ xử lý</p>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="shadow-sm dashboard-card">
                        <Card.Body>
                            <div className="stat-item">
                                <div className="stat-icon bg-info-subtle">
                                    <i className="bi bi-tools text-info"></i>
                                </div>
                                <div className="stat-details">
                                    <h3>{dashboardStats.inProgress}</h3>
                                    <p>Đang sửa chữa</p>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="shadow-sm dashboard-card">
                        <Card.Body>
                            <div className="stat-item">
                                <div className="stat-icon bg-success-subtle">
                                    <i className="bi bi-check-circle text-success"></i>
                                </div>
                                <div className="stat-details">
                                    <h3>{dashboardStats.completed}</h3>
                                    <p>Hoàn thành</p>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="shadow-sm dashboard-card">
                        <Card.Body>
                            <div className="stat-item">
                                <div className="stat-icon bg-danger-subtle">
                                    <i className="bi bi-x-circle text-danger"></i>
                                </div>
                                <div className="stat-details">
                                    <h3>{dashboardStats.cancelled}</h3>
                                    <p>Đã hủy</p>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Danh sách đơn hàng và thợ sửa chữa */}
            <Row>
                {/* Orders on the left */}
                <Col lg={8}>
                    {renderOrdersTabs()}
                </Col>
                
                {/* Technicians on the right */}
                <Col lg={4}>
                    {renderTechnicianCards()}
                </Col>
            </Row>
            
            {/* Đặt dashboard charts (biểu đồ) */}
            <div className="dashboard-charts-section">
                <Row className="mt-4">
                    <Col md={8}>
                        <Card className="shadow-sm">
                            <Card.Header className="bg-white">
                                <h6 className="mb-0">Phân bổ công việc giữa các thợ</h6>
                            </Card.Header>
                            <Card.Body>
                                <div style={{ height: '250px' }}>
                                    <Bar 
                                        data={workDistributionData} 
                                        options={{
                                            maintainAspectRatio: false,
                                            scales: {
                                                y: {
                                                    beginAtZero: true,
                                                    ticks: {
                                                        precision: 0
                                                    }
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="shadow-sm">
                            <Card.Header className="bg-white">
                                <h6 className="mb-0">Trạng thái đơn hàng</h6>
                            </Card.Header>
                            <Card.Body>
                                <div style={{ height: '250px' }}>
                                    <Pie 
                                        data={orderStatusData} 
                                        options={{
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: {
                                                    position: 'bottom'
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </div>
            
            {/* Modals (giữ nguyên như cũ) */}
            {/* Assignment Modal */}
            <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)}>
                <Form noValidate validated={validated} onSubmit={handleAssignOrder}>
                    <Modal.Header closeButton>
                        <Modal.Title>Phân công đơn hàng</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {currentOrder && (
                            <>
                                <div className="mb-3">
                                    <h6>Thông tin đơn hàng:</h6>
                                    <p className="mb-1"><strong>Mã đơn:</strong> {currentOrder.orderId}</p>
                                    <p className="mb-1"><strong>Xe:</strong> {currentOrder.motorcycleInfo?.model || ''} - {currentOrder.motorcycleInfo?.plate || ''}</p>
                                    <p className="mb-1"><strong>Ngày tạo:</strong> {currentOrder.createdDate} {currentOrder.createdTime}</p>
                                    <p className="mb-0"><strong>Mô tả:</strong> {currentOrder.description || 'Không có mô tả'}</p>
                                </div>
                                
                                <Form.Group className="mb-3">
                                    <Form.Label>Chọn thợ phụ trách*</Form.Label>
                                    <Form.Select
                                        required
                                        value={selectedTechnician}
                                        onChange={(e) => setSelectedTechnician(e.target.value)}
                                    >
                                        <option value="">-- Chọn thợ sửa chữa --</option>
                                        {technicians.map(tech => (
                                            <option key={tech.staff_id} value={tech.staff_id}>
                                                {tech.fullname} - {tech.expertise || 'Tổng hợp'} ({assignedOrders.filter(o => o.technicianId === tech.staff_id).length} đơn)
                                            </option>
                                        ))}
                                    </Form.Select>
                                    <Form.Control.Feedback type="invalid">
                                        Vui lòng chọn thợ phụ trách
                                    </Form.Control.Feedback>
                                </Form.Group>
                                
                                {/* <Form.Group className="mb-3">
                                    <Form.Label>Ghi chú phân công</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        value={assignmentNote}
                                        onChange={(e) => setAssignmentNote(e.target.value)}
                                        placeholder="Nhập các yêu cầu hoặc lưu ý khi phân công (nếu có)"
                                    />
                                </Form.Group> */}
                            </>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowAssignModal(false)}>
                            Hủy
                        </Button>
                        <Button type="submit" style={{ backgroundColor: '#d30000', borderColor: '#d30000' }}>
                            Xác nhận phân công
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
            
            {/* Technician Workload Detail Modal */}
            <Modal show={showWorkloadModal} onHide={() => setShowWorkloadModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Lịch làm việc của thợ</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedTechnicianDetail && (
                        <>
                            <div className="mb-4">
                                <h5>{selectedTechnicianDetail.fullname}</h5>
                                <p className="mb-1"><strong>Mã nhân viên:</strong> {selectedTechnicianDetail.staff_id}</p>
                                <p className="mb-1"><strong>Chuyên môn:</strong> {selectedTechnicianDetail.expertise || 'Tổng hợp'}</p>
                                <p className="mb-0">
                                    <strong>Trạng thái:</strong> {' '}
                                    <Badge bg={
                                        selectedTechnicianDetail.orders.length > 4 ? 'danger' :
                                        selectedTechnicianDetail.orders.length > 2 ? 'warning' : 'success'
                                    }>
                                        {selectedTechnicianDetail.orders.length > 4 ? 'Quá tải' :
                                            selectedTechnicianDetail.orders.length > 2 ? 'Bận' : 'Sẵn sàng'}
                                        ({selectedTechnicianDetail.orders.length} đơn)
                                    </Badge>
                                </p>
                            </div>
                            
                            {renderTechnicianSchedule()}
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowWorkloadModal(false)}>
                        Đóng
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default AssignmentManagement;
