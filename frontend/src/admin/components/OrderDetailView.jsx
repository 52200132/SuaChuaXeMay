import React, { useEffect, useState } from 'react';
import { Row, Col, Table } from 'react-bootstrap';
import PropTypes from 'prop-types';
import { useAppData } from '../contexts/AppDataContext';
import { resourceService, repairService } from '../../services/api';

/**
 * A component for displaying detailed order information including parts and services.
 * Uses AppDataContext to cache parts and services data.
 * Auto-fetches order details when necessary.
 */
const OrderDetailView = ({
    currentOrder,
    formatCurrency,
    partOrderDetails: propPartOrderDetails,
    serviceOrderDetails: propServiceOrderDetails,
}) => {
    // Local state for order details
    const [partOrderDetails, setPartOrderDetails] = useState(propPartOrderDetails || []);
    const [serviceOrderDetails, setServiceOrderDetails] = useState(propServiceOrderDetails || []);
    const [isLoading, setIsLoading] = useState(false);

    // Get data from AppDataContext
    const { 
        getData, 
        setData,
        getAllData, 
        fetchAndStoreData,
        loading: contextLoading
    } = useAppData();
    
    // Get cached parts, services and moto type data
    const partsData = getAllData('parts');
    const servicesData = getAllData('services');
    const motorTypeId = currentOrder?.motoTypeId;
    
    // Fetch parts and services data if not already in context
    useEffect(() => {
        const fetchPartsAndServices = async () => {
            // Only fetch if we don't already have the data
            if (partsData.length === 0) {
                await fetchAndStoreData('parts', resourceService.part.getAllParts, 'part_id');
            }
            
            if (servicesData.length === 0) {
                await fetchAndStoreData('services', resourceService.service.getAllServices, 'service_id');
            }
        };
        
        fetchPartsAndServices();
    }, [fetchAndStoreData, partsData.length, servicesData.length]);

    // Fetch moto type specific data for parts and services if needed
    useEffect(() => {
        if (!motorTypeId) return;

        const fetchMotoTypeData = async () => {
            // Check if we already have moto type specific data in context
            const partMotoTypes = getData(`partMotoTypes_${motorTypeId}`);
            const serviceMotoTypes = getData(`serviceMotoTypes_${motorTypeId}`);

            if (!partMotoTypes) {
                try {
                    const response = await resourceService.partMotoType.getAllPartMotoTypesByMotoTypeId(motorTypeId);
                    setData(`partMotoTypes_${motorTypeId}`, response.data);
                } catch (error) {
                    console.error(`Error fetching part moto types for moto_type_id=${motorTypeId}:`, error);
                }
            }

            if (!serviceMotoTypes) {
                try {
                    const response = await resourceService.serviceMotoType.getAllServiceMotoTypesByMotoTypeId(motorTypeId);
                    setData(`serviceMotoTypes_${motorTypeId}`, response.data);
                } catch (error) {
                    console.error(`Error fetching service moto types for moto_type_id=${motorTypeId}:`, error);
                }
            }
        };

        fetchMotoTypeData();
    }, [motorTypeId, getData, setData]);

    // Fetch order details if they weren't provided via props
    useEffect(() => {
        const fetchOrderDetails = async () => {
            if (!currentOrder?.orderId) return;
            
            // Skip fetching if data was already provided via props
            if ((propPartOrderDetails && propPartOrderDetails.length > 0) || 
                (propServiceOrderDetails && propServiceOrderDetails.length > 0)) {
                return;
            }
            
            setIsLoading(true);
            try {
                const [partDetails, serviceDetails] = await Promise.all([
                    fetchPartOrderDetails(currentOrder.orderId),
                    fetchServiceOrderDetails(currentOrder.orderId)
                ]);
                // console.log('Check data', partDetails, serviceDetails);
                
                setPartOrderDetails(partDetails);
                setServiceOrderDetails(serviceDetails);
            } catch (error) {
                console.error('Error loading order details:', error);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchOrderDetails();
    }, [currentOrder?.orderId, propPartOrderDetails, propServiceOrderDetails]);

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

    // Helper to find part info by ID with price from moto type specific data
    const findPartById = (partId) => {
        // Get base part info from context
        const partInfo = getData('parts', partId) || { name: `Phụ tùng #${partId}`, unit: 'cái' };
        
        // If we have moto type specific data, get the price
        if (motorTypeId) {
            const partMotoTypes = getData(`partMotoTypes_${motorTypeId}`);
            if (partMotoTypes) {
                // Ensure partMotoTypes is an array before using find
                const partMotoTypeArray = Array.isArray(partMotoTypes) ? partMotoTypes : Object.values(partMotoTypes);
                const partMotoType = partMotoTypeArray.find(p => p.part_id === partId);
                if (partMotoType) {
                    return { ...partInfo, price: partMotoType.price };
                }
            }
        }
        
        return partInfo;
    };

    // Helper to find service info by ID with price from moto type specific data
    const findServiceById = (serviceId) => {
        // Get base service info from context
        const serviceInfo = getData('services', serviceId) || { name: `Dịch vụ #${serviceId}` };
        
        // If we have moto type specific data, get the price
        if (motorTypeId) {
            const serviceMotoTypes = getData(`serviceMotoTypes_${motorTypeId}`);
            if (serviceMotoTypes) {
                // Ensure serviceMotoTypes is an array before using find
                const serviceMotoTypeArray = Array.isArray(serviceMotoTypes) ? serviceMotoTypes : Object.values(serviceMotoTypes);
                const serviceMotoType = serviceMotoTypeArray.find(s => s.service_id === serviceId);
                if (serviceMotoType) {
                    return { ...serviceInfo, price: serviceMotoType.price };
                }
            }
        }
        
        return serviceInfo;
    };

    if (isLoading || contextLoading?.parts || contextLoading?.services) {
        return (
            <div className="text-center py-4">
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                    <span className="visually-hidden">Đang tải...</span>
                </div>
                <p className="mt-2 text-muted">Đang tải chi tiết đơn hàng...</p>
            </div>
        );
    }

    // Filter selected items
    const selectedParts = partOrderDetails.filter(item => item.is_selected);
    const selectedServices = serviceOrderDetails.filter(item => item.is_selected);

    // Calculate totals
    const selectedPartsTotal = selectedParts.reduce((total, part) => {
        return total + (part.price);
    }, 0);

    const selectedServicesTotal = selectedServices.reduce((total, service) => {
        return total + service.price;
    }, 0);

    const selectedTotal = selectedPartsTotal + selectedServicesTotal;

    return (
        <div className="order-details mt-4">
            <h6 className="mb-3 border-bottom pb-2">Chi tiết đơn hàng</h6>
            
            <Row>
                <Col md={6}>
                    <h6 className="text-muted">Tất cả mục</h6>
                    <div className="p-3 bg-light rounded mb-3">
                        {partOrderDetails.length > 0 && (
                            <div className="mb-3">
                                <h6 className="border-bottom pb-2">Phụ tùng</h6>
                                <Table size="sm" className="mt-2">
                                    <thead>
                                        <tr>
                                            <th>Tên</th>
                                            <th>SL</th>
                                            <th>Đơn giá</th>
                                            <th>Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {partOrderDetails.map(part => {
                                            const partInfo = findPartById(part.part_id);
                                            // console.log('Part Info', partInfo, part);
                                            const unitPrice = part.quantity ? part.price / part.quantity : 0;
                                            return (
                                                <tr key={part.part_detail_ID || `part-${part.part_id}-${Math.random()}`} 
                                                    className={part.is_selected ? 'table-success' : ''}>
                                                    <td>{partInfo?.name}</td>
                                                    <td>{part.quantity}</td>
                                                    <td>{formatCurrency(unitPrice)}</td>
                                                    <td>{formatCurrency(part.price)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </Table>
                            </div>
                        )}

                        {serviceOrderDetails.length > 0 && (
                            <div>
                                <h6 className="border-bottom pb-2">Dịch vụ</h6>
                                <Table size="sm" className="mt-2">
                                    <thead>
                                        <tr>
                                            <th>Tên</th>
                                            <th>Giá</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {serviceOrderDetails.map(service => {
                                            const serviceInfo = findServiceById(service.service_id);
                                            return (
                                                <tr key={service.service_detail_ID || `service-${service.service_id}-${Math.random()}`}
                                                    className={service.is_selected ? 'table-success' : ''}>
                                                    <td>{serviceInfo?.name}</td>
                                                    <td>{formatCurrency(service.price)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </Table>
                            </div>
                        )}

                        {partOrderDetails.length === 0 && serviceOrderDetails.length === 0 && (
                            <p className="text-center text-muted my-3">Chưa có phụ tùng và dịch vụ</p>
                        )}
                    </div>
                </Col>
                
                <Col md={6}>
                    <h6 className="text-muted">Mục đã chọn</h6>
                    <div className="p-3 bg-light rounded mb-3">
                        {selectedParts.length > 0 && (
                            <div className="mb-3">
                                <h6 className="border-bottom pb-2">Phụ tùng đã chọn</h6>
                                <Table size="sm" className="mt-2">
                                    <thead>
                                        <tr>
                                            <th>Tên</th>
                                            <th>SL</th>
                                            <th>Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedParts.map(part => {
                                            const partInfo = findPartById(part.part_id);
                                            return (
                                                <tr key={part.part_detail_ID || `selected-part-${part.part_id}-${Math.random()}`}>
                                                    <td>{partInfo?.name}</td>
                                                    <td>{part.quantity}</td>
                                                    <td>{formatCurrency(part.price)}</td>
                                                </tr>
                                            );
                                        })}
                                        <tr className="fw-bold">
                                            <td colSpan={2}>Tổng phụ tùng:</td>
                                            <td>{formatCurrency(selectedPartsTotal)}</td>
                                        </tr>
                                    </tbody>
                                </Table>
                            </div>
                        )}

                        {selectedServices.length > 0 && (
                            <div className="mb-3">
                                <h6 className="border-bottom pb-2">Dịch vụ đã chọn</h6>
                                <Table size="sm" className="mt-2">
                                    <thead>
                                        <tr>
                                            <th>Tên</th>
                                            <th>Giá</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedServices.map(service => {
                                            const serviceInfo = findServiceById(service.service_id);
                                            return (
                                                <tr key={service.service_detail_ID || `selected-service-${service.service_id}-${Math.random()}`}>
                                                    <td>{serviceInfo?.name}</td>
                                                    <td>{formatCurrency(service.price)}</td>
                                                </tr>
                                            );
                                        })}
                                        <tr className="fw-bold">
                                            <td>Tổng dịch vụ:</td>
                                            <td>{formatCurrency(selectedServicesTotal)}</td>
                                        </tr>
                                    </tbody>
                                </Table>
                            </div>
                        )}

                        {/* Display price summary */}
                        <div className="price-summary mt-3 pt-2 border-top">
                            <Row className="mb-2">
                                <Col xs={6}>
                                    <span className="fw-medium">Tổng tiền đã chọn:</span>
                                </Col>
                                <Col xs={6} className="text-end">
                                    <span className="fw-bold">{formatCurrency(selectedTotal)}</span>
                                </Col>
                            </Row>
                            
                            {currentOrder?.estimatedCost > 0 && (
                                <Row className="mb-2">
                                    <Col xs={6}>
                                        <span className="fw-medium">Chi phí dự kiến:</span>
                                    </Col>
                                    <Col xs={6} className="text-end">
                                        <span className="fw-bold">{formatCurrency(currentOrder.estimatedCost)}</span>
                                    </Col>
                                </Row>
                            )}
                            
                            <Row>
                                <Col xs={6}>
                                    <span className="fw-medium">Tổng tiền đơn hàng:</span>
                                </Col>
                                <Col xs={6} className="text-end">
                                    <span className="fw-bold text-danger">{formatCurrency(currentOrder?.totalAmount || 0)}</span>
                                </Col>
                            </Row>
                        </div>

                        {selectedParts.length === 0 && selectedServices.length === 0 && (
                            <p className="text-center text-muted my-3">Chưa có mục nào được chọn</p>
                        )}
                    </div>
                </Col>
            </Row>
        </div>
    );
};

OrderDetailView.propTypes = {
    currentOrder: PropTypes.object.isRequired,
    formatCurrency: PropTypes.func.isRequired,
    partOrderDetails: PropTypes.array,
    serviceOrderDetails: PropTypes.array,
};

export default OrderDetailView;
