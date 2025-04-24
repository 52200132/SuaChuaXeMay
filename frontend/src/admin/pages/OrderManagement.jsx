import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Pagination, Modal, Form, Row, Col, InputGroup, Badge, Tabs, Tab, Dropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import AssignmentManagement from './AssignmentManagement';

import StatusBadge from '../components/StatusBadge';
import { useAppData } from '../contexts/AppDataContext';
import { customerService, resourceService, repairService } from '../../services/api';
import './OrderManagement.css';
import { set } from 'date-fns';

// Register Chart.js components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const OrderManagement = () => {
    // TODO: Lấy từ context
    const { getData, getIds, setData, fetchAndStoreData, setMultipleData, errors, setError } = useAppData();
    const ordersById = getData('orders');
    const ordersIds = getData('ordersIds');
    const customersById = getData('customers');
    const motorcyclesById = getData('motorcycles');
    const diagnosisById = getData('diagnosis');
    const staffsById = getData('staffs');

    // State quản lý danh sách đơn hàng
    const [orders, setOrders] = useState([]);
    const [fileredOrdersIds, setFilteredOrdersIds] = useState([]);
    const [ordersDisplay, setOrdersDisplay] = useState({});
    
    // State cho filter và phân trang
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        startDate: '',
        endDate: '',
        motocycleId: ''
    });

    const tableOrderStatus = {
        // English to Vietnamese mapping
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
    
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    // State cho modal
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentOrder, setCurrentOrder] = useState({});
    
    // State cho form chỉnh sửa
    const [formData, setFormData] = useState({
        status: '',
        note: '',
    });
    
    const [validated, setValidated] = useState(false);
    const [loading, setLoading] = useState(true);
    
    // Tab management
    const [activeTab, setActiveTab] = useState('orders');
    
    // Additional states for technician assignment
    const [technicians, setTechnicians] = useState([]);
    const [technicianAvailability, setTechnicianAvailability] = useState({});

    const [pendingOrders, setPendingOrders] = useState([]); // Mảng lưu id đơn hàng chưa phân công
    const [assignedOrders, setAssignedOrders] = useState([]); // Mảng lưu id đơn hàng đã phân công

    const [technicianPerformance, setTechnicianPerformance] = useState([]);
    const [dashboardStats, setDashboardStats] = useState({
        pending: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0
    });
    
    // States for technician assignment modal
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedTechnician, setSelectedTechnician] = useState('');
    const [assignmentNote, setAssignmentNote] = useState('');
    const [startTime, setStartTime] = useState('');
    const [estimatedEndTime, setEstimatedEndTime] = useState('');
    
    // State for showing technician workload details
    const [showWorkloadModal, setShowWorkloadModal] = useState(false);
    const [selectedTechnicianDetail, setSelectedTechnicianDetail] = useState(null);

    // Load mock data
    useEffect(() => {

        // TODO: Fetch dữ liệu từ API
        const fetchData = async () => { 
            setLoading(true);

            errors.customers = [];
            errors.motorcycles = [];
            errors.staffs = [];
            errors.diagnosis = [];

            await fetchAndStoreData('orders', repairService.order.getAllOrders, 'order_id')
                .then(async response => {
                    const orderData = response.dataArray;

                    // Sử dụng Promise.allSettled cho map chính
                    const results = await Promise.allSettled(orderData.map(async order => {
                        // const customerId = order.customer_id;
                        const motorcycleId = order.motocycle_id;
                        const staffId = order.staff_id;

                        // Sử dụng Promise.allSettled cho các fetch phụ để biết cái nào lỗi
                        const [ motorcycleResult, staffResult, diagnosisResult] = await Promise.allSettled([
                            motorcyclesById[motorcycleId] ? Promise.resolve({ data: motorcyclesById[motorcycleId] }) : customerService.motorcycle.getMotorcycleById(motorcycleId),
                            staffsById[staffId] ? Promise.resolve({ data: staffsById[staffId] }) : resourceService.staff.getStaffById(staffId),
                            diagnosisById[order.order_id] ? Promise.resolve({ data: diagnosisById[order.order_id] }) : repairService.diagnosis.getDiagnosisByOrderId(order.order_id),
                        ]);

                        const customerId = motorcycleResult.value?.data?.customer_id || '';
                        // Lấy dữ liệu khách hàng từ context hoặc gọi API nếu không có trong context
                        const [ customerResult ] = await Promise.allSettled([
                            customersById[customerId] ? Promise.resolve({ data: customersById[customerId] }) : customerService.customer.getCustomerById(customerId)
                        ]);

                        // Lấy dữ liệu nếu thành công, hoặc dùng object rỗng nếu thất bại
                        const customer = customerResult.status === 'fulfilled' ? customerResult.value?.data || {} : {};
                        const motorcycle = motorcycleResult.status === 'fulfilled' ? motorcycleResult.value?.data || {} : {};
                        const staff = staffResult.status === 'fulfilled' ? staffResult.value?.data || {} : {};
                        const diagnosis = diagnosisResult.status === 'fulfilled' ? diagnosisResult.value?.data || {} : {};

                        // Ghi log lỗi cụ thể nếu có
                        Object.entries({
                            customers: customerResult,
                            motorcycles: motorcycleResult,
                            staffs: staffResult,
                            diagnosis: diagnosisResult,
                        }).forEach(([key, res]) => { 
                            errors[key].push(res.status === 'rejected' ? `Lỗi khi lấy ${key} cho đơn ${order.order_id}: ${res.reason.response?.data?.detail}` : null);
                        })

                        // Lưu dữ liệu vào context
                        if (staffId) { // có staffId thì mới lưu staff, và đã phân công
                            setData('staffs', staff, staffId); 
                            // console.log('staff:', staff); 
                        }
                        if (customerId) { setData('customers', customer, customerId); }
                        if (motorcycleId) { setData('motorcycles', motorcycle, motorcycleId); }
                        if (order.order_id) { setData('diagnosis', diagnosis, order.order_id); }

                        // Luôn trả về để format, hàm formatOrder cần xử lý dữ liệu thiếu
                        return [order.order_id, formatOrder(order, customer, motorcycle, staff, diagnosis)];
                    }));

                    // Lọc ra các kết quả thành công từ map chính
                    const successfulEntries = results
                        .filter(result => result.status === 'fulfilled')
                        .map(result => result.value); // Lấy giá trị trả về [order_id, formattedOrder]

                    const newOrderDisplay = Object.fromEntries(successfulEntries);

                    // Ghi log các lỗi bị bắt bởi Promise.allSettled ở map chính (nếu có lỗi logic bên trong map không bị try...catch)
                    results.forEach(result => {
                        if (result.status === 'rejected') {
                            console.error("Một promise xử lý đơn hàng đã thất bại hoàn toàn:", result.reason);
                        }
                    });

                    // Object.entries(errors).forEach(([key, value]) => {
                    //     console.log(`Errors for ${key}:`, value.filter(v => v !== null)); // Lọc ra các lỗi không null
                    // });

                    console.log('useEffect - Đơn hàng:', orderData);
                    console.log('useEffect - Danh sách đơn hàng:', newOrderDisplay);

                    setOrdersDisplay(newOrderDisplay);
                })
                .catch(error => {
                    // Catch này chỉ bắt lỗi của fetchAndStoreData hoặc lỗi không mong muốn khác
                    console.error('Lỗi nghiêm trọng khi lấy danh sách đơn hàng hoặc xử lý chung:', error);
                    setLoading(false);
                });

            setLoading(false);
        }

        fetchData();
    }, []);

    // TODO: Khi load dữ liệu xong
    useEffect(() => {
        console.log('useEffect - Trạng thái của loading', loading);
        console.log('Các dữ liệu lấy được', ordersById, ordersIds, getIds('orders'));
        if (!loading) {
            console.log('useEffect - Dữ liệu display', ordersDisplay);
            setFilteredOrdersIds(getIds('orders'));
            setTotalPages(Math.ceil(getIds('orders').length / 10));
            // console.log('useEffect - fillteredOrdersIds và totalPages', fileredOrdersIds, totalPages)

            // Phân loại đơn hàng thành đã phân công và chưa phân công
            const assingedOrders = []
            const pendingOrders = []
            Object.values(ordersById).map(order => {
                if (order.staff_id && order.status !== 'delivered') {
                    assingedOrders.push(order.order_id);
                } else {
                    pendingOrders.push(order.order_id);
                }
            });
            console.log(assignedOrders, pendingOrders);
            setAssignedOrders(assingedOrders);
            setPendingOrders(pendingOrders);
        }
    }, [loading, ordersById]);

    // Process orders for assignment view when orders data changes
    useEffect(() => {
        if (!loading && Object.keys(ordersDisplay).length > 0) {
            // processingOrdersForAssignment();
            // updateDashboardStats();
        }
    }, [ordersDisplay, loading]);

    const formatOrder = (order, customer, motorcycle, staff, diagnosis) => { 
        const [ createdAtDate, createdAtTime ] = order?.created_at?.split('T') || ['', ''];
        return {
            orderId: order.order_id,
            // cutomer info
            customerName: customer?.fullname || '',
            customerPhone: customer?.phone_num || '',
            // moto info
            plateNumber: motorcycle?.license_plate || '',
            motorcycleModel: `${motorcycle?.brand || ''} ${motorcycle?.model || ''}`,
            // staff info
            technicianName: staff?.fullname || 'Chưa phân công',

            status: tableOrderStatus[order.status] || '',
            totalAmount: order.total_price || '',
            createdDate: createdAtDate || '',
            createdTime: createdAtTime || '',
            // diagnosis
            diagnosis: diagnosis?.problem || '',
        }
    }
    
    // Xử lý filter
    const handleApplyFilter = () => {
        let filtered = [...orders];
        
        // Filter by search term
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(order => 
                order.orderId.toLowerCase().includes(searchTerm) ||
                order.customerName.toLowerCase().includes(searchTerm) ||
                order.customerPhone.includes(searchTerm) ||
                order.technicianName.toLowerCase().includes(searchTerm)
            );
        }
        
        // Filter by status
        if (filters.status) {
            filtered = filtered.filter(order => order.status === filters.status);
        }
        
        // Filter by date range
        if (filters.startDate) {
            filtered = filtered.filter(order => order.createdDate >= filters.startDate);
        }
        
        if (filters.endDate) {
            filtered = filtered.filter(order => order.createdDate <= filters.endDate);
        }
        
        // setFilteredOrders(filtered);
        setTotalPages(Math.ceil(filtered.length / 10));
        setCurrentPage(1);
    };
    
    // Xử lý reset filter
    const handleResetFilter = () => {
        setFilters({
            search: '',
            status: '',
            startDate: '',
            endDate: '',
        });
        // setFilteredOrders(orders);
        setTotalPages(Math.ceil(orders.length / 10));
        setCurrentPage(1);
    };
    
    // Xử lý thay đổi filter
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    // Phân trang
    const getCurrentItems = () => {
        const indexOfLastItem = currentPage * 10;
        const indexOfFirstItem = indexOfLastItem - 10;
        return fileredOrdersIds.slice(indexOfFirstItem, indexOfLastItem).map(id => ordersDisplay[id]);
    };
    
    // Xử lý modal xem chi tiết
    const handleShowDetailModal = (order) => {
        setCurrentOrder(order);
        setShowDetailModal(true);
    };
    
    // Xử lý modal chỉnh sửa
    const handleShowEditModal = (order) => {
        setCurrentOrder(order);
        setFormData({
            status: order.status,
            note: order.note,
        });
        setValidated(false);
        setShowEditModal(true);
    };
    
    // Xử lý thay đổi form
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    // Xử lý submit form chỉnh sửa
    const handleEditSubmit = (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        
        if (form.checkValidity() === false) {
            e.stopPropagation();
            setValidated(true);
            return;
        }
        
        // Update order in state
        const updatedOrders = orders.map(order => {
            if (order.orderId === currentOrder.orderId) {
                return {
                    ...order,
                    status: formData.status,
                    note: formData.note,
                };
            }
            return order;
        });
        
        setOrders(updatedOrders);
        // setFilteredOrders(updatedOrders);
        setShowEditModal(false);
    };
    
    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };
    
    // Xử lý thay đổi trang
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };
    
    // Pagination component
    const renderPagination = () => {
        if (totalPages <= 1) return null;
        
        let items = [];
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        
        if (startPage > 1) {
            items.push(
                <Pagination.First key="first" onClick={() => handlePageChange(1)} />,
                <Pagination.Prev key="prev" onClick={() => handlePageChange(currentPage - 1)} />
            );
        }
        
        for (let page = startPage; page <= endPage; page++) {
            items.push(
                <Pagination.Item
                    key={page}
                    active={page === currentPage}
                    onClick={() => handlePageChange(page)}
                >
                    {page}
                </Pagination.Item>
            );
        }
        
        if (endPage < totalPages) {
            items.push(
                <Pagination.Next key="next" onClick={() => handlePageChange(currentPage + 1)} />,
                <Pagination.Last key="last" onClick={() => handlePageChange(totalPages)} />
            );
        }
        
        return (
            <Pagination className="justify-content-center mt-4">
                {items}
            </Pagination>
        );
    };

    // Process orders for assignment view
    const processingOrdersForAssignment = () => {
        const pending = [];
        const assigned = [];
        
        Object.values(ordersDisplay).forEach(order => {
            // Only include orders that need assignment
            if (['Đã tiếp nhận', 'Đang kiểm tra', 'Chờ xác nhận'].includes(order.status)) {
                if (!order.technicianId || order.technicianId === '') {
                    pending.push({
                        ...order,
                        motorcycleInfo: {
                            id: order.motorcycleId || '',
                            plate: order.plateNumber || '',
                            model: order.motorcycleModel || ''
                        }
                    });
                } else {
                    assigned.push({
                        ...order,
                        motorcycleInfo: {
                            id: order.motorcycleId || '',
                            plate: order.plateNumber || '',
                            model: order.motorcycleModel || ''
                        },
                        startTime: order.startTime || '08:00',
                        estimatedEndTime: order.estimatedEndTime || '10:00'
                    });
                }
            }
        });
        
        setPendingOrders(pending);
        setAssignedOrders(assigned);
        
        // Update technician availability based on assigned orders
        calculateTechnicianAvailability(technicians, assigned);
    };
    
    // Update dashboard statistics
    const updateDashboardStats = () => {
        const orders = Object.values(ordersDisplay);
        const stats = {
            pending: orders.filter(order => 
                ['Đã tiếp nhận', 'Đang kiểm tra', 'Chờ xác nhận'].includes(order.status)).length,
            inProgress: orders.filter(order => 
                ['Đang sửa chữa'].includes(order.status)).length,
            completed: orders.filter(order => 
                ['Chờ giao xe', 'Đã giao xe'].includes(order.status)).length,
            cancelled: orders.filter(order => 
                ['Đã hủy'].includes(order.status)).length
        };
        
        setDashboardStats(stats);
    };
    
    // Calculate technician availability
    const calculateTechnicianAvailability = (techList, assignedOrdersList) => {
        const availability = {};
        
        techList.forEach(tech => {
            // Count assigned orders for this technician
            const assignedOrdersCount = assignedOrdersList.filter(order => order.technicianId === tech.staff_id).length;
            
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
    
    // Calculate technician performance
    const calculateTechnicianPerformance = (techList, ordersList) => {
        const performance = techList.map(tech => {
            // Filter completed orders by this technician
            const completedOrders = ordersList.filter(order => 
                order.technicianId === tech.staff_id && 
                ['Chờ giao xe', 'Đã giao xe'].includes(order.status)
            );
            
            // Filter in-progress orders by this technician
            const inProgressOrders = ordersList.filter(order => 
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
    
    // Handle technician assignment
    const handleAssignOrder = async (order) => { // order: Thông tin đơn hàng mới
        try {
            
            // Cập nhật ordersDisplay với thông tin mới
            const motorcycle = motorcyclesById[order.motocycle_id];
            const customer = customersById[motorcycle.customer_id];
            const staff = staffsById[order.staff_id];
            const diagnosis = diagnosisById[order.diagnosis_id];

            ordersDisplay[order.order_id] = formatOrder(order, customer, motorcycle, staff, diagnosis);

            // // Find the order to update
            // const order = [...pendingOrders, ...assignedOrders].find(o => o.orderId === orderId);
            // if (!order) return;
            
            // // Find the technician
            // const selectedTech = technicians.find(tech => tech.staff_id === technicianId);
            
            // // Update orders in state
            // const updatedPendingOrders = pendingOrders.filter(o => o.orderId !== orderId);
            
            // const assignedOrder = {
            //     ...order,
            //     technicianId: technicianId,
            //     technicianName: selectedTech ? selectedTech.fullname : 'Không xác định',
            //     status: 'Đang sửa chữa',
            // };
            
            // setPendingOrders(updatedPendingOrders);
            // setAssignedOrders([...assignedOrders.filter(o => o.orderId !== orderId), assignedOrder]);
            
            // // Also update in ordersDisplay
            // setOrdersDisplay(prev => ({
            //     ...prev,
            //     [orderId]: {
            //         ...prev[orderId],
            //         technicianId: technicianId,
            //         technicianName: selectedTech ? selectedTech.fullname : 'Không xác định',
            //         status: 'Đang sửa chữa',
            //         startTime: startTime,
            //     }
            // }));
            
            // Update technician availability
            // updateTechnicianAvailability(technicianId);
            
            // TODO: Toast thông báo
            // alert(`Đã phân công đơn hàng ${orderId} cho ${selectedTech?.fullname}`);
            
            return true;
        } catch (error) {
            console.error('Lỗi khi phân công đơn hàng:', error);
            alert('Có lỗi xảy ra khi phân công đơn hàng. Vui lòng thử lại!');
            return false;
        }
    };
    
    // Handle unassign order
    const handleUnassignOrder = (orderId) => {
        try {
            // Find the order
            const order = assignedOrders.find(o => o.orderId === orderId);
            if (!order) return;
            
            // Update orders in state
            const updatedAssignedOrders = assignedOrders.filter(o => o.orderId !== orderId);
            
            const unassignedOrder = {
                ...order,
                technicianId: '',
                technicianName: '',
                status: 'Đã tiếp nhận'
            };
            
            setAssignedOrders(updatedAssignedOrders);
            setPendingOrders([...pendingOrders, unassignedOrder]);
            
            // Also update in ordersDisplay
            setOrdersDisplay(prev => ({
                ...prev,
                [orderId]: {
                    ...prev[orderId],
                    technicianId: '',
                    technicianName: 'Chưa phân công',
                    status: 'Đã tiếp nhận'
                }
            }));
            
            // Update technician availability
            if (order.technicianId) {
                setTechnicianAvailability(prev => {
                    const techAvail = prev[order.technicianId];
                    
                    if (techAvail) {
                        const newOrderCount = Math.max(0, techAvail.currentOrders - 1);
                        const newPercentage = Math.max(0, 100 - (newOrderCount * 20));
                        
                        return {
                            ...prev,
                            [order.technicianId]: {
                                percentage: newPercentage,
                                currentOrders: newOrderCount,
                                status: newPercentage > 70 ? 'available' : (newPercentage > 30 ? 'busy' : 'overloaded')
                            }
                        };
                    }
                    
                    return prev;
                });
            }
            
            // Notification
            alert(`Đã hủy phân công đơn hàng ${orderId}`);
            
            return true;
        } catch (error) {
            console.error('Lỗi khi hủy phân công đơn hàng:', error);
            alert('Có lỗi xảy ra khi hủy phân công đơn hàng. Vui lòng thử lại!');
            return false;
        }
    };

    // Update technician availability after assignment
    const updateTechnicianAvailability = (techId) => {
        setTechnicianAvailability(prev => {
            const techAvail = prev[techId] || { percentage: 100, currentOrders: 0, status: 'available' };
            const newOrderCount = techAvail.currentOrders + 1;
            const newPercentage = Math.max(0, 100 - (newOrderCount * 20));
            
            return {
                ...prev,
                [techId]: {
                    percentage: newPercentage,
                    currentOrders: newOrderCount,
                    status: newPercentage > 70 ? 'available' : (newPercentage > 30 ? 'busy' : 'overloaded')
                }
            };
        });
    };
    
    // Render technician options for the assignment modal (used before we migrated to AssignmentManagement)
    const renderTechnicianOptions = () => {
        return technicians.map(tech => {
            const availability = technicianAvailability[tech.staff_id] || { 
                percentage: 100, 
                currentOrders: 0, 
                status: 'available' 
            };
            
            return (
                <option key={tech.staff_id} value={tech.staff_id}>
                    {tech.fullname} - {tech.expertise || 'Tổng hợp'} ({availability.currentOrders} đơn)
                </option>
            );
        });
    };
    
    // Render availability badge (used before we migrated to AssignmentManagement)
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
    
    // Render technician schedule (used before we migrated to AssignmentManagement)
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

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0">Quản lý đơn hàng</h5>
                <div>
                    <Button
                        variant="outline-primary"
                        className={`me-2 ${activeTab === 'orders' ? 'active' : ''}`}
                        onClick={() => setActiveTab('orders')}
                    >
                        <i className="bi bi-list-ul me-1"></i>
                        Danh sách đơn hàng
                    </Button>
                    <Button
                        variant="outline-primary"
                        className={`me-2 ${activeTab === 'assignments' ? 'active' : ''}`}
                        onClick={() => setActiveTab('assignments')}
                    >
                        <i className="bi bi-person-check me-1"></i>
                        Phân công công việc
                    </Button>
                    <Button
                        as={Link}
                        to="/admin/orders/create"
                        style={{ backgroundColor: '#d30000', borderColor: '#d30000' }}
                    >
                        <i className="bi bi-plus-circle me-1"></i>
                        Tạo đơn hàng mới
                    </Button>
                </div>
            </div>

            {/* Main Content based on active tab */}
            {activeTab === 'orders' ? (
                <>
                    {/* Filter Section */}
                    <Card className="shadow-sm mb-4">
                        <Card.Body>
                            <Row className="g-3">
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label>Tìm kiếm</Form.Label>
                                        <InputGroup>
                                            <Form.Control
                                                placeholder="Tìm kiếm theo mã đơn, tên khách, SĐT..."
                                                name="search"
                                                value={filters.search}
                                                onChange={handleFilterChange}
                                            />
                                            <Button variant="outline-secondary">
                                                <i className="bi bi-search"></i>
                                            </Button>
                                        </InputGroup>
                                    </Form.Group>
                                </Col>
                                <Col md={2}>
                                    <Form.Group>
                                        <Form.Label>Trạng thái</Form.Label>
                                        <Form.Select
                                            name="status"
                                            value={filters.status}
                                            onChange={handleFilterChange}
                                        >
                                            <option value="">Tất cả</option>
                                            <option value="Đang xử lý">Đang xử lý</option>
                                            <option value="Chờ thanh toán">Chờ thanh toán</option>
                                            <option value="Hoàn thành">Hoàn thành</option>
                                            <option value="Đã hủy">Đã hủy</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label>Từ ngày</Form.Label>
                                        <Form.Control
                                            type="date"
                                            name="startDate"
                                            value={filters.startDate}
                                            onChange={handleFilterChange}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label>Đến ngày</Form.Label>
                                        <Form.Control
                                            type="date"
                                            name="endDate"
                                            value={filters.endDate}
                                            onChange={handleFilterChange}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <div className="d-flex justify-content-end mt-3">
                                <Button
                                    variant="outline-secondary"
                                    className="me-2"
                                    onClick={handleResetFilter}
                                >
                                    <i className="bi bi-x-circle me-1"></i> Xóa bộ lọc
                                </Button>
                                <Button
                                    variant="primary"
                                    style={{ backgroundColor: '#d30000', borderColor: '#d30000' }}
                                    onClick={handleApplyFilter}
                                >
                                    <i className="bi bi-filter me-1"></i> Lọc
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Table Section */}
                    <Card className="shadow-sm mb-4">
                        <Card.Body className="p-0">
                            <div className="table-responsive">
                                <Table hover className="mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Mã đơn</th>
                                            <th>Khách hàng</th>
                                            <th>Thông tin xe</th>
                                            <th>Kỹ thuật viên</th>
                                            <th>Ngày tạo</th>
                                            <th>Trạng thái</th>
                                            <th>Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan="6" className="text-center py-4">
                                                    <div className="spinner-border text-primary" role="status">
                                                        <span className="visually-hidden">Loading...</span>
                                                    </div>
                                                    <p className="mt-2 text-muted">Đang tải dữ liệu...</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            getCurrentItems().map(order => (
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
                                                    <td>{order.technicianName}</td>
                                                    <td>
                                                        <div>{order.createdDate}</div>
                                                        <small className="text-muted">{order.createdTime}</small>
                                                    </td>
                                                    <td>
                                                        <StatusBadge status={order.status} />
                                                    </td>
                                                    <td>
                                                        <div className="d-flex gap-2">
                                                            <Button
                                                                variant="outline-primary"
                                                                size="sm"
                                                                className="btn-icon"
                                                                onClick={() => handleShowDetailModal(order)}
                                                                title="Xem chi tiết"
                                                            >
                                                                <i className="bi bi-eye"></i>
                                                            </Button>
                                                            <Button
                                                                variant="outline-primary"
                                                                size="sm"
                                                                className="btn-edit"
                                                                onClick={() => handleShowEditModal(order)}
                                                                style={{ borderColor: '#d30000', color: '#d30000' }}
                                                                title="Chỉnh sửa"
                                                            >
                                                                <i className="bi bi-pencil"></i>
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}

                                        {!loading && fileredOrdersIds.length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="text-center py-4">
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

                    {renderPagination()}
                </>
            ) : (
                // TODO: checkpoint for AssignmentManagement component
                <AssignmentManagement
                    ordersDisplay={ordersDisplay} 
                    pendingOrders={pendingOrders}
                    assignedOrders={assignedOrders}
                    technicianAvailability={technicianAvailability}
                    dashboardStats={dashboardStats}
                    onAssignOrder={handleAssignOrder}
                    onUnassignOrder={handleUnassignOrder}
                    loading={loading}
                    setLoading={setLoading}
                />
            )}

            {/* Modal xem chi tiết */}
            <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Chi tiết đơn hàng</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {currentOrder && (
                        <div>
                            <Row className="mb-4">
                                <Col md={6}>
                                    <h6 className="text-muted mb-3">Thông tin chung</h6>
                                    <p><strong>Mã đơn:</strong> {currentOrder.orderId}</p>
                                    <p><strong>Ngày tạo:</strong> {`${currentOrder.createdDate} ${currentOrder.createdTime}`}</p>
                                    <p>
                                        <strong>Trạng thái:</strong> <StatusBadge status={currentOrder.status} />
                                    </p>
                                </Col>
                                <Col md={6}>
                                    <h6 className="text-muted mb-3">Thông tin khách hàng</h6>
                                    <p><strong>Họ tên:</strong> {currentOrder.customerName}</p>
                                    <p><strong>Số điện thoại:</strong> {currentOrder.customerPhone}</p>
                                    <p><strong>Kỹ thuật viên:</strong> {currentOrder.technicianName}</p>
                                </Col>
                            </Row>

                            {/* <h6 className="text-muted mb-3">Chi tiết dịch vụ/sản phẩm</h6>
                            <div className="table-responsive mb-4">
                                <Table bordered hover>
                                    <thead className="table-light">
                                        <tr>
                                            <th>#</th>
                                            <th>Tên dịch vụ/sản phẩm</th>
                                            <th className="text-center">Số lượng</th>
                                            <th className="text-end">Đơn giá</th>
                                            <th className="text-end">Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentOrder.items.map((item, index) => (
                                            <tr key={index}>
                                                <td>{index + 1}</td>
                                                <td>{item.name}</td>
                                                <td className="text-center">{item.quantity}</td>
                                                <td className="text-end">{formatCurrency(item.price)}</td>
                                                <td className="text-end">{formatCurrency(item.price * item.quantity)}</td>
                                            </tr>
                                        ))}
                                        <tr className="table-light">
                                            <td colSpan="4" className="text-end fw-bold">Tổng cộng:</td>
                                            <td className="text-end fw-bold">{formatCurrency(currentOrder.totalAmount)}</td>
                                        </tr>
                                    </tbody>
                                </Table>
                            </div> */}

                            <div className="p-3 bg-light rounded">
                                <h6>Chuẩn đoán:</h6>
                                <p className="mb-0">{currentOrder.diagnosis || "Chuẩn đoán chưa được thêm"}</p>
                            </div>
                        </div>
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
                            handleShowEditModal(currentOrder);
                        }}
                    >
                        Chỉnh sửa
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal chỉnh sửa */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
                <Form noValidate validated={validated} onSubmit={handleEditSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>Cập nhật đơn hàng</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {currentOrder && (
                            <>
                                <div className="mb-3">
                                    <p className="mb-1"><strong>Mã đơn:</strong> {currentOrder.orderId}</p>
                                    <p className="mb-1"><strong>Khách hàng:</strong> {currentOrder.customerName}</p>
                                    <p className="mb-0"><strong>Tổng tiền:</strong> {formatCurrency(currentOrder.totalAmount)}</p>
                                </div>

                                <Form.Group className="mb-3">
                                    <Form.Label>Trạng thái</Form.Label>
                                    <Form.Select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleFormChange}
                                        required
                                    >
                                        <option value="Đang xử lý">Đang xử lý</option>
                                        <option value="Chờ thanh toán">Chờ thanh toán</option>
                                        <option value="Hoàn thành">Hoàn thành</option>
                                        <option value="Đã hủy">Đã hủy</option>
                                    </Form.Select>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Ghi chú</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        name="note"
                                        value={formData.note}
                                        onChange={handleFormChange}
                                    />
                                </Form.Group>
                            </>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            style={{ backgroundColor: '#d30000', borderColor: '#d30000' }}
                        >
                            Lưu thay đổi
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Assignment Modal */}
            {/* <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)}>
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
                                        {renderTechnicianOptions()}
                                    </Form.Select>
                                    <Form.Control.Feedback type="invalid">
                                        Vui lòng chọn thợ phụ trách
                                    </Form.Control.Feedback>
                                </Form.Group>
                                
                                <Row className="mb-3">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>Thời gian bắt đầu*</Form.Label>
                                            <Form.Control
                                                type="time"
                                                required
                                                value={startTime}
                                                onChange={(e) => setStartTime(e.target.value)}
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                Vui lòng chọn thời gian bắt đầu
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>Dự kiến hoàn thành*</Form.Label>
                                            <Form.Control
                                                type="time"
                                                required
                                                value={estimatedEndTime}
                                                onChange={(e) => setEstimatedEndTime(e.target.value)}
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                Vui lòng chọn thời gian dự kiến hoàn thành
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                </Row>
                                
                                <Form.Group className="mb-3">
                                    <Form.Label>Ghi chú phân công</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        value={assignmentNote}
                                        onChange={(e) => setAssignmentNote(e.target.value)}
                                        placeholder="Nhập các yêu cầu hoặc lưu ý khi phân công (nếu có)"
                                    />
                                </Form.Group>
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
            </Modal> */}
            
            {/* Technician Workload Detail Modal */}
            {/* <Modal show={showWorkloadModal} onHide={() => setShowWorkloadModal(false)} size="lg">
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
                                    {renderAvailabilityBadge(selectedTechnicianDetail.staff_id)}
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
            </Modal> */}
        </>
    );
};

export default OrderManagement;
