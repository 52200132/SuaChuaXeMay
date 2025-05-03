import React, { useState, useEffect, useMemo } from "react";
import { Card, Table, Button, Pagination, Modal, Form, Row, Col, InputGroup } from "react-bootstrap";
import { Link } from "react-router-dom";

import StatusBadge from "../components/StatusBadge";
import "./BookingManagement.css";
import { customerService } from "../../services/api";

import { useData } from "../../contexts/DataContext";
import { useAppData } from "../contexts/AppDataContext";
import { set } from "date-fns";

// Status translation mappings
const STATUS_MAPPINGS = {
    "pending": "Chờ xử lý",
    "confirmed": "Đã xác nhận",
    "cancelled": "Đã hủy",
    "Chờ xử lý": "pending",
    "Đã xác nhận": "confirmed",
    "Đã hủy": "cancelled",
};

const BookingManagement = () => {
    // Context data
    const { getData, setData, fetchAndStoreData, loading, setLoadingState } = useAppData();
    const { serviceTypes, timeSlots } = useData();
    const appointments = getData("appointments");
    const appointmentsIds = getData("appointmentsIds");
    const customers = getData("customers");

    // UI state
    const [viewType, setViewType] = useState("list"); // "list" or "timeline"
    const [timeFilter, setTimeFilter] = useState("today"); // "today", "week", "all"
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [currentBooking, setCurrentBooking] = useState(null);
    const [updateFormData, setUpdateFormData] = useState({
        date: "",
        time: "",
        note: "",
        status: ""
    });

    // Filter state
    const [filters, setFilters] = useState({
        search: "",
        status: "",
        startDate: "",
        endDate: "",
        service: ""
    });
    
    // Filtered data
    const [filteredBookingIds, setFilteredBookingIds] = useState([]);
    const [timefilteredBookingIds, setTimeFilteredBookingIds] = useState([]);

    const [localLoading, setLocalLoading] = useState(false);

    // Format appointment data for display
    const formatAppointment = (appointment, customersData = {}, serviceTypesData = {}) => {
        if (!appointment) return null;
        
        const [date, time] = appointment.appointment_date.split("T");
        
        return {
            id: appointment.appointment_id,
            customer: customersData[appointment.customer_id]?.fullname || "Chưa có tên khách hàng",
            status: STATUS_MAPPINGS[appointment.status] || appointment.status,
            date: date,
            time: time,
            phone: customersData[appointment.customer_id]?.phone_num || "Chưa có số điện thoại",
            service: serviceTypesData[appointment.service_type_id]?.name || "Chưa có dịch vụ",
            note: appointment.note || "",
        };
    };

    // Memoized formatted appointments
    const displayAppointments = useMemo(() => {
        if (!appointments || !customers || !serviceTypes) return {};
        
        const displayData = {};
        if (appointmentsIds && appointmentsIds.size > 0) {
            Array.from(appointmentsIds).forEach(id => {
                if (appointments[id]) {
                    displayData[appointments[id].appointment_id] = formatAppointment(
                        appointments[id], 
                        customers, 
                        serviceTypes
                    );
                }
            });
        }
        return displayData;
    }, [appointmentsIds, appointments, customers, serviceTypes]);

    // Apply filters when data changes
    useEffect(() => {
        setLocalLoading(true);
        if (loading["appointments"] === true || loading["customers"] === true) return;
        if (appointmentsIds.size === 0) return;
        applyTimeFilter(displayAppointments, appointmentsIds, timeFilter);
        setLocalLoading(false);
    }, [loading["appointments"], loading["customers"]]);

    // Reset and apply time filter when it changes
    useEffect(() => {
        setFilters({
            search: "",
            status: "",
            startDate: "",
            endDate: "",
            service: ""
        });
        
        if (Object.keys(appointments).length > 0) {
            applyTimeFilter(displayAppointments, appointmentsIds, timeFilter);
        }
    }, [timeFilter]);

    // Time filter function
    const applyTimeFilter = (bookingsData, bookingIdsData, filter) => {
        const bookingIds = Array.isArray(bookingIdsData) ? bookingIdsData : Array.from(bookingIdsData);
        if (!bookingIds.length) return;

        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)

        let filtered = [...bookingIds];

        if (filter === "today") {
            const todayStr = today.toLocaleDateString("en-CA"); // Format YYYY-MM-DD
            filtered = filtered.filter(id => bookingsData[id]?.date === todayStr);
        } else if (filter === "week") {
            filtered = filtered.filter(id => {
                const bookingDate = new Date(bookingsData[id]?.date);
                return bookingDate >= weekStart && bookingDate <= weekEnd;
            });
        }

        setFilteredBookingIds(filtered);
        setTimeFilteredBookingIds(filtered);
        setTotalPages(Math.ceil(filtered.length / 10));
        setCurrentPage(1);
    };

    // Apply search and other filters
    const applyActiveFilters = (ids, bookingsData) => {
        if (!ids || !ids.length) return;
        
        let filtered = [...ids];

        // Apply search filter
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(id => {
                const booking = bookingsData[id];
                if (!booking) return false;
                
                return (booking.id && booking.id.toString().toLowerCase().includes(searchTerm)) ||
                    (booking.customer && booking.customer.toLowerCase().includes(searchTerm)) ||
                    (booking.phone && booking.phone.includes(searchTerm)) ||
                    (booking.service && booking.service.toLowerCase().includes(searchTerm));
            });
        }

        // Apply status filter
        if (filters.status) {
            filtered = filtered.filter(id => bookingsData[id]?.status === filters.status);
        }

        // Apply service filter
        if (filters.service) {
            filtered = filtered.filter(id => bookingsData[id]?.service === filters.service);
        }

        // Apply date range filter
        if (filters.startDate) {
            filtered = filtered.filter(id => bookingsData[id]?.date >= filters.startDate);
        }
        if (filters.endDate) {
            filtered = filtered.filter(id => bookingsData[id]?.date <= filters.endDate);
        }

        setFilteredBookingIds(filtered);
        setTotalPages(Math.ceil(filtered.length / 10));
        setCurrentPage(1);
    };

    // Event handlers
    const handleApplyFilter = (appliedFilters) => {
        setFilters(appliedFilters);
        applyActiveFilters(timefilteredBookingIds, displayAppointments);
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const openStatusModal = (booking) => {
        setCurrentBooking(booking);
        setUpdateFormData({
            date: booking.date || "",
            time: booking.time?.substring(0, 5) || "", // Get only HH:MM from time
            note: booking.note || "",
            status: booking.status || ""
        });
        setShowModal(true);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setUpdateFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleUpdateBooking = async () => {
        if (!currentBooking) return;

        try {
            setLoadingState('appointments', true);
            const response = await customerService.appointment.updateAppointment(currentBooking.id, {
                appointment_date: `${updateFormData.date} ${updateFormData.time}`,
                note: updateFormData.note,
                status: STATUS_MAPPINGS[updateFormData.status],
            });
            if (response.status === 200 && response.data) {
                setData("appointments", response.data, currentBooking.id);
                alert("Cập nhật lịch hẹn thành công!");
            }
            setShowModal(false);
        } catch (error) {
            const errorMessage = error.response?.data?.detail || "Đã xảy ra lỗi. Vui lòng thử lại.";
            console.error("Lỗi khi cập nhật lịch hẹn:", errorMessage);
            alert(errorMessage);
        } finally {
            setLoadingState('appointments', false);
        }
    }

    // Pagination helpers
    const getCurrentItems = () => {
        const indexOfLastItem = currentPage * 10;
        const indexOfFirstItem = indexOfLastItem - 10;
        const currentIds = filteredBookingIds.slice(indexOfFirstItem, indexOfFirstItem + 10);
        return currentIds.map(id => displayAppointments[id]).filter(Boolean);
    };

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

    // UI Components
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
                                {localLoading ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-4">
                                            <div className="spinner-border text-primary" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                            <p className="mt-2 text-muted">Đang tải dữ liệu...</p>
                                        </td>
                                    </tr>
                                ) : (
                                    getCurrentItems().map(booking => (
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
                                                        title="Cập nhật lịch hẹn"
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
                                    ))
                                )}
                                {!localLoading && getCurrentItems().length === 0 && (
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
                                        <div className="timeline-time-badge">{time.toString().substring(0, 5)}</div>
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
                                        value={filters.search || ""}
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
                                    value={filters.status || ""}
                                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                >
                                    <option value="">Tất cả</option>
                                    <option value="Chờ xác nhận">Chờ xác nhận</option>
                                    <option value="Đã xác nhận">Đã xác nhận</option>
                                    <option value="Đã hủy">Đã hủy</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group>
                                <Form.Label>Từ ngày</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={filters.startDate || ""}
                                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group>
                                <Form.Label>Đến ngày</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={filters.endDate || ""}
                                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group>
                                <Form.Label>Loại dịch vụ</Form.Label>
                                <Form.Select
                                    value={filters.service || ""}
                                    onChange={(e) => setFilters({ ...filters, service: e.target.value })}
                                >
                                    <option value="">Tất cả</option>
                                    <option value="Sửa chữa">Sửa chữa</option>
                                    <option value="Thay thế phụ tùng">Thay thế phụ tùng</option>
                                    <option value="Bảo dưỡng">Bảo dưỡng</option>
\\                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                    <div className="d-flex justify-content-end mt-3">
                        <Button
                            variant="outline-secondary"
                            className="me-2"
                            onClick={() => {
                                setFilters({
                                    search: "",
                                    status: "",
                                    startDate: "",
                                    endDate: "",
                                    service: ""
                                });
                            }}
                        >
                            <i className="bi bi-x-circle me-1"></i> Xóa bộ lọc
                        </Button>
                        <Button
                            variant="primary"
                            className="btn-custom"
                            onClick={() => handleApplyFilter(filters)}
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

            {/* Time Period Tabs */}
            <div className="time-filter-container mb-4">
                <div className="time-filter-tabs">
                    <button
                        className={`time-filter-tab ${timeFilter === "today" ? "active" : ""}`}
                        onClick={() => setTimeFilter("today")}
                    >
                        Hôm nay
                    </button>
                    <button
                        className={`time-filter-tab ${timeFilter === "week" ? "active" : ""}`}
                        onClick={() => setTimeFilter("week")}
                    >
                        Tuần này
                    </button>
                    <button
                        className={`time-filter-tab ${timeFilter === "all" ? "active" : ""}`}
                        onClick={() => setTimeFilter("all")}
                    >
                        Tất cả
                    </button>
                </div>
            </div>

            {renderFilterSection()}

            {/* View Type Toggle */}
            {timeFilter === "today" && (
                <div className="d-flex justify-content-end mb-3">
                    <div className="view-toggle-container">
                        <button
                            className={`view-toggle-btn ${viewType === "list" ? "active" : ""}`}
                            onClick={() => setViewType("list")}
                        >
                            <i className="bi bi-list-ul me-2"></i>
                            Danh sách
                        </button>
                        <button
                            className={`view-toggle-btn ${viewType === "timeline" ? "active" : ""}`}
                            onClick={() => setViewType("timeline")}
                        >
                            <i className="bi bi-calendar3 me-2"></i>
                            Timeline
                        </button>
                    </div>
                </div>
            )}

            {timeFilter === "today" && viewType === "timeline"
                ? renderTimelineView()
                : renderTableView()
            }

            {renderPagination()}

            {/* Status Update Modal */}
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
                                    {currentBooking.status !== "Đã hủy" && (
                                        <Button
                                            variant={updateFormData.status === "Đã xác nhận" ? "info" : "outline-info"} 
                                            size="sm"
                                            onClick={handleFormChange}
                                            name="status"
                                            value="Đã xác nhận"
                                            disabled={updateFormData.status === "Đã xác nhận"}
                                        >
                                            <i className="bi bi-check-circle me-1"></i> Xác nhận lịch hẹn
                                        </Button>
                                    )}
                                    
                                    <Button
                                        variant={updateFormData.status === "Đã hủy" ? "danger" : "outline-danger"}
                                        size="sm"
                                        onClick={handleFormChange}
                                        name="status"
                                        value="Đã hủy"
                                        disabled={updateFormData.status === "Đã hủy"}
                                    >
                                        <i className="bi bi-x-circle me-1"></i> Hủy lịch hẹn
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
                                        <Form.Select
                                            name="time"
                                            value={updateFormData.time}
                                            onChange={handleFormChange}
                                            required
                                        >
                                        {timeSlots.map((slot, index) => (
                                            <option key={index} value={slot.value}>
                                                {slot.value}
                                            </option>
                                        ))}
                                        </Form.Select>
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
                        onClick={handleUpdateBooking}
                    >
                        <i className="bi bi-save me-1"></i> Lưu thay đổi
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default BookingManagement;
