import React, { useState, useEffect, use } from 'react';
import { Card, Table, Button, Row, Col, Form, InputGroup, Badge, Modal, Tabs, Tab, ProgressBar, ListGroup, Alert } from 'react-bootstrap';
import { useAppData } from '../contexts/AppDataContext';
import { useStaffAuth } from '../contexts/StaffAuthContext';
import { repairService, customerService, resourceService } from '../../services/api';
import StatusBadge from '../components/StatusBadge';
import './TechnicianDashboard.css';

const TechnicianDashboard = () => {
    // Context và state
    const { currentStaff } = useStaffAuth();
    const { getData, getIds, setData } = useAppData();
    const ordersById = getData('orders') || {};
    const customersById = getData('customers') || {};
    const motorcyclesById = getData('motorcycles') || {};
    const diagnosisById = getData('diagnosis') || {};
    const receiptsById = getData('receiptions');

    // State quản lý
    const [loading, setLoading] = useState(true);
    const [myOrdersIds, setMyOrdersIds] = useState(new Set());
    const [myOrdersIdsArray, setMyOrdersIdsArray] = useState([]);
    const [myOrdersDisplay, setMyOrdersDisplay] = useState({});
    const [filteredOrdersIds, setFilteredOrdersIds] = useState([]);
    const [activeTab, setActiveTab] = useState('all');
    const [currentOrder, setCurrentOrder] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    
    // State cho phụ tùng
    const [parts, setParts] = useState([]);
    const [selectedParts, setSelectedParts] = useState([]);
    const [partQuantities, setPartQuantities] = useState({});
    const [partSearchTerm, setPartSearchTerm] = useState('');
    const [partLoading, setPartLoading] = useState(false);
    
    // State cho dịch vụ
    const [services, setServices] = useState([]);
    const [selectedServices, setSelectedServices] = useState([]);
    const [serviceLoading, setServiceLoading] = useState(false);
    
    const [activeModalTab, setActiveModalTab] = useState('status');
    const [activeCatalogTab, setActiveCatalogTab] = useState('services'); // Tab cho phụ tùng/dịch vụ
    
    const [updateData, setUpdateData] = useState({
        status: '',
        notes: '',
        progressPercentage: 0
    });
    const [searchTerm, setSearchTerm] = useState('');

    // Thống kê
    const [stats, setStats] = useState({
        totalOrders: 0,
        inProgress: 0,
        pendingConfirmation: 0,
        completed: 0,
        todayOrders: 0
    });

    // Hằng số cho trạng thái
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

    // Thêm state mới để lưu trữ thông tin về loại xe và phụ tùng tương ứng
    const [motoTypeId, setMotoTypeId] = useState(null);
    const [partsByMotoType, setPartsByMotoType] = useState([]);
    const [partMotoTypesLoading, setPartMotoTypesLoading] = useState(false);

    // TODO: Lấy dữ liệu đơn hàng của kỹ thuật viên
    useEffect(() => {
        const fetchMyOrders = async () => {
            if (!currentStaff || !currentStaff.staff_id) {
                setLoading(false);
                return;
            }

            // mock currentStaff for testing
            currentStaff.staff_id = 4; 
            
            try {
                setLoading(true);
                // Gọi API để lấy đơn hàng được phân công cho kỹ thuật viên
                const response = await repairService.order.getAllOrdersByStaffIdToday(currentStaff.staff_id);
                const ordersData = response.data || [];

                console.log('Đơn hàng của kỹ thuật viên:', ordersData);
                
                // Tạo Set mới để lưu order IDs
                const newOrdersIds = new Set();
                const newOrdersDisplay = {};
                
                // Xử lý dữ liệu đơn hàng
                await Promise.all(ordersData.map(async (order) => {
                    // Lấy thông tin xe và khách hàng nếu cần
                    let motorcycle = motorcyclesById[order.motocycle_id];
                    let customer = null;
                    let diagnosis = diagnosisById[order.order_id];

                    if (!motorcycle) {
                        try {
                            const motoResponse = await customerService.motorcycle.getMotorcycleById(order.motocycle_id);
                            motorcycle = motoResponse.data;
                            setData('motorcycles', motorcycle, order.motocycle_id);
                        } catch (error) {
                            console.error('Lỗi khi lấy thông tin xe:', error);
                            motorcycle = { license_plate: 'Không có thông tin', brand: '', model: '' };
                        }
                    }

                    if (motorcycle && motorcycle.customer_id && !customersById[motorcycle.customer_id]) {
                        try {
                            const customerResponse = await customerService.customer.getCustomerById(motorcycle.customer_id);
                            customer = customerResponse.data;
                            setData('customers', customer, motorcycle.customer_id);
                        } catch (error) {
                            console.error('Lỗi khi lấy thông tin khách hàng:', error);
                            customer = { fullname: 'Không có thông tin', phone_num: '' };
                        }
                    } else {
                        customer = customersById[motorcycle?.customer_id];
                    }

                    if (!diagnosis) {
                        try {
                            const diagnosisResponse = await repairService.diagnosis.getDiagnosisByOrderId(order.order_id);
                            diagnosis = diagnosisResponse.data;
                            setData('diagnosis', diagnosis, order.order_id);
                        } catch (error) {
                            console.error('Lỗi khi lấy thông tin chuẩn đoán:', error);
                            diagnosis = { problem: '' };
                        }
                    }

                    let receiption = receiptsById[diagnosis?.form_id] || null;
                    if (!receiption && diagnosis.form_id) { 
                        try {
                            const receiptResponse = await customerService.reception.getReceptionById(diagnosis.form_id);
                            receiption = receiptResponse.data;
                            setData('receiptions', receiption, diagnosis.form_id);
                        } catch (error) {
                            console.error('Lỗi khi lấy thông tin biên bản tiếp nhận:', error);
                            receiption = { note: 'Không có ghi chú' };
                        }
                    }

                    // Format dữ liệu đơn hàng và lưu vào object hiển thị
                    newOrdersIds.add(order.order_id);
                    newOrdersDisplay[order.order_id] = formatOrderData(order, customer, motorcycle, diagnosis, receiption);
                }));

                // Cập nhật state
                setMyOrdersIds(newOrdersIds);
                setMyOrdersIdsArray(Array.from(newOrdersIds));
                setMyOrdersDisplay(newOrdersDisplay);
                setFilteredOrdersIds(Array.from(newOrdersIds));
                updateStats(newOrdersIds, newOrdersDisplay);
                setLoading(false);
            } catch (error) {
                console.error('Lỗi khi lấy đơn hàng của kỹ thuật viên:', error);
                setLoading(false);
            }
        };

        fetchMyOrders();
        
        // Lấy danh sách phụ tùng khi component được mount
        fetchParts();
        // Lấy danh sách dịch vụ
        fetchServices();
    }, [currentStaff]);

    // Hàm lấy danh sách phụ tùng từ API
    const fetchParts = async () => {
        try {
            setPartLoading(true);
            const response = await resourceService.part.getAllParts();
            const partsData = response.data || [];
            setParts(partsData);
            setPartLoading(false);
        } catch (error) {
            console.error('Lỗi khi lấy danh sách phụ tùng:', error);
            setPartLoading(false);
            
            // Sử dụng dữ liệu mẫu nếu API lỗi
            const mockParts = [
                { part_id: 1, name: 'Bugi NGK', code: 'BG001', unit: 'Cái' },
                { part_id: 2, name: 'Dầu nhớt Motul 4T 10W40', code: 'DN001', unit: 'Chai' },
                { part_id: 3, name: 'Lốc máy Honda Wave', code: 'LM001', unit: 'Bộ' },
                { part_id: 4, name: 'Xích đĩa DID', code: 'XD001', unit: 'Bộ' },
                { part_id: 5, name: 'Phanh đĩa Brembo', code: 'PD001', unit: 'Bộ' },
                { part_id: 6, name: 'Lọc gió K&N', code: 'LG001', unit: 'Cái' },
                { part_id: 7, name: 'Má phanh Nissin', code: 'MP001', unit: 'Bộ' },
                { part_id: 8, name: 'Ắc quy GS', code: 'AQ001', unit: 'Cái' },
            ];
            setParts(mockParts);
        }
    };

    // Hàm lấy danh sách dịch vụ
    const fetchServices = async () => {
        try {
            setServiceLoading(true);
            const response = await resourceService.service.getAllServices();
            const servicesData = response.data || [];
            setServices(servicesData);
            setServiceLoading(false);
        } catch (error) {
            console.error('Lỗi khi lấy danh sách dịch vụ:', error);
            setServiceLoading(false);
            
            // Sử dụng dữ liệu mẫu nếu API lỗi
            const mockServices = [
                { service_id: 1, name: 'Thay dầu máy', description: 'Thay dầu nhớt cho xe' },
                { service_id: 2, name: 'Thay bugi', description: 'Thay bugi mới' },
                { service_id: 3, name: 'Bảo dưỡng định kỳ', description: 'Bảo dưỡng toàn bộ xe' },
                { service_id: 4, name: 'Thay lốc máy', description: 'Thay lốc máy mới' },
                { service_id: 5, name: 'Thay xích đĩa', description: 'Thay thế bộ xích và đĩa' },
                { service_id: 6, name: 'Thay phanh', description: 'Thay phanh mới' },
                { service_id: 7, name: 'Thay nhớt hộp số', description: 'Thay nhớt hộp số' },
                { service_id: 8, name: 'Vệ sinh kim phun xăng', description: 'Vệ sinh hệ thống phun xăng' },
            ];
            setServices(mockServices);
        }
    };

    useEffect(() => {
        if (!loading) {
            console.log('Dashboard data loaded:', ordersById, customersById, motorcyclesById, diagnosisById, myOrdersDisplay, myOrdersIds);
            console.log('Reception data:', receiptsById);
        }
    }, [loading]);

    // Format dữ liệu đơn hàng
    const formatOrderData = (order, customer, motorcycle, diagnosis, receiption) => {
        const [createdAtDate, createdAtTime] = order.created_at?.split('T') || ['', ''];
        return {
            motorcycleId: order.motocycle_id,
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
            diagnosis: diagnosis?.problem || '',
            priority: getPriorityFromDate(createdAtDate),
            progressPercentage: getProgressPercentage(order.status),

            note: receiption?.note || 'Không có ghi chú',
        };
    };

    // Hàm tính độ ưu tiên dựa trên ngày tạo
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

    // Hàm tính phần trăm tiến độ dựa trên trạng thái
    const getProgressPercentage = (status) => {
        switch (status) {
            case 'received': return 10;
            case 'checking': return 30;
            case 'wait_confirm': return 50;
            case 'repairing': return 70;
            case 'wait_delivery': return 90;
            case 'delivered': return 100;
            default: return 0;
        }
    };

    // Cập nhật thống kê
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

    // Xử lý khi thay đổi tab
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        filterOrders(tab, searchTerm);
    };

    // Xử lý khi tìm kiếm
    const handleSearch = (e) => {
        const term = e.target.value.toLowerCase();
        setSearchTerm(term);
        filterOrders(activeTab, term);
    };

    // Lọc đơn hàng
    const filterOrders = (tab, term) => {
        let filtered = [...myOrdersIdsArray];
        
        // Lọc theo tab
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
        
        // Lọc theo từ khóa tìm kiếm
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

    // Xem chi tiết đơn hàng
    const handleViewDetail = (orderId) => {
        setCurrentOrder(myOrdersDisplay[orderId]);
        setShowDetailModal(true);
    };

    // Mở modal cập nhật trạng thái
    const handleShowUpdateModal = (orderId) => {
        const order = myOrdersDisplay[orderId];
        setCurrentOrder(order);
        setUpdateData({
            status: order.rawStatus,
            notes: '',
            progressPercentage: getProgressPercentage(order.rawStatus)
        });
        
        // Reset lại state phụ tùng và dịch vụ khi mở modal
        setSelectedParts([]);
        setPartQuantities({});
        setSelectedServices([]);
        setActiveModalTab('status');
        setActiveCatalogTab('services'); // Mặc định hiển thị tab dịch vụ trước
        
        // Lấy loại xe từ thông tin xe
        if (order.originalData && order.originalData.motocycle_id) {
            const motorcycle = motorcyclesById[order.originalData.motocycle_id];
            if (motorcycle && motorcycle.moto_type_id) {
                setMotoTypeId(motorcycle.moto_type_id);
                fetchPartsByMotoType(motorcycle.moto_type_id);
            } else {
                // Trường hợp không có thông tin loại xe, reset parts
                setPartsByMotoType([]);
                setMotoTypeId(null);
            }
        }
        
        setShowUpdateModal(true);
    };

    // Hàm lấy danh sách phụ tùng theo loại xe
    const fetchPartsByMotoType = async (motoTypeId) => {
        if (!motoTypeId) return;
        
        try {
            setPartMotoTypesLoading(true);
            const response = await resourceService.partMotoType.getAllPartMotoTypesByMotoTypeId(motoTypeId);
            const partMotoTypeData = response.data || [];
            
            // Map dữ liệu phụ tùng theo loại xe với thông tin phụ tùng đầy đủ
            const enhancedPartData = await Promise.all(partMotoTypeData.map(async (partMotoType) => {
                // Tìm thông tin phụ tùng trong danh sách phụ tùng hiện có
                const partInfo = parts.find(p => p.part_id === partMotoType.part_id);
                
                if (partInfo) {
                    return {
                        ...partMotoType,
                        ...partInfo,
                        // Đảm bảo part_id từ partMotoType không bị ghi đè
                        part_id: partMotoType.part_id
                    };
                }
                
                // Nếu không tìm thấy trong cache, lấy thông tin từ API
                try {
                    const partResponse = await resourceService.part.getPartById(partMotoType.part_id);
                    const partData = partResponse.data;
                    return {
                        ...partMotoType,
                        ...partData
                    };
                } catch (error) {
                    console.error(`Lỗi khi lấy thông tin phụ tùng id=${partMotoType.part_id}:`, error);
                    return {
                        ...partMotoType,
                        name: `Phụ tùng ID ${partMotoType.part_id}`,
                        code: 'Unknown',
                        unit: 'Cái'
                    };
                }
            }));
            
            setPartsByMotoType(enhancedPartData);
            setPartMotoTypesLoading(false);
        } catch (error) {
            console.error('Lỗi khi lấy danh sách phụ tùng theo loại xe:', error);
            setPartsByMotoType([]);
            setPartMotoTypesLoading(false);
        }
    };

    // Chỉnh sửa hàm getFilteredParts để hiển thị phụ tùng theo loại xe
    const getFilteredParts = () => {
        // Nếu có danh sách phụ tùng theo loại xe, ưu tiên hiển thị
        const partsToFilter = partsByMotoType.length > 0 ? partsByMotoType : parts;
        
        // Nếu không có từ khóa tìm kiếm, trả về toàn bộ danh sách
        if (!partSearchTerm) return partsToFilter;
        
        // Nếu có từ khóa tìm kiếm, lọc theo nhiều tiêu chí
        const searchTerm = partSearchTerm.toLowerCase();
        return partsToFilter.filter(part => {
            // Tìm kiếm theo tên phụ tùng
            if (part.name?.toLowerCase().includes(searchTerm)) {
                return true;
            }
            
            // Tìm kiếm theo mã phụ tùng
            if (part.code?.toLowerCase().includes(searchTerm)) {
                return true;
            }
            
            // Có thể mở rộng tìm kiếm theo các tiêu chí khác
            // Ví dụ: loại phụ tùng, nhà sản xuất, v.v.
            
            return false;
        });
    };

    // Thêm/xóa phụ tùng khỏi danh sách đã chọn
    const togglePartSelection = (partId, partMotoTypeId = null) => {
        // Sử dụng part_mototype_id nếu có, ngược lại sử dụng part_id
        const selectionId = partMotoTypeId || partId;
        
        if (selectedParts.includes(selectionId)) {
            // Xóa phụ tùng khỏi danh sách đã chọn
            setSelectedParts(prev => prev.filter(id => id !== selectionId));
            
            // Xóa số lượng của phụ tùng
            const newQuantities = {...partQuantities};
            delete newQuantities[selectionId];
            setPartQuantities(newQuantities);
        } else {
            // Thêm phụ tùng vào danh sách đã chọn
            setSelectedParts(prev => [...prev, selectionId]);
            
            // Khởi tạo số lượng là 1
            setPartQuantities(prev => ({
                ...prev,
                [selectionId]: 1
            }));
        }
    };

    // Thêm/xóa dịch vụ khỏi danh sách đã chọn
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

    // Tính tổng tiền phụ tùng đã chọn
    const calculateTotalAmount = () => {
        return selectedParts.reduce((total, partId) => {
            // Tìm thông tin phụ tùng từ cả hai nguồn
            const partFromMotoType = partsByMotoType.find(p => 
                p.part_mototype_id === partId || p.part_id === partId
            );
            const part = partFromMotoType || parts.find(p => p.part_id === partId);
            
            if (!part) return total;
            
            const quantity = partQuantities[partId] || 1;
            const price = part.price || 0;
            
            return total + (price * quantity);
        }, 0);
    };

    const calculateTotalPrice = async (partsData, servicesData, motorcycleId, orderId) => {
        let totalPrice = 0;
        const partOrderDetails = await Promise.all(partsData.map(async (part) => {
            try {
                const partId = part.part_id;
                const response = await resourceService.partMotoType.getPartMotoTypeByPartIdAndMototypeId(partId, motorcycleId);
                const partMotoType = response.data;
                if (partMotoType) {
                    part.price = partMotoType.price;
                } else {
                    part.price = 0; // Hoặc giá mặc định nếu không tìm thấy
                }
                return {
                    is_selected: false,
                    order_id: orderId,
                    part_id: partId,
                    quantity: part.quantity,
                    price: parseInt(part.price) * parseInt(part.quantity),
                }
            } catch (error) {
                console.error('Lỗi khi lấy giá phụ tùng:', error);
                return null;
            }
        }));
        partOrderDetails.map(partOrderDetail => { 
            if (partOrderDetail) {
                totalPrice += partOrderDetail.price;
            }
        });
        console.log('Tổng tiền và chi tiết phụ tùng đơn hàng', totalPrice, partOrderDetails);
    }

    // Cập nhật trạng thái đơn hàng
    const handleUpdateOrder = async () => {
        if (!currentOrder) return;

        try {
            setLoading(true);
            
            // Chuẩn bị dữ liệu phụ tùng
            const partsData = selectedParts.map(partId => {
                // Tìm thông tin phụ tùng từ cả hai nguồn
                const partFromMotoType = partsByMotoType.find(p => 
                    p.part_mototype_id === partId || p.part_id === partId
                );
                const part = partFromMotoType || parts.find(p => p.part_id === partId);
                
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
            
            // Chuẩn bị dữ liệu dịch vụ
            const servicesData = selectedServices.map(serviceId => {
                const service = services.find(s => s.id === serviceId);
                return {
                    service_id: serviceId,
                    name: service ? service.name : '',
                };
            });

            await calculateTotalPrice(partsData, servicesData, motorcyclesById[currentOrder.motorcycleId].moto_type_id, currentOrder.orderId);
            
            // TODO: Gọi API cập nhật
            // const response = await repairService.order.updateOrderStatus(currentOrder.orderId, {
            //     status: updateData.status,
            //     notes: updateData.notes,
            //     parts: partsData,
            //     services: servicesData
            // });

            // const responseDiaginosis = await repairService.diagnosis.updateDiagnosis();
            
            // Cập nhật state
            // const updatedOrder = response.data;
            // setData('orders', updatedOrder, updatedOrder.order_id);
            
            // Cập nhật object hiển thị
            // const updatedOrdersDisplay = {...myOrdersDisplay};
            // updatedOrdersDisplay[currentOrder.orderId] = {
            //     ...myOrdersDisplay[currentOrder.orderId],
            //     status: STATUS_MAPPING[updatedOrder.status],
            //     rawStatus: updatedOrder.status,
            //     progressPercentage: getProgressPercentage(updatedOrder.status)
            // };
            
            // setMyOrdersDisplay(updatedOrdersDisplay);
            // filterOrders(activeTab, searchTerm);
            // updateStats(myOrdersIds, updatedOrdersDisplay);
            // setShowUpdateModal(false);
            setLoading(false);
            
            alert('Cập nhật đơn hàng thành công!');
        } catch (error) {
            console.error('Lỗi khi cập nhật trạng thái đơn hàng:', error);
            setLoading(false);
            alert('Cập nhật thất bại. Vui lòng thử lại sau!');
        }
    };

    // Hàm định dạng tiền tệ
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // Hiển thị các thẻ thống kê
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

    // Hiển thị component chọn phụ tùng và dịch vụ trong modal
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
                                {serviceLoading ? (
                                    <div className="text-center py-2">
                                        <div className="spinner-border spinner-border-sm" role="status">
                                            <span className="visually-hidden">Đang tải...</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="service-list-container p-2 border rounded" style={{height: "400px", overflowY: "auto"}}>
                                        {services.map(service => (
                                            <Form.Check
                                                key={service.service_id}
                                                type="checkbox"
                                                id={`service-${service.service_id}`}
                                                label={service.name}
                                                checked={selectedServices.includes(service.service_id)}
                                                onChange={() => toggleServiceSelection(service.service_id)}
                                                className="mb-2"
                                            />
                                        ))}
                                    </div>
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
                        <div className="selected-items-summary p-3 bg-light rounded" style={{height: "460px", overflowY: "auto"}}>
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
                                                    const service = services.find(s => s.service_id === serviceId);
                                                    return (
                                                        <ListGroup.Item 
                                                            key={serviceId}
                                                            className="px-0 py-2 d-flex justify-content-between align-items-center"
                                                            style={{backgroundColor: 'transparent'}}
                                                        >
                                                            <span>{service?.name}</span>
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
                                                            style={{backgroundColor: 'transparent'}}
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
                                <div className="text-center" style={{paddingTop: "100px"}}>
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

    // Cập nhật hàm handlePartSearch để xử lý tìm kiếm phụ tùng

    // Xử lý tìm kiếm phụ tùng
    const handlePartSearch = (e) => {
        const term = e.target.value;
        setPartSearchTerm(term);
        
        // Nếu từ khóa tìm kiếm không rỗng và độ dài >= 2 ký tự, thực hiện tìm kiếm
        if (term.length >= 2) {
            // Nếu đang hiển thị phụ tùng theo loại xe, thì tìm kiếm trong danh sách đó
            if (partsByMotoType.length > 0) {
                // Tìm kiếm local trong danh sách phụ tùng theo loại xe đã có
                const filtered = partsByMotoType.filter(part => 
                    part.name?.toLowerCase().includes(term.toLowerCase()) || 
                    part.code?.toLowerCase().includes(term.toLowerCase())
                );
                // Hiển thị kết quả tìm kiếm ngay lập tức
            } else {
                // Nếu không có danh sách phụ tùng theo loại xe, thực hiện tìm kiếm API
                searchPartsFromAPI(term);
            }
        }
    };

    // Hàm tìm kiếm phụ tùng từ API
    const searchPartsFromAPI = async (searchTerm) => {
        if (!searchTerm || searchTerm.length < 2) return;
        
        try {
            setPartLoading(true);
            // Gọi API tìm kiếm phụ tùng
            const response = await resourceService.part.searchParts(searchTerm);
            
            if (response && response.data) {
                // Cập nhật danh sách phụ tùng tạm thời với kết quả tìm kiếm
                const searchResults = response.data;
                // Nếu đang hiển thị theo loại xe, thì ghi đè tạm thời kết quả tìm kiếm
                if (motoTypeId) {
                    // Giữ nguyên danh sách phụ tùng theo loại xe, chỉ lọc theo từ khóa
                } else {
                    // Nếu không hiển thị theo loại xe, cập nhật toàn bộ danh sách
                    setParts(searchResults);
                }
            }
            setPartLoading(false);
        } catch (error) {
            console.error('Lỗi khi tìm kiếm phụ tùng:', error);
            setPartLoading(false);
            // Tìm kiếm local trong trường hợp API lỗi
            const filtered = parts.filter(part => 
                part.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                part.code?.toLowerCase().includes(searchTerm.toLowerCase())
            );
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
                                    <th style={{width: "150px"}}>Thao tác</th>
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
                                                        style={{height: "8px"}}
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
                                                        <Button
                                                            variant="outline-success"
                                                            size="sm"
                                                            onClick={() => handleShowUpdateModal(order.orderId)}
                                                            title="Cập nhật trạng thái"
                                                        >
                                                            <i className="bi bi-arrow-clockwise"></i>
                                                        </Button>
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

            {/* Modal xem chi tiết */}
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
                                <Col md={12}>
                                    <h6 className="text-muted mb-3">Thông tin xe</h6>
                                    <p><strong>Loại xe:</strong> {currentOrder.motorcycleModel}</p>
                                    <p><strong>Biển số:</strong> {currentOrder.plateNumber}</p>
                                </Col>
                            </Row>

                            <div className="p-3 bg-light rounded mb-3">
                                <h6>Ghi chú tiếp nhận:</h6>
                                <p className="mb-0">{currentOrder.note}</p>
                            </div>

                            {currentOrder.totalAmount > 0 && (
                                <div className="p-3 bg-light rounded mb-3">
                                    <h6>Giá trị đơn hàng:</h6>
                                    <p className="mb-0 fw-bold">{formatCurrency(currentOrder.totalAmount)}</p>
                                </div>
                            )}
                        </>
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
                            handleShowUpdateModal(currentOrder.orderId);
                        }}
                    >
                        Cập nhật trạng thái
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal cập nhật đơn hàng */}
            <Modal show={showUpdateModal} onHide={() => setShowUpdateModal(false)} size="xl">
                <Modal.Header closeButton>
                    <Modal.Title>Cập nhật đơn hàng #{currentOrder?.orderId}</Modal.Title>
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
                                <Tab eventKey="status" title={<span><i className="bi bi-pencil-square me-1"></i>Cập nhật trạng thái</span>}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Trạng thái mới</Form.Label>
                                        <Form.Select
                                            value={updateData.status}
                                            onChange={(e) => setUpdateData({...updateData, status: e.target.value})}
                                        >
                                            <option value="received">Đã tiếp nhận</option>
                                            <option value="checking">Đang kiểm tra</option>
                                            <option value="wait_confirm">Chờ xác nhận</option>
                                            <option value="repairing">Đang sửa chữa</option>
                                            <option value="wait_delivery">Chờ giao xe</option>
                                            <option value="delivered">Đã giao xe</option>
                                        </Form.Select>
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Tiến độ công việc</Form.Label>
                                        <ProgressBar 
                                            now={updateData.progressPercentage} 
                                            variant={
                                                updateData.progressPercentage < 30 ? "info" :
                                                updateData.progressPercentage < 70 ? "warning" :
                                                updateData.progressPercentage < 100 ? "primary" : "success"
                                            }
                                            className="mb-2"
                                        />
                                        <small className="text-muted d-block">{updateData.progressPercentage}% hoàn thành</small>
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Chuẩn đoán (không bắt buộc)</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={5}
                                            value={updateData.diagnosis}
                                            onChange={(e) => setUpdateData({...updateData, diagnosis: e.target.value})}
                                            placeholder="Nhập chuẩn đoán, vấn đề phát sinh, v.v."
                                        />
                                    </Form.Group>
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
                        variant="primary" 
                        style={{ backgroundColor: '#d30000', borderColor: '#d30000' }}
                        onClick={handleUpdateOrder}
                        disabled={loading}
                    >
                        {loading ? 'Đang xử lý...' : 'Cập nhật'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default TechnicianDashboard;
