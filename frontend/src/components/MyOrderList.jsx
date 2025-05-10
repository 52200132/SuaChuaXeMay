import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Pagination, Spinner, Modal, Row, Col, Nav, Card, Form, Alert } from 'react-bootstrap';

import StatusBadge from '../admin/components/StatusBadge';
import { useUserData } from '../contexts/UserDataContext';
import { customerService, resourceService, repairService } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import pusher from '../services/pusher';

const MyOrderList = () => {
    const { getData, loading, getIds, setData } = useUserData();
    const ordersById = getData('orders');
    const motorcyclesById = getData('motorcycles');
    const staffsById = getData('staffs');

    const [filteredOrdersIds, setFilteredOrdersIds] = useState([]);
    const [pendingOrdersIds, setPendingOrdersIds] = useState([]);
    const [activeTab, setActiveTab] = useState('all'); // 'all' or 'pending'

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [totalPages, setTotalPages] = useState(1);
    

    // Modal state
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [orderModalLoading, setOrderModalLoading] = useState(false);
    const [currentOrder, setCurrentOrder] = useState(null);
    const [partOrderDetails, setPartOrderDetails] = useState([]);
    const [serviceOrderDetails, setServiceOrderDetails] = useState([]);
    const [diagnosis, setDiagnosis] = useState(null);
    const [motorcycle, setMotorcycle] = useState(null);
    
    // States for update details modal
    const [showUpdateDetailsModal, setShowUpdateDetailsModal] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [selectedItems, setSelectedItems] = useState({ parts: new Set(), services: new Set() });
    const [partOrderDetailsData, setPartOrderDetailsData] = useState([]);
    const [serviceOrderDetailsData, setServiceOrderDetailsData] = useState([]);

    const STATUS_MAPPING = {
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

    // Lắng nghe sự kiện từ Pusher
    useEffect(() => {
        const orderChannel = pusher.subscribe(`order`);
        orderChannel.bind('client-sendOrder', (dataR) => {
            const { order_id, data } = dataR;
            if (ordersById[order_id]) {
                setData('orders', data, order_id);
            }
        });
        return () => {
            orderChannel.unbind('client-sendOrder');
            pusher.unsubscribe(`order`);
        }
    }, []);

    useEffect(() => {
        if (loading['orders'] === true || loading['motorcycles'] || loading['staffs'] || loading['parts'] || loading['services']) return;
        
        const allOrders = getIds('orders');
        setFilteredOrdersIds(allOrders);
        
        // Filter orders with status 'wait_confirm'
        const pendingOrders = allOrders.filter(orderId => {
            const order = ordersById[orderId];
            return order && order.status === 'wait_confirm';
        });
        setPendingOrdersIds(pendingOrders);
        
        setTotalPages(Math.ceil(activeTab === 'all' ? allOrders.length : pendingOrders.length) / itemsPerPage);
    }, [loading, itemsPerPage, getIds, ordersById, activeTab]);

    // Update total pages when tab changes
    useEffect(() => {
        setCurrentPage(1); // Reset to page 1 when switching tabs
        const relevantOrders = activeTab === 'all' ? filteredOrdersIds : pendingOrdersIds;
        setTotalPages(Math.ceil(relevantOrders.length / itemsPerPage) || 1);
    }, [activeTab, filteredOrdersIds, pendingOrdersIds, itemsPerPage]);

    // Format order data for display
    const formatOrderData = (order, motorcycle, staff, diagnosis) => {
        const [createdAtDate, createdAtTime] = order.created_at?.split('T') || ['', ''];
        return {
            orderId: order.order_id,
            status: STATUS_MAPPING[order.status] || order.status,
            rawStatus: order.status,
            totalPrice: order.total_price || 0,
            createdDate: createdAtDate || '',
            createdTime: createdAtTime?.substring(0, 5) || '',
            originalData: order,

            motorcycleId: order.motocycle_id,
            motorcycleBrand: motorcycle?.brand,
            motorcycleModel: motorcycle?.model,
            plateNumber: motorcycle?.license_plate,

            diagnosisProblem: diagnosis?.problem,

            staffName: staff?.fullname,
        };
    };

    // Handle page change
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    // Create pagination items
    const renderPaginationItems = () => {
        let items = [];

        // Add Previous button
        items.push(
            <Pagination.Prev
                key="prev"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
            />
        );

        // Always show first page
        items.push(
            <Pagination.Item
                key={1}
                active={currentPage === 1}
                onClick={() => handlePageChange(1)}
            >
                1
            </Pagination.Item>
        );

        // Add ellipsis if needed
        if (currentPage > 3) {
            items.push(<Pagination.Ellipsis key="ellipsis-1" disabled />);
        }

        // Add pages around current page
        for (let page = Math.max(2, currentPage - 1); page <= Math.min(totalPages - 1, currentPage + 1); page++) {
            if (page === 1 || page === totalPages) continue; // Skip first and last page (handled separately)
            items.push(
                <Pagination.Item
                    key={page}
                    active={currentPage === page}
                    onClick={() => handlePageChange(page)}
                >
                    {page}
                </Pagination.Item>
            );
        }

        // Add ellipsis if needed
        if (currentPage < totalPages - 2 && totalPages > 3) {
            items.push(<Pagination.Ellipsis key="ellipsis-2" disabled />);
        }

        // Always show last page if there is more than one page
        if (totalPages > 1) {
            items.push(
                <Pagination.Item
                    key={totalPages}
                    active={currentPage === totalPages}
                    onClick={() => handlePageChange(totalPages)}
                >
                    {totalPages}
                </Pagination.Item>
            );
        }

        // Add Next button
        items.push(
            <Pagination.Next
                key="next"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => handlePageChange(currentPage + 1)}
            />
        );

        return items;
    };

    // Show order details modal
    const handleShowOrderDetails = async (order) => {
        setShowOrderModal(true);
        setOrderModalLoading(true);
        setCurrentOrder(null);
        setPartOrderDetails([]);
        setServiceOrderDetails([]);
        setDiagnosis(null);
        setMotorcycle(null);

        try {
            setCurrentOrder(order);

            // Get motorcycle info (if available)
            let moto = null;
            if (order.motorcycleId) {
                try {
                    const motoRes = await customerService.motorcycle.getMotorcycleById(order.motorcycleId);
                    moto = motoRes.data;
                } catch {
                    moto = null;
                }
            }
            setMotorcycle(moto);

            // Fetch diagnosis, parts, and services in parallel
            const [diagnosisRes, partDetailsRes, serviceDetailsRes] = await Promise.all([
                repairService.diagnosis.getDiagnosisByOrderId(order.orderId),
                repairService.partOrderDetail.getAllPartOrderDetailsByOrderId(order.orderId),
                repairService.serviceOrderDetail.getAllServiceOrderDetailsByOrderId(order.orderId)
            ]);
            setDiagnosis(diagnosisRes.data);

            // Filter selected parts and services
            const selectedParts = (partDetailsRes.data || []).filter(part => part.is_selected);
            const selectedServices = (serviceDetailsRes.data || []).filter(service => service.is_selected);

            // Fetch details for all parts and services
            const [allPartsRes, allServicesRes] = await Promise.all([
                resourceService.part.getAllParts(),
                resourceService.service.getAllServices()
            ]);
            const partsMap = {};
            (allPartsRes.data || []).forEach(part => {
                partsMap[part.part_id] = part;
            });
            const servicesMap = {};
            (allServicesRes.data || []).forEach(service => {
                servicesMap[service.service_id] = service;
            });

            // Enrich parts and services with names and other details
            const enrichedParts = selectedParts.map(part => {
                const partDetail = partsMap[part.part_id];
                return {
                    ...part,
                    partDetail,
                    part_name: partDetail?.name || part.part_name || "Phụ tùng không xác định",
                    part_code: partDetail?.code || part.part_code || "Không có mã"
                };
            });
            const enrichedServices = selectedServices.map(service => {
                const serviceDetail = servicesMap[service.service_id];
                return {
                    ...service,
                    serviceDetail,
                    service_name: serviceDetail?.name || service.service_name || "Dịch vụ không xác định",
                    service_code: serviceDetail?.code || service.service_code || "Không có mã"
                };
            });

            setPartOrderDetails(enrichedParts);
            setServiceOrderDetails(enrichedServices);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error("Lỗi khi tải chi tiết đơn hàng:", error);
        } finally {
            setOrderModalLoading(false);
        }
    };

    // Handle showing the update details modal
    const handleShowUpdateDetailsModal = async (order) => {
        // Only allow updating details for orders in "wait_confirm" status
        if (order.rawStatus !== 'wait_confirm') {
            alert('Chỉ có thể cập nhật chi tiết đơn hàng đang ở trạng thái chờ xác nhận');
            return;
        }
        
        setCurrentOrder(order);
        setDetailsLoading(true);
        setShowUpdateDetailsModal(true);
        
        try {
            // Fetch part and service order details
            const [partDetails, serviceDetails] = await Promise.all([
                fetchPartOrderDetails(order.orderId),
                fetchServiceOrderDetails(order.orderId)
            ]);
            
            setPartOrderDetailsData(partDetails);
            setServiceOrderDetailsData(serviceDetails);
            
            // Initialize selected items based on current is_selected values
            const selectedParts = new Set(partDetails.filter(part => part.is_selected).map(part => part.part_detail_ID));
            const selectedServices = new Set(serviceDetails.filter(service => service.is_selected).map(service => service.service_detail_ID));
            
            setSelectedItems({
                parts: selectedParts,
                services: selectedServices
            });
        } catch (error) {
            console.error('Error fetching order details:', error);
            alert('Không thể tải thông tin chi tiết đơn hàng');
        } finally {
            setDetailsLoading(false);
        }
    };
    
    // Helper functions for details selection
    const togglePartSelectionDetails = (partDetailId) => {
        setSelectedItems(prev => {
            const newParts = new Set(prev.parts);
            if (newParts.has(partDetailId)) {
                newParts.delete(partDetailId);
            } else {
                newParts.add(partDetailId);
            }
            return { ...prev, parts: newParts };
        });
    };

    const toggleServiceSelectionDetails = (serviceDetailId) => {
        setSelectedItems(prev => {
            const newServices = new Set(prev.services);
            if (newServices.has(serviceDetailId)) {
                newServices.delete(serviceDetailId);
            } else {
                newServices.add(serviceDetailId);
            }
            return { ...prev, services: newServices };
        });
    };

    const selectAllParts = () => {
        setSelectedItems(prev => ({
            ...prev,
            parts: new Set(partOrderDetailsData.map(part => part.part_detail_ID))
        }));
    };

    const deselectAllParts = () => {
        setSelectedItems(prev => ({
            ...prev,
            parts: new Set()
        }));
    };

    const selectAllServices = () => {
        setSelectedItems(prev => ({
            ...prev,
            services: new Set(serviceOrderDetailsData.map(service => service.service_detail_ID))
        }));
    };

    const deselectAllServices = () => {
        setSelectedItems(prev => ({
            ...prev,
            services: new Set()
        }));
    };
    
    // Function to handle submitting the updated order details
    const handleSubmitOrderDetails = async () => {
        if (!currentOrder) return;
        
        setDetailsLoading(true);
        
        try {
            // Update part order details with is_selected field
            const updatedPartDetails = partOrderDetailsData.map(part => ({
                ...part,
                is_selected: selectedItems.parts.has(part.part_detail_ID)
            }));
            
            // Update service order details with is_selected field
            const updatedServiceDetails = serviceOrderDetailsData.map(service => ({
                ...service,
                is_selected: selectedItems.services.has(service.service_detail_ID)
            }));
            
            // Calculate total selected amount
            const totalSelectedAmount = 
                updatedPartDetails
                    .filter(part => part.is_selected)
                    .reduce((sum, part) => sum + (part.price), 0) +
                updatedServiceDetails
                    .filter(service => service.is_selected)
                    .reduce((sum, service) => sum + service.price, 0);
            
            // Update part order details in the database
            await Promise.all([
                ...updatedPartDetails.map(part => 
                    repairService.partOrderDetail.updatePartOrderDetail(part.part_detail_ID,
                        { 
                            part_id: part.part_id,
                            quantity: part.quantity,
                            price: part.price,
                            is_selected: part.is_selected,
                        }
                    )
                ),
                ...updatedServiceDetails.map(service => 
                    repairService.serviceOrderDetail.updateServiceOrderDetail(service.service_detail_ID,
                        { 
                            is_selected: service.is_selected,
                            service_id: service.service_id,
                            price: service.price,
                        }
                    )
                )
            ]);

            // const response = await repairService.order.getOrderById(currentOrder.orderId);
            const response = await repairService.order.updateOrder(currentOrder.orderId, {
                total_price: totalSelectedAmount,
            });
            setData('orders', response.data, response.data.order_id);

            console.log('currentOrder', currentOrder.originalData.staff_id);
            pusher.subscribe(`staff-${currentOrder.originalData.staff_id}`).trigger('client-notification', {
                title: 'Khách hàng đã xác nhận đơn hàng',
                message: `Đơn hàng #${currentOrder.originalData.staff_id} đã được xác nhận`,
                type: 'info',
                timestamp: new Date().toISOString(),
                id: Date.now().toString()
            });

            // Update order status to repairing
            // const response = await repairService.order.updateOrder(currentOrder.orderId, {
            //     status: 'repairing',
            //     total_price: totalSelectedAmount
            // });
            
            // Update the local order in the state
            // ordersById[currentOrder.orderId] = {
            //     ...ordersById[currentOrder.orderId],
            //     status: 'repairing',
            //     total_price: totalSelectedAmount
            // };
            
            // Filter pending orders again
            // const pendingOrders = filteredOrdersIds.filter(orderId => {
            //     const order = ordersById[orderId];
            //     return order && order.status === 'wait_confirm';
            // });
            // setPendingOrdersIds(pendingOrders);
            
            alert('Cập nhật chi tiết đơn hàng thành công!');
            setShowUpdateDetailsModal(false);
        } catch (error) {
            console.error('Error updating order details:', error);
            alert('Có lỗi xảy ra khi cập nhật chi tiết đơn hàng');
        } finally {
            setDetailsLoading(false);
        }
    };

    // Fetch part order details
    const fetchPartOrderDetails = async (orderId) => {
        try {
            const response = await repairService.partOrderDetail.getAllPartOrderDetailsByOrderId(orderId);
            return response.data || [];
        } catch (error) {
            console.error('Error fetching part order details:', error);
            return [];
        }
    };

    // Fetch service order details
    const fetchServiceOrderDetails = async (orderId) => {
        try {
            const response = await repairService.serviceOrderDetail.getAllServiceOrderDetailsByOrderId(orderId);
            return response.data || [];
        } catch (error) {
            console.error('Error fetching service order details:', error);
            return [];
        }
    };

    const getCurrentOrders = useCallback(() => {
        const orderIds = activeTab === 'all' ? filteredOrdersIds : pendingOrdersIds;
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const displayData = orderIds.slice(startIndex, endIndex).map(orderId => {
            const order = ordersById[orderId];
            const motorcycle = motorcyclesById[order?.motocycle_id];
            const staff = staffsById[order?.staff_id];
            return formatOrderData(order, motorcycle, staff);
        });
        return displayData;
    }, [ordersById, motorcyclesById, staffsById, filteredOrdersIds, pendingOrdersIds, currentPage, itemsPerPage, activeTab]);

    return (
        <>
            <Card className="shadow-sm mb-4">
                <Card.Header className="bg-white">
                    <Nav variant="tabs" activeKey={activeTab} onSelect={setActiveTab} className="border-bottom-0">
                        <Nav.Item>
                            <Nav.Link eventKey="all">Tất cả đơn hàng</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="pending">
                                Đơn hàng chờ xác nhận
                                {pendingOrdersIds.length > 0 && (
                                    <span className="badge bg-danger ms-2">{pendingOrdersIds.length}</span>
                                )}
                            </Nav.Link>
                        </Nav.Item>
                    </Nav>
                </Card.Header>
                <Card.Body className="p-0">
                    <div className="table-responsive">
                        <Table hover className="mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Mã đơn</th>
                                    <th>Thông tin xe</th>
                                    <th>Trạng thái</th>
                                    <th>Tổng tiền</th>
                                    <th style={{ width: "150px" }}>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading.orders ? (
                                    <tr>
                                        <td colSpan="5" className="text-center py-4">
                                            <Spinner animation="border" variant="primary" />
                                            <p className="mt-2 text-muted">Đang tải dữ liệu...</p>
                                        </td>
                                    </tr>
                                ) : getCurrentOrders().length > 0 ? (
                                    getCurrentOrders().map(order => (
                                        <tr key={order.orderId}>
                                            <td>{order.orderId}</td>
                                            <td>
                                                <div>{order.motorcycleBrand + ' ' + order.motorcycleModel}</div>
                                                <small className="text-muted">{order.plateNumber}</small>
                                            </td>
                                            <td>
                                                <StatusBadge status={order.status} />
                                            </td>
                                            <td>
                                                {formatCurrency(order.totalPrice)}
                                            </td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        onClick={() => handleShowOrderDetails(order)}
                                                    >
                                                        <i className="bi bi-eye"></i>
                                                    </Button>
                                                    
                                                    {order.rawStatus === 'wait_confirm' && (
                                                        <Button
                                                            variant="outline-success"
                                                            size="sm"
                                                            onClick={() => handleShowUpdateDetailsModal(order)}
                                                            title="Xác nhận đơn hàng"
                                                        >
                                                            <i className="bi bi-check2-circle"></i>
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center py-4">
                                            <div className="text-muted">
                                                <i className="bi bi-inbox fs-4 d-block mb-2"></i>
                                                {activeTab === 'all' 
                                                    ? 'Không tìm thấy đơn hàng nào' 
                                                    : 'Không có đơn hàng nào đang chờ xác nhận'}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>

                        {/* Pagination controls */}
                        <div className="d-flex justify-content-between align-items-center p-3 border-top">
                            <div className="text-muted small">
                                Hiển thị {getCurrentOrders().length} / {activeTab === 'all' ? filteredOrdersIds.length : pendingOrdersIds.length} đơn hàng
                            </div>
                            <div className="d-flex align-items-center">
                                <span className="me-3">
                                    <select
                                        className="form-select form-select-sm"
                                        value={itemsPerPage}
                                        onChange={(e) => {
                                            setItemsPerPage(Number(e.target.value));
                                            setCurrentPage(1); // Reset to first page when changing items per page
                                        }}
                                    >
                                        <option value={5}>5 mục</option>
                                        <option value={10}>10 mục</option>
                                        <option value={20}>20 mục</option>
                                    </select>
                                </span>
                                {totalPages > 1 && (
                                    <Pagination size="sm" className="mb-0">
                                        {renderPaginationItems()}
                                    </Pagination>
                                )}
                            </div>
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {/* Order Detail Modal */}
            <Modal
                show={showOrderModal}
                onHide={() => setShowOrderModal(false)}
                size="lg"
                backdrop="static"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Chi tiết đơn sửa chữa #{currentOrder?.orderId}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {orderModalLoading ? (
                        <div className="text-center py-4">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-3 text-muted">Đang tải chi tiết đơn hàng...</p>
                        </div>
                    ) : (
                        <div id="order-detail-content">
                            <div className="mb-4">
                                <h5 className="border-bottom pb-2 mb-3">Thông tin đơn hàng</h5>
                                <Row>
                                    <Col md={6}>
                                        <p className="mb-1"><strong>Mã đơn hàng:</strong> {currentOrder?.orderId}</p>
                                        <p className="mb-1"><strong>Ngày tạo:</strong> {currentOrder ? new Date(currentOrder.created_at || currentOrder.create_at).toLocaleDateString('vi-VN', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        }) : ''}</p>
                                    </Col>
                                    <Col md={6}>
                                        <p className="mb-1">
                                            <strong>Trạng thái:</strong>{' '}
                                            <StatusBadge status={currentOrder?.status} />
                                        </p>
                                        <p className="mb-1"><strong>Tổng tiền:</strong> <span className="text-primary fw-bold">
                                            {currentOrder?.totalPrice ? formatCurrency(currentOrder.totalPrice) : 'Chưa tính'}
                                        </span></p>
                                    </Col>
                                </Row>
                            </div>
                            <Row className="mb-4">
                                <Col md={6}>
                                    <div className="mb-4">
                                        <h5 className="border-bottom pb-2 mb-3">Thông tin xe</h5>
                                        <p className="mb-1"><strong>Biển số:</strong> {motorcycle?.license_plate || currentOrder?.licensePlate || 'N/A'}</p>
                                        <p className="mb-1"><strong>Loại xe:</strong> {motorcycle?.brand || currentOrder?.motorBrand || ''} {motorcycle?.model || currentOrder?.motorModel || ''}</p>
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="mb-4">
                                        <h5 className="border-bottom pb-2 mb-3">Thông tin kỹ thuật viên</h5>
                                        <p className="mb-1"><strong>Tên:</strong> {currentOrder?.staffName}</p>
                                    </div>
                                </Col>
                            </Row>

                            <div className="mb-4 diagnosis-section">
                                <h5 className="border-bottom pb-2 mb-3">Chuẩn đoán</h5>
                                <div className="p-3 bg-light rounded mb-3">
                                    <p className="mb-1"><strong>Vấn đề:</strong> {diagnosis?.problem || 'Không có thông tin'}</p>
                                    {diagnosis?.estimated_cost && <p className="mb-0"><strong>Chi phí ước tính:</strong> {formatCurrency(diagnosis.estimated_cost)}</p>}
                                </div>
                            </div>

                            {/* Hiển thị chi tiết phụ tùng */}
                            <div className="mb-4">
                                <h5 className="border-bottom pb-2 mb-3">Phụ tùng và vật tư</h5>
                                <div className="table-responsive">
                                    <Table bordered hover className="mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th width="5%">#</th>
                                                <th width="40%">Tên phụ tùng</th>
                                                <th width="15%" className="text-center">Đơn giá</th>
                                                <th width="10%" className="text-center">Số lượng</th>
                                                <th width="15%" className="text-center">Thành tiền</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {partOrderDetails.length > 0 ? (
                                                partOrderDetails.map((item, index) => (
                                                    <tr key={item.part_order_detail_id || index}>
                                                        <td className="text-center">{index + 1}</td>
                                                        <td>
                                                            <span className="fw-medium">{item.part_name}</span>
                                                        </td>
                                                        <td className="text-center">
                                                            {item.quantity && item.quantity > 0
                                                                ? formatCurrency(item.price / item.quantity)
                                                                : formatCurrency(item.price)
                                                            }
                                                        </td>
                                                        <td className="text-center">{item.quantity}</td>
                                                        <td className="text-end">{formatCurrency(item.price)}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className="text-center py-3 text-muted">
                                                        Không có phụ tùng nào được sử dụng
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                        {partOrderDetails.length > 0 && (
                                            <tfoot className="table-light">
                                                <tr>
                                                    <td colSpan={4} className="text-end fw-bold">Tổng chi phí phụ tùng:</td>
                                                    <td className="text-end fw-bold">
                                                        {formatCurrency(
                                                            partOrderDetails.reduce((sum, part) => sum + (part.price), 0)
                                                        )}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        )}
                                    </Table>
                                </div>
                            </div>

                            {/* Hiển thị chi tiết dịch vụ */}
                            <div className="mb-4">
                                <h5 className="border-bottom pb-2 mb-3">Dịch vụ</h5>
                                <div className="table-responsive">
                                    <Table bordered hover className="mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th width="5%">#</th>
                                                <th width="55%">Tên dịch vụ</th>
                                                <th width="15%" className="text-center">Đơn giá</th>
                                                <th width="15%" className="text-center">Thành tiền</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {serviceOrderDetails.length > 0 ? (
                                                serviceOrderDetails.map((item, index) => (
                                                    <tr key={item.service_order_detail_id || index}>
                                                        <td className="text-center">{index + 1}</td>
                                                        <td>
                                                            <span className="fw-medium">{item.service_name}</span>
                                                        </td>
                                                        <td className="text-center">{formatCurrency(item.price)}</td>
                                                        <td className="text-end">{formatCurrency(item.price)}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={4} className="text-center py-3 text-muted">
                                                        Không có dịch vụ nào được sử dụng
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                        {serviceOrderDetails.length > 0 && (
                                            <tfoot className="table-light">
                                                <tr>
                                                    <td colSpan={3} className="text-end fw-bold">Tổng chi phí dịch vụ:</td>
                                                    <td className="text-end fw-bold">
                                                        {formatCurrency(
                                                            serviceOrderDetails.reduce((sum, service) => sum + service.price, 0)
                                                        )}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        )}
                                    </Table>
                                </div>
                            </div>

                            {/* Hiển thị tổng chi phí */}
                            <div className="mt-4 border-top pt-3">
                                <Row>
                                    <Col md={7}>
                                        <div>
                                            <p className="mb-1 text-muted">Ghi chú:</p>
                                            <p className="small text-muted mb-0">
                                                {currentOrder?.note || 'Không có ghi chú'}
                                            </p>
                                        </div>
                                    </Col>
                                    <Col md={5}>
                                        <div className="bg-light p-3 rounded">
                                            <div className="d-flex justify-content-between mb-2">
                                                <span>Tổng chi phí phụ tùng:</span>
                                                <span>
                                                    {formatCurrency(
                                                        partOrderDetails.reduce((sum, part) => sum + (part.price * (part.quantity || 1)), 0)
                                                    )}
                                                </span>
                                            </div>
                                            <div className="d-flex justify-content-between mb-2">
                                                <span>Tổng chi phí dịch vụ:</span>
                                                <span>
                                                    {formatCurrency(
                                                        serviceOrderDetails.reduce((sum, service) => sum + service.price, 0)
                                                    )}
                                                </span>
                                            </div>
                                            <div className="d-flex justify-content-between pt-2 border-top mt-2">
                                                <span className="fw-bold">Tổng cộng:</span>
                                                <span className="fw-bold text-primary fs-5">
                                                    {currentOrder?.totalPrice
                                                        ? formatCurrency(currentOrder.totalPrice)
                                                        : formatCurrency(
                                                            partOrderDetails.reduce((sum, part) => sum + (part.price * (part.quantity || 1)), 0) +
                                                            serviceOrderDetails.reduce((sum, service) => sum + service.price, 0)
                                                        )
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowOrderModal(false)}>
                        Đóng
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal cập nhật chi tiết đơn hàng */}
            <Modal
                show={showUpdateDetailsModal}
                onHide={() => setShowUpdateDetailsModal(false)}
                size="lg"
                backdrop="static"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Xác nhận đơn hàng #{currentOrder?.orderId}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {detailsLoading ? (
                        <div className="text-center py-4">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Đang tải...</span>
                            </div>
                            <p className="mt-2 text-muted">Đang tải thông tin chi tiết...</p>
                        </div>
                    ) : (
                        <div>
                            <Row className="mb-3">
                                <Col md={6}>
                                    <p className="mb-1"><strong>Mã đơn:</strong> {currentOrder?.orderId}</p>
                                    <p className="mb-0"><strong>Thông tin xe:</strong> {currentOrder?.motorcycleBrand} {currentOrder?.motorcycleModel} - {currentOrder?.plateNumber}</p>
                                </Col>
                                <Col md={6}>
                                    <p className="mb-1"><strong>Ngày tạo:</strong> {currentOrder?.createdDate}</p>
                                    <p className="mb-0"><strong>Trạng thái:</strong> <StatusBadge status={currentOrder?.status} /></p>
                                </Col>
                                <Col md={12}>
                                    <p className="mb-1"><strong>Kỹ thuật viên:</strong> {currentOrder?.staffName}</p>
                                </Col>
                            </Row>
                            
                            <Alert variant="info">
                                <i className="bi bi-info-circle me-2"></i>
                                Vui lòng chọn các phụ tùng và dịch vụ mà bạn muốn sử dụng cho đơn hàng này.
                            </Alert>
                            
                            <div className="mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <h5 className="mb-0">Phụ tùng</h5>
                                    <div>
                                        <Button 
                                            variant="outline-primary" 
                                            size="sm" 
                                            className="me-2"
                                            onClick={selectAllParts}
                                        >
                                            Chọn tất cả
                                        </Button>
                                        <Button 
                                            variant="outline-secondary" 
                                            size="sm"
                                            onClick={deselectAllParts}
                                        >
                                            Bỏ chọn tất cả
                                        </Button>
                                    </div>
                                </div>
                                
                                <Table bordered hover className="align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th style={{ width: '50px' }}>Chọn</th>
                                            <th>Tên phụ tùng</th>
                                            <th style={{ width: '100px' }}>Số lượng</th>
                                            <th style={{ width: '150px' }}>Đơn giá</th>
                                            <th style={{ width: '150px' }}>Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {partOrderDetailsData.length > 0 ? (
                                            partOrderDetailsData.map(part => {
                                                const isSelected = selectedItems.parts.has(part.part_detail_ID);
                                                const partName = getData('parts', part.part_id)?.name;
                                                return (
                                                    <tr 
                                                        key={part.part_detail_ID} 
                                                        className={isSelected ? 'table-success' : ''}
                                                        onClick={() => togglePartSelectionDetails(part.part_detail_ID)}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <td className="text-center">
                                                            <Form.Check
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => togglePartSelectionDetails(part.part_detail_ID)}
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                        </td>
                                                        <td>{partName}</td>
                                                        <td className="text-center">{part.quantity}</td>
                                                        <td className="text-end">{formatCurrency(part.price / part.quantity)}</td>
                                                        <td className="text-end">{formatCurrency(part.price)}</td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="text-center py-3">Không có phụ tùng nào</td>
                                            </tr>
                                        )}
                                    </tbody>
                                    <tfoot className="table-light">
                                        <tr>
                                            <td colSpan="4" className="text-end fw-bold">Tổng tiền phụ tùng đã chọn:</td>
                                            <td className="text-end fw-bold">
                                                {formatCurrency(
                                                    partOrderDetailsData
                                                        .filter(part => selectedItems.parts.has(part.part_detail_ID))
                                                        .reduce((sum, part) => sum + (part.price), 0)
                                                )}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </Table>
                            </div>
                            
                            <div>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <h5 className="mb-0">Dịch vụ</h5>
                                    <div>
                                        <Button 
                                            variant="outline-primary" 
                                            size="sm" 
                                            className="me-2"
                                            onClick={selectAllServices}
                                        >
                                            Chọn tất cả
                                        </Button>
                                        <Button 
                                            variant="outline-secondary" 
                                            size="sm"
                                            onClick={deselectAllServices}
                                        >
                                            Bỏ chọn tất cả
                                        </Button>
                                    </div>
                                </div>
                                
                                <Table bordered hover className="align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th style={{ width: '50px' }}>Chọn</th>
                                            <th>Tên dịch vụ</th>
                                            <th style={{ width: '150px' }}>Giá</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {serviceOrderDetailsData.length > 0 ? (
                                            serviceOrderDetailsData.map(service => {
                                                const serviceName = getData('services', service.service_id)?.name;
                                                const isSelected = selectedItems.services.has(service.service_detail_ID);
                                                return (
                                                    <tr 
                                                        key={service.service_detail_ID} 
                                                        className={isSelected ? 'table-success' : ''}
                                                        onClick={() => toggleServiceSelectionDetails(service.service_detail_ID)}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <td className="text-center">
                                                            <Form.Check
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => toggleServiceSelectionDetails(service.service_detail_ID)}
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                        </td>
                                                        <td>{serviceName}</td>
                                                        <td className="text-end">{formatCurrency(service.price)}</td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan="3" className="text-center py-3">Không có dịch vụ nào</td>
                                            </tr>
                                        )}
                                    </tbody>
                                    <tfoot className="table-light">
                                        <tr>
                                            <td colSpan="2" className="text-end fw-bold">Tổng tiền dịch vụ đã chọn:</td>
                                            <td className="text-end fw-bold">
                                                {formatCurrency(
                                                    serviceOrderDetailsData
                                                        .filter(service => selectedItems.services.has(service.service_detail_ID))
                                                        .reduce((sum, service) => sum + service.price, 0)
                                                )}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </Table>
                            </div>
                            
                            <div className="mt-4 p-3 bg-light rounded">
                                <div className="d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0">Tổng chi phí đã chọn:</h5>
                                    <h5 className="text-danger mb-0">
                                        {formatCurrency(
                                            partOrderDetailsData
                                                .filter(part => selectedItems.parts.has(part.part_detail_ID))
                                                .reduce((sum, part) => sum + (part.price), 0) +
                                            serviceOrderDetailsData
                                                .filter(service => selectedItems.services.has(service.service_detail_ID))
                                                .reduce((sum, service) => sum + service.price, 0)
                                        )}
                                    </h5>
                                </div>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowUpdateDetailsModal(false)}>
                        Hủy
                    </Button>
                    <Button
                        variant="success"
                        onClick={handleSubmitOrderDetails}
                        disabled={detailsLoading}
                    >
                        {detailsLoading ? 'Đang xử lý...' : 'Xác nhận đơn hàng'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default MyOrderList;
