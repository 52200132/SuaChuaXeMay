import React, { useState } from 'react';
import { Modal, Button, Row, Col, Alert, Table, Form } from 'react-bootstrap';

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const UpdateDetailModal = ({ 
    show, 
    onHide, 
    currentOrder,
    partOrderDetailsData,
    serviceOrderDetailsData,
    detailsLoading,
    onSubmit,
    getData
}) => {
    // State cho các mục đã chọn
    const [selectedItems, setSelectedItems] = useState({ parts: new Set(), services: new Set() });

    // Toggle chọn phụ tùng
    const togglePartSelection = (partDetailId) => {
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

    // Toggle chọn dịch vụ
    const toggleServiceSelection = (serviceDetailId) => {
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

    // Chọn tất cả phụ tùng
    const selectAllParts = () => {
        setSelectedItems(prev => ({
            ...prev,
            parts: new Set(partOrderDetailsData.map(part => part.part_detail_ID))
        }));
    };

    // Bỏ chọn tất cả phụ tùng
    const deselectAllParts = () => {
        setSelectedItems(prev => ({
            ...prev,
            parts: new Set()
        }));
    };

    // Chọn tất cả dịch vụ
    const selectAllServices = () => {
        setSelectedItems(prev => ({
            ...prev,
            services: new Set(serviceOrderDetailsData.map(service => service.service_detail_ID))
        }));
    };

    // Bỏ chọn tất cả dịch vụ
    const deselectAllServices = () => {
        setSelectedItems(prev => ({
            ...prev,
            services: new Set()
        }));
    };

    // Tính tổng chi phí đã chọn
    const calculateTotalSelectedAmount = () => {
        const partsTotal = partOrderDetailsData
            .filter(part => selectedItems.parts.has(part.part_detail_ID))
            .reduce((sum, part) => sum + (part.price), 0);

        const servicesTotal = serviceOrderDetailsData
            .filter(service => selectedItems.services.has(service.service_detail_ID))
            .reduce((sum, service) => sum + service.price, 0);

        return partsTotal + servicesTotal;
    };

    // Xử lý khi submit form
    const handleSubmit = () => {
        // Tạo danh sách các phụ tùng và dịch vụ được chọn
        const updatedPartDetails = partOrderDetailsData.map(part => ({
            ...part,
            is_selected: selectedItems.parts.has(part.part_detail_ID)
        }));
        
        const updatedServiceDetails = serviceOrderDetailsData.map(service => ({
            ...service,
            is_selected: selectedItems.services.has(service.service_detail_ID)
        }));

        const totalSelectedAmount = calculateTotalSelectedAmount();

        onSubmit({
            partDetails: updatedPartDetails,
            serviceDetails: updatedServiceDetails,
            totalAmount: totalSelectedAmount
        });
    };

    // Reset selected items when modal is shown with new data
    React.useEffect(() => {
        if (show) {
            const selectedParts = new Set(partOrderDetailsData?.filter(part => part.is_selected).map(part => part.part_detail_ID) || []);
            const selectedServices = new Set(serviceOrderDetailsData?.filter(service => service.is_selected).map(service => service.service_detail_ID) || []);
            setSelectedItems({ parts: selectedParts, services: selectedServices });
        }
    }, [show, partOrderDetailsData, serviceOrderDetailsData]);

    return (
        <Modal
            show={show}
            onHide={onHide}
            size="lg"
            backdrop="static"
        >
            <Modal.Header closeButton>
                <Modal.Title>Cập nhật chi tiết đơn hàng #{currentOrder?.orderId}</Modal.Title>
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
                                <p className="mb-0"><strong>Khách hàng:</strong> {currentOrder?.customerName} - {currentOrder?.customerPhone}</p>
                            </Col>
                            <Col md={6}>
                                <p className="mb-1"><strong>Xe:</strong> {currentOrder?.motorcycleModel}</p>
                                <p className="mb-0"><strong>Biển số:</strong> {currentOrder?.plateNumber}</p>
                            </Col>
                        </Row>
                        
                        <Alert variant="info">
                            <i className="bi bi-info-circle me-2"></i>
                            Chọn các phụ tùng và dịch vụ cần sử dụng cho đơn hàng này. Đơn hàng sẽ tự động chuyển sang trạng thái "Đang sửa chữa".
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
                                        <th>Mã</th>
                                        <th>Tên phụ tùng</th>
                                        <th style={{ width: '100px' }}>Số lượng</th>
                                        <th style={{ width: '150px' }}>Đơn giá</th>
                                        <th style={{ width: '150px' }}>Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {partOrderDetailsData?.length > 0 ? (
                                        partOrderDetailsData.map(part => {
                                            const partInfo = getData('parts', part.part_id) || { name: `Phụ tùng #${part.part_id}` };
                                            const isSelected = selectedItems.parts.has(part.part_detail_ID);
                                            const unitPrice = part.quantity > 0 ? part.price / part.quantity : 0;
                                            
                                            return (
                                                <tr 
                                                    key={part.part_detail_ID} 
                                                    className={isSelected ? 'table-success' : ''}
                                                    onClick={() => togglePartSelection(part.part_detail_ID)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <td className="text-center">
                                                        <Form.Check
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => togglePartSelection(part.part_detail_ID)}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </td>
                                                    <td>{part.part_id}</td>
                                                    <td>{partInfo.name}</td>
                                                    <td>{part.quantity}</td>
                                                    <td>{formatCurrency(unitPrice)}</td>
                                                    <td>{formatCurrency(part.price)}</td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="text-center py-3">Không có phụ tùng nào</td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot className="table-light">
                                    <tr>
                                        <td colSpan="5" className="text-end fw-bold">Tổng tiền phụ tùng đã chọn:</td>
                                        <td className="fw-bold">
                                            {formatCurrency(
                                                partOrderDetailsData
                                                    ?.filter(part => selectedItems.parts.has(part.part_detail_ID))
                                                    .reduce((sum, part) => sum + (part.price), 0) || 0
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
                                        <th>Mã</th>
                                        <th>Tên dịch vụ</th>
                                        <th style={{ width: '150px' }}>Giá</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {serviceOrderDetailsData?.length > 0 ? (
                                        serviceOrderDetailsData.map(service => {
                                            const serviceInfo = getData('services', service.service_id) || { name: `Dịch vụ #${service.service_id}` };
                                            const isSelected = selectedItems.services.has(service.service_detail_ID);
                                            return (
                                                <tr 
                                                    key={service.service_detail_ID} 
                                                    className={isSelected ? 'table-success' : ''}
                                                    onClick={() => toggleServiceSelection(service.service_detail_ID)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <td className="text-center">
                                                        <Form.Check
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => toggleServiceSelection(service.service_detail_ID)}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </td>
                                                    <td>{service.service_id}</td>
                                                    <td>{serviceInfo.name}</td>
                                                    <td>{formatCurrency(service.price)}</td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="text-center py-3">Không có dịch vụ nào</td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot className="table-light">
                                    <tr>
                                        <td colSpan="3" className="text-end fw-bold">Tổng tiền dịch vụ đã chọn:</td>
                                        <td className="fw-bold">
                                            {formatCurrency(
                                                serviceOrderDetailsData
                                                    ?.filter(service => selectedItems.services.has(service.service_detail_ID))
                                                    .reduce((sum, service) => sum + service.price, 0) || 0
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
                                    {formatCurrency(calculateTotalSelectedAmount())}
                                </h5>
                            </div>
                        </div>
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Hủy
                </Button>
                <Button
                    variant="success"
                    onClick={handleSubmit}
                    disabled={detailsLoading}
                >
                    {detailsLoading ? 'Đang xử lý...' : 'Xác nhận và bắt đầu sửa chữa'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default UpdateDetailModal;
