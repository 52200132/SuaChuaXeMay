import React, { useState, useEffect } from 'react';
import {
    Card, Table, Button, Row, Col, Form,
    InputGroup, Badge, Modal, Tabs, Tab,
    ProgressBar, ListGroup, Alert
} from 'react-bootstrap';
import { useAppData } from '../contexts/AppDataContext';
import { useStaffAuth } from '../contexts/StaffAuthContext';
import { repairService, customerService, resourceService } from '../../services/api';
import StatusBadge from '../components/StatusBadge';
import CustomModal from '../components/CustomModal';
import OrderDetailView from '../components/OrderDetailView';
import './TechnicianDashboard.css';

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

const getPriorityFromDate = (dateString) => {
    if (!dateString) return 'normal';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orderDate = new Date(dateString);
    orderDate.setHours(0, 0, 0, 0);

    const diffTime = today - orderDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 3) return 'high';
    if (diffDays > 1) return 'medium';
    return 'normal';
};

const TechnicianDashboard = () => {
    // Context and data state
    const { currentStaff } = useStaffAuth();
    const { getData, setData } = useAppData();
    const ordersById = getData('orders') || {};
    const customersById = getData('customers') || {};
    const motorcyclesById = getData('motorcycles') || {};
    const diagnosisById = getData('diagnosis') || {};
    const receiptsById = getData('receiptions');

    // Orders state
    const [loading, setLoading] = useState(true);
    const [myOrdersIds, setMyOrdersIds] = useState(new Set());
    const [myOrdersIdsArray, setMyOrdersIdsArray] = useState([]);
    const [myOrdersDisplay, setMyOrdersDisplay] = useState({});
    const [filteredOrdersIds, setFilteredOrdersIds] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    // Current order and modal state
    const [currentOrder, setCurrentOrder] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [showAcceptModal, setShowAcceptModal] = useState(false); // Add state for accept modal
    const [activeModalTab, setActiveModalTab] = useState('status');
    const [activeCatalogTab, setActiveCatalogTab] = useState('services');
    const [isAcceptingOrder, setIsAcceptingOrder] = useState(false); // Add loading state for accepting orders

    // Update state form state
    const [updateData, setUpdateData] = useState({
        diagnosisProblem: '',
        estimatedCost: 0,
        notes: ''
    });

    // Parts state
    const [parts, setParts] = useState([]);
    const [selectedParts, setSelectedParts] = useState([]);
    const [partQuantities, setPartQuantities] = useState({});
    const [partSearchTerm, setPartSearchTerm] = useState('');
    const [partLoading, setPartLoading] = useState(false);
    const [partsByMotoType, setPartsByMotoType] = useState([]);
    const [partMotoTypesLoading, setPartMotoTypesLoading] = useState(false);

    // Parts cache
    const [partMotoTypeCache, setPartMotoTypeCache] = useState({});
    const [partsCache, setPartsCache] = useState({});

    // Services state
    const [services, setServices] = useState([]);
    const [selectedServices, setSelectedServices] = useState([]);
    const [serviceLoading, setServiceLoading] = useState(false);
    const [servicesByMotoType, setServicesByMotoType] = useState([]);
    const [serviceMotoTypesLoading, setServiceMotoTypesLoading] = useState(false);

    // Services cache
    const [serviceMotoTypeCache, setServiceMotoTypeCache] = useState({});
    const [servicesCache, setServicesCache] = useState({});

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
            motorTypeId: motorcycle.moto_type_id,
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
            priority: getPriorityFromDate(createdAtDate),
            progressPercentage: getProgressPercentage(order.status),
            note: reception?.note || 'Không có ghi chú',
            estimatedCost: diagnosis?.estimated_cost || 0,
        };
    };

    // Initial data loading
    useEffect(() => {
        fetchInitialData();
    }, [currentStaff]);
    // TODO: check points for loading data
    useEffect(() => {
        if (!loading) {
            console.log('Orders loaded:', myOrdersDisplay, customersById, motorcyclesById, diagnosisById, receiptsById);
        }
    }, [loading]);

    const fetchInitialData = async () => {
        try {
            await Promise.all([
                fetchMyOrders(),
                fetchParts(),
                fetchServices()
            ]);
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    };

    // Fetch orders assigned to the technician
    const fetchMyOrders = async () => {
        if (!currentStaff?.staff_id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            // Mock staff ID for testing
            const staffId = 4;

            const response = await repairService.order.getAllOrdersByStaffIdToday(staffId);
            const ordersData = response.data || [];

            const newOrdersIds = new Set();
            const newOrdersDisplay = {};

            await Promise.all(ordersData.map(async (order) => {
                // Get motorcycle, customer, diagnosis and reception data
                const { motorcycle, customer, diagnosis, reception } = await fetchOrderRelatedData(order);

                // Add order to display data
                newOrdersIds.add(order.order_id);
                newOrdersDisplay[order.order_id] = formatOrderData(order, customer, motorcycle, diagnosis, reception);
            }));

            // Update state
            setMyOrdersIds(newOrdersIds);
            setMyOrdersIdsArray(Array.from(newOrdersIds));
            setMyOrdersDisplay(newOrdersDisplay);
            setFilteredOrdersIds(Array.from(newOrdersIds));
            updateStats(newOrdersIds, newOrdersDisplay);
        } catch (error) {
            console.error('Error fetching technician orders:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch all related data for an order
    const fetchOrderRelatedData = async (order) => {
        let motorcycle = motorcyclesById[order.motocycle_id];
        let customer = null;
        let diagnosis = diagnosisById[order.order_id];
        let reception = null;

        // Fetch motorcycle data if needed
        if (!motorcycle) {
            motorcycle = await fetchMotorcycleData(order.motocycle_id);
        }

        // Fetch customer data if needed
        if (motorcycle?.customer_id && !customersById[motorcycle.customer_id]) {
            customer = await fetchCustomerData(motorcycle.customer_id);
        } else {
            customer = customersById[motorcycle?.customer_id];
        }

        // Fetch diagnosis data if needed
        if (!diagnosis) {
            diagnosis = await fetchDiagnosisData(order.order_id);
        }

        // Fetch reception data if needed
        if (diagnosis?.form_id) {
            reception = receiptsById[diagnosis.form_id] || await fetchReceptionData(diagnosis.form_id);
        }

        return { motorcycle, customer, diagnosis, reception };
    };

    // Fetch motorcycle data
    const fetchMotorcycleData = async (motorcycleId) => {
        try {
            const response = await customerService.motorcycle.getMotorcycleById(motorcycleId);
            const motorcycle = response.data;
            setData('motorcycles', motorcycle, motorcycleId);
            return motorcycle;
        } catch (error) {
            console.error('Error fetching motorcycle data:', error);
            return { license_plate: 'Không có thông tin', brand: '', model: '' };
        }
    };

    // Fetch customer data
    const fetchCustomerData = async (customerId) => {
        try {
            const response = await customerService.customer.getCustomerById(customerId);
            const customer = response.data;
            setData('customers', customer, customerId);
            return customer;
        } catch (error) {
            console.error('Error fetching customer data:', error);
            return { fullname: 'Không có thông tin', phone_num: '' };
        }
    };

    // Fetch diagnosis data
    const fetchDiagnosisData = async (orderId) => {
        try {
            const response = await repairService.diagnosis.getDiagnosisByOrderId(orderId);
            const diagnosis = response.data;
            setData('diagnosis', diagnosis, orderId);
            return diagnosis;
        } catch (error) {
            console.error('Error fetching diagnosis data:', error);
            return { problem: '' };
        }
    };

    // Fetch reception data
    const fetchReceptionData = async (formId) => {
        try {
            const response = await customerService.reception.getReceptionById(formId);
            const reception = response.data;
            setData('receiptions', reception, formId);
            return reception;
        } catch (error) {
            console.error('Error fetching reception data:', error);
            return { note: 'Không có ghi chú' };
        }
    };

    // Fetch parts data
    const fetchParts = async () => {
        // Use cached parts if available
        if (Object.keys(partsCache).length > 0) {
            setParts(Object.values(partsCache));
            return;
        }

        try {
            setPartLoading(true);
            const response = await resourceService.part.getAllParts();
            const partsData = response.data || [];

            // Update cache and state
            const newPartsCache = {};
            partsData.forEach(part => {
                newPartsCache[part.part_id] = part;
            });

            setPartsCache(newPartsCache);
            setParts(partsData);
        } catch (error) {
            console.error('Error fetching parts:', error);
            // Add mock parts for testing
            const mockParts = getMockPartsData();
            setParts(mockParts);
        } finally {
            setPartLoading(false);
        }
    };

    // Get mock parts data for testing
    const getMockPartsData = () => [
        { part_id: 1, name: 'Bugi NGK', code: 'BG001', unit: 'Cái' },
        { part_id: 2, name: 'Dầu nhớt Motul 4T 10W40', code: 'DN001', unit: 'Chai' },
        { part_id: 3, name: 'Lốc máy Honda Wave', code: 'LM001', unit: 'Bộ' },
        { part_id: 4, name: 'Xích đĩa DID', code: 'XD001', unit: 'Bộ' },
        { part_id: 5, name: 'Phanh đĩa Brembo', code: 'PD001', unit: 'Bộ' },
        { part_id: 6, name: 'Lọc gió K&N', code: 'LG001', unit: 'Cái' },
        { part_id: 7, name: 'Má phanh Nissin', code: 'MP001', unit: 'Bộ' },
        { part_id: 8, name: 'Ắc quy GS', code: 'AQ001', unit: 'Cái' },
    ];

    // Fetch services data
    const fetchServices = async () => {
        // Use cached services if available
        if (Object.keys(servicesCache).length > 0) {
            setServices(Object.values(servicesCache));
            return;
        }

        try {
            setServiceLoading(true);
            const response = await resourceService.service.getAllServices();
            const servicesData = response.data || [];

            // Update cache and state
            const newServicesCache = {};
            servicesData.forEach(service => {
                newServicesCache[service.service_id] = service;
            });

            setServicesCache(newServicesCache);
            setServices(servicesData);
        } catch (error) {
            console.error('Error fetching services:', error);
            // Add mock services for testing
            const mockServices = getMockServicesData();
            setServices(mockServices);
        } finally {
            setServiceLoading(false);
        }
    };

    // Get mock services data for testing
    const getMockServicesData = () => [
        { service_id: 1, name: 'Thay dầu máy', description: 'Thay dầu nhớt cho xe' },
        { service_id: 2, name: 'Thay bugi', description: 'Thay bugi mới' },
        { service_id: 3, name: 'Bảo dưỡng định kỳ', description: 'Bảo dưỡng toàn bộ xe' },
        { service_id: 4, name: 'Thay lốc máy', description: 'Thay lốc máy mới' },
        { service_id: 5, name: 'Thay xích đĩa', description: 'Thay thế bộ xích và đĩa' },
        { service_id: 6, name: 'Thay phanh', description: 'Thay phanh mới' },
        { service_id: 7, name: 'Thay nhớt hộp số', description: 'Thay nhớt hộp số' },
        { service_id: 8, name: 'Vệ sinh kim phun xăng', description: 'Vệ sinh hệ thống phun xăng' },
    ];

    // Update statistics
    const updateStats = (orderIds, ordersDisplay) => {
        const today = new Date().toISOString().split('T')[0];
        const ordersArray = Array.from(orderIds).map(id => ordersDisplay[id]);

        setStats({
            totalOrders: orderIds.size,
            inProgress: ordersArray.filter(order => order.rawStatus === 'repairing').length,
            pendingConfirmation: ordersArray.filter(order => order.rawStatus === 'wait_confirm').length,
            completed: ordersArray.filter(order => ['wait_delivery', 'delivered'].includes(order.rawStatus)).length,
            todayOrders: ordersArray.filter(order => order.createdDate === today).length
        });
    };

    // Filter orders based on tab and search term
    const filterOrders = (tab, term) => {
        let filtered = [...myOrdersIdsArray];

        // Filter by tab
        if (tab !== 'all') {
            switch (tab) {
                case 'new':
                    filtered = filtered.filter(id =>
                        ['received', 'checking'].includes(myOrdersDisplay[id].rawStatus));
                    break;
                case 'in-progress':
                    filtered = filtered.filter(id =>
                        myOrdersDisplay[id].rawStatus === 'repairing');
                    break;
                case 'pending-confirmation':
                    filtered = filtered.filter(id =>
                        myOrdersDisplay[id].rawStatus === 'wait_confirm');
                    break;
                case 'completed':
                    filtered = filtered.filter(id =>
                        ['wait_delivery', 'delivered'].includes(myOrdersDisplay[id].rawStatus));
                    break;
                default:
                    break;
            }
        }

        // Filter by search term
        if (term) {
            filtered = filtered.filter(id => {
                const order = myOrdersDisplay[id];
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
        
        const order = myOrdersDisplay[orderId];
        setCurrentOrder(order);
        setShowAcceptModal(true);
    };

    // Confirm accepting an order
    const confirmAcceptOrder = async () => {
        if (!currentOrder) return;

        try {
            setIsAcceptingOrder(true);
            
            // Call API to update order status to "checking"
            await repairService.order.updateOrderStatus(currentOrder.orderId, 'checking');
            
            console.log(`Technician accepted order #${currentOrder.orderId}`);
            
            // Update local state
            const updatedOrder = {
                ...currentOrder,
                originalData: { 
                    ...currentOrder.originalData,
                    status: 'checking'
                },
                status: STATUS_MAPPING['checking'],
                rawStatus: 'checking',
                progressPercentage: getProgressPercentage('checking')
            };
            
            const updatedOrdersDisplay = {
                ...myOrdersDisplay,
                [currentOrder.orderId]: updatedOrder
            };
            
            setMyOrdersDisplay(updatedOrdersDisplay);
            
            // Close modal
            setShowAcceptModal(false);
            
            // Show success message
            alert('Đã nhận đơn hàng thành công!');
            
            // Refresh orders list
            // await fetchMyOrders();
            
        } catch (error) {
            console.error('Error accepting order:', error);
            alert('Có lỗi xảy ra khi nhận đơn. Vui lòng thử lại sau.');
        } finally {
            setIsAcceptingOrder(false);
        }
    };

    // Open vehicle inspection modal (renamed from handleShowUpdateModal)
    const handleShowInspectionModal = (orderId) => {
        const order = myOrdersDisplay[orderId];
        
        // Check if order is in received status and prevent editing
        if (order.rawStatus === 'received') {
            alert('Bạn cần nhận đơn trước khi có thể chỉnh sửa!');
            return;
        }
        
        setCurrentOrder(order);
        setUpdateData({
            diagnosisProblem: order.diagnosisProblem || '',
            estimatedCost: order.estimatedCost || 0,
            notes: order.note || ''
        });

        // Reset parts and services selection
        resetSelections();

        // Get motorcycle type and fetch related parts/services
        if (order.originalData?.motocycle_id) {
            const motorcycle = motorcyclesById[order.originalData.motocycle_id];
            if (motorcycle?.moto_type_id) {
                setMotoTypeId(motorcycle.moto_type_id);
                fetchPartsByMotoType(motorcycle.moto_type_id);
                fetchServicesByMotoType(motorcycle.moto_type_id);
            } else {
                resetMotoTypeData();
            }
        }

        setShowUpdateModal(true);
    };

    // Reset selections when opening modal
    const resetSelections = () => {
        setSelectedParts([]);
        setPartQuantities({});
        setSelectedServices([]);
        setActiveModalTab('status');
        setActiveCatalogTab('services');
    };

    // Reset motorcycle type related data
    const resetMotoTypeData = () => {
        setPartsByMotoType([]);
        setServicesByMotoType([]);
        setMotoTypeId(null);
    };

    // Fetch parts by motorcycle type
    const fetchPartsByMotoType = async (motoTypeId) => {
        if (!motoTypeId) return;

        // Use cached data if available
        if (partMotoTypeCache[motoTypeId]) {
            setPartsByMotoType(partMotoTypeCache[motoTypeId]);
            return;
        }

        try {
            setPartMotoTypesLoading(true);
            const response = await resourceService.partMotoType.getAllPartMotoTypesByMotoTypeId(motoTypeId);
            const partMotoTypeData = response.data || [];

            // Enhance part data with full information
            const enhancedPartData = await Promise.all(
                partMotoTypeData.map(partMotoType => getEnhancedPartData(partMotoType))
            );

            // Update cache and state
            setPartMotoTypeCache(prev => ({
                ...prev,
                [motoTypeId]: enhancedPartData
            }));

            setPartsByMotoType(enhancedPartData);
        } catch (error) {
            console.error('Error fetching parts by motorcycle type:', error);
            setPartsByMotoType([]);
        } finally {
            setPartMotoTypesLoading(false);
        }
    };

    // Get enhanced part data with full information
    const getEnhancedPartData = async (partMotoType) => {
        // Check cache first
        if (partsCache[partMotoType.part_id]) {
            return {
                ...partMotoType,
                ...partsCache[partMotoType.part_id],
                part_id: partMotoType.part_id
            };
        }

        // Check in current parts list
        const partInfo = parts.find(p => p.part_id === partMotoType.part_id);
        if (partInfo) {
            // Update cache
            setPartsCache(prev => ({
                ...prev,
                [partInfo.part_id]: partInfo
            }));

            return {
                ...partMotoType,
                ...partInfo,
                part_id: partMotoType.part_id
            };
        }

        // Fetch from API if not found
        try {
            const response = await resourceService.part.getPartById(partMotoType.part_id);
            const partData = response.data;

            // Update cache
            setPartsCache(prev => ({
                ...prev,
                [partData.part_id]: partData
            }));

            return {
                ...partMotoType,
                ...partData
            };
        } catch (error) {
            console.error(`Error fetching part details id=${partMotoType.part_id}:`, error);
            return {
                ...partMotoType,
                name: `Phụ tùng ID ${partMotoType.part_id}`,
                code: 'Unknown',
                unit: 'Cái'
            };
        }
    };

    // Fetch services by motorcycle type
    const fetchServicesByMotoType = async (motoTypeId) => {
        if (!motoTypeId) return;

        // Use cached data if available
        if (serviceMotoTypeCache[motoTypeId]) {
            setServicesByMotoType(serviceMotoTypeCache[motoTypeId]);
            return;
        }

        try {
            setServiceMotoTypesLoading(true);
            const response = await resourceService.serviceMotoType.getAllServiceMotoTypesByMotoTypeId(motoTypeId);
            const serviceMotoTypeData = response.data || [];

            // Enhance service data with full information
            const enhancedServiceData = await Promise.all(
                serviceMotoTypeData.map(serviceMotoType => getEnhancedServiceData(serviceMotoType))
            );

            // Update cache and state
            setServiceMotoTypeCache(prev => ({
                ...prev,
                [motoTypeId]: enhancedServiceData
            }));

            setServicesByMotoType(enhancedServiceData);
        } catch (error) {
            console.error('Error fetching services by motorcycle type:', error);
            setServicesByMotoType([]);
        } finally {
            setServiceMotoTypesLoading(false);
        }
    };

    // Get enhanced service data with full information
    const getEnhancedServiceData = async (serviceMotoType) => {
        // Check cache first
        if (servicesCache[serviceMotoType.service_id]) {
            return {
                ...serviceMotoType,
                ...servicesCache[serviceMotoType.service_id],
                service_id: serviceMotoType.service_id
            };
        }

        // Check in current services list
        const serviceInfo = services.find(s => s.service_id === serviceMotoType.service_id);
        if (serviceInfo) {
            // Update cache
            setServicesCache(prev => ({
                ...prev,
                [serviceInfo.service_id]: serviceInfo
            }));

            return {
                ...serviceMotoType,
                ...serviceInfo,
                service_id: serviceMotoType.service_id
            };
        }

        // Fetch from API if not found
        try {
            const response = await resourceService.service.getServiceById(serviceMotoType.service_id);
            const serviceData = response.data;

            // Update cache
            setServicesCache(prev => ({
                ...prev,
                [serviceData.service_id]: serviceData
            }));

            return {
                ...serviceMotoType,
                ...serviceData
            };
        } catch (error) {
            console.error(`Error fetching service details id=${serviceMotoType.service_id}:`, error);
            return {
                ...serviceMotoType,
                name: `Dịch vụ ID ${serviceMotoType.service_id}`,
                description: 'Không có mô tả'
            };
        }
    };

    // Filter parts based on search term
    const getFilteredParts = () => {
        const partsToFilter = partsByMotoType.length > 0 ? partsByMotoType : parts;

        if (!partSearchTerm) return partsToFilter;

        const searchTerm = partSearchTerm.toLowerCase();
        return partsToFilter.filter(part =>
            part.name?.toLowerCase().includes(searchTerm) ||
            part.code?.toLowerCase().includes(searchTerm)
        );
    };

    // Toggle part selection
    const togglePartSelection = (partId, partMotoTypeId = null) => {
        const selectionId = partMotoTypeId || partId;

        if (selectedParts.includes(selectionId)) {
            // Remove part
            setSelectedParts(prev => prev.filter(id => id !== selectionId));
            setPartQuantities(prev => {
                const newQuantities = { ...prev };
                delete newQuantities[selectionId];
                return newQuantities;
            });
        } else {
            // Add part
            setSelectedParts(prev => [...prev, selectionId]);
            setPartQuantities(prev => ({
                ...prev,
                [selectionId]: 1
            }));
        }
    };

    // Toggle service selection
    const toggleServiceSelection = (serviceId, serviceMotoTypeId = null) => {
        const selectionId = serviceMotoTypeId || serviceId;

        if (selectedServices.includes(selectionId)) {
            setSelectedServices(prev => prev.filter(id => id !== selectionId));
        } else {
            setSelectedServices(prev => [...prev, selectionId]);
        }
    };

    // Update part quantity
    const handleQuantityChange = (partId, quantity) => {
        const numericQuantity = parseInt(quantity, 10) || 0;
        const clampedQuantity = Math.max(1, Math.min(99, numericQuantity));

        setPartQuantities(prev => ({
            ...prev,
            [partId]: clampedQuantity
        }));
    };

    // Calculate total amount of selected parts and services
    const calculateTotalAmount = () => {
        // Calculate parts total
        const partsTotal = selectedParts.reduce((total, partId) => {
            const part = findPartById(partId);
            if (!part) return total;

            const quantity = partQuantities[partId] || 1;
            const price = part.price || 0;

            return total + (price * quantity);
        }, 0);

        // Calculate services total
        const servicesTotal = selectedServices.reduce((total, serviceId) => {
            const service = findServiceById(serviceId);
            if (!service) return total;

            const price = service.price || 0;

            return total + price;
        }, 0);

        return partsTotal + servicesTotal;
    };

    // Find part by ID (from both sources)
    const findPartById = (partId) => {
        const partFromMotoType = partsByMotoType.find(p =>
            p.part_mototype_id === partId || p.part_id === partId
        );
        return partFromMotoType || parts.find(p => p.part_id === partId);
    };

    // Find service by ID (from both sources)
    const findServiceById = (serviceId) => {
        const serviceFromMotoType = servicesByMotoType.find(s =>
            s.service_mototype_id === serviceId || s.service_id === serviceId
        );
        return serviceFromMotoType || services.find(s => s.service_id === serviceId);
    };

    // Prepare order data for API
    const calculateTotalPrice = async (partsData, servicesData, motorcycleId, orderId) => {
        let totalPrice = 0;

        // Process parts
        const partOrderDetails = await Promise.all(partsData.map(async (part) => {
            try {
                const partId = part.part_id;
                const response = await resourceService.partMotoType
                    .getPartMotoTypeByPartIdAndMototypeId(partId, motorcycleId);
                const partMotoType = response.data;

                part.price = partMotoType ? partMotoType.price : 0;

                return {
                    is_selected: false,
                    order_id: orderId,
                    part_id: partId,
                    quantity: part.quantity,
                    price: parseInt(part.price) * parseInt(part.quantity),
                };
            } catch (error) {
                console.error('Error fetching part price:', error);
                return null;
            }
        }));

        // Process services
        const serviceOrderDetails = await Promise.all(servicesData.map(async (service) => {
            try {
                const serviceId = service.service_id;
                const response = await resourceService.serviceMotoType
                    .getServiceMotoTypeByServiceIdAndMototypeId(serviceId, motorcycleId);
                const serviceMotoType = response.data;

                service.price = serviceMotoType ? serviceMotoType.price : (service.price || 0);

                return {
                    is_selected: false,
                    order_id: orderId,
                    service_id: serviceId,
                    price: parseInt(service.price)
                };
            } catch (error) {
                console.error(`Error fetching service price id=${service.service_id}:`, error);
                return {
                    is_selected: false,
                    order_id: orderId,
                    service_id: service.service_id,
                    price: parseInt(service.price || 0)
                };
            }
        }));

        // Calculate total price
        partOrderDetails.forEach(item => {
            if (item) totalPrice += item.price;
        });

        serviceOrderDetails.forEach(item => {
            if (item) totalPrice += item.price;
        });

        console.log('Total order price:', totalPrice);

        return {
            totalPrice,
            partOrderDetails: partOrderDetails.filter(Boolean),
            serviceOrderDetails: serviceOrderDetails.filter(Boolean)
        };
    };

    // Handle vehicle inspection submission (renamed from handleUpdateOrder)
    const handleSubmitInspection = async () => {
        if (!currentOrder) return;

        try {
            setLoading(true);

            // Prepare parts data
            const partsData = selectedParts.map(partId => {
                const part = findPartById(partId);
                if (!part) return null;

                return {
                    part_id: part.part_id,
                    part_mototype_id: part.part_mototype_id,
                    quantity: partQuantities[partId] || 1,
                    name: part.name || '',
                    unit: part.unit || '',
                    price: part.price || 0
                };
            }).filter(Boolean);

            // Prepare services data
            const servicesData = selectedServices.map(serviceId => {
                const service = findServiceById(serviceId);
                if (!service) return null;

                return {
                    service_id: service.service_id,
                    service_mototype_id: service.service_mototype_id,
                    name: service.name || '',
                    price: service.price || 0
                };
            }).filter(Boolean);

            // Calculate total price and prepare order details
            const motorcycleTypeId = motorcyclesById[currentOrder.motorcycleId].moto_type_id;
            const { totalPrice, partOrderDetails, serviceOrderDetails } =
                await calculateTotalPrice(partsData, servicesData, motorcycleTypeId, currentOrder.orderId);

            // Update diagnosis with new problem description and estimated cost
            await repairService.diagnosis.updateDiagnosis(
                diagnosisById[currentOrder.orderId]?.diagnosis_id, 
                updateData.diagnosisProblem, 
                totalPrice
            );
            
            // Create part and service order details
            await Promise.all([
                repairService.partOrderDetail.createPartOrderDetail(partOrderDetails),
                repairService.serviceOrderDetail.createServiceOrderDetail(serviceOrderDetails)
            ]);

            // Set status to waiting for confirmation after inspection is complete
            if (currentOrder.rawStatus === 'checking') {
                await repairService.order.updateOrderStatus(currentOrder.orderId, 'wait_confirm');
            }

            console.log('Inspection update data:', {
                orderId: currentOrder.orderId,
                diagnosisProblem: updateData.diagnosisProblem,
                parts: partOrderDetails,
                services: serviceOrderDetails,
                estimatedCost: totalPrice
            });

            // Update local state
            diagnosisById[currentOrder.orderId].problem = updateData.diagnosisProblem;
            const estimatedCost = diagnosisById[currentOrder.orderId].estimated_cost || 0;
            diagnosisById[currentOrder.orderId].estimated_cost = estimatedCost + totalPrice;
            
            // Update display data
            const newStatus = currentOrder.rawStatus === 'checking' ? 'wait_confirm' : currentOrder.rawStatus;
            
            setMyOrdersDisplay(prev => ({
                ...prev,
                [currentOrder.orderId]: {
                    ...prev[currentOrder.orderId],
                    diagnosisProblem: updateData.diagnosisProblem,
                    status: STATUS_MAPPING[newStatus],
                    rawStatus: newStatus,
                    progressPercentage: getProgressPercentage(newStatus),
                    estimatedCost: diagnosisById[currentOrder.orderId].estimated_cost,
                }
            }));

            alert('Cập nhật kiểm tra xe thành công!');
            setShowUpdateModal(false);
        } catch (error) {
            console.error('Error updating inspection:', error);
            alert('Cập nhật thất bại. Vui lòng thử lại sau!');
        } finally {
            setLoading(false);
        }
    };

    // Handle parts search
    const handlePartSearch = (e) => {
        const term = e.target.value;
        setPartSearchTerm(term);

        if (term.length >= 2) {
            if (partsByMotoType.length > 0) {
                // Local search within motorcycle type parts
            } else {
                // API search
                searchPartsFromAPI(term);
            }
        }
    };

    // Search parts from API
    const searchPartsFromAPI = async (searchTerm) => {
        if (!searchTerm || searchTerm.length < 2) return;

        try {
            setPartLoading(true);

            const response = await resourceService.part.searchParts(searchTerm);

            if (response?.data) {
                const searchResults = response.data;

                // Update cache
                const newPartsCache = { ...partsCache };
                searchResults.forEach(part => {
                    newPartsCache[part.part_id] = part;
                });
                setPartsCache(newPartsCache);

                // Update state if not filtered by motorcycle type
                if (!motoTypeId) {
                    setParts(searchResults);
                }
            }
        } catch (error) {
            console.error('Error searching parts:', error);
        } finally {
            setPartLoading(false);
        }
    };

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

    // Render parts and services selection component
    const renderPartsSelection = () => {
        const filteredParts = getFilteredParts();

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
                                {serviceMotoTypesLoading || serviceLoading ? (
                                    <div className="text-center py-2">
                                        <div className="spinner-border spinner-border-sm" role="status">
                                            <span className="visually-hidden">Đang tải...</span>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {motoTypeId && (
                                            <Alert variant="info" className="py-2 mb-3">
                                                <small>
                                                    <i className="bi bi-info-circle me-1"></i>
                                                    Hiển thị dịch vụ phù hợp với xe {currentOrder?.motorcycleModel}
                                                </small>
                                            </Alert>
                                        )}

                                        <div className="service-list-container p-2 border rounded">
                                            {servicesByMotoType.length > 0 ? (
                                                <ListGroup variant="flush">
                                                    {servicesByMotoType.map(service => (
                                                        <ListGroup.Item
                                                            key={service.service_mototype_id || service.service_id}
                                                            as="div"
                                                            className={`d-flex justify-content-between align-items-center service-item ${selectedServices.includes(service.service_mototype_id || service.service_id) ? 'selected' : ''}`}
                                                            action
                                                            onClick={() => toggleServiceSelection(service.service_id, service.service_mototype_id)}
                                                        >
                                                            <div className="service-info">
                                                                <div>{service.name}</div>
                                                                {service.description && (
                                                                    <small className="text-muted d-block">{service.description}</small>
                                                                )}
                                                                {service.price && (
                                                                    <small className="text-primary">
                                                                        {formatCurrency(service.price)}
                                                                    </small>
                                                                )}
                                                            </div>
                                                            <div className="service-actions">
                                                                <Form.Check
                                                                    type="checkbox"
                                                                    className="m-0"
                                                                    checked={selectedServices.includes(service.service_mototype_id || service.service_id)}
                                                                    onChange={() => { }} // Controlled component
                                                                    onClick={(e) => e.stopPropagation()}
                                                                />
                                                            </div>
                                                        </ListGroup.Item>
                                                    ))}
                                                </ListGroup>
                                            ) : (
                                                <Form.Group className="service-list-container">
                                                    {services.map(service => (
                                                        <Form.Check
                                                            key={service.service_id}
                                                            type="checkbox"
                                                            id={`service-${service.service_id}`}
                                                            label={
                                                                <div>
                                                                    {service.name}
                                                                    {service.description && (
                                                                        <small className="text-muted d-block">{service.description}</small>
                                                                    )}
                                                                </div>
                                                            }
                                                            checked={selectedServices.includes(service.service_id)}
                                                            onChange={() => toggleServiceSelection(service.service_id)}
                                                            className="mb-2"
                                                        />
                                                    ))}
                                                </Form.Group>
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
                                            placeholder="Nhập tên hoặc mã phụ tùng..."
                                            value={partSearchTerm}
                                            onChange={handlePartSearch}
                                            onKeyDown={(e) => {
                                                // Bắt sự kiện nhấn Enter để tìm kiếm
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    if (partSearchTerm.length >= 2) {
                                                        searchPartsFromAPI(partSearchTerm);
                                                    }
                                                }
                                            }}
                                        />
                                        <Button
                                            variant="outline-secondary"
                                            onClick={() => {
                                                if (partSearchTerm.length >= 2) {
                                                    searchPartsFromAPI(partSearchTerm);
                                                }
                                            }}
                                            disabled={partSearchTerm.length < 2}
                                        >
                                            <i className="bi bi-search"></i>
                                        </Button>
                                        {partSearchTerm && (
                                            <Button
                                                variant="outline-secondary"
                                                onClick={() => {
                                                    setPartSearchTerm('');
                                                    // Nếu đang hiển thị theo loại xe, quay lại danh sách ban đầu
                                                    if (motoTypeId) {
                                                        fetchPartsByMotoType(motoTypeId);
                                                    } else {
                                                        // Nếu không, tải lại danh sách phụ tùng
                                                        fetchParts();
                                                    }
                                                }}
                                            >
                                                <i className="bi bi-x"></i>
                                            </Button>
                                        )}
                                    </InputGroup>
                                    {partSearchTerm && partSearchTerm.length < 2 && (
                                        <small className="text-muted">Nhập ít nhất 2 ký tự để tìm kiếm</small>
                                    )}
                                </Form.Group>

                                {partMotoTypesLoading || partLoading ? (
                                    <div className="text-center py-3">
                                        <div className="spinner-border spinner-border-sm" role="status">
                                            <span className="visually-hidden">Đang tải...</span>
                                        </div>
                                        <p className="mt-2 text-muted">Đang tải danh sách phụ tùng...</p>
                                    </div>
                                ) : (
                                    <>
                                        {motoTypeId && (
                                            <Alert variant="info" className="py-2 mb-3">
                                                <small>
                                                    <i className="bi bi-info-circle me-1"></i>
                                                    Hiển thị phụ tùng phù hợp với xe {currentOrder?.motorcycleModel}
                                                </small>
                                            </Alert>
                                        )}

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
                                                            onClick={() => {
                                                                setPartSearchTerm('');
                                                                // Nếu đang hiển thị theo loại xe, quay lại danh sách ban đầu
                                                                if (motoTypeId) {
                                                                    fetchPartsByMotoType(motoTypeId);
                                                                } else {
                                                                    // Nếu không, tải lại danh sách phụ tùng
                                                                    fetchParts();
                                                                }
                                                            }}
                                                        >
                                                            <small>Xóa bộ lọc</small>
                                                        </Button>
                                                    )}
                                                </div>
                                                <ListGroup className="parts-list">
                                                    {filteredParts.map(part => (
                                                        <ListGroup.Item
                                                            key={part.part_mototype_id || part.part_id}
                                                            as="div" // Đảm bảo render thành div thay vì button
                                                            className={`d-flex justify-content-between align-items-center part-item ${selectedParts.includes(part.part_mototype_id || part.part_id) ? 'selected' : ''}`}
                                                            onClick={() => togglePartSelection(part.part_id, part.part_mototype_id)}
                                                        >
                                                            <div className="part-info">
                                                                <div>{part.name}</div>
                                                                {part.price && (
                                                                    <small className="text-primary">
                                                                        {formatCurrency(part.price)}
                                                                    </small>
                                                                )}
                                                            </div>
                                                            <div className="part-quantity">
                                                                {selectedParts.includes(part.part_mototype_id || part.part_id) ? (
                                                                    <div className="quantity-input">
                                                                        <span
                                                                            className="quantity-btn"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                const id = part.part_mototype_id || part.part_id;
                                                                                handleQuantityChange(id, (partQuantities[id] || 1) - 1);
                                                                            }}
                                                                        >
                                                                            -
                                                                        </span>
                                                                        <span className="quantity-value">
                                                                            {partQuantities[part.part_mototype_id || part.part_id] || 1}
                                                                        </span>
                                                                        <span
                                                                            className="quantity-btn"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                const id = part.part_mototype_id || part.part_id;
                                                                                handleQuantityChange(id, (partQuantities[id] || 1) + 1);
                                                                            }}
                                                                        >
                                                                            +
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <span></span>
                                                                )}
                                                            </div>
                                                        </ListGroup.Item>
                                                    ))}
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
                                                    // Tìm thông tin dịch vụ từ cả hai nguồn
                                                    const serviceFromMotoType = servicesByMotoType.find(s =>
                                                        s.service_mototype_id === serviceId || s.service_id === serviceId
                                                    );
                                                    const service = serviceFromMotoType || services.find(s => s.service_id === serviceId);

                                                    if (!service) return null;

                                                    const price = service.price || 0;

                                                    return (
                                                        <ListGroup.Item
                                                            key={serviceId}
                                                            className="px-0 py-2 d-flex justify-content-between align-items-center"
                                                            style={{ backgroundColor: 'transparent' }}
                                                        >
                                                            <div>
                                                                <div>{service.name}</div>
                                                                {price > 0 && (
                                                                    <small className="text-primary">
                                                                        {formatCurrency(price)}
                                                                    </small>
                                                                )}
                                                            </div>
                                                            <Button
                                                                variant="link"
                                                                className="text-danger p-0"
                                                                onClick={() => toggleServiceSelection(service.service_id, service.service_mototype_id)}
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
                                        <div>
                                            <h6 className="border-bottom pb-2">Phụ tùng đã chọn</h6>
                                            <ListGroup variant="flush">
                                                {selectedParts.map(partId => {
                                                    // Tìm thông tin phụ tùng từ cả hai nguồn
                                                    const partFromMotoType = partsByMotoType.find(p =>
                                                        p.part_mototype_id === partId || p.part_id === partId
                                                    );
                                                    const part = partFromMotoType || parts.find(p => p.part_id === partId);

                                                    if (!part) return null;

                                                    const quantity = partQuantities[partId] || 1;
                                                    const price = part.price || 0;

                                                    return (
                                                        <ListGroup.Item
                                                            key={partId}
                                                            className="px-0 py-2 d-flex justify-content-between align-items-center"
                                                            style={{ backgroundColor: 'transparent' }}
                                                        >
                                                            <div>
                                                                <div>{part.name}</div>
                                                                <div className="d-flex align-items-center">
                                                                    <small className="text-muted me-2">{part.unit} x{quantity}</small>
                                                                    {price > 0 && (
                                                                        <small className="text-primary">
                                                                            {formatCurrency(price * quantity)}
                                                                        </small>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <Button
                                                                variant="link"
                                                                className="text-danger p-0"
                                                                onClick={() => togglePartSelection(part.part_id, part.part_mototype_id)}
                                                            >
                                                                <i className="bi bi-x-circle"></i>
                                                            </Button>
                                                        </ListGroup.Item>
                                                    );
                                                })}
                                            </ListGroup>

                                            {/* Hiển thị tổng tiền */}
                                            <div className="mt-3 pt-2 border-top d-flex justify-content-between">
                                                <span className="fw-medium">Tổng cộng:</span>
                                                <span className="fw-bold">{formatCurrency(calculateTotalAmount())}</span>
                                            </div>
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

    // New handler for the inspection button in detail modal
    const handleModalInspectionClick = (orderId) => {
        setShowDetailModal(false);
        handleShowInspectionModal(orderId);
    };

    // Open order detail modal
    const handleViewDetail = (orderId) => {
        setCurrentOrder(myOrdersDisplay[orderId]);
        setShowDetailModal(true);
    };

    // Add a new function to handle showing the update details modal
    const handleShowUpdateDetailsModal = async (orderId) => {
        const order = myOrdersDisplay[orderId];
        
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

    // Add helper functions for the update details modal
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

    // Add function to handle submitting the updated order details
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

            console.log(updatedPartDetails, updatedServiceDetails)
            
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
            
            // Update order status to repairing if not already
            if (currentOrder.rawStatus === 'wait_confirm') {
                // await repairService.order.updateOrderStatus(currentOrder.orderId, 'repairing');
                await repairService.order.updateOrder(currentOrder.orderId, {
                    status: 'repairing',
                    total_price: totalSelectedAmount
                });
                
                // Update local state
                setMyOrdersDisplay(prev => ({
                    ...prev,
                    [currentOrder.orderId]: {
                        ...prev[currentOrder.orderId],
                        status: STATUS_MAPPING['repairing'],
                        rawStatus: 'repairing',
                        progressPercentage: getProgressPercentage('repairing'),
                        totalAmount: totalSelectedAmount
                    }
                }));
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

    const handleSubmitCompleteRepairing = async (orderId) => {
        setCompleteLoading(true);
        setCurrentOrder(myOrdersDisplay[orderId]);

        try {
            // TODO: Gọi api cập nhật trạng thái và tạo hóa đơn
            console.log(myOrdersDisplay[orderId]);
            await Promise.all([
                resourceService.invoice.createInvoice({
                    order_id: orderId,
                    total_price: myOrdersDisplay[orderId].totalAmount
                }),
                repairService.order.updateOrderStatus(orderId, 'wait_delivery')
            ]);

            // 
            setMyOrdersDisplay(prev => ({
                ...prev,
                [currentOrder.orderId]: {
                    ...prev[currentOrder.orderId],
                    status: STATUS_MAPPING['wait_delivery'],
                    rawStatus: 'wait_delivery',
                    progressPercentage: getProgressPercentage('wait_delivery'),
                }
            }));

            setCompleteLoading(false);
        } catch (error) {
            console.log('Lỗi khi cập nhật hoàn thành', error);
            setCompleteLoading(false);
        }
        setCurrentOrder({});
    }

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
                        <Tab eventKey="in-progress" title={<span><i className="bi bi-gear-wide-connected me-1"></i>Đang sửa chữa</span>} />
                        <Tab eventKey="pending-confirmation" title={<span><i className="bi bi-hourglass-split me-1"></i>Chờ xác nhận</span>} />
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
                                {loading ? (
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
                                        const order = myOrdersDisplay[id];
                                        return (
                                            <tr key={order.orderId} className={`priority-${order.priority}`}>
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
                                                                    onClick={() => handleShowInspectionModal(order.orderId)}
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
                                                                    onClick={() => handleShowInspectionModal(order.orderId)}
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
                                                                    onClick={() => {
                                                                        setCurrentOrder(myOrdersDisplay[order.orderId])
                                                                        handleSubmitCompleteRepairing(order.orderId)
                                                                    }}
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
                                setCurrentOrder(myOrdersDisplay[currentOrder.orderId]);
                                handleSubmitCompleteRepairing(currentOrder.orderId);
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
            <Modal show={showUpdateModal} onHide={() => setShowUpdateModal(false)} size="xl">
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
                                activeKey={activeModalTab}
                                onSelect={(k) => setActiveModalTab(k)}
                                className="mb-3"
                            >
                                <Tab eventKey="status" title={<span><i className="bi bi-clipboard-check me-1"></i>Kết quả kiểm tra</span>}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Chuẩn đoán / Vấn đề phát hiện</Form.Label>
                                        <Form.Control
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
                                    {renderPartsSelection()}
                                </Tab>
                            </Tabs>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowUpdateModal(false)}>
                        Hủy
                    </Button>
                    <Button
                        variant="warning"
                        // style={{ backgroundColor: '#d30000', borderColor: '#d30000' }}
                        onClick={handleSubmitInspection}
                        disabled={loading}
                    >
                        {loading ? 'Đang xử lý...' : 'Hoàn thành kiểm tra'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal xác nhận nhận đơn - Add this new modal */}
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

            {/* Modal cập nhật chi tiết đơn hàng */}
            <Modal
                show={showUpdateDetailsModal}
                onHide={() => setShowUpdateDetailsModal(false)}
                size="xl"
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
                                        {partOrderDetailsData.length > 0 ? (
                                            partOrderDetailsData.map(part => {
                                                const partInfo = getData('parts', part.part_id) || { name: `Phụ tùng #${part.part_id}` };
                                                const isSelected = selectedItems.parts.has(part.part_detail_ID);
                                                // const realprice = partMotoTypeCache
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
                                                        <td>{part.part_id}</td>
                                                        <td>{partInfo.name}</td>
                                                        <td>{part.quantity}</td>
                                                        <td>{formatCurrency(part.price / part.quantity)}</td>
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
                                                        .filter(part => selectedItems.parts.has(part.part_detail_ID))
                                                        .reduce((sum, part) => sum + (part.price * part.quantity), 0)
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
                                        {serviceOrderDetailsData.length > 0 ? (
                                            serviceOrderDetailsData.map(service => {
                                                const serviceInfo = getData('services', service.service_id) || { name: `Dịch vụ #${service.service_id}` };
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
                        {detailsLoading ? 'Đang xử lý...' : 'Xác nhận và bắt đầu sửa chữa'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default TechnicianDashboard;
