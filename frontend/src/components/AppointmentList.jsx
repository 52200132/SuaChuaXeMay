import React, { useState, useEffect, useCallback } from 'react';
import { Table, Badge, Button, Spinner, Alert, Modal, Pagination } from 'react-bootstrap';

import StatusBadge from '../admin/components/StatusBadge';
import { useUserData } from '../contexts/UserDataContext';
import { useData } from '../contexts/DataContext';
import { formatDate, formatTime } from '../utils/formatters';

const AppointmentList = () => {
    const { getData, getIds, loading, errors } = useUserData();
    const { serviceTypes } = useData();

    const appointmentsById = getData('appointments');
    const [serviceTypesObject, setServiceTypesObject] = useState({});

    const [filteredAppointments, setFilteredAppointments] = useState([]);
    const [fillteredAppointmentIds, setFillteredAppointmentIds] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState({});
    const [filter, setFilter] = useState('all'); // 'all', 'upcoming', 'past', 'cancelled'
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [totalPages, setTotalPages] = useState(1);
    const [displayedAppointments, setDisplayedAppointments] = useState([]);

    const appointmentStatus = {
        "pending": "Chờ xử lý",
        "confirmed": "Đã xác nhận",
        "cancelled": "Đã hủy",
        "Chờ xử lý": "pending",
        "Đã xác nhận": "confirmed",
        "Đã hủy": "cancelled",
    };

    useEffect(() => {
        if (serviceTypes && serviceTypes.length > 0) {
            const typesObject = serviceTypes.reduce((acc, type) => {
                acc[type.service_type_id] = type;
                return acc;
            }, {});
            setServiceTypesObject(typesObject);
        }
    }, [serviceTypes]);

    useEffect(() => {
        if (loading.appointments === true) return;
        setFillteredAppointmentIds(getIds('appointments'));
        setTotalPages(Math.ceil(getIds('appointments').length / itemsPerPage));
    }, [loading, itemsPerPage]);

    // useEffect(() => {
    //     // Get appointments
    //     const appointments = Object.values(appointmentsById || {});
        
    //     if (appointments && appointments.length > 0) {
    //         let filtered = [...appointments];
            
    //         // Sort by date (newest first)
    //         filtered.sort((a, b) => new Date(b.appointment_date || b.appointment_time) - 
    //                                 new Date(a.appointment_date || a.appointment_time));
            
    //         // Apply filter
    //         if (filter === 'upcoming') {
    //             filtered = filtered.filter(app => 
    //                 new Date(app.appointment_date || app.appointment_time) > new Date() && 
    //                 app.status !== 'Đã hủy' && 
    //                 app.status !== 'cancelled'
    //             );
    //         } else if (filter === 'past') {
    //             filtered = filtered.filter(app => 
    //                 new Date(app.appointment_date || app.appointment_time) < new Date() && 
    //                 app.status !== 'Đã hủy' && 
    //                 app.status !== 'cancelled'
    //             );
    //         } else if (filter === 'cancelled') {
    //             filtered = filtered.filter(app => 
    //                 app.status === 'Đã hủy' || app.status === 'cancelled'
    //             );
    //         }
            
    //         setFilteredAppointments(filtered);
            
    //         // Calculate total pages
    //         const calculatedTotalPages = Math.ceil(filtered.length / itemsPerPage);
    //         setTotalPages(calculatedTotalPages);
            
    //         // Reset to first page when filter changes
    //         if (currentPage > calculatedTotalPages) {
    //             setCurrentPage(1);
    //         }
    //     } else {
    //         setFilteredAppointments([]);
    //         setTotalPages(1);
    //     }
    // }, [appointmentsById, filter, itemsPerPage]);
    
    // Update displayed appointments when filteredAppointments or pagination changes
    // useEffect(() => {
    //     if (filteredAppointments.length > 0) {
    //         const startIndex = (currentPage - 1) * itemsPerPage;
    //         const endIndex = startIndex + itemsPerPage;
    //         setDisplayedAppointments(filteredAppointments.slice(startIndex, endIndex));
    //     } else {
    //         setDisplayedAppointments([]);
    //     }
    // }, [filteredAppointments, currentPage, itemsPerPage]);

    // Handle page change
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleShowDetails = (appointment) => {
        setSelectedAppointment(appointment);
        setShowModal(true);
    };

    const formatAppointmentData = (appointment, serviceType) => {
        const [date, time] = appointment.created_at?.split('T') || [null, null];
        const [appdate, apptime] = appointment.appointment_date?.split('T') || [null, null];
        return {
            originalData: appointment,
            appointmentId: appointment.appointment_id,
            createdAtDate: date,
            createdAtTime: time,
            appointmentDate: appdate,
            appointmentTime: apptime,
            serviceTypeName: serviceType?.name || '',
            note: appointment.note || 'Không có ghi chú',
            status: appointmentStatus[appointment.status] || '',
        }
    }

    // Create pagination items
    const renderPaginationItems = () => {
        let items = [];

        // Add Previous button
        items.push(
            <Pagination.Prev
                key="prev"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
            />
        );

        // Always show first page
        items.push(
            <Pagination.Item
                key={1}
                active={currentPage === 1}
                onClick={() => handlePageChange(1)}
            >
                1
            </Pagination.Item>
        );

        // Add ellipsis if needed
        if (currentPage > 3) {
            items.push(<Pagination.Ellipsis key="ellipsis-1" disabled />);
        }

        // Add pages around current page
        for (let page = Math.max(2, currentPage - 1); page <= Math.min(totalPages - 1, currentPage + 1); page++) {
            if (page === 1 || page === totalPages) continue; // Skip first and last page (handled separately)
            items.push(
                <Pagination.Item
                    key={page}
                    active={currentPage === page}
                    onClick={() => handlePageChange(page)}
                >
                    {page}
                </Pagination.Item>
            );
        }

        // Add ellipsis if needed
        if (currentPage < totalPages - 2 && totalPages > 3) {
            items.push(<Pagination.Ellipsis key="ellipsis-2" disabled />);
        }

        // Always show last page if there is more than one page
        if (totalPages > 1) {
            items.push(
                <Pagination.Item
                    key={totalPages}
                    active={currentPage === totalPages}
                    onClick={() => handlePageChange(totalPages)}
                >
                    {totalPages}
                </Pagination.Item>
            );
        }

        // Add Next button
        items.push(
            <Pagination.Next
                key="next"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => handlePageChange(currentPage + 1)}
            />
        );

        return items;
    };

    const getCurrentAppointments = useCallback(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const displayData = fillteredAppointmentIds.slice(startIndex, endIndex).map(id => {
            const appointment = appointmentsById[id];
            return formatAppointmentData(appointment, serviceTypesObject[appointment.service_type_id]);
        });
        return displayData;
    }, [appointmentsById, serviceTypesObject, currentPage, itemsPerPage, fillteredAppointmentIds]);

    if (loading.appointments) {
        return (
            <div className="text-center p-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Đang tải lịch hẹn...</p>
            </div>
        );
    }

    if (errors.appointments) {
        return (
            <Alert variant="danger">
                Lỗi: {errors.appointments}
            </Alert>
        );
    }

    return (
        <div className="appointment-list">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0">Danh sách lịch hẹn của bạn</h5>
                <div className="d-flex">
                    <div className="btn-group">
                        <Button 
                            variant={filter === 'all' ? 'primary' : 'outline-primary'}
                            onClick={() => setFilter('all')}
                            size="sm"
                        >
                            Tất cả
                        </Button>
                        <Button 
                            variant={filter === 'upcoming' ? 'primary' : 'outline-primary'}
                            onClick={() => setFilter('upcoming')} 
                            size="sm"
                        >
                            Sắp tới
                        </Button>
                        <Button 
                            variant={filter === 'past' ? 'primary' : 'outline-primary'} 
                            onClick={() => setFilter('past')}
                            size="sm"
                        >
                            Đã qua
                        </Button>
                        <Button 
                            variant={filter === 'cancelled' ? 'primary' : 'outline-primary'} 
                            onClick={() => setFilter('cancelled')}
                            size="sm"
                        >
                            Đã hủy
                        </Button>
                    </div>
                </div>
            </div>

            {fillteredAppointmentIds.length === 0 ? (
                <Alert variant="info">
                    Không tìm thấy lịch hẹn nào {filter !== 'all' ? 'cho bộ lọc đã chọn' : ''}.
                </Alert>
            ) : (
                <>
                    <Table responsive hover>
                        <thead>
                            <tr>
                                <th>Mã hẹn</th>
                                <th>Ngày & giờ hẹn</th>
                                <th>Dịch vụ</th>
                                <th>Trạng thái</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {getCurrentAppointments().map(a => (
                                <tr key={a.appointmentId}>
                                    <td>{a.appointmentId}</td>
                                    <td>{formatDate(a.appointmentDate)}<br />
                                        <small className='text-muted'>{formatTime(a.appointmentTime)}</small>
                                    </td>
                                    <td>{a.serviceTypeName}</td>
                                    <td>
                                        <StatusBadge status={a.status} />
                                    </td>
                                    <td>
                                        <Button 
                                            variant="outline-secondary" 
                                            size="sm"
                                            onClick={() => handleShowDetails(a)}
                                        >
                                            <i className="bi bi-eye"></i>
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    
                    {/* Pagination controls */}
                    <div className="d-flex justify-content-between align-items-center mt-3">
                        <div className="text-muted small">
                            Hiển thị {getCurrentAppointments().length} / {fillteredAppointmentIds.length} lịch hẹn
                        </div>
                        <div className="d-flex align-items-center">
                            <span className="me-3">
                                <select 
                                    className="form-select form-select-sm"
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                        setItemsPerPage(Number(e.target.value));
                                        setCurrentPage(1); // Reset to first page when changing items per page
                                    }}
                                >
                                    <option value={5}>5 mục</option>
                                    <option value={10}>10 mục</option>
                                    <option value={20}>20 mục</option>
                                </select>
                            </span>
                            <Pagination size="sm" className="mb-0">
                                {renderPaginationItems()}
                            </Pagination>
                        </div>
                    </div>
                </>
            )}

            {/* Appointment Detail Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Chi tiết lịch hẹn #{selectedAppointment?.appointmentId}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedAppointment && (
                        <div>
                            <p><strong>Ngày hẹn:</strong> {formatDate(selectedAppointment.appointmentDate) + ' '}
                                {formatTime(selectedAppointment.appointmentTime)}</p>
                            <p><strong>Loại dịch vụ:</strong> {selectedAppointment.serviceTypeName}</p>
                            <p>
                                <strong>Trạng thái:</strong>{' '}
                                <StatusBadge status={selectedAppointment.status} />
                            </p>
                            <p><strong>Ngày tạo:</strong> {formatDate(selectedAppointment.createdAtDate) + ' ' + 
                            formatTime(selectedAppointment.createdAtTime)}
                            </p>
                            <p><strong>Ghi chú:</strong> {selectedAppointment.note}</p>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    {selectedAppointment &&
                        new Date(selectedAppointment.appointment_date || selectedAppointment.appointment_time) > new Date() &&
                        (selectedAppointment.status === 'Đang chờ' || selectedAppointment.status === 'Đã xác nhận' ||
                            selectedAppointment.status === 'pending' || selectedAppointment.status === 'confirmed') && (
                            <Button variant="danger">
                                Hủy lịch hẹn
                            </Button>
                        )}
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Đóng
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default AppointmentList;
