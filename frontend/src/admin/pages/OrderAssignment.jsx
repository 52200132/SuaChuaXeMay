import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Row, Col, Form, Badge, Spinner } from 'react-bootstrap';
import { useAppData } from '../contexts/AppDataContext';
import { customerService, resourceService, repairService } from '../../services/api';
import StatusBadge from '../components/StatusBadge';
import CustomModal from '../components/CustomModal';
import './OrderAssignment.css';

const OrderAssignment = () => {
    const { getData, getIds, setData, loading, dataStore } = useAppData();
    const ordersById = getData('orders');
    const customersById = getData('customers');
    const motorcyclesById = getData('motorcycles');
    const diagnosisById = getData('diagnosis');
    const staffsById = getData('staffs');

    // Orders management
    const [pendingOrders, setPendingOrders] = useState([]); // Orders pending assignment
    const [assignedOrders, setAssignedOrders] = useState([]); // Orders already assigned
    const [localLoading, setLocalLoading] = useState(true);
    
    // Assignment modal states
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [orderToAssign, setOrderToAssign] = useState(null);
    const [selectedTechnician, setSelectedTechnician] = useState('');
    const [technicians, setTechnicians] = useState([]);
    const [technicianAvailability, setTechnicianAvailability] = useState({});
    
    // Dashboard stats
    const [dashboardStats, setDashboardStats] = useState({
        pending: 0,
        inProgress: 0,
        completed: 0,
        total: 0
    });

    // Status mappings
    const tableOrderStatus = {
        'received': 'Đã tiếp nhận',
        'checking': 'Đang kiểm tra',        
        'wait_confirm': 'Chờ xác nhận',    
        'repairing': 'Đang sửa chữa',       
        'wait_delivery': 'Chờ giao xe',   
        'delivered': 'Đã giao xe',
        
        'Đã tiếp nhận': 'received',
        'Đang kiểm tra': 'checking',
        'Chờ xác nhận': 'wait_confirm',
        'Đang sửa chữa': 'repairing',
        'Chờ giao xe': 'wait_delivery',
        'Đã giao xe': 'delivered'
    };

    useEffect(() => {
        loadTechnicians();
    }, []);

    useEffect(() => {
        setLocalLoading(true);
        if (loading['orders'] === true || loading['customers'] === true || 
            loading['motorcycles'] === true || loading['diagnosis'] === true || 
            loading['staffs'] === true) return;
        
        processOrders();
        calculateDashboardStats();
        setLocalLoading(false);
    }, [loading, ordersById]);

    const loadTechnicians = async () => {
        try {
            const response = await resourceService.staff.getAllTechnicians();
            const techData = response.data || [];
            setTechnicians(techData);
            calculateTechnicianAvailability(techData, []);
        } catch (error) {
            console.error("Error loading technicians:", error);
        }
    };

    const formatOrder = (order, customer, motorcycle, staff, diagnosis) => {
        const [createdAtDate, createdAtTime] = order?.created_at?.split('T') || ['', ''];
        return {
            orderId: order.order_id,
            customerName: customer?.fullname || '',
            customerPhone: customer?.phone_num || '',
            motoTypeId: motorcycle?.moto_type_id || '',
            plateNumber: motorcycle?.license_plate || '',
            motorcycleModel: `${motorcycle?.brand || ''} ${motorcycle?.model || ''}`,
            technicianId: staff?.staff_id || '',
            technicianName: staff?.fullname || 'Chưa phân công',
            status: tableOrderStatus[order.status] || '',
            totalAmount: order.total_price || '',
            createdDate: createdAtDate || '',
            createdTime: createdAtTime || '',
            diagnosis: diagnosis?.problem || '',
        };
    };

    const processOrders = () => {
        const pendingOrdersArray = [];
        const assignedOrdersArray = [];
        
        Object.values(ordersById).forEach(order => {
            const motorcycle = motorcyclesById[order.motocycle_id];
            const customer = customersById[motorcycle?.customer_id];
            const staff = staffsById[order.staff_id];
            const diagnosis = diagnosisById[order.order_id];
            
            const formattedOrder = formatOrder(order, customer, motorcycle, staff, diagnosis);
            
            if (['Đã tiếp nhận', 'Đang kiểm tra', 'Chờ xác nhận'].includes(formattedOrder.status)) {
                if (!formattedOrder.technicianId || formattedOrder.technicianId === '') {
                    pendingOrdersArray.push(formattedOrder);
                } else {
                    assignedOrdersArray.push(formattedOrder);
                }
            } else if (formattedOrder.status === 'Đang sửa chữa') {
                assignedOrdersArray.push(formattedOrder);
            }
        });
        
        setPendingOrders(pendingOrdersArray);
        setAssignedOrders(assignedOrdersArray);
        
        calculateTechnicianAvailability(technicians, assignedOrdersArray);
    };

    const calculateDashboardStats = () => {
        const orders = Object.values(ordersById);
        const stats = {
            pending: orders.filter(order => 
                ['received', 'checking', 'wait_confirm'].includes(order.status)).length,
            inProgress: orders.filter(order => 
                ['repairing'].includes(order.status)).length,
            completed: orders.filter(order => 
                ['wait_delivery', 'delivered'].includes(order.status)).length,
            total: orders.length
        };
        
        setDashboardStats(stats);
    };

    const calculateTechnicianAvailability = (techList, assignedOrdersList) => {
        const availability = {};
        
        techList.forEach(tech => {
            // Count assigned orders for this technician
            const assignedOrdersCount = assignedOrdersList.filter(
                order => String(order.technicianId) === String(tech.staff_id)
            ).length;
            
            // Calculate availability percentage (0-100%)
            let availabilityPercentage = 100;
            
            if (assignedOrdersCount > 0) {
                // Assume each technician can handle up to 5 orders at maximum efficiency
                availabilityPercentage = Math.max(0, 100 - (assignedOrdersCount * 20));
            }
            
            availability[tech.staff_id] = {
                percentage: availabilityPercentage,
                currentOrders: assignedOrdersCount,
                status: availabilityPercentage > 70 ? 'available' : (availabilityPercentage > 30 ? 'busy' : 'overloaded')
            };
        });
        
        setTechnicianAvailability(availability);
    };

    const handleShowAssignModal = (order) => {
        setOrderToAssign(order);
        setSelectedTechnician('');
        setShowAssignModal(true);
    };

    const handleAssignOrder = async () => {
        if (!orderToAssign || !selectedTechnician) return;
        
        try {
            setLocalLoading(true);
            
            // Call API to assign technician
            await repairService.order.assignOrderToStaff(
                orderToAssign.orderId, 
                parseInt(selectedTechnician)
            );
            
            // Update order status to 'repairing'
            await repairService.order.updateOrderStatus(
                orderToAssign.orderId,
                'repairing'
            );
            
            // Get updated order data
            const updatedOrderResponse = await repairService.order.getOrderById(orderToAssign.orderId);
            const updatedOrder = updatedOrderResponse.data;
            
            // Update in context
            setData('orders', updatedOrder, updatedOrder.order_id);
            
            setShowAssignModal(false);
            processOrders();
            calculateDashboardStats();
            
            alert(`Đã phân công đơn hàng #${orderToAssign.orderId} thành công!`);
        } catch (error) {
            console.error("Error assigning order:", error);
            alert('Có lỗi xảy ra khi phân công đơn hàng. Vui lòng thử lại!');
        } finally {
            setLocalLoading(false);
        }
    };

    const handleUnassignOrder = async (order) => {
        try {
            setLocalLoading(true);
            
            // Call API to unassign technician and reset status
            await repairService.order.unassignStaff(order.orderId);
            await repairService.order.updateOrderStatus(order.orderId, 'received');
            
            // Get updated order data
            const updatedOrderResponse = await repairService.order.getOrderById(order.orderId);
            const updatedOrder = updatedOrderResponse.data;
            
            // Update in context
            setData('orders', updatedOrder, updatedOrder.order_id);
            
            processOrders();
            calculateDashboardStats();
            
            alert(`Đã hủy phân công đơn hàng #${order.orderId} thành công!`);
        } catch (error) {
            console.error("Error unassigning order:", error);
            alert('Có lỗi xảy ra khi hủy phân công đơn hàng. Vui lòng thử lại!');
        } finally {
            setLocalLoading(false);
        }
    };

    const renderAvailabilityBadge = (techId) => {
        const availability = technicianAvailability[techId] || { 
            percentage: 100, 
            currentOrders: 0, 
            status: 'available' 
        };
        
        let badgeVariant = 'success';
        let statusText = 'Sẵn sàng';
        
        if (availability.status === 'busy') {
            badgeVariant = 'warning';
            statusText = 'Bận';
        } else if (availability.status === 'overloaded') {
            badgeVariant = 'danger';
            statusText = 'Quá tải';
        }
        
        return (
            <Badge bg={badgeVariant}>
                {statusText} ({availability.currentOrders} đơn)
            </Badge>
        );
    };

    return (
        <div className="assignment-management-container">
            <h5 className="page-title mb-4">Phân công đơn hàng</h5>
            
            {/* Dashboard Statistics */}
            <Row className="mb-4">
                <Col md={3}>
                    <Card className="dashboard-card shadow-sm">
                        <Card.Body>
                            <div className="stat-item">
                                <div className="stat-icon bg-primary bg-opacity-10 text-primary">
                                    <i className="bi bi-clipboard-check"></i>
                                </div>
                                <div className="stat-details">
                                    <h3>{dashboardStats.total}</h3>
                                    <p>Tổng số đơn hàng</p>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="dashboard-card shadow-sm">
                        <Card.Body>
                            <div className="stat-item">
                                <div className="stat-icon bg-warning bg-opacity-10 text-warning">
                                    <i className="bi bi-hourglass-split"></i>
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
                    <Card className="dashboard-card shadow-sm">
                        <Card.Body>
                            <div className="stat-item">
                                <div className="stat-icon bg-info bg-opacity-10 text-info">
                                    <i className="bi bi-tools"></i>
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
                    <Card className="dashboard-card shadow-sm">
                        <Card.Body>
                            <div className="stat-item">
                                <div className="stat-icon bg-success bg-opacity-10 text-success">
                                    <i className="bi bi-check-circle"></i>
                                </div>
                                <div className="stat-details">
                                    <h3>{dashboardStats.completed}</h3>
                                    <p>Hoàn thành</p>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row>
                {/* Pending Orders */}
                <Col md={6}>
                    <Card className="shadow-sm mb-4">
                        <Card.Header className="bg-white py-3">
                            <h6 className="mb-0">Đơn hàng chờ phân công ({pendingOrders.length})</h6>
                        </Card.Header>
                        <Card.Body className="p-0">
                            {localLoading ? (
                                <div className="text-center py-5">
                                    <Spinner animation="border" variant="primary" />
                                    <p className="mt-2">Đang tải dữ liệu...</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <Table hover className="mb-0 align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Mã đơn</th>
                                                <th>Khách hàng</th>
                                                <th>Xe</th>
                                                <th>Trạng thái</th>
                                                <th>Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pendingOrders.length > 0 ? (
                                                pendingOrders.map(order => (
                                                    <tr key={order.orderId}>
                                                        <td>#{order.orderId}</td>
                                                        <td>
                                                            <div className="fw-medium">{order.customerName}</div>
                                                            <small className="text-muted">{order.customerPhone}</small>
                                                        </td>
                                                        <td>
                                                            <div>{order.motorcycleModel}</div>
                                                            <small className="text-muted">{order.plateNumber}</small>
                                                        </td>
                                                        <td>
                                                            <StatusBadge status={order.status} />
                                                        </td>
                                                        <td>
                                                            <Button 
                                                                size="sm" 
                                                                variant="primary"
                                                                onClick={() => handleShowAssignModal(order)}
                                                                className="btn-assign"
                                                                style={{ backgroundColor: '#d30000', borderColor: '#d30000' }}
                                                            >
                                                                <i className="bi bi-person-check me-1"></i> Phân công
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="5" className="text-center py-4">
                                                        <p className="text-muted mb-0">Không có đơn hàng nào chờ phân công</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                {/* Assigned Orders */}
                <Col md={6}>
                    <Card className="shadow-sm mb-4">
                        <Card.Header className="bg-white py-3">
                            <h6 className="mb-0">Đơn hàng đã phân công ({assignedOrders.length})</h6>
                        </Card.Header>
                        <Card.Body className="p-0">
                            {localLoading ? (
                                <div className="text-center py-5">
                                    <Spinner animation="border" variant="primary" />
                                    <p className="mt-2">Đang tải dữ liệu...</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <Table hover className="mb-0 align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Mã đơn</th>
                                                <th>Kỹ thuật viên</th>
                                                <th>Xe</th>
                                                <th>Trạng thái</th>
                                                <th>Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {assignedOrders.length > 0 ? (
                                                assignedOrders.map(order => (
                                                    <tr key={order.orderId}>
                                                        <td>#{order.orderId}</td>
                                                        <td>
                                                            <div className="fw-medium">{order.technicianName}</div>
                                                            {order.technicianId && (
                                                                <div className="mt-1">
                                                                    {renderAvailabilityBadge(order.technicianId)}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <div>{order.motorcycleModel}</div>
                                                            <small className="text-muted">{order.plateNumber}</small>
                                                        </td>
                                                        <td>
                                                            <StatusBadge status={order.status} />
                                                        </td>
                                                        <td>
                                                            <Button 
                                                                size="sm" 
                                                                variant="outline-danger"
                                                                onClick={() => handleUnassignOrder(order)}
                                                            >
                                                                <i className="bi bi-x-circle me-1"></i> Hủy
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="5" className="text-center py-4">
                                                        <p className="text-muted mb-0">Không có đơn hàng nào đã phân công</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Assignment Modal */}
            <CustomModal
                show={showAssignModal}
                onHide={() => setShowAssignModal(false)}
                title="Phân công kỹ thuật viên"
                size="lg"
                message={
                    <>
                        {orderToAssign && (
                            <div className="mb-4">
                                <h6>Thông tin đơn hàng</h6>
                                <div className="p-3 bg-light rounded">
                                    <Row>
                                        <Col md={6}>
                                            <p className="mb-1"><strong>Mã đơn:</strong> #{orderToAssign.orderId}</p>
                                            <p className="mb-1"><strong>Khách hàng:</strong> {orderToAssign.customerName}</p>
                                            <p className="mb-0"><strong>SĐT:</strong> {orderToAssign.customerPhone}</p>
                                        </Col>
                                        <Col md={6}>
                                            <p className="mb-1"><strong>Xe:</strong> {orderToAssign.motorcycleModel}</p>
                                            <p className="mb-1"><strong>Biển số:</strong> {orderToAssign.plateNumber}</p>
                                            <p className="mb-0"><strong>Trạng thái:</strong> <StatusBadge status={orderToAssign.status} /></p>
                                        </Col>
                                    </Row>
                                    {orderToAssign.diagnosis && (
                                        <div className="mt-3">
                                            <p className="mb-1"><strong>Chuẩn đoán:</strong></p>
                                            <p className="mb-0">{orderToAssign.diagnosis}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        <Form.Group>
                            <Form.Label>Chọn kỹ thuật viên</Form.Label>
                            <Form.Select 
                                value={selectedTechnician} 
                                onChange={(e) => setSelectedTechnician(e.target.value)}
                            >
                                <option value="">-- Chọn kỹ thuật viên --</option>
                                {technicians.map(tech => {
                                    const availability = technicianAvailability[tech.staff_id] || { 
                                        currentOrders: 0, 
                                        status: 'available' 
                                    };
                                    return (
                                        <option key={tech.staff_id} value={tech.staff_id}>
                                            {tech.fullname} - {tech.role || 'Kỹ thuật viên'} ({availability.currentOrders} đơn)
                                        </option>
                                    );
                                })}
                            </Form.Select>
                            
                            {selectedTechnician && (
                                <div className="mt-3">
                                    <p className="mb-2">Tình trạng công việc:</p>
                                    {renderAvailabilityBadge(selectedTechnician)}
                                </div>
                            )}
                        </Form.Group>
                    </>
                }
                confirmButtonText="Phân công"
                confirmButtonVariant="primary"
                confirmButtonStyle={{ backgroundColor: '#d30000', borderColor: '#d30000' }}
                onConfirm={handleAssignOrder}
                confirmDisabled={!selectedTechnician}
                cancelButtonText="Hủy"
            />
        </div>
    );
};

export default OrderAssignment;
