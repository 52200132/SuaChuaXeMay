import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Button, Pagination, Modal, Form, Row, Col, InputGroup, Badge } from 'react-bootstrap';
import { debounce, get, set } from 'lodash';

import AssignmentManagement from './AssignmentManagement';
import StatusBadge from '../components/StatusBadge';
import CustomModal from '../components/CustomModal';
import { useAppData } from '../contexts/AppDataContext';
import { customerService, resourceService, repairService } from '../../services/api';
import './OrderManagement.css';
import OrderDetailView from '../components/OrderDetailView';

// Register Chart.js components
const OrderManagement = () => {
    // TODO: Lấy từ context
    const { getData, getIds, setData, loading, dataStore, setMultipleData } = useAppData();
    const ordersById = getData('orders');
    const ordersIds = getData('ordersIds');
    const customersById = getData('customers');
    const motorcyclesById = getData('motorcycles');
    const diagnosisById = getData('diagnosis');
    const staffsById = getData('staffs');

    const [newOrderId, setNewOrderId] = useState(null);

    // State quản lý danh sách đơn hàng
    const [filteredOrdersIds, setFilteredOrdersIds] = useState([]);
    
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
    const [currentOrder, setCurrentOrder] = useState({});
    
    const [validated, setValidated] = useState(false);
    const [localLoading, setLocalLoading] = useState(false);
    
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
    
    // State for showing technician workload details
    const [showWorkloadModal, setShowWorkloadModal] = useState(false);
    const [selectedTechnicianDetail, setSelectedTechnicianDetail] = useState(null);

    // State for delivery confirmation modal
    const [showDeliveryModal, setShowDeliveryModal] = useState(false);
    const [orderToDeliver, setOrderToDeliver] = useState(null);

    // State for create order modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [currentCustomerWithMotorcycle, setCurrentCustomerWithMotorcycle] = useState({});
    const [customerNotFound, setCustomerNotFound] = useState(false);
    
    // Form data for new order
    const [formData, setFormData] = useState({
        customerName: '',
        phone: '',
        email: '',
        plateNumber: '',
        plateNumberManual: '',
        brand: '',
        motorcycleModel: '',
        staffId: '',
        customerId: '',
        motocycleId: '',
        motoTypeId: '',
    });
    
    // Motorcycle types
    const motoTypes = [
        { id: 1, name: 'Xe tay ga' },
        { id: 2, name: 'Xe số' },
    ];

    useEffect(() => {
        setLocalLoading(true);
        if (loading['orders'] === true || loading['customers'] === true || loading['motorcycles'] === true || loading['diagnosis'] === true || loading['staffs'] === true) return;
        setLocalLoading(false);
    }, [loading]);

    // TODO: Khi load dữ liệu xong
    useEffect(() => {
        // console.log('useEffect - Trạng thái của loading', localLoading);
        // console.log('Các dữ liệu lấy được', ordersById, ordersIds, getIds('orders'));
        if (!localLoading) {
            if (newOrderId) { dataStore['ordersIds'] = new Set([newOrderId?.toString(), ...dataStore['ordersIds']]); }
            setFilteredOrdersIds(getIds('orders'));
            setTotalPages(Math.ceil(getIds('orders').length / 10));
            // console.log('useEffect - fillteredOrdersIds và totalPages', filteredOrdersIds, totalPages)

            // Phân loại đơn hàng thành đã phân công và chưa phân công
            const assingedOrders = []
            const pendingOrders = []
            getIds('orders').map(id => {
                const order = ordersById[id];
                if (order.staff_id && order.status !== 'delivered') {
                    assingedOrders.push(order.order_id);
                } else if (order.status !== 'delivered') {
                    pendingOrders.push(order.order_id);
                }
            });
            console.log(assignedOrders, pendingOrders);
            setAssignedOrders(assingedOrders);
            setPendingOrders(pendingOrders);
        }
    }, [newOrderId, localLoading, ordersById/*, getIds*/]); 


    const formatOrder = (order, customer, motorcycle, staff, diagnosis) => { 
        // console.log(order);
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
        let filtered = [...ordersIds];
        
        const ordersDisplay = Object.values(ordersById).reduce((acc, order) => {
            const motorcycle = motorcyclesById[order.motocycle_id];
            const customer = customersById[motorcycle.customer_id];
            const staff = staffsById[order.staff_id];
            const diagnosis = diagnosisById[order.order_id];
            acc[order.order_id] = formatOrder(order, customer, motorcycle, staff, diagnosis);
            return acc;
        }, {});

        // Filter by search term
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(id => {
                const order = ordersDisplay[id];
                return order.orderId.toString().toLowerCase().includes(searchTerm) ||
                order.customerName.toLowerCase().includes(searchTerm) ||
                order.customerPhone.includes(searchTerm) ||
                order.technicianName.toLowerCase().includes(searchTerm)
            });
        }
        
        // Filter by status
        if (filters.status) {
            filtered = filtered.filter(id => ordersDisplay[id].status === filters.status);
        }
        
        // Filter by date range
        if (filters.startDate) {
            filtered = filtered.filter(id => ordersDisplay[id].createdDate >= filters.startDate);
        }
        
        if (filters.endDate) {
            filtered = filtered.filter(id => ordersDisplay[id].createdDate <= filters.endDate);
        }
        
        setFilteredOrdersIds(filtered);
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
        // setTotalPages(Math.ceil(filteredOrdersIds.length / 10));
        // setCurrentPage(1);
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
    const getCurrentItems = useCallback(() => {
        const indexOfLastItem = currentPage * 10;
        const indexOfFirstItem = indexOfLastItem - 10;
        return filteredOrdersIds.slice(indexOfFirstItem, indexOfLastItem).map(id => {
            const order = ordersById[id];
            const motorcycle = motorcyclesById[order.motocycle_id];
            const customer = customersById[motorcycle?.customer_id];
            const staff = staffsById[order.staff_id];
            const diagnosis = diagnosisById[order.order_id];
            return formatOrder(order, customer, motorcycle, staff, diagnosis);
        });
    }, [ordersById, customersById, motorcyclesById, diagnosisById, staffsById, currentPage, filteredOrdersIds]);
    
    // Xử lý modal xem chi tiết - using OrderDetailView component
    const handleShowDetailModal = (order) => {
        setCurrentOrder(order);
        setShowDetailModal(true);
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
    // const processingOrdersForAssignment = () => {
    //     const pending = [];
    //     const assigned = [];
        
    //     Object.values(ordersDisplay).forEach(order => {
    //         // Only include orders that need assignment
    //         if (['Đã tiếp nhận', 'Đang kiểm tra', 'Chờ xác nhận'].includes(order.status)) {
    //             if (!order.technicianId || order.technicianId === '') {
    //                 pending.push({
    //                     ...order,
    //                     motorcycleInfo: {
    //                         id: order.motorcycleId || '',
    //                         plate: order.plateNumber || '',
    //                         model: order.motorcycleModel || ''
    //                     }
    //                 });
    //             } else {
    //                 assigned.push({
    //                     ...order,
    //                     motorcycleInfo: {
    //                         id: order.motorcycleId || '',
    //                         plate: order.plateNumber || '',
    //                         model: order.motorcycleModel || ''
    //                     },
    //                     startTime: order.startTime || '08:00',
    //                     estimatedEndTime: order.estimatedEndTime || '10:00'
    //                 });
    //             }
    //         }
    //     });
        
    //     setPendingOrders(pending);
    //     setAssignedOrders(assigned);
        
    //     // Update technician availability based on assigned orders
    //     calculateTechnicianAvailability(technicians, assigned);
    // };
    
    // Update dashboard statistics
    // const updateDashboardStats = () => {
    //     const orders = Object.values(ordersDisplay);
    //     const stats = {
    //         pending: orders.filter(order => 
    //             ['Đã tiếp nhận', 'Đang kiểm tra', 'Chờ xác nhận'].includes(order.status)).length,
    //         inProgress: orders.filter(order => 
    //             ['Đang sửa chữa'].includes(order.status)).length,
    //         completed: orders.filter(order => 
    //             ['Chờ giao xe', 'Đã giao xe'].includes(order.status)).length,
    //         cancelled: orders.filter(order => 
    //             ['Đã hủy'].includes(order.status)).length
    //     };
        
    //     setDashboardStats(stats);
    // };
    
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
            // const motorcycle = motorcyclesById[order.motocycle_id];
            // const customer = customersById[motorcycle.customer_id];
            // const staff = staffsById[order.staff_id];
            // const diagnosis = diagnosisById[order.diagnosis_id];

            // ordersDisplay[order.order_id] = formatOrder(order, customer, motorcycle, staff, diagnosis);

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
            // setOrdersDisplay(prev => ({
            //     ...prev,
            //     [orderId]: {
            //         ...prev[orderId],
            //         technicianId: '',
            //         technicianName: 'Chưa phân công',
            //         status: 'Đã tiếp nhận'
            //     }
            // }));
            
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

    // Handle showing the delivery confirmation modal
    const handleShowDeliveryModal = (order) => {
        setOrderToDeliver(order);
        setShowDeliveryModal(true);
    };
    
    // Handle the delivery action
    const handleDeliverOrder = async () => {
        if (!orderToDeliver) return;
        
        try {
            setLocalLoading(true);
            
            // Call API to update order status to "delivered"
            await repairService.order.updateOrderStatus(orderToDeliver.orderId, 'delivered');
            
            // Update local state
            const updatedOrdersById = { ...ordersById };
            if (updatedOrdersById[orderToDeliver.orderId]) {
                updatedOrdersById[orderToDeliver.orderId].status = 'delivered';
                setData('orders', updatedOrdersById[orderToDeliver.orderId], orderToDeliver.orderId);
            }
            
            // Update ordersDisplay
            // setOrdersDisplay(prev => ({
            //     ...prev,
            //     [orderToDeliver.orderId]: {
            //         ...prev[orderToDeliver.orderId],
            //         status: 'Đã giao xe'
            //     }
            // }));
            
            setShowDeliveryModal(false);
            alert('Giao xe thành công!');
        } catch (error) {
            console.error('Lỗi khi cập nhật trạng thái giao xe:', error);
            alert('Có lỗi xảy ra khi giao xe. Vui lòng thử lại!');
        } finally {
            setLocalLoading(false);
        }
    };

    // Find customer by phone (debounced)
    const debouncedFindCustomer = useCallback(
        debounce((phone) => {
            setFormData(prev => ({
                ...prev, brand: '', motorcycleModel: '',
            }));
            customerService.customer.getCustomerWithMotorcyclesByPhone(phone)
                .then(response => {
                    const customer = response.data || response;
                    if (customer && customer.fullname) {
                        setCurrentCustomerWithMotorcycle(customer);
                        setMultipleData('motorcycles', customer.motocycles, 'motocycle_id');
                        setData('customers', customer, customer.customer_id);
                        setFormData(prev => ({
                            ...prev,
                            customerId: customer.customer_id || '',
                            customerName: customer.fullname || '',
                            email: customer.email || ''
                        }));
                        setCustomerNotFound(false);
                    } else {
                        setFormData(prev => ({
                            ...prev,
                            customerName: '',
                            email: ''
                        }));
                        setCustomerNotFound(phone.length > 0);
                    }
                })
                .catch(error => {
                    console.error('Lỗi khi tìm khách hàng với xe:', error);
                    setFormData(prev => ({
                        ...prev,
                        customerName: '',
                        email: ''
                    }));
                    setCurrentCustomerWithMotorcycle({});
                    setCustomerNotFound(phone.length > 0);
                });
        }, 500),
        []
    );
    
    // Reset customerId when customer not found
    useEffect(() => {
        if (customerNotFound) {
            setFormData(prevForm => ({
                ...prevForm,
                customerId: ''
            }));
        }
    }, [customerNotFound]);
    
    // Clean up debounce on unmount
    useEffect(() => {
        return () => {
            debouncedFindCustomer.cancel();
        };
    }, [debouncedFindCustomer]);
    
    // Form handlers
    const handlePhoneChange = (e) => {
        const phone = e.target.value;
        setFormData(prev => ({
            ...prev,
            phone
        }));
        debouncedFindCustomer(phone);
    };
    
    const handleSelectPlate = (e) => {    
        const motorcycleId = e.target.value;
        
        // Find motorcycle by plate number
        const motorcycle = currentCustomerWithMotorcycle.motocycles?.find(m => m.motocycle_id == motorcycleId);
        if (motorcycle) {
            setFormData(prev => ({
                ...prev,
                brand: motorcycle.brand || '',
                motorcycleModel: motorcycle.model || '',
                motocycleId: motorcycle.motocycle_id || '',
                motoTypeId: motorcycle.moto_type_id || ''
            }));
        } else { // không có thì dùng '__manual__'
            setFormData(prev => ({
                ...prev,
                brand: '',
                motorcycleModel: '',
                plateNumber: motorcycleId,
                motocycleId: motorcycleId,
                motoTypeId: ''
            }));
        }
    };
    
    // Xử lý khi thay đổi thông tin trong form
    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === 'phone') {
            handlePhoneChange(e);
        } else if (name === 'motocycleId') {
            handleSelectPlate(e);
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };
    
    const handleShowCreateModal = () => {
        setFormData({
            customerName: '',
            phone: '',
            email: '',
            plateNumber: '',
            brand: '',
            motorcycleModel: '',
            staffId: '',
            customerId: '',
            motocycleId: '',
            motoTypeId: '',
        });
        setValidated(false);
        setShowCreateModal(true);
    };

    const createNewOrder = async () => {
        try {
            let orderData = null;
            let customerId = formData.customerId;
            let motorcycleId = formData.motocycleId;
            
            // Tạo khách hàng nếu cần
            if (customerId === '') {
                try {
                    const response = await customerService.customer.createCustomer({
                        fullname: formData.customerName,
                        phone_num: formData.phone,
                        is_guest: false,
                        ...(formData.email ? { email: formData.email } : {}),
                    });
                    const customer = response.data || response;
                    setData('customers', customer, customer.customer_id);
                    customerId = customer.customer_id;
                } catch (error) {
                    console.error('Lỗi khi tạo khách hàng:', error);
                    throw new Error(error.response?.data?.detail || 'Không thể tạo thông tin khách hàng');
                }
            }
            
            // Tạo thông tin xe nếu cần
            if ((motorcycleId === '__manual__' || motorcycleId === '') && customerId !== '') {
                try {
                    console.log('data moto', formData);
                    const motorcycle = await customerService.motorcycle.createMotorcycle({
                        license_plate: formData.plateNumberManual || formData.plateNumber,
                        brand: formData.brand,
                        model: formData.motorcycleModel,
                        customer_id: customerId,
                        moto_type_id: formData.motoTypeId,
                    });
                    setData('motorcycles', motorcycle.data, motorcycle.data.motocycle_id);
                    motorcycleId = motorcycle.data.motocycle_id;
                } catch (error) {
                    console.error('Lỗi khi tạo thông tin xe:', error);
                    throw new Error(error.response?.data?.detail || 'Không thể tạo thông tin xe');
                }
            }

            // Tạo đơn hàng
            if (motorcycleId !== '' && motorcycleId !== '__manual__') {
                try {
                    const response = await repairService.order.createOrder2({
                        motocycle_id: motorcycleId,
                    });
                    orderData = response.data;
                } catch (error) {
                    console.error('Lỗi khi tạo đơn hàng:', error);
                    throw new Error('Không thể tạo đơn hàng');
                }
            }
            
            return orderData;
        } catch (error) {
            console.error('Lỗi trong quá trình tạo đơn hàng:', error);
            throw error; // Ném lỗi để hàm gọi xử lý
        }
    }
    
    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        
        if (form.checkValidity() === false) {
            e.stopPropagation();
            setValidated(true);
            return;
        }
        
        try {
            setLocalLoading(true);
            
            // Create new order
            const order = await createNewOrder();
            console.log('Đơn hàng mới:', order);
            
            // Add new order to store
            setData('orders', order, order.order_id);
            setNewOrderId(order.order_id);
            
            alert('Tạo đơn hàng mới thành công!');
        } catch (error) {
            const errorMessage = error.response?.data?.detail || 'Tạo đơn hàng thất bại. Vui lòng thử lại sau.';
            alert(errorMessage);
            console.error("Lỗi khi tạo đơn hàng:", error);
        }
        setLocalLoading(false);
        setShowCreateModal(false);
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
                        onClick={handleShowCreateModal}
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
                                            <option value="Đã tiếp nhận">Đã tiếp nhận</option>
                                            <option value="Đang kiểm tra">Đang kiểm tra</option>
                                            <option value="Chờ xác nhận">Chờ xác nhận</option>
                                            <option value="Đang sửa chữa">Đang sửa chữa</option>
                                            <option value="Chờ giao xe">Chờ giao xe</option>
                                            <option value="Đã giao xe">Đã giao xe</option>
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
                                        {localLoading ? (
                                            <tr>
                                                <td colSpan="7" className="text-center py-4">
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
                                                            {/* Add "Giao xe" button for orders with status "Chờ giao xe" */}
                                                            {order.status === 'Chờ giao xe' && (
                                                                <Button
                                                                    variant="outline-success"
                                                                    size="sm"
                                                                    onClick={() => handleShowDeliveryModal(order)}
                                                                    title="Giao xe"
                                                                >
                                                                    <i className="bi bi-check-circle"></i>
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}

                                        {!localLoading && filteredOrdersIds.length === 0 && (
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

                    {renderPagination()}
                </>
            ) : (
                // TODO: checkpoint for AssignmentManagement component
                <AssignmentManagement
                    pendingOrders={pendingOrders}
                    assignedOrders={assignedOrders}
                    dashboardStats={dashboardStats}
                    onAssignOrder={handleAssignOrder}
                    localLoading={localLoading}
                    setLocalLoading={setLocalLoading}
                    formatOrder={formatOrder}
                />
            )}

            {/* Modal xem chi tiết - using OrderDetailView component */}
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

                            <Row className="mb-4">
                                <Col md={12}>
                                    <h6 className="text-muted mb-3">Thông tin xe</h6>
                                    <p><strong>Loại xe:</strong> {currentOrder.motorcycleModel}</p>
                                    <p><strong>Biển số:</strong> {currentOrder.plateNumber}</p>
                                </Col>
                            </Row>

                            <div className="p-3 bg-light rounded mb-3">
                                <h6>Chuẩn đoán:</h6>
                                <p className="mb-0">{currentOrder.diagnosis || "Chuẩn đoán chưa được thêm"}</p>
                            </div>

                            {/* Use OrderDetailView component from context data */}
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
                </Modal.Footer>
            </Modal>

            {/* Delivery Confirmation Modal */}
            <CustomModal
                show={showDeliveryModal}
                onHide={() => setShowDeliveryModal(false)}
                title="Xác nhận giao xe"
                message={
                    <>
                        <p>Bạn có chắc chắn muốn xác nhận giao xe cho đơn hàng này?</p>
                        {orderToDeliver && (
                            <div className="mt-3 p-3 bg-light rounded">
                                <p className="mb-1"><strong>Mã đơn:</strong> {orderToDeliver.orderId}</p>
                                <p className="mb-1"><strong>Khách hàng:</strong> {orderToDeliver.customerName}</p>
                                <p className="mb-0"><strong>Biển số xe:</strong> {orderToDeliver.plateNumber}</p>
                            </div>
                        )}
                    </>
                }
                confirmButtonText="Xác nhận giao xe"
                confirmButtonVariant="success"
                onConfirm={handleDeliverOrder}
                cancelButtonText="Hủy"
            />

            {/* Modal tạo đơn hàng mới */}
            <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
                <Form noValidate validated={validated} onSubmit={handleCreateSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>Tạo đơn hàng mới</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Row>
                            <Col md={6}>
                                <h6 className="mb-3">Thông tin khách hàng</h6>
                                <Form.Group className="mb-3">
                                    <Form.Label>Số điện thoại *</Form.Label>
                                    <Form.Control
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        pattern="^0[0-9]{9,10}$"
                                        onChange={handleFormChange}
                                        required
                                        maxLength={10}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        Vui lòng nhập số điện thoại hợp lệ
                                    </Form.Control.Feedback>
                                    {customerNotFound && (
                                        <div className="text-warning mt-1" style={{ fontSize: '0.95em' }}>
                                            Khách hàng chưa có tài khoản!
                                        </div>
                                    )}
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Họ và tên khách hàng *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="customerName"
                                        value={formData.customerName}
                                        onChange={handleFormChange}
                                        required
                                        readOnly={!customerNotFound}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        Vui lòng nhập họ tên khách hàng
                                    </Form.Control.Feedback>
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleFormChange}
                                        readOnly={!customerNotFound}
                                        placeholder="Email khách hàng (nếu có)"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <h6 className="mb-3">Thông tin xe</h6>
                                <Form.Group className="mb-3">
                                    <Form.Label>Biển số xe *</Form.Label>
                                    {Array.isArray(currentCustomerWithMotorcycle.motocycles) && currentCustomerWithMotorcycle.motocycles.length > 0 ? (
                                        <Form.Select
                                            name="motocycleId"
                                            value={formData.motocycleId}
                                            onChange={handleFormChange}
                                            required
                                        >
                                            <option value="">-- Chọn biển số xe --</option>
                                            {currentCustomerWithMotorcycle.motocycles.map(m => (
                                                <option key={m.motocycle_id} value={m.motocycle_id}>
                                                    {m.license_plate} 
                                                </option>
                                            ))} 
                                            <option value="__manual__">Nhập biển số mới...</option>
                                        </Form.Select>
                                    ) : (
                                        <Form.Control
                                            type="text"
                                            name="plateNumber"
                                            value={formData.plateNumber}
                                            onChange={handleFormChange}
                                            required
                                            disabled={!formData.phone}
                                            placeholder="Ví dụ: 59X1-12345"
                                        />
                                    )}
                                    {Array.isArray(currentCustomerWithMotorcycle.motocycles) 
                                    && currentCustomerWithMotorcycle.motocycles.length > 0 
                                    && formData.motocycleId === "__manual__" && (
                                        <Form.Control
                                            className="mt-2"
                                            type="text"
                                            name="plateNumberManual"
                                            value={formData.plateNumberManual || ""}
                                            onChange={handleFormChange}
                                            required
                                            placeholder="Nhập biển số mới"
                                        />
                                    )}
                                    <Form.Control.Feedback type="invalid">
                                        Vui lòng nhập biển số xe
                                    </Form.Control.Feedback>
                                </Form.Group>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Hãng xe</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="brand"
                                                onChange={handleFormChange}
                                                value={formData.brand}
                                                readOnly={!formData.phone}
                                                required
                                                placeholder="Hãng xe (tự động điền nếu có)"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Loại xe *</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="motorcycleModel"
                                                value={formData.motorcycleModel}
                                                onChange={handleFormChange}
                                                readOnly={!formData.phone}
                                                required
                                                placeholder="Ví dụ: Honda Wave, Yamaha Exciter..."
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                Vui lòng nhập loại xe
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Form.Group className="mb-3">
                                    <Form.Label>Chọn loại xe *</Form.Label>
                                    <Form.Select
                                        name="motoTypeId"
                                        value={formData.motoTypeId}
                                        onChange={handleFormChange}
                                        required
                                    >
                                        <option value="">-- Chọn loại xe --</option>
                                        {motoTypes.map(type => (
                                            <option key={type.id} value={type.id}>{type.name}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            style={{ backgroundColor: '#d30000', borderColor: '#d30000' }}
                        >
                            Tạo đơn hàng
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    );
};

export default OrderManagement;
