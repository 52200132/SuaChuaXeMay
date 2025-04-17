import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Pagination, Modal, Form, Row, Col, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import FilterBar from '../components/FilterBar';
import StatusBadge from '../components/StatusBadge';

const BookingManagement = () => {
    const [bookings, setBookings] = useState([]);
    const [filteredBookings, setFilteredBookings] = useState([]);
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
    const [statusUpdateNote, setStatusUpdateNote] = useState('');
    
    // Load bookings data
    useEffect(() => {
        // In a real application, this would be an API call
        const fetchBookings = () => {
            // Mock data
            const mockBookings = Array(50).fill().map((_, index) => {
                const id = `BK-2023-${(index + 1).toString().padStart(3, '0')}`;
                const statuses = ['Chờ xác nhận', 'Đã xác nhận', 'Đang thực hiện', 'Hoàn thành', 'Đã hủy'];
                const services = ['Bảo dưỡng định kỳ', 'Sửa chữa động cơ', 'Thay thế phụ tùng', 'Sửa hệ thống điện', 'Vệ sinh xe'];
                const names = ['Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C', 'Phạm Thị D', 'Hoàng Văn E'];
                
                // Generate random date within last 30 days
                const date = new Date();
                date.setDate(date.getDate() - Math.floor(Math.random() * 30));
                const formattedDate = date.toISOString().split('T')[0];
                
                // Times 
                const times = ['08:00', '09:00', '10:00', '11:00', '13:30', '14:30', '15:30', '16:30'];
                
                return {
                    id,
                    customer: names[Math.floor(Math.random() * names.length)],
                    service: services[Math.floor(Math.random() * services.length)],
                    date: formattedDate,
                    time: times[Math.floor(Math.random() * times.length)],
                    status: statuses[Math.floor(Math.random() * statuses.length)],
                    phone: `09${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
                    vehicleModel: ['Honda Wave', 'Yamaha Exciter', 'Honda SH', 'Yamaha Janus', 'Honda Vision'][Math.floor(Math.random() * 5)],
                    notes: Math.random() > 0.7 ? 'Ghi chú về tình trạng xe và yêu cầu sửa chữa.' : ''
                };
            });
            
            setBookings(mockBookings);
            setFilteredBookings(mockBookings);
            setTotalPages(Math.ceil(mockBookings.length / 10));
        };
        
        fetchBookings();
    }, []);
    
    // Handle filter application
    const handleApplyFilter = (appliedFilters) => {
        let filtered = [...bookings];
        
        // Apply search filter
        if (appliedFilters.search) {
            const searchTerm = appliedFilters.search.toLowerCase();
            filtered = filtered.filter(booking => 
                booking.id.toLowerCase().includes(searchTerm) ||
                booking.customer.toLowerCase().includes(searchTerm) ||
                booking.phone.includes(searchTerm) ||
                booking.service.toLowerCase().includes(searchTerm)
            );
        }
        
        // Apply status filter
        if (appliedFilters.status) {
            filtered = filtered.filter(booking => booking.status === appliedFilters.status);
        }
        
        // Apply service filter
        if (appliedFilters.service) {
            filtered = filtered.filter(booking => booking.service === appliedFilters.service);
        }
        
        // Apply date range filter
        if (appliedFilters.startDate) {
            filtered = filtered.filter(booking => booking.date >= appliedFilters.startDate);
        }
        if (appliedFilters.endDate) {
            filtered = filtered.filter(booking => booking.date <= appliedFilters.endDate);
        }
        
        setFilteredBookings(filtered);
        setTotalPages(Math.ceil(filtered.length / 10));
        setCurrentPage(1);
    };
    
    // Pagination change
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };
    
    // Handle status update
    const openStatusModal = (booking) => {
        setCurrentBooking(booking);
        setStatusUpdateNote('');
        setShowModal(true);
    };
    
    const handleStatusUpdate = (newStatus) => {
        // In a real app, this would be an API call
        const updatedBookings = bookings.map(booking => {
            if (booking.id === currentBooking.id) {
                return { ...booking, status: newStatus };
            }
            return booking;
        });
        
        setBookings(updatedBookings);
        
        // Also update the filtered results
        const updatedFilteredBookings = filteredBookings.map(booking => {
            if (booking.id === currentBooking.id) {
                return { ...booking, status: newStatus };
            }
            return booking;
        });
        
        setFilteredBookings(updatedFilteredBookings);
        setShowModal(false);
        
        // In a real app, you would save the note to the backend here
        console.log(`Booking ${currentBooking.id} status updated to ${newStatus} with note: ${statusUpdateNote}`);
    };
    
    // Calculate current page items
    const getCurrentItems = () => {
        const indexOfLastItem = currentPage * 10;
        const indexOfFirstItem = indexOfLastItem - 10;
        return filteredBookings.slice(indexOfFirstItem, indexOfLastItem);
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

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0">Quản lý đặt lịch</h5>
                <Button 
                    as={Link} 
                    to="/admin/bookings/create"
                    style={{ backgroundColor: '#d30000', borderColor: '#d30000' }}
                >
                    <i className="bi bi-plus-circle me-1"></i>
                    Tạo đơn đặt lịch mới
                </Button>
            </div>
            
            <FilterBar 
                filters={filters} 
                setFilters={setFilters} 
                onApplyFilter={handleApplyFilter}
                filterOptions={['status', 'dateRange', 'service']}
            />
            
            <Card className="shadow-sm mb-4">
                <Card.Body className="p-0">
                    <div className="table-responsive">
                        <Table hover className="mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Mã đơn</th>
                                    <th>Khách hàng</th>
                                    <th>Dịch vụ</th>
                                    <th>Loại xe</th>
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
                                        <td>{booking.vehicleModel}</td>
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
                                                    style={{ borderColor: '#d30000', color: '#d30000' }}
                                                    onClick={() => openStatusModal(booking)}
                                                >
                                                    Cập nhật
                                                </Button>
                                                <Button 
                                                    variant="outline-secondary" 
                                                    size="sm"
                                                    as={Link}
                                                    to={`/admin/bookings/${booking.id}`}
                                                >
                                                    Chi tiết
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                
                                {getCurrentItems().length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="text-center py-4">
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
            
            {renderPagination()}
            
            {/* Status Update Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Cập nhật trạng thái đơn đặt lịch</Modal.Title>
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
                                    <Button 
                                        variant={currentBooking.status === 'Chờ xác nhận' ? 'warning' : 'outline-warning'} 
                                        size="sm" 
                                        onClick={() => handleStatusUpdate('Chờ xác nhận')}
                                    >
                                        Chờ xác nhận
                                    </Button>
                                    <Button 
                                        variant={currentBooking.status === 'Đã xác nhận' ? 'info' : 'outline-info'} 
                                        size="sm"
                                        onClick={() => handleStatusUpdate('Đã xác nhận')}
                                    >
                                        Đã xác nhận
                                    </Button>
                                    <Button 
                                        variant={currentBooking.status === 'Đang thực hiện' ? 'primary' : 'outline-primary'} 
                                        size="sm"
                                        onClick={() => handleStatusUpdate('Đang thực hiện')}
                                    >
                                        Đang thực hiện
                                    </Button>
                                    <Button 
                                        variant={currentBooking.status === 'Hoàn thành' ? 'success' : 'outline-success'} 
                                        size="sm"
                                        onClick={() => handleStatusUpdate('Hoàn thành')}
                                    >
                                        Hoàn thành
                                    </Button>
                                    <Button 
                                        variant={currentBooking.status === 'Đã hủy' ? 'danger' : 'outline-danger'} 
                                        size="sm"
                                        onClick={() => handleStatusUpdate('Đã hủy')}
                                    >
                                        Đã hủy
                                    </Button>
                                </div>
                            </Form.Group>
                            
                            <Form.Group>
                                <Form.Label>Ghi chú cập nhật</Form.Label>
                                <Form.Control 
                                    as="textarea" 
                                    rows={3}
                                    value={statusUpdateNote}
                                    onChange={(e) => setStatusUpdateNote(e.target.value)}
                                    placeholder="Nhập ghi chú về việc cập nhật trạng thái (nếu có)"
                                />
                            </Form.Group>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Đóng
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default BookingManagement;
