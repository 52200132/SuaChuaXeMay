import { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Tabs, Tab, Alert, ListGroup, InputGroup, Badge } from 'react-bootstrap';

import { useAppData } from '../../../contexts/AppDataContext';
import { repairService } from '../../../../services/api';

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const InspectionModal = ({ 
    show, 
    onHide, 
    currentOrder, 
    // onSubmitInspection,
    loading = false,
    partsViewsByMotoTypeId = {},
    servicesViewsByParentMotoType = {},
}) => {
    const { getData, setData } = useAppData();
    
    // Lấy dữ liệu từ context
    const parts = getData('parts');
    // const services = getData('services');
    const servicesParentMotoType = getData('servicesParentMotoType');
    const diagnosisById = getData('diagnosis');

    // State cho tab và form
    const [activeTab, setActiveTab] = useState('status');
    const [activeCatalogTab, setActiveCatalogTab] = useState('services');
    
    // State cho dữ liệu cập nhật
    const [updateData, setUpdateData] = useState({
        diagnosisProblem: '',
        estimatedCost: 0,
        notes: ''
    });
    
    // State cho phụ tùng
    const [selectedParts, setSelectedParts] = useState([]);
    const [partQuantities, setPartQuantities] = useState({});
    const [partSearchTerm, setPartSearchTerm] = useState('');
    
    // State cho dịch vụ
    const [selectedServices, setSelectedServices] = useState([]);

    // Khởi tạo dữ liệu khi modal mở
    useEffect(() => {
        if (show && currentOrder) {
            resetSelections();
            setUpdateData({
                diagnosisProblem: currentOrder.diagnosisProblem || '',
                estimatedCost: currentOrder.estimatedCost || 0,
                notes: currentOrder.note || ''
            });
        }
        // console.log(parts);
    }, [show, currentOrder]);

    // Reset lựa chọn khi mở modal
    const resetSelections = () => {
        setSelectedParts([]);
        setPartQuantities({});
        setSelectedServices([]);
        setActiveTab('status');
        setActiveCatalogTab('services');
    };

    // Xử lý chọn phụ tùng
    const togglePartSelection = (partId) => {
        // Find the part object to check stock
        const part = parts[partId];
        console.log('Part selected:', part);
        
        // Prevent selection if out of stock
        if (part && part.total_stock <= 0) return;
        
        if (selectedParts.includes(partId)) {
            // Xóa phụ tùng
            setSelectedParts(prev => prev.filter(id => id !== partId));
            setPartQuantities(prev => {
                const newQuantities = { ...prev };
                delete newQuantities[partId];
                return newQuantities;
            });
        } else {
            // Thêm phụ tùng
            setSelectedParts(prev => [...prev, partId]);
            setPartQuantities(prev => ({
                ...prev,
                [partId]: 1
            }));
        }
    };

    // Xử lý chọn dịch vụ
    const toggleServiceSelection = (serviceId) => {
        if (selectedServices.includes(serviceId)) {
            setSelectedServices(prev => prev.filter(id => id !== serviceId));
        } else {
            setSelectedServices(prev => [...prev, serviceId]);
        }
    };

    // Cập nhật số lượng phụ tùng
    const handleQuantityChange = (partId, quantity) => {
        const numericQuantity = parseInt(quantity, 10) || 0;
        const clampedQuantity = Math.max(1, Math.min(99, numericQuantity));

        setPartQuantities(prev => ({
            ...prev,
            [partId]: clampedQuantity
        }));
    };

    // Tính tổng tiền của các phụ tùng và dịch vụ đã chọn
    const calculateTotalAmount = () => {
        // Tính tổng tiền phụ tùng
        const partsTotal = selectedParts.reduce((total, partId) => {
            const part = parts[partId];
            if (!part) return total;

            const quantity = partQuantities[partId] || 1;
            const price = part.price || 0;

            return total + (price * quantity);
        }, 0);

        // Tính tổng tiền dịch vụ
        const servicesTotal = selectedServices.reduce((total, serviceId) => {
            const service = servicesParentMotoType[currentOrder.parentMotoType]?.[serviceId];
            if (!service) return total;

            const price = service.price || 0;

            return total + price;
        }, 0);

        return partsTotal + servicesTotal;
    };

    // TODO: Chuẩn bị dữ liệu để submit
    const prepareSubmitData = () => {
        // Dữ liệu phụ tùng
        const partsData = selectedParts.map(partId => {
            const part = parts[partId];
            if (!part) return null;

            if (partQuantities[partId] > part.total_stock) {
                alert(`Số lượng phụ tùng ${part.name} vượt quá số lượng tồn kho (${part.total_stock})`);
                return null;
            }

            return {
                is_sleected: false,
                order_id: currentOrder.orderId,
                part_id: part.part_id,
                quantity: partQuantities[partId] || 1,
                name: part.name || '',
                unit: part.unit || '',
                price: part.price || 0
            };
        }).filter(Boolean);

        console.log('Phụ tùng đã chọn:', partsData);

        // Dữ liệu dịch vụ
        const servicesData = selectedServices.map(serviceId => {
            const service = servicesParentMotoType[currentOrder.parentMotoType]?.[serviceId];
            if (!service) return null;

            return {
                is_sleected: false,
                order_id: currentOrder.orderId,
                service_id: service.service_id,
                name: service.name || '',
                price: service.price || 0
            };
        }).filter(Boolean);

        console.log('Dịch vụ đã chọn:', servicesData);

        // Tính tổng tiền
        const totalPrice = calculateTotalAmount();

        console.log('Tổng tiền:', totalPrice);

        return {
            diagnosisData: {
                problem: updateData.diagnosisProblem,
                estimatedCost: totalPrice
            },
            partsData,
            servicesData,
            totalPrice
        };
    };

    // Xử lý submit form
    const handleSubmit = async () => {
        if (!currentOrder) return;
        
        const submitData = prepareSubmitData();
        console.log('Submit data:', submitData);

        try {
            // Update diagnosis with new problem description and estimated cost
            if (currentOrder.hasDiagnosis === true) {
                await repairService.diagnosis.updateDiagnosis(
                    diagnosisById[currentOrder.orderId]?.diagnosis_id,
                    updateData.diagnosisProblem,
                    submitData.totalPrice
                );
                // setData('diagnosis', res.data, currentOrder.orderId);
            }

            // Create part and service order details
            await Promise.all([
                repairService.partOrderDetail.createPartOrderDetail(submitData.partsData),
                repairService.serviceOrderDetail.createServiceOrderDetail(submitData.servicesData)
            ]);

            let orderU = null;
            // Set status to waiting for confirmation after inspection is complete
            if (currentOrder.rawStatus === 'checking') {
                const response = await repairService.order.updateOrderStatus(currentOrder.orderId, 'wait_confirm');
                setData('orders', response.data, response.data.order_id);
                orderU = response.data;
            }

            console.log('Inspection update data:', {
                orderId: currentOrder.orderId,
                diagnosisProblem: updateData.diagnosisProblem,
                parts: submitData.partsData,
                services: submitData.servicesData,
                estimatedCost: submitData.totalPrice,
            });

            // Update local state
            if (currentOrder.hasDiagnosis === true) {
                diagnosisById[currentOrder.orderId].problem = updateData.diagnosisProblem;
                const estimatedCost = diagnosisById[currentOrder.orderId].estimated_cost || 0;
                diagnosisById[currentOrder.orderId].estimated_cost = estimatedCost + submitData.totalPrice;
            }
            alert('Cập nhật kiểm tra thành công!');
            onHide();
        } catch (error) { 
            console.error('Lỗi khi cập nhật kiểm tra:', error);
            alert('Có lỗi xảy ra trong quá trình cập nhật kiểm tra. Vui lòng thử lại sau.');
            return;
        }
        // onSubmitInspection(submitData);
    };

    // TODO: Render phần chọn phụ tùng và dịch vụ
    const renderPartsSelection = ({ partsViews = [], servicesViews = [] }) => {
        // Lọc phụ tùng theo từ khóa tìm kiếm
        // console.log('Load danh sách phụ tùng', partsViews);
        // console.log('Load danh sách dịch vụ', servicesViews);
        
        const filteredParts = partSearchTerm 
            ? partsViews.filter(part => 
                part.name?.toLowerCase().includes(partSearchTerm.toLowerCase()) ||
                part.supplier_name?.toLowerCase().includes(partSearchTerm.toLowerCase()))
            : partsViews;

        return (
            <>
                <Row>
                    {/* Danh sách phụ tùng/dịch vụ bên trái */}
                    <Col md={7}>
                        <Tabs
                            activeKey={activeCatalogTab}
                            onSelect={(k) => setActiveCatalogTab(k)}
                            className="mb-3"
                        >
                            <Tab eventKey="services" title={<span><i className="bi bi-tools me-1"></i>Dịch vụ</span>}>
                                {!servicesViews ? (
                                    <div className="text-center py-2">
                                        <div className="spinner-border spinner-border-sm" role="status">
                                            <span className="visually-hidden">Đang tải...</span>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="service-list-container p-2 border rounded">
                                            {servicesViews.length > 0 ? (
                                                <ListGroup variant="flush">
                                                    {servicesViews.map(service => (
                                                        <ListGroup.Item
                                                            key={`${service.service_id}-${currentOrder.parentMotoType}`}
                                                            as="div"
                                                            className={`d-flex justify-content-between align-items-center service-item ${selectedServices.includes(service.service_id) ? 'selected' : ''}`}
                                                            action
                                                            onClick={() => toggleServiceSelection(service.service_id)}
                                                        >
                                                            <div className="service-info">
                                                                <div>{service.name}</div>
                                                                {service.price > 0 && (
                                                                    <small className="text-primary">
                                                                        {formatCurrency(service.price)}
                                                                    </small>
                                                                )}
                                                            </div>
                                                            <div className="service-actions">
                                                                <Form.Check
                                                                    type="checkbox"
                                                                    className="m-0"
                                                                    checked={selectedServices.includes(service.service_id)}
                                                                    onChange={() => toggleServiceSelection(service.service_id)}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                />
                                                            </div>
                                                        </ListGroup.Item>
                                                    ))}
                                                </ListGroup>
                                            ) : (
                                                <div className="text-center py-3">
                                                    <p className="text-muted">Không có dịch vụ nào khả dụng</p>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </Tab>

                            <Tab eventKey="parts" title={<span><i className="bi bi-box-seam me-1"></i>Phụ tùng</span>}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Tìm kiếm phụ tùng</Form.Label>
                                    <InputGroup>
                                        <Form.Control
                                            placeholder="Nhập tên hoặc nhà cung cấp phụ tùng..."
                                            value={partSearchTerm}
                                            onChange={(e) => setPartSearchTerm(e.target.value)}
                                        />
                                        {partSearchTerm && (
                                            <Button
                                                variant="outline-secondary"
                                                onClick={() => setPartSearchTerm('')}
                                            >
                                                <i className="bi bi-x"></i>
                                            </Button>
                                        )}
                                    </InputGroup>
                                </Form.Group>

                                {!partsViews ? (
                                    <div className="text-center py-3">
                                        <div className="spinner-border spinner-border-sm" role="status">
                                            <span className="visually-hidden">Đang tải...</span>
                                        </div>
                                        <p className="mt-2 text-muted">Đang tải danh sách phụ tùng...</p>
                                    </div>
                                ) : (
                                    <>
                                        {filteredParts.length > 0 ? (
                                            <div className="parts-container">
                                                <div className="d-flex justify-content-between align-items-center px-2 py-1 bg-light border-bottom">
                                                    <small className="text-muted">
                                                        {filteredParts.length} phụ tùng {partSearchTerm ? `cho "${partSearchTerm}"` : ''}
                                                    </small>
                                                    {partSearchTerm && (
                                                        <Button
                                                            variant="link"
                                                            className="p-0 text-decoration-none"
                                                            size="sm"
                                                            onClick={() => setPartSearchTerm('')}
                                                        >
                                                            <small>Xóa bộ lọc</small>
                                                        </Button>
                                                    )}
                                                </div>
                                                <ListGroup className="parts-list">
                                                    {filteredParts.map(part => {
                                                        const isOutOfStock = part.total_stock <= 0;
                                                        return (
                                                        <ListGroup.Item
                                                            key={`${part.part_id}-${currentOrder.orderId}`}
                                                            as="div"
                                                            className={`d-flex justify-content-between align-items-center part-item ${selectedParts.includes(part.part_id) ? 'selected' : ''} ${isOutOfStock ? 'disabled-item' : ''}`}
                                                            onClick={() => !isOutOfStock && togglePartSelection(part.part_id)}
                                                            style={isOutOfStock ? { opacity: 0.65, cursor: 'not-allowed' } : {}}
                                                        >
                                                            <div className="part-info">
                                                                <div className="d-flex flex-column">
                                                                    <span>{part.name}</span>
                                                                    <small className="text-muted">{part.supplier_name}</small>
                                                                    {part.price > 0 && (
                                                                        <small className="text-primary">
                                                                            {formatCurrency(part.price)}
                                                                        </small>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="part-quantity">
                                                                {selectedParts.includes(part.part_id) ? (
                                                                    <div className="quantity-input">
                                                                        <span
                                                                            className="quantity-btn"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleQuantityChange(part.part_id, (partQuantities[part.part_id] || 1) - 1);
                                                                            }}
                                                                        >
                                                                            -
                                                                        </span>
                                                                        <span className="quantity-value">
                                                                            {partQuantities[part.part_id] || 1}
                                                                        </span>
                                                                        <span
                                                                            className="quantity-btn"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleQuantityChange(part.part_id, (partQuantities[part.part_id] || 1) + 1);
                                                                            }}
                                                                        >
                                                                            +
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <Badge 
                                                                        bg={part.total_stock > 0 ? "success" : "danger"}
                                                                        className="stock-badge"
                                                                    >
                                                                        {part.total_stock > 0 ? `Còn ${part.total_stock}` : 'Hết hàng'}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </ListGroup.Item>
                                                    )})}
                                                </ListGroup>
                                            </div>
                                        ) : (
                                            <Alert variant="info">
                                                {partSearchTerm
                                                    ? `Không tìm thấy phụ tùng phù hợp với từ khóa "${partSearchTerm}".`
                                                    : 'Không có phụ tùng nào khả dụng.'
                                                }
                                            </Alert>
                                        )}
                                    </>
                                )}
                            </Tab>
                        </Tabs>
                    </Col>

                    {/* Danh sách đã chọn bên phải */}
                    <Col md={5}>
                        <div className="selected-items-summary p-3 bg-light rounded" style={{ height: "460px", overflowY: "auto" }}>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="mb-0">Danh mục đã chọn</h6>
                                <div>
                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedParts([]);
                                            setPartQuantities({});
                                            setSelectedServices([]);
                                        }}
                                    >
                                        <i className="bi bi-trash me-1"></i>
                                        Xóa tất cả
                                    </Button>
                                </div>
                            </div>

                            {(selectedServices.length > 0 || selectedParts.length > 0) ? (
                                <>
                                    {selectedServices.length > 0 && (
                                        <div className="mb-3">
                                            <h6 className="border-bottom pb-2">Dịch vụ đã chọn</h6>
                                            <ListGroup variant="flush">
                                                {selectedServices.map(serviceId => {
                                                    const service = servicesViews.find(s => s.service_id === serviceId);
                                                    if (!service) return null;
                                                    return (
                                                        <ListGroup.Item
                                                            key={serviceId}
                                                            className="px-0 py-2 d-flex justify-content-between align-items-center"
                                                            style={{ backgroundColor: 'transparent' }}
                                                        >
                                                            <div>
                                                                <div>{service.name}</div>
                                                                {service.price > 0 && (
                                                                    <small className="text-primary">
                                                                        {formatCurrency(service.price)}
                                                                    </small>
                                                                )}
                                                            </div>
                                                            <Button
                                                                variant="link"
                                                                className="text-danger p-0"
                                                                onClick={() => toggleServiceSelection(serviceId)}
                                                            >
                                                                <i className="bi bi-x-circle"></i>
                                                            </Button>
                                                        </ListGroup.Item>
                                                    );
                                                })}
                                            </ListGroup>
                                        </div>
                                    )}

                                    {selectedParts.length > 0 && (
                                        <>
                                        <h6 className="border-bottom pb-2">Phụ tùng đã chọn</h6>
                                        <ListGroup variant="flush">
                                            {selectedParts.map(partId => {
                                                const part = partsViews.find(p => p.part_id === partId);
                                                if (!part) return null;
                                                const quantity = partQuantities[partId] || 1;
                                                return (
                                                    <ListGroup.Item
                                                        key={partId}
                                                        className="px-0 py-2 d-flex justify-content-between align-items-center"
                                                        style={{ backgroundColor: 'transparent' }}
                                                    >
                                                        <div>
                                                            <div>{part.name}</div>
                                                            <div className="d-flex align-items-center">
                                                                <small className="text-muted me-2">{part.unit || 'Cái'} x{quantity}</small>
                                                                {part.price > 0 && (
                                                                    <small className="text-primary">
                                                                        {formatCurrency(part.price * quantity)}
                                                                    </small>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="link"
                                                            className="text-danger p-0"
                                                            onClick={() => togglePartSelection(partId)}
                                                        >
                                                            <i className="bi bi-x-circle"></i>
                                                        </Button>
                                                    </ListGroup.Item>
                                                );
                                            })}
                                        </ListGroup>
                                        </>
                                    )}

                                    {(selectedParts.length > 0 || selectedServices.length > 0) && (
                                        // Hiển thị tổng tiền
                                        <div className="mt-3 pt-2 border-top d-flex justify-content-between">
                                            <span className="fw-medium">Tổng cộng:</span>
                                            <span className="fw-bold">
                                                {formatCurrency(
                                                    // Tính tổng tiền phụ tùng
                                                    selectedParts.reduce((total, partId) => {
                                                        const part = partsViews.find(p => p.part_id === partId);
                                                        if (!part) return total;
                                                        const quantity = partQuantities[partId] || 1;
                                                        return total + (part.price * quantity);
                                                    }, 0) +
                                                    // Tính tổng tiền dịch vụ
                                                    selectedServices.reduce((total, serviceId) => {
                                                        const service = servicesViews.find(s => s.service_id === serviceId);
                                                        if (!service) return total;
                                                        return total + service.price;
                                                    }, 0)
                                                )}
                                            </span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center" style={{ paddingTop: "100px" }}>
                                    <i className="bi bi-cart text-muted fs-1 d-block mb-2"></i>
                                    <p className="text-muted mb-0">Chưa có mục nào được chọn</p>
                                    <p className="text-muted small">Vui lòng chọn dịch vụ và phụ tùng từ tab bên trái</p>
                                </div>
                            )}
                        </div>
                    </Col>
                </Row>
            </>
        );
    };

    return (
        <Modal show={show} onHide={onHide} size="xl">
            <Modal.Header closeButton>
                <Modal.Title>Cập nhật kiểm tra xe #{currentOrder?.orderId}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {currentOrder && (
                    <>
                        <Row className="mb-3">
                            <Col md={6}>
                                <p className="mb-1"><strong>Mã đơn:</strong> {currentOrder.orderId}</p>
                                <p className="mb-0"><strong>Khách hàng:</strong> {currentOrder.customerName} - {currentOrder.customerPhone}</p>
                            </Col>
                            <Col md={6}>
                                <p className="mb-1"><strong>Xe:</strong> {currentOrder.motorcycleModel}</p>
                                <p className="mb-0"><strong>Biển số:</strong> {currentOrder.plateNumber}</p>
                            </Col>
                        </Row>

                        <Tabs
                            activeKey={activeTab}
                            onSelect={(k) => setActiveTab(k)}
                            className="mb-3"
                        >
                            <Tab eventKey="status" title={<span><i className="bi bi-clipboard-check me-1"></i>Kết quả kiểm tra</span>}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Chuẩn đoán / Vấn đề phát hiện</Form.Label>
                                    <Form.Control
                                        disabled={!currentOrder.hasDiagnosis}
                                        as="textarea"
                                        rows={5}
                                        value={updateData.diagnosisProblem}
                                        onChange={(e) => setUpdateData({ ...updateData, diagnosisProblem: e.target.value })}
                                        placeholder="Nhập chuẩn đoán, vấn đề phát sinh, v.v."
                                    />
                                </Form.Group>
                                
                                <Alert variant="info">
                                    <i className="bi bi-info-circle me-2"></i>
                                    Sau khi hoàn thành kiểm tra, đơn hàng sẽ được chuyển sang trạng thái "Chờ xác nhận" để khách hàng phê duyệt.
                                </Alert>
                            </Tab>
                            <Tab eventKey="parts" title={<span><i className="bi bi-box-seam me-1"></i>Dịch vụ & Phụ tùng</span>}>
                                {renderPartsSelection({ partsViews: partsViewsByMotoTypeId[currentOrder.motorTypeId], servicesViews: servicesViewsByParentMotoType[currentOrder.parentMotoType] })}
                            </Tab>
                        </Tabs>
                    </>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Hủy
                </Button>
                <Button
                    variant="warning"
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? 'Đang xử lý...' : 'Hoàn thành kiểm tra'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default InspectionModal;
