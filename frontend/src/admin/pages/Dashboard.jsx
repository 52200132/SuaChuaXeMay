import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button } from 'react-bootstrap';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useStaffAuth } from '../contexts/StaffAuthContext';

const Dashboard = () => {
    const { currentUser } = useAuth();
    const isOwner = currentUser?.role === 'admin' || currentUser?.role === 'owner';
    const { currentStaff } = useStaffAuth();
    
    // Mock data
    const [stats, setStats] = useState({
        bookings: 0,
        completedServices: 0,
        revenue: 0,
        pendingBookings: 0
    });
    
    const [recentBookings, setRecentBookings] = useState([]);
    const [upcomingServices, setUpcomingServices] = useState([]);
    
    // Simulate loading data
    useEffect(() => {
        // Fetch dashboard data
        const fetchDashboardData = () => {
            // This would be replaced with actual API calls
            
            setStats({
                bookings: 187,
                completedServices: 156,
                revenue: 45600000,
                pendingBookings: 8
            });
            
            setRecentBookings([
                {
                    id: 'BK-2023-056',
                    customer: 'Nguyễn Văn A',
                    service: 'Bảo dưỡng định kỳ',
                    date: '2023-06-15',
                    status: 'Hoàn thành',
                    phone: '0912345678'
                },
                {
                    id: 'BK-2023-057',
                    customer: 'Trần Thị B',
                    service: 'Sửa chữa động cơ',
                    date: '2023-06-15',
                    status: 'Đang thực hiện',
                    phone: '0987654321'
                },
                {
                    id: 'BK-2023-058',
                    customer: 'Lê Văn C',
                    service: 'Thay thế phụ tùng',
                    date: '2023-06-16',
                    status: 'Chờ xác nhận',
                    phone: '0977123456'
                },
                {
                    id: 'BK-2023-059',
                    customer: 'Phạm Thị D',
                    service: 'Vệ sinh xe',
                    date: '2023-06-16',
                    status: 'Đã xác nhận',
                    phone: '0909123456'
                },
                {
                    id: 'BK-2023-060',
                    customer: 'Hoàng Văn E',
                    service: 'Sửa hệ thống điện',
                    date: '2023-06-17',
                    status: 'Đã hủy',
                    phone: '0918765432'
                }
            ]);
            
            setUpcomingServices([
                {
                    id: 'BK-2023-058',
                    customer: 'Lê Văn C',
                    service: 'Thay thế phụ tùng',
                    time: '08:00',
                    date: '2023-06-16',
                    status: 'Chờ xác nhận',
                    phone: '0977123456',
                    vehicleModel: 'Honda Wave'
                },
                {
                    id: 'BK-2023-059',
                    customer: 'Phạm Thị D',
                    service: 'Vệ sinh xe',
                    time: '09:30',
                    date: '2023-06-16',
                    status: 'Đã xác nhận',
                    phone: '0909123456',
                    vehicleModel: 'Yamaha Exciter'
                },
                {
                    id: 'BK-2023-061',
                    customer: 'Vũ Thị F',
                    service: 'Bảo dưỡng định kỳ',
                    time: '10:30',
                    date: '2023-06-17',
                    status: 'Đã xác nhận',
                    phone: '0919123456',
                    vehicleModel: 'Honda Lead'
                }
            ]);
        };
        
        fetchDashboardData();
    }, []);
    
    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <>
            <Row className="g-4 mb-4">
                <Col xl={3} md={6}>
                    <StatCard
                        title="Tổng đơn đặt lịch"
                        value={stats.bookings}
                        icon="bi-calendar-check"
                        trend="up"
                        trendValue="8.5"
                        trendText="so với tháng trước"
                    />
                </Col>
                <Col xl={3} md={6}>
                    <StatCard
                        title="Dịch vụ đã hoàn thành"
                        value={stats.completedServices}
                        icon="bi-tools"
                        trend="up"
                        trendValue="5.2"
                        trendText="so với tháng trước"
                        color="#198754"  // success green
                    />
                </Col>
                {isOwner && (
                    <>
                        <Col xl={3} md={6}>
                            <StatCard
                                title="Doanh thu"
                                value={formatCurrency(stats.revenue)}
                                icon="bi-currency-exchange"
                                trend="up"
                                trendValue="12.3"
                                trendText="so với tháng trước"
                                color="#0d6efd"  // primary blue
                            />
                        </Col>
                        <Col xl={3} md={6}>
                            <StatCard
                                title="Đơn đang chờ xử lý"
                                value={stats.pendingBookings}
                                icon="bi-hourglass-split"
                                trend="down"
                                trendValue="3.1"
                                trendText="so với tháng trước"
                                color="#fd7e14"  // warning orange
                            />
                        </Col>
                    </>
                )}
                {!isOwner && (
                    <Col xl={6} md={6}>
                        <StatCard
                            title="Đơn đang chờ xử lý"
                            value={stats.pendingBookings}
                            icon="bi-hourglass-split"
                            trend="down"
                            trendValue="3.1"
                            trendText="so với tháng trước"
                            color="#fd7e14"  // warning orange
                        />
                    </Col>
                )}
            </Row>
            
            <Row className="mb-4">
                <Col xl={8} lg={12}>
                    <Card className="shadow-sm">
                        <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">Lịch đặt gần đây</h5>
                            <Button 
                                as={Link} 
                                to="/admin/bookings" 
                                variant="outline-primary" 
                                size="sm"
                                style={{ borderColor: '#d30000', color: '#d30000' }}
                            >
                                Xem tất cả
                            </Button>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <div className="table-responsive">
                                <Table hover className="mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Mã đơn</th>
                                            <th>Khách hàng</th>
                                            <th>Dịch vụ</th>
                                            <th>Ngày</th>
                                            <th>Trạng thái</th>
                                            <th>Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentBookings.map(booking => (
                                            <tr key={booking.id}>
                                                <td>{booking.id}</td>
                                                <td>
                                                    <div>
                                                        <div className="fw-semibold">{booking.customer}</div>
                                                        <small className="text-muted">{booking.phone}</small>
                                                    </div>
                                                </td>
                                                <td>{booking.service}</td>
                                                <td>{booking.date}</td>
                                                <td>
                                                    <StatusBadge status={booking.status} />
                                                </td>
                                                <td>
                                                    <Button 
                                                        variant="link" 
                                                        size="sm" 
                                                        className="p-0 text-decoration-none"
                                                        as={Link}
                                                        to={`/admin/bookings/${booking.id}`}
                                                    >
                                                        Chi tiết
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                
                <Col xl={4} lg={12} className="mt-4 mt-xl-0">
                    <Card className="shadow-sm">
                        <Card.Header className="bg-white">
                            <h5 className="mb-0">Lịch hẹn sắp tới</h5>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <div style={{ maxHeight: '365px', overflowY: 'auto' }}>
                                {upcomingServices.map(service => (
                                    <div key={service.id} className="p-3 border-bottom">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <h6 className="mb-0">{service.customer}</h6>
                                            <StatusBadge status={service.status} />
                                        </div>
                                        <div className="d-flex mb-1">
                                            <i className="bi bi-telephone me-2"></i>
                                            <span>{service.phone}</span>
                                        </div>
                                        <div className="d-flex mb-1">
                                            <i className="bi bi-tools me-2"></i>
                                            <span>{service.service}</span>
                                        </div>
                                        <div className="d-flex mb-1">
                                            <i className="bi bi-bicycle me-2"></i>
                                            <span>{service.vehicleModel}</span>
                                        </div>
                                        <div className="d-flex mb-3">
                                            <i className="bi bi-calendar3 me-2"></i>
                                            <span>{service.date} - {service.time}</span>
                                        </div>
                                        <div className="d-flex justify-content-end">
                                            <Button 
                                                variant="outline-primary" 
                                                size="sm"
                                                style={{ borderColor: '#d30000', color: '#d30000' }}
                                                as={Link}
                                                to={`/admin/bookings/${service.id}`}
                                            >
                                                Xem chi tiết
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            
            {isOwner && (
                <Row>
                    <Col>
                        <Card className="shadow-sm">
                            <Card.Header className="bg-white">
                                <h5 className="mb-0">Thống kê doanh thu</h5>
                            </Card.Header>
                            <Card.Body>
                                <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <p className="text-muted mb-0">Biểu đồ thống kê doanh thu sẽ được hiển thị ở đây</p>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}
        </>
    );
};

export default Dashboard;
