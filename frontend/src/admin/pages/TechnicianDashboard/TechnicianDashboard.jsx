import { useState, useEffect, use } from 'react';
import {
    Card, Table, Button, Row, Col, Form,
    InputGroup, Badge, Modal, Tabs, Tab,
    ProgressBar, ListGroup, Alert
} from 'react-bootstrap';
import { useAppData } from '../../contexts/AppDataContext';
import { useStaffAuth } from '../../contexts/StaffAuthContext';
import { repairService, resourceService, repairService2 } from '../../../services/api';
import StatusBadge from '../../components/StatusBadge';
import CustomModal from '../../components/CustomModal';
import OrderDetailView from '../../components/OrderDetailView';
import './TechnicianDashboard.css';
import pusher, {} from '../../../services/pusher';
import InspectionModal from './Modals/InspectionModal';
import UpdateDetailModal from './Modals/UpdateDetailModal';

// Constants
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

// Helper functions (moved outside component)
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const getProgressPercentage = (status) => {
    const progressMap = {
        'received': 10,
        'checking': 30,
        'wait_confirm': 50,
        'repairing': 70,
        'wait_delivery': 90,
        'delivered': 100
    };
    return progressMap[status] || 0;
};

const TechnicianDashboard = () => {
    // Context and data state
    const { currentStaff } = useStaffAuth();
    const { getData, setData, loading, getIds, channel } = useAppData();
    const ordersById = getData('orders');
    const customersById = getData('customers');
    const motorcyclesById = getData('motorcycles');
    const diagnosisById = getData('diagnosis');
    const receptionsById = getData('receptions');

    // Orders state
    const [localLoading, setLocalLoading] = useState(true);

    const [filteredOrdersIds, setFilteredOrdersIds] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    // Current order and modal state
    const [currentOrder, setCurrentOrder] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [showAcceptModal, setShowAcceptModal] = useState(false); // Add state for accept modal
    const [isAcceptingOrder, setIsAcceptingOrder] = useState(false); // Add loading state for accepting orders
    const [showCompleteRepairModal, setShowCompleteRepairModal] = useState(false); // Add state for complete repair modal

    // Update state form state
    const [updateData, setUpdateData] = useState({
        diagnosisProblem: '',
        estimatedCost: 0,
        notes: ''
    });

    // Parts state
    const [partsViewsByMotoTypeId, setPartsViewsByMotoTypeId] = useState({});
    
    // Services state
    const [servicesViewsByParentMotoType, setServicesViewsByParentMotoTypeId] = useState({});

    // Motorcycle state
    const [motoTypeId, setMotoTypeId] = useState(null);

    // Statistics state
    const [stats, setStats] = useState({
        totalOrders: 0,
        inProgress: 0,
        pendingConfirmation: 0,
        completed: 0,
        todayOrders: 0
    });

    // useState cho hoàn thành đơn hàng
    const [completeLoading, setCompleteLoading] = useState(false);

    // Add new state variables for the update details modal
    const [showUpdateDetailsModal, setShowUpdateDetailsModal] = useState(false);
    const [partOrderDetailsData, setPartOrderDetailsData] = useState([]);
    const [serviceOrderDetailsData, setServiceOrderDetailsData] = useState([]);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [selectedItems, setSelectedItems] = useState({ parts: new Set(), services: new Set() });

    // Format order data for display
    const formatOrderData = (order, customer, motorcycle, diagnosis, reception) => {
        const [createdAtDate, createdAtTime] = order.created_at?.split('T') || ['', ''];
        return {
            initialConditon: reception?.initial_conditon || 'Không có thông tin',
            motorcycleId: order.motocycle_id,
            motorTypeId: motorcycle?.moto_type_id,
            parentMotoType: motorcycle?.type,
            orderId: order.order_id,
            originalData: order,
            customerName: customer?.fullname || 'Không có thông tin',
            customerPhone: customer?.phone_num || '',
            plateNumber: motorcycle?.license_plate || 'Không có thông tin',
            motorcycleModel: `${motorcycle?.brand || ''} ${motorcycle?.model || ''}`.trim() || 'Không có thông tin',
            status: STATUS_MAPPING[order.status] || order.status,
            rawStatus: order.status,
            totalAmount: order.total_price || 0,
            createdDate: createdAtDate || '',
            createdTime: createdAtTime?.substring(0, 5) || '',
            diagnosisProblem: diagnosis?.problem || '',
            progressPercentage: getProgressPercentage(order.status),
            note: reception?.note || 'Không có ghi chú',
            estimatedCost: diagnosis?.estimated_cost || 0,
            hasDiagnosis: diagnosis?.diagnosis_id ? true : false,
        };
    };

    const formatServiceData = (service, servicesMotoType) => {
        return {
            serviceId: service.service_id,
            serviceMotoTypeId: servicesMotoType.service_mototype_id,
            serviceName: service.name || 'Không có thông tin',
            serviceDescription: service.description,
            servicePrice: servicesMotoType.price || 0,
        };
    }

    const formatPartData = (part, partMotoType) => {
        return {
            partId: part.part_id,
            partMotoTypeId: partMotoType.part_mototype_id,
            partName: part.name || 'Không có thông tin',
            partCode: part.code,
            partUnit: part.unit || 'Cái',
            partPrice: partMotoType.price || 0,
        };
    }

    const createOrderDisplay = (orderId) => {
        const order = ordersById[orderId];
        const motorcycle = motorcyclesById[order.motocycle_id];
        const customer = customersById[motorcycle?.customer_id];
        const diagnosis = diagnosisById[orderId];
        const reception = receptionsById[diagnosis?.form_id];

        return formatOrderData(order, customer, motorcycle, diagnosis, reception);
    }

    // Đăng ký kênh Pusher cho kỹ thuật viên
    useEffect(() => {
        const channel = pusher.subscribe(`technician`);
        return () => {
        };
    }, []);

    // TODO: check points for loading data
    useEffect(() => {
        setLocalLoading(true);
        if (loading['orders'] || loading['customers'] || loading['motorcycles'] || loading['diagnosis'] || loading['receiptions']) return;
        setFilteredOrdersIds(getIds('orders'));
        updateStats(getData('ordersIds'))
        setLocalLoading(false);
    }, [loading]);

    // TODO: Khi load dữ liệu xong
    useEffect(() => {
        if (!localLoading) {
            // setFilteredOrdersIds(getIds('orders'));
        }
    }, [localLoading, ordersById]);

    // Update statistics
    const updateStats = (orderIds = new Set()) => {
        const today = new Date().toISOString().split('T')[0];
        const setIdsIterator = orderIds.entries();
        const tempStats = {
            totalOrders: 0,
            inProgress: 0,
            pendingConfirmation: 0,
            completed: 0,
            todayOrders: 0
        };
        setIdsIterator.forEach(([key, value]) => {
            const order = ordersById[value];
            if (order) {    
                tempStats.totalOrders += 1;
                if (order.status === 'repairing') tempStats.inProgress += 1;
                if (order.status === 'wait_confirm') tempStats.pendingConfirmation += 1;
                if (['wait_delivery', 'delivered'].includes(order.status)) tempStats.completed += 1;
                if (order.created_at.split('T')[0] === today) tempStats.todayOrders += 1;
            }
        })

        setStats(tempStats);
    };

    // Filter orders based on tab and search term
    const filterOrders = (tab, term) => {
        let filtered = getIds('orders');

        // Filter by tab
        if (tab !== 'all') {
            switch (tab) {
                case 'new':
                    filtered = filtered.filter(id =>
                        ['received', 'checking'].includes(createOrderDisplay(id).rawStatus));
                    break;
                case 'in-progress':
                    filtered = filtered.filter(id =>
                        createOrderDisplay(id).rawStatus === 'repairing');
                    break;
                case 'pending-confirmation':
                    filtered = filtered.filter(id =>
                        createOrderDisplay(id).rawStatus === 'wait_confirm');
                    break;
                case 'completed':
                    filtered = filtered.filter(id =>
                        ['wait_delivery', 'delivered'].includes(createOrderDisplay(id).rawStatus));
                    break;
                default:
                    break;
            }
        }

        // Filter by search term
        if (term) {
            filtered = filtered.filter(id => {
                const order = createOrderDisplay(id);
                return order.orderId.toString().toLowerCase().includes(term) ||
                    order.customerName.toLowerCase().includes(term) ||
                    order.customerPhone.includes(term) ||
                    order.plateNumber.toLowerCase().includes(term) ||
                    order.motorcycleModel.toLowerCase().includes(term);
            });
        }

        setFilteredOrdersIds(filtered);
    };

    // Handle tab change
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        filterOrders(tab, searchTerm);
    };

    // Handle search input change
    const handleSearch = (e) => {
        const term = e.target.value.toLowerCase();
        setSearchTerm(term);
        filterOrders(activeTab, term);
    };

    // Handle accepting an order
    const handleAcceptOrder = async (orderId) => {
        if (!orderId) return;
        
        const order = createOrderDisplay(orderId);
        setCurrentOrder(order);
        setShowAcceptModal(true);
    };

    // Confirm accepting an order
    const confirmAcceptOrder = async () => {
        if (!currentOrder) return;

        try {
            setIsAcceptingOrder(true);
            // Call API to update order status to "checking"
            const response = await repairService.order.updateOrderStatus(currentOrder.orderId, 'checking');
            setData('orders', response.data, response.data.order_id);
            console.log(`Technician accepted order #${currentOrder.orderId}`);
            // Close modal
            setShowAcceptModal(false);
            alert('Đã nhận đơn hàng thành công!');
        } catch (error) {
            console.error('Error accepting order:', error);
            alert('Có lỗi xảy ra khi nhận đơn. Vui lòng thử lại sau.');
        } finally {
            setIsAcceptingOrder(false);
        }
    };

    // TODO: fetch - Lấy dữ liệu phụ tùng theo id loại xe
    const fetchPartsViewsByMotoType = async (motoTypeId) => {
        if (!motoTypeId) return;

        if (partsViewsByMotoTypeId[motoTypeId]) return;

        try {
            const response = await repairService2.part.getPartViewsByMotoTypeId(motoTypeId);
            setPartsViewsByMotoTypeId(prev => {
                return {
                    ...prev,
                    [motoTypeId]: response.data
                };
            });
        } catch (error) {
            console.error('Có lỗi xảy ra khi tải dữ liệu phụ tùng: ', error);
        }
    }

    const fetchServicesViewsByParentMotoType = async (parentMotoType) => {
        console.log('Fetch dữ liệu dịch vụ theo loại xe cha: ', parentMotoType);
        if (!parentMotoType) return;

        if (servicesViewsByParentMotoType[parentMotoType]) return;

        try {
            const response = await repairService2.service.getServiceViewsByParentMotoType(parentMotoType);
            setServicesViewsByParentMotoTypeId(prev => {
                return {
                    ...prev,
                    [parentMotoType]: response.data
                };
            });
        } catch (error) {
            console.error('Có lỗi xảy ra khi tải dữ liệu dịch vụ: ', error);
        }
    }

    // useEffect(() => {console.log(servicesViewsByParentMotoType)}, [servicesViewsByParentMotoType]);

    // Open vehicle inspection modal (renamed from handleShowUpdateModal)
    const handleShowInspectionModal = (orderId) => {
        const order = createOrderDisplay(orderId);
        console.log('Opening inspection modal for order:', order);
        
        // Check if order is in received status and prevent editing
        if (order.rawStatus === 'received') {
            alert('Bạn cần nhận đơn trước khi có thể chỉnh sửa!');
            return;
        }
        
        setCurrentOrder(order);
        fetchPartsViewsByMotoType(order.motorTypeId);
        fetchServicesViewsByParentMotoType(order.parentMotoType);

        // setUpdateData({
        //     diagnosisProblem: order.diagnosisProblem || '',
        //     estimatedCost: order.estimatedCost || 0,
        //     notes: order.note || ''
        // });

        // Reset parts and services selection
        // resetSelections();

        setShowUpdateModal(true);
    };

    // Reset selections when opening modal
    // const resetSelections = () => {
    //     setSelectedParts([]);
    //     setPartQuantities({});
    //     setSelectedServices([]);
    //     setActiveModalTab('status');
    //     setActiveCatalogTab('services');
    // };

    // Prepare order data for API
    // const calculateTotalPrice = (partsData, servicesData, motoTypeId, orderId) => {
    //     let totalPrice = 0;

    //     // Process parts
    //     const partOrderDetails = partsData.map((part) => {
    //         return {
    //             is_selected: false,
    //             order_id: orderId,
    //             part_id: part.part_id,
    //             quantity: part.quantity,
    //             price: parseInt(part.price) * parseInt(part.quantity),
    //         };
    //     });

    //     // Process services
    //     const serviceOrderDetails = servicesData.map((service) => {
    //         return {
    //             is_selected: false,
    //             order_id: orderId,
    //             service_id: service.service_id,
    //             price: parseInt(service.price)
    //         };
    //     });

    //     // Calculate total price
    //     partOrderDetails.forEach(item => {
    //         if (item) totalPrice += item.price;
    //     });

    //     serviceOrderDetails.forEach(item => {
    //         if (item) totalPrice += item.price;
    //     });

    //     console.log('Total order price:', totalPrice);

    //     return {
    //         totalPrice,
    //         partOrderDetails: partOrderDetails.filter(Boolean),
    //         serviceOrderDetails: serviceOrderDetails.filter(Boolean)
    //     };
    // };

    // Handle vehicle inspection submission (renamed from handleUpdateOrder)
    // const handleSubmitInspection = async () => {
    //     if (!currentOrder) return;

    //     try {
    //         // Prepare parts data
    //         const partsData = selectedParts.map(partId => {
    //             const motorcycle = motorcyclesById[currentOrder.originalData.motocycle_id];
    //             const part = formatPartData(parts[partId], partsMotoType[motorcycle.moto_type_id][partId]);
    //             if (!part) return null;

    //             return {
    //                 part_id: part.partId,
    //                 part_mototype_id: part.partMotoTypeId,
    //                 quantity: partQuantities[partId] || 1,
    //                 name: part.partName || '',
    //                 unit: part.partUnit || '',
    //                 price: part.partPrice || 0
    //             };
    //         }).filter(Boolean);

    //         // Prepare services data
    //         const servicesData = selectedServices.map(serviceId => {
    //             const motorcycle = motorcyclesById[currentOrder.originalData.motocycle_id];
    //             const service = formatServiceData(services[serviceId], servicesMotoType[motorcycle.moto_type_id][serviceId]);
    //             if (!service) return null;

    //             return {
    //                 service_id: service.serviceId,
    //                 service_mototype_id: service.serviceMotoTypeId,
    //                 name: service.serviceName || '',
    //                 price: service.servicePrice || 0
    //             };
    //         }).filter(Boolean);

    //         // Calculate total price and prepare order details
    //         const motoTypeId = motorcyclesById[currentOrder.motorcycleId].moto_type_id;
    //         const { totalPrice, partOrderDetails, serviceOrderDetails } =
    //             calculateTotalPrice(partsData, servicesData, motoTypeId, currentOrder.orderId);

    //         // Update diagnosis with new problem description and estimated cost
    //         if (currentOrder.hasDiagnosis === true) {
    //             await repairService.diagnosis.updateDiagnosis(
    //                 diagnosisById[currentOrder.orderId]?.diagnosis_id, 
    //                 updateData.diagnosisProblem, 
    //                 totalPrice
    //             );
    //         }
            
    //         // Create part and service order details
    //         await Promise.all([
    //             repairService.partOrderDetail.createPartOrderDetail(partOrderDetails),
    //             repairService.serviceOrderDetail.createServiceOrderDetail(serviceOrderDetails)
    //         ]);

    //         const orderU = null;
    //         // Set status to waiting for confirmation after inspection is complete
    //         if (currentOrder.rawStatus === 'checking') {
    //             const response = await repairService.order.updateOrderStatus(currentOrder.orderId, 'wait_confirm');
    //             setData('orders', response.data, response.data.order_id);
    //             orderU = response.data;
    //         }

    //         console.log('Inspection update data:', {
    //             orderId: currentOrder.orderId,
    //             diagnosisProblem: updateData.diagnosisProblem,
    //             parts: partOrderDetails,
    //             services: serviceOrderDetails,
    //             estimatedCost: totalPrice
    //         });

    //         // Update local state
    //         if (currentOrder.hasDiagnosis === true) {
    //             diagnosisById[currentOrder.orderId].problem = updateData.diagnosisProblem;
    //             const estimatedCost = diagnosisById[currentOrder.orderId].estimated_cost || 0;
    //             diagnosisById[currentOrder.orderId].estimated_cost = estimatedCost + totalPrice;
    //         }
    //         // TODO: event
    //         if (channel['order']) {
    //             console.log('Triggering order update event on Pusher channel');
    //             channel['order'].trigger('client-sendOrder', {
    //                 order_id: orderU?.order_id,
    //                 data: orderU,
    //             });
    //             const customerId = motorcyclesById[currentOrder.originalData.motocycle_id].customer_id;
    //             pusher.subscribe(`customer-${customerId}`).trigger('client-notification', {

    //                 title: 'Đã kiểm tra xe',
    //                 message: `Đơn hàng #${currentOrder.orderId} đã được kiểm tra. Vui lòng kiểm tra lại!`,
    //                 type: 'info',
    //                 timestamp: new Date().toISOString(),
    //                 id: Date.now().toString()
    //             });
    //         }
            
    //         setShowUpdateModal(false);
    //         alert('Cập nhật kiểm tra xe thành công!');
    //     } catch (error) {
    //         console.error('Error updating inspection:', error);
    //         alert('Cập nhật thất bại. Vui lòng thử lại sau!');
    //     }
    // };

    // Render statistics cards
    const renderStatCards = () => {
        return (
            <Row className="mb-4">
                <Col md={3}>
                    <Card className="shadow-sm dashboard-card">
                        <Card.Body>
                            <div className="stat-item">
                                <div className="stat-icon bg-primary-subtle">
                                    <i className="bi bi-list-check text-primary"></i>
                                </div>
                                <div className="stat-details">
                                    <h3>{stats.totalOrders}</h3>
                                    <p>Tổng đơn hàng</p>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="shadow-sm dashboard-card">
                        <Card.Body>
                            <div className="stat-item">
                                <div className="stat-icon bg-warning-subtle">
                                    <i className="bi bi-clock-history text-warning"></i>
                                </div>
                                <div className="stat-details">
                                    <h3>{stats.pendingConfirmation}</h3>
                                    <p>Chờ xác nhận</p>
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
                                    <h3>{stats.inProgress}</h3>
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
                                    <h3>{stats.completed}</h3>
                                    <p>Hoàn thành</p>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        );
    };

    // New handler for the inspection button in detail modal
    const handleModalInspectionClick = (orderId) => {
        setShowDetailModal(false);
        handleShowInspectionModal(orderId);
    };

    // Open order detail modal
    const handleViewDetail = (orderId) => {
        const order = createOrderDisplay(orderId);
        setMotoTypeId(order.motorTypeId);
        setCurrentOrder(order);
        setShowDetailModal(true);
    };

    // Add a new function to handle showing the update details modal
    const handleShowUpdateDetailsModal = async (orderId) => {
        const order = createOrderDisplay(orderId);
        
        // Only allow updating details for orders in "wait_confirm" status
        if (order.rawStatus !== 'wait_confirm') {
            alert('Chỉ có thể cập nhật chi tiết đơn hàng đang ở trạng thái chờ xác nhận');
            return;
        }
        
        setCurrentOrder(order);
        setDetailsLoading(true);
        
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
            
            setShowUpdateDetailsModal(true);
        } catch (error) {
            console.error('Error fetching order details:', error);
            alert('Không thể tải thông tin chi tiết đơn hàng');
        } finally {
            setDetailsLoading(false);
        }
    };

    // TODO: submit - Cập nhật chi tiết đơn hàng
    const handleSubmitOrderDetails = async (data) => {
        if (!currentOrder) return;
        
        setDetailsLoading(true);
        
        try {
            // Update part order details with is_selected field
            const updatedPartDetails = data.partDetails;
            const updatedServiceDetails = data.serviceDetails;
            const totalSelectedAmount = data.totalAmount;
            
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
            
            // Update order status to repairing if not already
            if (currentOrder.rawStatus === 'wait_confirm') {
                const response = await repairService.order.updateOrder(currentOrder.orderId, {
                    status: 'repairing',
                    total_price: totalSelectedAmount
                });
                await resourceService.invoice.createInvoice({
                    order_id: currentOrder.orderId,
                    total_price: currentOrder.totalAmount
                });
                setData('orders', response.data, response.data.order_id);

            }
            
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

    // Modify this function to show the confirmation modal first
    const handleCompleteRepairClick = (orderId) => {
        const order = createOrderDisplay(orderId);
        setCurrentOrder(order);
        setShowCompleteRepairModal(true);
    };

    // Keep the existing function but rename it to confirmCompleteRepairing
    const confirmCompleteRepairing = async () => {
        if (!currentOrder) return;
        
        setCompleteLoading(true);
        
        try {
            // TODO: Gọi api cập nhật trạng thái và tạo hóa đơn
            console.log(currentOrder);
            const [_, __] = await Promise.all([
                // resourceService.invoice.createInvoice({
                //     order_id: currentOrder.orderId,
                //     total_price: currentOrder.totalAmount
                // }),
                '',
                repairService.order.updateOrderStatus(currentOrder.orderId, 'wait_delivery')
            ]);
            setData('orders', __.data, __.data.order_id);

            // Close the modal after successful completion
            setShowCompleteRepairModal(false);
            alert('Đã hoàn thành sửa chữa thành công!');
        } catch (error) {
            console.log('Lỗi khi cập nhật hoàn thành', error);
            alert('Có lỗi xảy ra khi hoàn thành sửa chữa. Vui lòng thử lại sau.');
        } finally {
            setCompleteLoading(false);
        }
    };

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0">Đơn hàng của tôi</h5>
                <div className="tech-info">
                    <span className="me-2">
                        <i className="bi bi-person-badge me-1"></i>
                        {currentStaff?.fullname || 'Kỹ thuật viên'}
                    </span>
                    <Badge bg="info">
                        <i className="bi bi-tools me-1"></i>
                        {stats.todayOrders} đơn hôm nay
                    </Badge>
                </div>
            </div>
            {renderStatCards()}
            <Card className="shadow-sm mb-4">
                <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                    <Tabs
                        activeKey={activeTab}
                        onSelect={handleTabChange}
                        className="mb-0 border-0 tech-tabs"
                    >
                        <Tab eventKey="all" title={<span><i className="bi bi-grid-3x3-gap me-1"></i>Tất cả</span>} />
                        <Tab eventKey="new" title={<span><i className="bi bi-lightning me-1"></i>Mới tiếp nhận</span>} />
                        <Tab eventKey="pending-confirmation" title={<span><i className="bi bi-hourglass-split me-1"></i>Chờ xác nhận</span>} />
                        <Tab eventKey="in-progress" title={<span><i className="bi bi-gear-wide-connected me-1"></i>Đang sửa chữa</span>} />
                        {/* <Tab eventKey="wait_delivery" title={<span><i className="bi bi-truck me-1"></i>Chờ giao xe</span>} /> */}
                        <Tab eventKey="completed" title={<span><i className="bi bi-check2-all me-1"></i>Hoàn thành</span>} />
                    </Tabs>
                    <Form.Group className="search-box">
                        <InputGroup>
                            <Form.Control
                                placeholder="Tìm kiếm đơn hàng..."
                                value={searchTerm}
                                onChange={handleSearch}
                            />
                            <Button variant="outline-secondary">
                                <i className="bi bi-search"></i>
                            </Button>
                        </InputGroup>
                    </Form.Group>
                </Card.Header>

                <Card.Body className="p-0">
                    <div className="table-responsive">
                        <Table hover className="mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Mã đơn</th>
                                    <th>Khách hàng</th>
                                    <th>Thông tin xe</th>
                                    <th>Ngày nhận</th>
                                    <th>Trạng thái</th>
                                    <th>Tiến độ</th>
                                    <th style={{ width: "150px" }}>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {localLoading ? (
                                    <tr>
                                        <td colSpan="7" className="text-center py-4">
                                            <div className="spinner-border text-primary" role="status">
                                                <span className="visually-hidden">Đang tải...</span>
                                            </div>
                                            <p className="mt-2 text-muted">Đang tải dữ liệu...</p>
                                        </td>
                                    </tr>
                                ) : filteredOrdersIds.length > 0 ? (
                                    filteredOrdersIds.map(id => {
                                        const order = createOrderDisplay(id);
                                        return (
                                            <tr key={order.orderId}>
                                                <td>{order.orderId}</td>
                                                <td>
                                                    <div className="fw-semibold">{order.customerName}</div>
                                                    <small className="text-muted">{order.customerPhone}</small>
                                                </td>
                                                <td>
                                                    <div>{order.motorcycleModel}</div>
                                                    <small className="text-muted">{order.plateNumber}</small>
                                                </td>
                                                <td>
                                                    <div>{order.createdDate}</div>
                                                    <small className="text-muted">{order.createdTime}</small>
                                                </td>
                                                <td>
                                                    <StatusBadge status={order.status} />
                                                </td>
                                                <td>
                                                    <ProgressBar
                                                        now={order.progressPercentage}
                                                        variant={
                                                            order.progressPercentage < 30 ? "info" :
                                                                order.progressPercentage < 70 ? "warning" :
                                                                    order.progressPercentage < 100 ? "primary" : "success"
                                                        }
                                                        style={{ height: "8px" }}
                                                    />
                                                    <small className="text-muted">{order.progressPercentage}%</small>
                                                </td>
                                                <td>
                                                    <div className="d-flex gap-2">
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            onClick={() => handleViewDetail(order.orderId)}
                                                            title="Xem chi tiết"
                                                        >
                                                            <i className="bi bi-eye"></i>
                                                        </Button>
                                                        
                                                        {order.rawStatus === 'received' ? (
                                                            <Button
                                                                variant="outline-danger"
                                                                size="sm"
                                                                onClick={() => handleAcceptOrder(order.orderId)}
                                                                title="Nhận đơn"
                                                            >
                                                                <i className="bi bi-check-circle"></i>
                                                            </Button>
                                                        ) : order.rawStatus === 'checking' ? (
                                                            <>
                                                                <Button
                                                                    variant="outline-warning"
                                                                    size="sm"
                                                                    onClick={() => handleModalInspectionClick(order.orderId)}
                                                                    title="Cập nhật kiểm tra xe"
                                                                >
                                                                    <i className="bi bi-tools"></i>
                                                                </Button>
                                                            </>
                                                        ) : order.rawStatus === 'wait_confirm' ? (
                                                            <>
                                                                <Button
                                                                    variant="outline-warning"
                                                                    size="sm"
                                                                    onClick={() => handleModalInspectionClick(order.orderId)}
                                                                    title="Cập nhật kiểm tra xe"
                                                                >
                                                                    <i className="bi bi-tools"></i>
                                                                </Button>
                                                                <Button
                                                                    variant="outline-info"
                                                                    size="sm"
                                                                    onClick={() => handleShowUpdateDetailsModal(order.orderId)}
                                                                    title="Cập nhật chi tiết"
                                                                >
                                                                    <i className="bi bi-list-check"></i>
                                                                </Button>
                                                            </>
                                                        ) : order.rawStatus === 'repairing' && (
                                                            <>
                                                                <Button
                                                                    variant="outline-success"
                                                                    disabled={completeLoading}
                                                                    size="sm"
                                                                    onClick={() => handleCompleteRepairClick(order.orderId)}
                                                                    title="Hoàn thành sửa chửa"
                                                                >
                                                                    <i className="bi bi-check2-circle"></i>
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="text-center py-4">
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

            {/* Modal xem chi tiết - Updated to use OrderDetailView */}
            <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Chi tiết đơn hàng #{currentOrder?.orderId}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {currentOrder && (
                        <>
                            <Row className="mb-4">
                                <Col md={6}>
                                    <h6 className="text-muted mb-3">Thông tin chung</h6>
                                    <p><strong>Mã đơn:</strong> {currentOrder.orderId}</p>
                                    <p><strong>Ngày tiếp nhận:</strong> {currentOrder.createdDate} {currentOrder.createdTime}</p>
                                    <p>
                                        <strong>Trạng thái:</strong> <StatusBadge status={currentOrder.status} />
                                    </p>
                                    <p><strong>Tiến độ:</strong> {currentOrder.progressPercentage}%</p>
                                </Col>
                                <Col md={6}>
                                    <h6 className="text-muted mb-3">Thông tin khách hàng</h6>
                                    <p><strong>Họ tên:</strong> {currentOrder.customerName}</p>
                                    <p><strong>Số điện thoại:</strong> {currentOrder.customerPhone}</p>
                                </Col>
                            </Row>

                            <Row className="mb-4">
                                <Col md={6}>
                                    <h6 className="text-muted mb-3">Thông tin xe</h6>
                                    <p><strong>Loại xe:</strong> {currentOrder.motorcycleModel}</p>
                                    <p><strong>Biển số:</strong> {currentOrder.plateNumber}</p>
                                </Col>
                                <Col md={6}>
                                    <h6 className="text-muted mb-3">Ghi chú tiếp nhận: </h6>

                                    <div className="p-3 rounded mb-3 outline-secondary border border-1">
                                        <p className="mb-0">{currentOrder.note}</p>
                                    </div>
                                </Col>
                            </Row>
                            <div className="p-3 bg-light rounded mb-3">
                                <h6>Tình trạng ban đầu:</h6>
                                <p className="mb-0">{currentOrder.initialConditon}</p>
                            </div>
                            <div className="p-3 bg-light rounded mb-3">
                                <h6>Chuẩn đoán:</h6>
                                <p className="mb-0">{currentOrder.diagnosisProblem}</p>
                            </div>

                            {/* Auto-loading OrderDetailView component */}
                            <OrderDetailView
                                currentOrder={currentOrder}
                                formatCurrency={formatCurrency}
                            />
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
                        Đóng
                    </Button>
                    {currentOrder && currentOrder.rawStatus === 'received' ? (
                        <Button
                            variant="danger"
                            onClick={() => {
                                setShowDetailModal(false);
                                handleAcceptOrder(currentOrder.orderId);
                            }}
                        >
                            <i className="bi bi-check-circle me-1"></i>
                            Nhận đơn
                        </Button>
                    ) : currentOrder && currentOrder.rawStatus === 'checking' ? (
                        <Button
                            variant="warning"
                            // style={{ backgroundColor: '#d30000', borderColor: '#d30000' }}
                            onClick={() => {
                                setShowDetailModal(false);
                                handleShowInspectionModal(currentOrder.orderId);
                            }}
                        >
                            <i className="bi bi-tools me-1"></i>
                            Cập nhật kiểm tra xe
                        </Button>
                    ) : currentOrder && currentOrder.rawStatus === 'wait_confirm' ? (
                        <>
                            <Button
                                variant="warning"
                                // style={{ backgroundColor: '#d30000', borderColor: '#d30000' }}
                                onClick={() => {
                                    setShowDetailModal(false);
                                    handleShowInspectionModal(currentOrder.orderId);
                                }}
                            >
                                <i className="bi bi-tools me-1"></i>
                                Cập nhật kiểm tra xe
                            </Button>
                            <Button
                                variant="info"
                                onClick={() => {
                                    setShowDetailModal(false);
                                    handleShowUpdateDetailsModal(currentOrder.orderId);
                                }}
                            >
                                <i className="bi bi-list-check me-1"></i>
                                Cập nhật chi tiết
                            </Button>
                        </>
                    ) : currentOrder && currentOrder.rawStatus === 'repairing' && (
                        <Button
                            disabled={completeLoading}
                            variant="success"
                            onClick={() => {
                                setShowDetailModal(false);
                                handleCompleteRepairClick(currentOrder.orderId);
                            }}
                        >
                            <i className="bi bi-check2-circle me-1"></i>
                            {completeLoading ? 'Đang xử lý...' : 'Hoàn thành sửa chửa' }
                        </Button>
                    ) 
                    }
                </Modal.Footer>
            </Modal>

            {/* Modal cập nhật kiểm tra xe (renamed from "Modal cập nhật đơn hàng") */}
            // TODO: modal - cập nhật kiểm tra xe
            <InspectionModal
                show={showUpdateModal}
                onHide={() => setShowUpdateModal(false)}
                currentOrder={currentOrder}
                partsViewsByMotoTypeId={partsViewsByMotoTypeId}
                servicesViewsByParentMotoType={servicesViewsByParentMotoType}
                // onSubmitInspection={handleSubmitInspection}
            />

            {/* Modal cập nhật chi tiết đơn hàng */}
            <UpdateDetailModal
                show={showUpdateDetailsModal}
                onHide={() => setShowUpdateDetailsModal(false)}
                currentOrder={currentOrder}
                partOrderDetailsData={partOrderDetailsData}
                serviceOrderDetailsData={serviceOrderDetailsData}
                detailsLoading={detailsLoading}
                getData={getData}
                onSubmit={handleSubmitOrderDetails}
            />

            {/* Modal xác nhận nhận đơn */}
            <CustomModal
                show={showAcceptModal}
                onHide={() => setShowAcceptModal(false)}
                title="Xác nhận nhận đơn"
                message={
                    currentOrder ? 
                    `Bạn có chắc chắn muốn nhận đơn hàng #${currentOrder.orderId} của khách hàng ${currentOrder.customerName} không?
                    Sau khi nhận đơn, bạn sẽ có trách nhiệm xử lý yêu cầu sửa chữa này.` :
                    'Bạn có chắc chắn muốn nhận đơn hàng này không?'
                }
                confirmButtonText={isAcceptingOrder ? "Đang xử lý..." : "Xác nhận nhận đơn"}
                confirmButtonVariant="success"
                onConfirm={confirmAcceptOrder}
                cancelButtonText="Hủy"
                backdrop="static"
                keyboard={!isAcceptingOrder}
            />

            {/* Modal xác nhận hoàn thành sửa chửa */}
            <CustomModal
                show={showCompleteRepairModal}
                onHide={() => setShowCompleteRepairModal(false)}
                title="Xác nhận hoàn thành sửa chữa"
                message={
                    currentOrder ? 
                    `Bạn có chắc chắn muốn hoàn thành sửa chữa đơn hàng #${currentOrder.orderId} của khách hàng ${currentOrder.customerName} không?
                    Sau khi hoàn thành, đơn hàng sẽ chuyển sang trạng thái "Chờ giao xe" và hóa đơn sẽ được tạo.` :
                    'Bạn có chắc chắn muốn hoàn thành sửa chữa đơn hàng này không?'
                }
                confirmButtonText={completeLoading ? "Đang xử lý..." : "Xác nhận hoàn thành"}
                confirmButtonVariant="success"
                onConfirm={confirmCompleteRepairing}
                cancelButtonText="Hủy"
                backdrop="static"
                keyboard={!completeLoading}
            />
        </>
    );
};

export default TechnicianDashboard;
