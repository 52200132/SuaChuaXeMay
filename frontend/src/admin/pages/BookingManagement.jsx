import React, { useState, useEffect, useMemo, use } from 'react';
import { Card, Table, Button, Pagination, Modal, Form, Row, Col, InputGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import FilterBar from '../components/FilterBar';
import StatusBadge from '../components/StatusBadge';
import './BookingManagement.css';
import { customerService } from '../../services/api';

import { useData } from '../../contexts/DataContext';
import { useAppData } from '../contexts/AppDataContext';

const BookingManagement = () => {
    const { getData, setData, fetchAndStoreData, loading, setLoadingState } = useAppData();
    const { serviceTypes } = useData();
    const appointments = getData('appointments'); // Object chứa booking theo ID
    const appointmentsIds = getData('appointmentsIds'); // Set chứa thứ tự ID
    const customers = getData('customers');

    // State cho filtered bookings
    const [filteredBookingIds, setFilteredBookingIds] = useState([]);
    const [timefilteredBookingIds, setTimeFilteredBookingIds] = useState([]);

    // Các state khác vẫn giữ nguyên
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        startDate: '',
        endDate: '',
        service: ''
    });

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [currentBooking, setCurrentBooking] = useState(null);
    
    // Thêm state cho form cập nhật
    const [updateFormData, setUpdateFormData] = useState({
        date: '',
        time: '',
        note: ''
    });

    // New state variables for view control
    const [timeFilter, setTimeFilter] = useState('today'); // 'today', 'week', 'all'
    const [viewType, setViewType] = useState('list'); // 'list' or 'timeline'

    // const { serviceTypes } = useData();
    const appointmentStatuTable = {
        'pending': 'Chờ xác nhận',
        'confirmed': 'Đã xác nhận',
        'cancelled': 'Đã hủy'
    };

    const appointmentStatusReverseTable = Object.fromEntries(
        Object.entries(appointmentStatuTable).map(([key, value]) => [value, key])
    );

    const mockFetchBookings2 = () => {
        // Mock service types
        const mockServiceTypes = {
            1: { service_type_id: 1, name: 'Bảo dưỡng định kỳ' },
            2: { service_type_id: 2, name: 'Sửa chữa động cơ' },
            3: { service_type_id: 3, name: 'Thay thế phụ tùng' },
            4: { service_type_id: 4, name: 'Sửa hệ thống điện' },
            5: { service_type_id: 5, name: 'Vệ sinh xe' }
        };

        // Mock customer data
        const mockCustomers = {
            'C001': {
                customer_id: 'C001',
                fullname: 'Nguyễn Văn A',
                phone_num: '0912345678',
                email: 'nguyenvana@example.com'
            },
            'C002': {
                customer_id: 'C002',
                fullname: 'Trần Thị B',
                phone_num: '0923456789',
                email: 'tranthib@example.com'
            },
            'C003': {
                customer_id: 'C003',
                fullname: 'Lê Văn C',
                phone_num: '0934567890',
                email: 'levanc@example.com'
            },
            'C004': {
                customer_id: 'C004',
                fullname: 'Phạm Thị D',
                phone_num: '0945678901',
                email: 'phamthid@example.com'
            },
            'C005': {
                customer_id: 'C005',
                fullname: 'Hoàng Văn E',
                phone_num: '0956789012',
                email: 'hoangvane@example.com'
            }
        };

        // Generate dates for appointments
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);
        const dayAfterTomorrow = new Date();
        dayAfterTomorrow.setDate(today.getDate() + 2);
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);

        // Format dates as ISO strings
        const todayStr = today.toISOString().split('T')[0];
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        const dayAfterTomorrowStr = dayAfterTomorrow.toISOString().split('T')[0];
        const nextWeekStr = nextWeek.toISOString().split('T')[0];

        // Mock appointment data
        const mockAppointments = [
            {
                appointment_id: 'BK-2025-001',
                customer_id: 'C001',
                service_type_id: 1,
                appointment_date: `${todayStr}T08:00:00`,
                status: 'pending',
                notes: 'Bảo dưỡng xe định kỳ 1000km'
            },
            {
                appointment_id: 'BK-2025-002',
                customer_id: 'C002',
                service_type_id: 3,
                appointment_date: `${todayStr}T09:30:00`,
                status: 'confirmed',
                notes: 'Thay lốp xe và bugi'
            },
            {
                appointment_id: 'BK-2025-003',
                customer_id: 'C003',
                service_type_id: 2,
                appointment_date: `${todayStr}T10:45:00`,
                status: 'confirmed',
                notes: 'Xe khó nổ máy, cần kiểm tra động cơ'
            },
            {
                appointment_id: 'BK-2025-004',
                customer_id: 'C004',
                service_type_id: 4,
                appointment_date: `${todayStr}T13:30:00`,
                status: 'cancelled',
                notes: 'Đèn xe không hoạt động'
            },
            {
                appointment_id: 'BK-2025-005',
                customer_id: 'C005',
                service_type_id: 5,
                appointment_date: `${todayStr}T15:00:00`,
                status: 'confirmed',
                notes: 'Vệ sinh xe toàn bộ'
            },
            {
                appointment_id: 'BK-2025-006',
                customer_id: 'C001',
                service_type_id: 3,
                appointment_date: `${tomorrowStr}T09:00:00`,
                status: 'pending',
                notes: 'Thay dầu động cơ'
            },
            {
                appointment_id: 'BK-2025-007',
                customer_id: 'C002',
                service_type_id: 2,
                appointment_date: `${tomorrowStr}T11:15:00`,
                status: 'pending',
                notes: 'Kiểm tra và sửa phanh'
            },
            {
                appointment_id: 'BK-2025-008',
                customer_id: 'C003',
                service_type_id: 1,
                appointment_date: `${dayAfterTomorrowStr}T10:00:00`,
                status: 'pending',
                notes: 'Bảo dưỡng định kỳ 10000km'
            },
            {
                appointment_id: 'BK-2025-009',
                customer_id: 'C004',
                service_type_id: 4,
                appointment_date: `${dayAfterTomorrowStr}T14:30:00`,
                status: 'pending',
                notes: 'Kiểm tra hệ thống điện'
            },
            {
                appointment_id: 'BK-2025-010',
                customer_id: 'C005',
                service_type_id: 5,
                appointment_date: `${nextWeekStr}T10:00:00`,
                status: 'pending',
                notes: 'Vệ sinh xe và đánh bóng'
            }
        ];

        // Thực hiện mock cho fetchBookings2
        try {
            // Tạo object và mảng ID từ dữ liệu
            const newBookingsById = {};
            const newBookingIds = [];

            mockAppointments.forEach(appointment => {
                const [date, time] = appointment.appointment_date.split('T');
                const bookingId = appointment.appointment_id;

                // Tạo đối tượng booking
                newBookingsById[bookingId] = {
                    id: bookingId,
                    customer: mockCustomers[appointment.customer_id]?.fullname || 'Chưa có tên khách hàng',
                    status: appointmentStatuTable[appointment.status],
                    date: date,
                    time: time,
                    phone: mockCustomers[appointment.customer_id]?.phone_num || 'Chưa có số điện thoại',
                    service: mockServiceTypes[appointment.service_type_id]?.name || 'Chưa có dịch vụ',
                    notes: appointment.notes || '',
                    vehicleModel: ['Honda Wave', 'Yamaha Exciter', 'Honda SH', 'Yamaha Janus', 'Honda Vision'][Math.floor(Math.random() * 5)]
                };

                // Thêm ID vào mảng thứ tự
                newBookingIds.push(bookingId);
            });

            // Cập nhật state
            setData('appointments', newBookingsById);

            // Filter dữ liệu
            applyTimeFilter(newBookingsById, newBookingIds, timeFilter);

            return { bookingsById: newBookingsById, bookingIds: newBookingIds };
        } catch (error) {
            console.error("Error in mockFetchBookings2:", error);
            return { bookingsById: {}, bookingIds: [] };
        }
    };

    // Load bookings data
    useEffect(() => {
        // TODO: Tạm thời fetch hết các appointments, sau này xử lý sau
        const fetch = async () => {
            if (!Object.keys(appointments)?.length) {
                fetchAndStoreData('appointments', customerService.appointment.getAllAppointments, 'appointment_id')
                .then( response => { 
                    const needCustomerIds = new Set();
                    Object.values(response.data).forEach(appointment => { 
                        needCustomerIds.add(appointment.customer_id);
                    });
                    [...needCustomerIds].forEach(customer_id => {
                        if (!customers[customer_id]) {
                            setLoadingState('customers', true);
                            customerService.customer.getCustomerById(customer_id)
                            .then(response => {
                                setData('customers', response.data, response.data.customer_id);
                            })
                            .finally(() => {
                                setLoadingState('customers', false);
                            });
                        }
                    });
                    // console.log('Bookings data fetched - frist:', response.data);
                    const appointments = response.data;
                    return { appointments, customers }
                })
                .then(({ appointments, customers }) => { 
                    // console.log('Bookings data fetched - second:', appointments);
                    // console.log('Customers data fetched - second:', customers);
                });
                // setBookingIds(dataIdSet);
                
            }
            // applyActiveFilters(bookingIds, bookingsById);
        }

        fetch();

        // mockFetchBookings2();
    }, []);

    useEffect(() => {
        if (!Object.keys(appointments)?.length || !Object.keys(customers)?.length) return;
        // console.log('Appointments:', appointments);
        // console.log('Customers:', customers);
        // console.log('appointmentsIds', appointmentsIds);

    }, [appointments, customers]);

    // Apply time filter (today, week, all)
    useEffect(() => {
        // console.log('appointmentsIds - useEffect:', appointmentsIds);
        if (loading.appointments || !appointmentsIds) return;
        // console.log(displayAppointments);
        if (Object.keys(appointments).length > 0) {
            applyActiveFilters(timefilteredBookingIds, displayAppointments);
        }
    }, [appointments, appointmentsIds, loading]);

    useEffect(() => {
        // Xóa filters
        setFilters(prev => {
            let newStatus = {}
            Object.keys(prev).forEach(key => { newStatus[key] = '' });
            return newStatus;
        })
        if (Object.keys(appointments).length > 0) {
            applyTimeFilter(displayAppointments, appointmentsIds, timeFilter);
        }
    }, [timeFilter]);

    // Function to convert appointment data for display
    const formatAppointment = (appointment, customers = {}, serviceTypes = {}) => {
        const [date, time] = appointment.appointment_date.split('T');
        
        return {
            id: appointment.appointment_id,
            customer: customers[appointment.customer_id]?.fullname || 'Chưa có tên khách hàng',
            status: appointmentStatuTable[appointment.status] || appointment.status,
            date: date,
            time: time,
            phone: customers[appointment.customer_id]?.phone_num || 'Chưa có số điện thoại',
            service: serviceTypes[appointment.service_type_id]?.name || 'Chưa có dịch vụ',
            note: appointment.note || '',
        };
    };

    const displayAppointments = useMemo(() => {
        console.log('Running - Display Appointments:');
        // console.log('Display Appointments:', serviceTypes);
        if (!appointments || !customers || !serviceTypes) return [];
        const displayAppointments = {};
        // appointmentsIds.values().forEach(id => { console.log(id); });
        appointmentsIds.values().forEach(id => {
            // console.log(appointments[id])
            displayAppointments[appointments[id]?.appointment_id] = formatAppointment(appointments[id], customers, serviceTypes);
        });
        return displayAppointments;
    }, [appointmentsIds, appointments, customers, serviceTypes]);

    const applyTimeFilter = (bookingsData, bookingIdsData, filter) => {
        // console.log(`Đang áp dụng bộ lọc thời gian: ${filter}, ${bookingIdsData} bookings`);
        bookingIdsData = Array.isArray(bookingIdsData) ? bookingIdsData : Array.from(bookingIdsData);
        if (!bookingIdsData.length) return;

        const today = new Date();
        // today.setHours(0, 0, 0, 0);

        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)

        let filtered = [...bookingIdsData];

        if (filter === 'today') {
            // const todayStr = today.toISOString().split('T')[0];
            const todayStr = today.toLocaleDateString('en-CA'); // Format 'en-CA' tạo định dạng YYYY-MM-DD
            // console.log(todayStr);
            filtered = filtered.filter(id => bookingsData[id].date === todayStr);
        } else if (filter === 'week') {
            filtered = filtered.filter(id => {
                const bookingDate = new Date(bookingsData[id].date);
                return bookingDate >= weekStart && bookingDate <= weekEnd;
            });
        }

        // console.log('Filtered booking IDs:', filtered);

        // Apply other active filters
        // filtered = applyActiveFilters(filtered, bookingsData);

        setFilteredBookingIds(filtered);
        setTimeFilteredBookingIds(filtered);
        setTotalPages(Math.ceil(filtered.length / 10));
        setCurrentPage(1);
    };

    const applyActiveFilters = (ids, bookingsData) => {
        if (!ids || !ids.length) return;
        
        let filtered = [...ids];

        // Apply search filter
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(id => {
                const booking = bookingsData[id];
                if (!booking) return false;
                
                return (booking.id && booking.id.toLowerCase().includes(searchTerm)) ||
                    (booking.customer && booking.customer.toLowerCase().includes(searchTerm)) ||
                    (booking.phone && booking.phone.includes(searchTerm)) ||
                    (booking.service && booking.service.toLowerCase().includes(searchTerm));
            });
        }

        // Apply status filter
        if (filters.status) {
            filtered = filtered.filter(id => bookingsData[id].status === filters.status);
        }

        // Apply service filter
        if (filters.service) {
            filtered = filtered.filter(id => bookingsData[id].service === filters.service);
        }

        // Apply date range filter
        if (filters.startDate) {
            filtered = filtered.filter(id => bookingsData[id].date >= filters.startDate);
        }
        if (filters.endDate) {
            filtered = filtered.filter(id => bookingsData[id].date <= filters.endDate);
        }

        setFilteredBookingIds(filtered);
        setTotalPages(Math.ceil(filtered.length / 10));
        setCurrentPage(1);
    };

    // Handle filter application
    const handleApplyFilter = (appliedFilters) => {
        // console.log(appliedFilters);
        setFilters(appliedFilters);

        applyActiveFilters(timefilteredBookingIds, displayAppointments);

        // First filter by time period
    };

    // Pagination change
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    // Handle status update
    const openStatusModal = (booking) => {
        setCurrentBooking(booking);
        // Khởi tạo dữ liệu form khi mở modal
        setUpdateFormData({
            date: booking.date || '',
            time: booking.time?.substring(0, 5) || '', // Lấy chỉ giờ:phút từ thời gian
            note: booking.note || ''
        });
        setShowModal(true);
    };

    const handleStatusUpdate = (newStatus) => {
        const bookingId = currentBooking.id;

        // Cập nhật booking trong dictionary với tất cả thông tin đã thay đổi

        setData('appointments', {
            ...appointments[bookingId],
            status: appointmentStatusReverseTable[newStatus],
            // date: updateFormData.date,
            // time: updateFormData.time,
            note: updateFormData.note
        }, bookingId);


        setShowModal(false);

        // In a real app, you would save the changes to the backend here
        console.log(`Booking ${bookingId} updated: status=${newStatus}, date=${updateFormData.date}, time=${updateFormData.time}, note=${updateFormData.note}`);
    };

    // Handle form data change
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setUpdateFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Calculate current page items
    const getCurrentItems = () => {
        const indexOfLastItem = currentPage * 10;
        const indexOfFirstItem = indexOfLastItem - 10;
        const currentIds = filteredBookingIds.slice(indexOfFirstItem, indexOfFirstItem + 10);

        // Chuyển ID thành booking objects
        return currentIds.map(id => displayAppointments[id]);
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

    // Render table view for bookings
    const renderTableView = () => {
        return (
            <Card className="shadow-sm mb-4">
                <Card.Body className="p-0">
                    <div className="table-responsive">
                        <Table hover className="mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Mã đơn</th>
                                    <th>Khách hàng</th>
                                    <th>Dịch vụ</th>
                                    <th>Thời gian</th>
                                    <th>Trạng thái</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {getCurrentItems().map(booking => (
                                    <tr key={booking.id}>
                                        <td>{booking.id}</td>
                                        <td>
                                            <div>
                                                <div className="fw-semibold">{booking.customer}</div>
                                                <small className="text-muted">{booking.phone}</small>
                                            </div>
                                        </td>
                                        <td>{booking.service}</td>
                                        <td>
                                            <div>{booking.date}</div>
                                            <small className="text-muted">{booking.time}</small>
                                        </td>
                                        <td>
                                            <StatusBadge status={booking.status} />
                                        </td>
                                        <td>
                                            <div className="d-flex gap-2">
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    className="btn-icon"
                                                    onClick={() => openStatusModal(booking)}
                                                    title="Cập nhật trạng thái"
                                                >
                                                    <i className="bi bi-pencil-square"></i>
                                                </Button>
                                                <Button
                                                    variant="outline-secondary"
                                                    size="sm"
                                                    as={Link}
                                                    to={`/admin/bookings/${booking.id}`}
                                                    title="Xem chi tiết"
                                                >
                                                    <i className="bi bi-info-circle"></i>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {getCurrentItems().length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="text-center py-4">
                                            <div className="text-muted">
                                                <i className="bi bi-inbox fs-4 d-block mb-2"></i>
                                                Không tìm thấy đơn đặt lịch nào
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>
        );
    };

    // Render timeline view for today's bookings
    const renderTimelineView = () => {
        // Group bookings by time slots
        const timeSlots = {};
        getCurrentItems().forEach(booking => {
            if (!timeSlots[booking.time]) {
                timeSlots[booking.time] = [];
            }
            timeSlots[booking.time].push(booking);
        });

        // Sort time slots
        const sortedTimes = Object.keys(timeSlots).sort();

        return (
            <Card className="shadow-sm mb-4">
                <Card.Body>
                    {sortedTimes.length === 0 ? (
                        <div className="text-center py-5 text-muted empty-state">
                            <i className="bi bi-calendar-x fs-1 d-block mb-3"></i>
                            <h5>Không có lịch hẹn nào trong ngày hôm nay</h5>
                        </div>
                    ) : (
                        <div className="timeline">
                            {sortedTimes.map(time => (
                                <div key={time} className="timeline-block mb-4">
                                    <div className="timeline-header">
                                        <div className="timeline-time-badge">{time}</div>
                                        <div className="timeline-header-line"></div>
                                    </div>
                                    <Row xs={1} md={2} lg={3} className="g-3 mt-2">
                                        {timeSlots[time].map(booking => (
                                            <Col key={booking.id}>
                                                <Card className="booking-card h-100">
                                                    <Card.Body>
                                                        <div className="d-flex justify-content-between mb-2">
                                                            <h6 className="booking-customer">{booking.customer}</h6>
                                                            <StatusBadge status={booking.status} />
                                                        </div>
                                                        <div className="booking-details">
                                                            <p className="text-muted small mb-1">
                                                                <i className="bi bi-telephone me-1"></i> {booking.phone}
                                                            </p>
                                                            <p className="text-muted small mb-2">
                                                                <i className="bi bi-tools me-1"></i> {booking.service}
                                                            </p>
                                                        </div>
                                                        <div className="mt-3 d-flex justify-content-between align-items-center">
                                                            <span className="text-muted small booking-id">{booking.id}</span>
                                                            <div className="d-flex gap-2">
                                                                <Button
                                                                    variant="outline-primary"
                                                                    size="sm"
                                                                    className="btn-icon"
                                                                    onClick={() => openStatusModal(booking)}
                                                                    title="Cập nhật trạng thái"
                                                                >
                                                                    <i className="bi bi-pencil-square"></i>
                                                                </Button>
                                                                <Button
                                                                    variant="outline-secondary"
                                                                    size="sm"
                                                                    as={Link}
                                                                    to={`/admin/bookings/${booking.id}`}
                                                                    title="Xem chi tiết"
                                                                >
                                                                    <i className="bi bi-info-circle"></i>
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        ))}
                                    </Row>
                                </div>
                            ))}
                        </div>
                    )}
                </Card.Body>
            </Card>
        );
    };

    // Custom filter component matching the screenshot
    const renderFilterSection = () => {
        return (
            <Card className="shadow-sm mb-4">
                <Card.Body>
                    <Row className="g-3">
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Tìm kiếm</Form.Label>
                                <InputGroup>
                                    <Form.Control
                                        placeholder="Tìm kiếm..."
                                        value={filters.search || ''}
                                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
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
                                    value={filters.status || ''}
                                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                >
                                    <option value="">Tất cả</option>
                                    <option value="Chờ xác nhận">Chờ xác nhận</option>
                                    <option value="Đã xác nhận">Đã xác nhận</option>
                                    <option value="Đang thực hiện">Đang thực hiện</option>
                                    <option value="Hoàn thành">Hoàn thành</option>
                                    <option value="Đã hủy">Đã hủy</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group>
                                <Form.Label>Từ ngày</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={filters.startDate || ''}
                                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group>
                                <Form.Label>Đến ngày</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={filters.endDate || ''}
                                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group>
                                <Form.Label>Loại dịch vụ</Form.Label>
                                <Form.Select
                                    value={filters.service || ''}
                                    onChange={(e) => setFilters({ ...filters, service: e.target.value })}
                                >
                                    <option value="">Tất cả</option>
                                    <option value="Bảo dưỡng định kỳ">Bảo dưỡng định kỳ</option>
                                    <option value="Sửa chữa động cơ">Sửa chữa động cơ</option>
                                    <option value="Thay thế phụ tùng">Thay thế phụ tùng</option>
                                    <option value="Sửa hệ thống điện">Sửa hệ thống điện</option>
                                    <option value="Vệ sinh xe">Vệ sinh xe</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                    <div className="d-flex justify-content-end mt-3">
                        <Button
                            variant="outline-secondary"
                            className="me-2"
                            onClick={() => {
                                setFilters({
                                    search: '',
                                    status: '',
                                    startDate: '',
                                    endDate: '',
                                    service: ''
                                });
                            }}
                        >
                            <i className="bi bi-x-circle me-1"></i> Xóa bộ lọc
                        </Button>
                        <Button
                            variant="primary"
                            className="btn-custom"
                            onClick={() => {
                                handleApplyFilter(filters);
                                // applyTimeFilter(bookingsById, bookingIds, timeFilter);
                                // applyActiveFilters(bookingIds, bookingsById);
                            }}
                        >
                            <i className="bi bi-filter me-1"></i> Lọc
                        </Button>
                    </div>
                </Card.Body>
            </Card>
        );
    };

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0">Quản lý đặt lịch</h5>
                <Button
                    as={Link}
                    to="/admin/bookings/create"
                    className="btn-custom"
                >
                    <i className="bi bi-plus-circle me-1"></i>
                    Tạo lịch hẹn mới
                </Button>
            </div>

            {/* Time Period Tabs - Redesigned to match screenshot */}
            <div className="time-filter-container mb-4">
                <div className="time-filter-tabs">
                    <button
                        className={`time-filter-tab ${timeFilter === 'today' ? 'active' : ''}`}
                        onClick={() => setTimeFilter('today')}
                    >
                        Hôm nay
                    </button>
                    <button
                        className={`time-filter-tab ${timeFilter === 'week' ? 'active' : ''}`}
                        onClick={() => setTimeFilter('week')}
                    >
                        Tuần này
                    </button>
                    <button
                        className={`time-filter-tab ${timeFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setTimeFilter('all')}
                    >
                        Tất cả
                    </button>
                </div>
            </div>

            {renderFilterSection()}

            {/* View Type Toggle */}
            {timeFilter === 'today' && (
                <div className="d-flex justify-content-end mb-3">
                    <div className="view-toggle-container">
                        <button
                            className={`view-toggle-btn ${viewType === 'list' ? 'active' : ''}`}
                            onClick={() => setViewType('list')}
                        >
                            <i className="bi bi-list-ul me-2"></i>
                            Danh sách
                        </button>
                        <button
                            className={`view-toggle-btn ${viewType === 'timeline' ? 'active' : ''}`}
                            onClick={() => setViewType('timeline')}
                        >
                            <i className="bi bi-calendar3 me-2"></i>
                            Timeline
                        </button>
                    </div>
                </div>
            )}

            {timeFilter === 'today' && viewType === 'timeline'
                ? renderTimelineView()
                : renderTableView()
            }

            {renderPagination()}

            {/* Status Update Modal - Đã cập nhật */}
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Cập nhật đơn đặt lịch</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {currentBooking && (
                        <>
                            <div className="mb-3">
                                <p className="mb-1"><strong>Mã đơn:</strong> {currentBooking.id}</p>
                                <p className="mb-1"><strong>Khách hàng:</strong> {currentBooking.customer}</p>
                                <p className="mb-1"><strong>Dịch vụ:</strong> {currentBooking.service}</p>
                                <p className="mb-0"><strong>Trạng thái hiện tại:</strong> <StatusBadge status={currentBooking.status} /></p>
                            </div>

                            <Form.Group className="mb-3">
                                <Form.Label>Trạng thái mới</Form.Label>
                                <div className="d-flex flex-wrap gap-2">
                                    {currentBooking.status !== 'Đã xác nhận' && currentBooking.status !== 'Đã hủy' && (
                                        <Button
                                            variant={currentBooking.status === 'Chờ xác nhận' ? 'warning' : 'outline-warning'}
                                            size="sm"
                                            onClick={() => handleStatusUpdate('Chờ xác nhận')}
                                        >
                                            <i className="bi bi-hourglass me-1"></i> Chờ xác nhận
                                        </Button>
                                    )}
                                    
                                    {currentBooking.status !== 'Đã hủy' && (
                                        <Button
                                            variant={currentBooking.status === 'Đã xác nhận' ? 'info' : 'outline-info'}
                                            size="sm"
                                            onClick={() => handleStatusUpdate('Đã xác nhận')}
                                        >
                                            <i className="bi bi-check-circle me-1"></i> Đã xác nhận
                                        </Button>
                                    )}
                                    
                                    <Button
                                        variant={currentBooking.status === 'Đã hủy' ? 'danger' : 'outline-danger'}
                                        size="sm"
                                        onClick={() => handleStatusUpdate('Đã hủy')}
                                    >
                                        <i className="bi bi-x-circle me-1"></i> Đã hủy
                                    </Button>
                                </div>
                            </Form.Group>
                            
                            <Row className="mb-3">
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Ngày hẹn</Form.Label>
                                        <Form.Control
                                            type="date"
                                            name="date"
                                            value={updateFormData.date}
                                            onChange={handleFormChange}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Giờ hẹn</Form.Label>
                                        <Form.Control
                                            type="time"
                                            name="time"
                                            value={updateFormData.time}
                                            onChange={handleFormChange}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Form.Group>
                                <Form.Label>Ghi chú</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    name="note"
                                    value={updateFormData.note}
                                    onChange={handleFormChange}
                                    placeholder="Nhập ghi chú về cuộc hẹn (nếu có)"
                                />
                            </Form.Group>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        <i className="bi bi-x-lg me-1"></i> Đóng
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={() => handleStatusUpdate(currentBooking.status)}
                    >
                        <i className="bi bi-save me-1"></i> Lưu thay đổi
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default BookingManagement;
