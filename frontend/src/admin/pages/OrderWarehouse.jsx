import { useState, useEffect } from 'react';
import { Card, Table, Row, Col, Button, Badge, Spinner, Form, InputGroup, Alert } from 'react-bootstrap';
import { repairService2 } from '../../services/api';
import StatusBadge from '../components/StatusBadge';
import './OrderWarehouse.css';
import { useStaffAuth } from '../contexts/StaffAuthContext';
import CustomModal from '../components/CustomModal';

const OrderWarehouse = () => {
    // State for orders
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // State for selected order
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderParts, setOrderParts] = useState([]);
    const [partsLoading, setPartsLoading] = useState(false);
    
    // State for export confirmation
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const [exportMessage, setExportMessage] = useState(null);
    
    // Get current staff information
    const { currentStaff } = useStaffAuth();

    // Fetch all orders on component mount
    useEffect(() => {
        fetchOrderViewForTable();
    }, []);

    // Filter orders when search term changes
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredOrders(orders);
            return;
        }

        const term = searchTerm.toLowerCase();
        const filtered = orders.filter(order => 
            order.order_id.toString().includes(term) ||
            order.customer.fullname.toLowerCase().includes(term) ||
            order.customer.phone_num.includes(term) ||
            order.motocycle.license_plate.toLowerCase().includes(term) ||
            `${order.motocycle.brand} ${order.motocycle.model}`.toLowerCase().includes(term)
        );
        
        setFilteredOrders(filtered);
    }, [searchTerm, orders]);

    // Fetch all orders
    const fetchOrderViewForTable = async () => {
        setLoading(true);
        try {
            const response = await repairService2.order.getOrderViewsForTable();
            if (Array.isArray(response.data)) {
                setOrders(response.data);
                setFilteredOrders(response.data);
            } else {
                console.error('Expected array of orders, received:', response.data);
                setOrders([]);
                setFilteredOrders([]);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            setOrders([]);
            setFilteredOrders([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch parts for selected order
    const fetchOrderParts = async (orderId) => {
        setPartsLoading(true);
        try {
            const response = await repairService2.part.getPartViewsByOrderIdV2(orderId);
            if (Array.isArray(response.data)) {
                setOrderParts(response.data);
            } else {
                console.error('Expected array of parts, received:', response.data);
                setOrderParts([]);
            }
        } catch (error) {
            console.error(`Error fetching parts for order ${orderId}:`, error);
            setOrderParts([]);
        } finally {
            setPartsLoading(false);
        }
    };

    // Handle order selection
    const handleSelectOrder = (order) => {
        setSelectedOrder(order);
        fetchOrderParts(order.order_id);
    };

    // Handle export confirmation
    const handleConfirmExport = async () => {
        if (!selectedOrder) return;
        
        setExportLoading(true);
        setExportMessage(null);
        
        try {
            // Gọi api xuất kho phụ tùng cho đơn hàng
            // const response = await warehouseService.exportPartsForOrder(selectedOrder.order_id);
            
            // Handle successful export
            setExportMessage({
                type: 'success',
                text: `Đã xuất kho phụ tùng cho đơn hàng #${selectedOrder.order_id} thành công!`
            });
            
            // Refresh parts data to show updated stock
            fetchOrderParts(selectedOrder.order_id);
        } catch (error) {
            console.error('Error confirming export:', error);
            setExportMessage({
                type: 'danger',
                text: `Lỗi khi xuất kho: ${error.message || 'Vui lòng thử lại'}`
            });
        } finally {
            setExportLoading(false);
            setShowExportModal(false);
        }
    };

    // Format date string
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            // hour: '2-digit',
            // minute: '2-digit',
        });
    };
    
    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0">Kho phụ tùng - Xuất kho</h5>
                <Button 
                    variant="outline-primary"
                    onClick={() => fetchOrderViewForTable()}
                    disabled={loading}
                >
                    <i className="bi bi-arrow-clockwise me-1"></i> Làm mới
                </Button>
            </div>

            {exportMessage && (
                <Alert 
                    variant={exportMessage.type} 
                    onClose={() => setExportMessage(null)}
                    dismissible
                    className="mb-4"
                >
                    {exportMessage.text}
                </Alert>
            )}

            <Row>
                {/* Left side - Orders Table */}
                <Col lg={6} className="mb-4">
                    <Card className="shadow-sm h-100">
                        <Card.Header className="bg-white">
                            <div className="d-flex justify-content-between align-items-center">
                                <h6 className="mb-0">Danh sách đơn hàng</h6>
                                <Form.Group className="search-box mb-0">
                                    <InputGroup>
                                        <Form.Control
                                            placeholder="Tìm kiếm đơn hàng..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                        <Button variant="outline-secondary">
                                            <i className="bi bi-search"></i>
                                        </Button>
                                    </InputGroup>
                                </Form.Group>
                            </div>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <div className="table-responsive" style={{ maxHeight: "80vh", overflowY: "auto" }}>
                                <Table hover className="mb-0">
                                    <thead className="sticky-top">
                                        <tr className="table-light">
                                            <th>Mã đơn</th>
                                            <th>Khách hàng</th>
                                            <th>Thông tin xe</th>
                                            <th>Ngày tạo</th>
                                            <th>Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan="5" className="text-center py-4">
                                                    <Spinner animation="border" variant="primary" />
                                                    <p className="mt-2 text-muted">Đang tải dữ liệu...</p>
                                                </td>
                                            </tr>
                                        ) : filteredOrders.length > 0 ? (
                                            filteredOrders.map(order => (
                                                <tr 
                                                    key={order.order_id}
                                                    onClick={() => handleSelectOrder(order)}
                                                    className={selectedOrder?.order_id === order.order_id ? 'table-active' : ''}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <td>{order.order_id}</td>
                                                    <td>
                                                        <div className="fw-semibold">{order.customer.fullname}</div>
                                                        <small className="text-muted">{order.customer.phone_num}</small>
                                                    </td>
                                                    <td>
                                                        <div>{order.motocycle.brand} {order.motocycle.model}</div>
                                                        <small className="text-muted">{order.motocycle.license_plate}</small>
                                                    </td>
                                                    <td>{formatDate(order.created_at)}</td>
                                                    <td><StatusBadge status={order.status} /></td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="text-center py-4">
                                                    <div className="text-muted">
                                                        <i className="bi bi-inbox fs-4 d-block mb-2"></i>
                                                        {searchTerm ? 'Không tìm thấy đơn hàng phù hợp' : 'Không có đơn hàng nào'}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Right side - Parts Details */}
                <Col lg={6} className="mb-4">
                    <Card className="shadow-sm h-100">
                        <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                            <h6 className="mb-0">Chi tiết phụ tùng</h6>
                            {selectedOrder && selectedOrder.status === 'repairing' && orderParts.length > 0 && (
                                <Button 
                                    variant="danger"
                                    size="sm"
                                    onClick={() => setShowExportModal(true)}
                                >
                                    <i className="bi bi-box-arrow-right me-1"></i>
                                    Xác nhận xuất kho
                                </Button>
                            )}
                        </Card.Header>
                        <Card.Body>
                            {!selectedOrder ? (
                                <div className="text-center py-5">
                                    <i className="bi bi-arrows-angle-contract fs-1 text-muted"></i>
                                    <p className="mt-3 text-muted">Vui lòng chọn một đơn hàng để xem chi tiết phụ tùng</p>
                                </div>
                            ) : partsLoading ? (
                                <div className="text-center py-5">
                                    <Spinner animation="border" variant="primary" />
                                    <p className="mt-2 text-muted">Đang tải dữ liệu phụ tùng...</p>
                                </div>
                            ) : orderParts.length > 0 ? (
                                <>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h6 className="mb-0">Đơn hàng #{selectedOrder.order_id}</h6>
                                        <div>
                                            <StatusBadge status={selectedOrder.status} />
                                        </div>
                                    </div>
                                    
                                    {orderParts.map((part, index) => (
                                        <div key={part.part_id} className="part-item mb-4">
                                            <div className="part-header d-flex justify-content-between align-items-center bg-light p-2 rounded">
                                                <h6 className="mb-0">{part.name}</h6>
                                                <div>
                                                    <Badge bg="primary" className="me-2">
                                                        {formatCurrency(part.price)}
                                                    </Badge>
                                                    <Badge bg="info">
                                                        Cần: {part.need_quantity} {part.unit}
                                                    </Badge>
                                                </div>
                                            </div>
                                            
                                            <div className="warehouse-list mt-2">
                                                <Table size="sm" bordered hover>
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th>Vị trí</th>
                                                            <th>Nhà cung cấp</th>
                                                            <th>Ngày nhập</th>
                                                            <th>Tồn kho</th>
                                                            <th>Đơn giá</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {part.warehouses.map(warehouse => (
                                                            <tr key={warehouse.part_lot_id}>
                                                                <td>{warehouse.location}</td>
                                                                <td>{warehouse.supplier_name}</td>
                                                                <td>{formatDate(warehouse.import_date)}</td>
                                                                <td>{warehouse.stock} / {warehouse.quantity}</td>
                                                                <td>{formatCurrency(warehouse.import_price)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </Table>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            ) : (
                                <div className="text-center py-5">
                                    <i className="bi bi-box fs-1 text-muted"></i>
                                    <p className="mt-3 text-muted">Không có thông tin phụ tùng cho đơn hàng này</p>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Export Confirmation Modal */}
            <CustomModal
                show={showExportModal}
                onHide={() => setShowExportModal(false)}
                title="Xác nhận xuất kho"
                message={
                    <>
                        <p>Bạn có chắc chắn muốn xuất kho các phụ tùng sau cho đơn hàng #{selectedOrder?.order_id}?</p>
                        <ul>
                            {orderParts.map(part => (
                                <li key={part.part_id}>
                                    {part.name} - {part.need_quantity} {part.unit}
                                </li>
                            ))}
                        </ul>
                        <p className="mb-0 text-danger">Lưu ý: Thao tác này không thể hoàn tác!</p>
                    </>
                }
                confirmButtonText={exportLoading ? "Đang xử lý..." : "Xác nhận xuất kho"}
                confirmButtonVariant="danger"
                onConfirm={handleConfirmExport}
                cancelButtonText="Hủy"
                confirmDisabled={exportLoading}
            />
        </>
    );
};

export default OrderWarehouse;
