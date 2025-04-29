import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Alert, Card, Tab, Nav, Spinner, Badge, Modal, Table } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { customerService, resourceService, repairService } from '../../services/api';
import { formatDate, formatCurrency } from '../../utils/formatters';

const Profile = () => {
    const { currentUser, updateProfile } = useAuth();

    const [profileData, setProfileData] = useState({
        displayName: currentUser.displayName || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        address: currentUser.address || ''
    });

    // Thêm state để hiển thị vai trò nếu người dùng là nhân viên
    const [userRole, setUserRole] = useState('');

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [activeTab, setActiveTab] = useState('profile');
    
    // State for orders and invoices
    const [orders, setOrders] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [loadingInvoices, setLoadingInvoices] = useState(false);
    const [orderError, setOrderError] = useState('');
    const [invoiceError, setInvoiceError] = useState('');
    
    // New states for motorcycles and their orders
    const [motorcycles, setMotorcycles] = useState([]);
    const [motorcycleOrders, setMotorcycleOrders] = useState({});
    const [loadingMotorcycles, setLoadingMotorcycles] = useState(false);
    const [motorcycleError, setMotorcycleError] = useState('');
    
    // New states for order details modal
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [currentOrder, setCurrentOrder] = useState(null);
    const [orderModalLoading, setOrderModalLoading] = useState(false);
    const [partOrderDetails, setPartOrderDetails] = useState([]);
    const [serviceOrderDetails, setServiceOrderDetails] = useState([]);
    const [diagnosis, setDiagnosis] = useState(null);
    const [motorcycle, setMotorcycle] = useState(null);

    useEffect(() => {
        // Kiểm tra xem người dùng có phải là nhân viên không
        if (currentUser && currentUser.role) {
            // Chuyển đổi vai trò sang tiếng Việt
            switch(currentUser.role) {
                case 'manager':
                case 'admin':
                case 'owner':
                    setUserRole('Quản lý');
                    break;
                case 'receptionist':
                    setUserRole('Tiếp tân');
                    break;
                case 'technician':
                    setUserRole('Kỹ thuật viên');
                    break;
                case 'cashier':
                    setUserRole('Thu ngân');
                    break;
                default:
                    setUserRole('Khách hàng');
            }
        } else {
            setUserRole('Khách hàng');
        }
        
        // Fetch orders and invoices when user navigates to the orders tab
        if (activeTab === 'orders' && currentUser) {
            fetchCustomerOrders();
            // fetchCustomerInvoices();
        }
        
        // Fetch motorcycles and their orders when user navigates to motorcycles tab
        if (activeTab === 'motorcycles' && currentUser) {
            fetchCustomerMotorcycles();
        }
    }, [activeTab, currentUser]);

    // Function to fetch motorcycles and their orders
    const fetchCustomerMotorcycles = async () => {
        try {
            console.log(currentUser);
            setLoadingMotorcycles(true);
            setMotorcycleError('');
            
            // Get all motorcycles for the customer
            const motorcyclesResponse = await customerService.motorcycle.getAllMotorcycleByCustomerId(currentUser.id);
            const motorcyclesList = motorcyclesResponse.data || [];
            console.log(motorcyclesList);
            setMotorcycles(motorcyclesList);
            
            // Get orders for each motorcycle
            const ordersData = {};
            for (const motorcycle of motorcyclesList) {
                try {
                    const ordersResponse = await repairService.order.getAllOrdersByMotorcycleId(motorcycle.motocycle_id);
                    ordersData[motorcycle.motocycle_id] = ordersResponse.data || [];
                } catch (error) {
                    console.error(`Error fetching orders for motorcycle ${motorcycle.motocycle_id}:`, error);
                }
            }
            console.log(ordersData);
            setMotorcycleOrders(ordersData);
        } catch (error) {
            console.error('Error fetching customer motorcycles:', error);
            setMotorcycleError('Không thể lấy dữ liệu xe máy. Vui lòng thử lại sau.');
        } finally {
            setLoadingMotorcycles(false);
        }
    };

    const fetchCustomerOrders = async () => {
        try {
            setLoadingOrders(true);
            setOrderError('');
            const response = await repairService.order.getCustomerOrders(currentUser.uid);
            setOrders(response.data || []);
        } catch (error) {
            console.error('Error fetching customer orders:', error);
            setOrderError('Không thể lấy dữ liệu đơn hàng. Vui lòng thử lại sau.');
        } finally {
            setLoadingOrders(false);
        }
    };

    const fetchCustomerInvoices = async () => {
        try {
            setLoadingInvoices(true);
            setInvoiceError('');
            const response = await resourceService.invoice.getCustomerInvoices(currentUser.uid);
            setInvoices(response.data || []);
        } catch (error) {
            console.error('Error fetching customer invoices:', error);
            setInvoiceError('Không thể lấy dữ liệu hóa đơn. Vui lòng thử lại sau.');
        } finally {
            setLoadingInvoices(false);
        }
    };

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            setMessage({ type: '', text: '' });

            await updateProfile(profileData);

            setMessage({
                type: 'success',
                text: 'Thông tin hồ sơ đã được cập nhật thành công!'
            });
        } catch (error) {
            setMessage({
                type: 'danger',
                text: error.message || 'Có lỗi xảy ra khi cập nhật hồ sơ.'
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            return setMessage({
                type: 'danger',
                text: 'Mật khẩu xác nhận không khớp'
            });
        }

        try {
            setLoading(true);
            setMessage({ type: '', text: '' });

            // Thực hiện đổi mật khẩu (mock)
            await new Promise(resolve => setTimeout(resolve, 1000));

            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });

            setMessage({
                type: 'success',
                text: 'Mật khẩu đã được thay đổi thành công!'
            });
        } catch (error) {
            setMessage({
                type: 'danger',
                text: error.message || 'Có lỗi xảy ra khi thay đổi mật khẩu.'
            });
        } finally {
            setLoading(false);
        }
    };

    // Get status badge color
    const getStatusBadgeColor = (status) => {
        // Add null check to handle undefined status
        if (!status) return 'secondary';
        
        switch (status.toLowerCase()) {
            case 'đang chờ':
            case 'pending':
                return 'warning';
            case 'đang xử lý':
            case 'processing':
                return 'info';
            case 'hoàn thành':
            case 'completed':
                return 'success';
            case 'đã hủy':
            case 'cancelled':
                return 'danger';
            default:
                return 'secondary';
        }
    };

    // Function to handle showing order details
    const handleShowOrderDetails = async (orderId, motorcycleId) => {
        setShowOrderModal(true);
        setOrderModalLoading(true);
        setCurrentOrder(null);
        setPartOrderDetails([]);
        setServiceOrderDetails([]);
        setDiagnosis(null);
        
        try {
            // Find the order in existing data or fetch it
            let order = null;
            
            if (motorcycleOrders[motorcycleId]) {
                order = motorcycleOrders[motorcycleId].find(o => o.order_id === orderId);
            }
            
            if (!order) {
                // If not found in state, fetch it directly
                const orderResponse = await repairService.order.getAllOrdersByMotorcycleId(motorcycleId);
                if (orderResponse.data && Array.isArray(orderResponse.data)) {
                    order = orderResponse.data.find(o => o.order_id === orderId);
                }
            }
            
            if (!order) {
                throw new Error("Không tìm thấy thông tin đơn hàng");
            }
            
            setCurrentOrder(order);
            
            // Find motorcycle in existing data or fetch it
            let moto = motorcycles.find(m => m.motocycle_id === motorcycleId);
            if (!moto) {
                const motoResponse = await customerService.motorcycle.getMotorcycleById(motorcycleId);
                moto = motoResponse.data;
            }
            setMotorcycle(moto);
            
            // Fetch diagnosis, parts, and services in parallel
            const [diagnosisRes, partDetailsRes, serviceDetailsRes] = await Promise.all([
                repairService.diagnosis.getDiagnosisByOrderId(orderId),
                repairService.partOrderDetail.getAllPartOrderDetailsByOrderId(orderId),
                repairService.serviceOrderDetail.getAllServiceOrderDetailsByOrderId(orderId)
            ]);
            
            setDiagnosis(diagnosisRes.data);
            
            // Filter selected parts and services
            const selectedParts = (partDetailsRes.data || []).filter(part => part.is_selected);
            const selectedServices = (serviceDetailsRes.data || []).filter(service => service.is_selected);
            
            // Fetch details for all parts and services
            const [allPartsRes, allServicesRes] = await Promise.all([
                resourceService.part.getAllParts(),
                resourceService.service.getAllServices()
            ]);
            
            // Create maps for parts and services
            const partsMap = {};
            (allPartsRes.data || []).forEach(part => {
                partsMap[part.part_id] = part;
            });
            
            const servicesMap = {};
            (allServicesRes.data || []).forEach(service => {
                servicesMap[service.service_id] = service;
            });
            
            // Enrich parts and services with names and other details
            const enrichedParts = selectedParts.map(part => {
                const partDetail = partsMap[part.part_id];
                return {
                    ...part,
                    partDetail,
                    part_name: partDetail?.name || part.part_name || "Phụ tùng không xác định",
                    part_code: partDetail?.code || part.part_code || "Không có mã"
                };
            });
            
            const enrichedServices = selectedServices.map(service => {
                const serviceDetail = servicesMap[service.service_id];
                return {
                    ...service,
                    serviceDetail,
                    service_name: serviceDetail?.name || service.service_name || "Dịch vụ không xác định",
                    service_code: serviceDetail?.code || service.service_code || "Không có mã"
                };
            });
            
            setPartOrderDetails(enrichedParts);
            setServiceOrderDetails(enrichedServices);
            
        } catch (error) {
            console.error("Lỗi khi tải chi tiết đơn hàng:", error);
        } finally {
            setOrderModalLoading(false);
        }
    };

    // Mock data cho lịch sử đặt lịch
    const bookingHistory = [
        {
            id: 1,
            date: '2023-05-15',
            time: '10:00',
            service: 'Bảo dưỡng định kỳ',
            status: 'Hoàn thành'
        },
        {
            id: 2,
            date: '2023-06-20',
            time: '14:30',
            service: 'Thay thế phụ tùng',
            status: 'Hoàn thành'
        },
        {
            id: 3,
            date: '2023-08-10',
            time: '09:00',
            service: 'Sửa chữa động cơ',
            status: 'Đang chờ'
        }
    ];

    return (
        <Container className="py-5">
            <h2 className="text-primary-red mb-4">Tài khoản của tôi</h2>

            <Row>
                <Col lg={3} md={4} className="mb-4">
                    <Card className="shadow-sm">
                        <Card.Body>
                            <div className="text-center mb-3">
                                <div className="profile-avatar mb-3">
                                    {currentUser.photoURL ? (
                                        <img
                                            src={currentUser.photoURL}
                                            alt="Profile"
                                            className="rounded-circle"
                                            style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div
                                            className="bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center"
                                            style={{ width: '100px', height: '100px', margin: '0 auto' }}
                                        >
                                            <i className="bi bi-person-fill fs-1"></i>
                                        </div>
                                    )}
                                </div>
                                <h5>{currentUser.displayName || 'Người dùng'}</h5>
                                <p className="text-muted mb-0">{currentUser.email}</p>
                                {userRole && <p className="text-muted mb-0">{userRole}</p>}
                            </div>

                            <hr />

                            <Nav variant="pills" className="flex-column" activeKey={activeTab} onSelect={setActiveTab}>
                                <Nav.Item>
                                    <Nav.Link eventKey="profile" className="d-flex align-items-center">
                                        <i className="bi bi-person me-2"></i> Hồ sơ
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="bookings" className="d-flex align-items-center">
                                        <i className="bi bi-calendar-check me-2"></i> Lịch sử đặt lịch
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="orders" className="d-flex align-items-center">
                                        <i className="bi bi-cart-check me-2"></i> Đơn hàng & Hóa đơn
                                    </Nav.Link>
                                </Nav.Item>
                                {/* Add new tab for motorcycles */}
                                <Nav.Item>
                                    <Nav.Link eventKey="motorcycles" className="d-flex align-items-center">
                                        <i className="bi bi-bicycle me-2"></i> Xe máy của tôi
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="password" className="d-flex align-items-center">
                                        <i className="bi bi-key me-2"></i> Đổi mật khẩu
                                    </Nav.Link>
                                </Nav.Item>
                            </Nav>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={9} md={8}>
                    <Card className="shadow-sm">
                        <Card.Body className="p-4">
                            {message.text && (
                                <Alert variant={message.type} onClose={() => setMessage({ type: '', text: '' })} dismissible>
                                    {message.text}
                                </Alert>
                            )}

                            <Tab.Content>
                                <Tab.Pane eventKey="profile" active={activeTab === 'profile'}>
                                    <h4 className="mb-4">Thông tin cá nhân</h4>

                                    <Form onSubmit={handleProfileSubmit}>
                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Họ và tên</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        name="displayName"
                                                        value={profileData.displayName}
                                                        onChange={handleProfileChange}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Email</Form.Label>
                                                    <Form.Control
                                                        type="email"
                                                        name="email"
                                                        value={profileData.email}
                                                        onChange={handleProfileChange}
                                                        disabled
                                                    />
                                                    <Form.Text className="text-muted">
                                                        Email không thể thay đổi
                                                    </Form.Text>
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Số điện thoại</Form.Label>
                                                    <Form.Control
                                                        type="tel"
                                                        name="phone"
                                                        value={profileData.phone}
                                                        onChange={handleProfileChange}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Địa chỉ</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        name="address"
                                                        value={profileData.address}
                                                        onChange={handleProfileChange}
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Ảnh đại diện</Form.Label>
                                            <Form.Control
                                                type="file"
                                                accept="image/*"
                                            />
                                        </Form.Group>

                                        <div className="text-end mt-4">
                                            <Button
                                                type="submit"
                                                className="btn-primary-red"
                                                disabled={loading}
                                            >
                                                {loading ? 'Đang cập nhật...' : 'Cập nhật hồ sơ'}
                                            </Button>
                                        </div>
                                    </Form>
                                </Tab.Pane>

                                <Tab.Pane eventKey="bookings" active={activeTab === 'bookings'}>
                                    <h4 className="mb-4">Lịch sử đặt lịch</h4>

                                    {bookingHistory.length > 0 ? (
                                        <div className="table-responsive">
                                            <table className="table table-hover">
                                                <thead>
                                                    <tr>
                                                        <th>#</th>
                                                        <th>Ngày</th>
                                                        <th>Giờ</th>
                                                        <th>Dịch vụ</th>
                                                        <th>Trạng thái</th>
                                                        <th></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {bookingHistory.map((booking, index) => (
                                                        <tr key={booking.id}>
                                                            <td>{index + 1}</td>
                                                            <td>{booking.date}</td>
                                                            <td>{booking.time}</td>
                                                            <td>{booking.service}</td>
                                                            <td>
                                                                <span className={`badge ${booking.status === 'Hoàn thành' ? 'bg-success' : 'bg-warning'}`}>
                                                                    {booking.status}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <Button variant="outline-secondary" size="sm">
                                                                    Chi tiết
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <Alert variant="info">
                                            Bạn chưa có lịch đặt nào. <Button variant="link" className="p-0">Đặt lịch ngay</Button>
                                        </Alert>
                                    )}
                                </Tab.Pane>

                                <Tab.Pane eventKey="orders" active={activeTab === 'orders'}>
                                    <h4 className="mb-4">Đơn hàng và hóa đơn</h4>
                                    
                                    {/* Orders Section */}
                                    <h5 className="mt-4 mb-3">Đơn hàng của tôi</h5>
                                    
                                    {loadingOrders ? (
                                        <div className="text-center p-4">
                                            <Spinner animation="border" variant="primary" />
                                            <p className="mt-2">Đang tải dữ liệu đơn hàng...</p>
                                        </div>
                                    ) : orderError ? (
                                        <Alert variant="danger">{orderError}</Alert>
                                    ) : orders.length === 0 ? (
                                        <Alert variant="info">
                                            Bạn chưa có đơn hàng nào.
                                        </Alert>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table table-hover">
                                                <thead>
                                                    <tr>
                                                        <th>Mã đơn</th>
                                                        <th>Ngày tạo</th>
                                                        <th>Dịch vụ</th>
                                                        <th>Trạng thái</th>
                                                        <th>Tổng tiền</th>
                                                        <th></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {orders.map((order) => (
                                                        <tr key={order.order_id}>
                                                            <td>#{order.order_id}</td>
                                                            <td>{order.create_at.split('T')?.[0]} {order.create_at.split('T')?.[1]}</td>
                                                            <td>{order.service_summary || 'Nhiều dịch vụ'}</td>
                                                            <td>
                                                                <Badge bg={getStatusBadgeColor(order.status)}>
                                                                    {order.status}
                                                                </Badge>
                                                            </td>
                                                            <td>{order.total_price ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_price) : 'Chưa tính'}</td>
                                                            <td>
                                                                <Button variant="outline-secondary" size="sm">
                                                                    Chi tiết
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                    
                                    {/* Invoices Section */}
                                    <h5 className="mt-5 mb-3">Hóa đơn của tôi</h5>
                                    
                                    {loadingInvoices ? (
                                        <div className="text-center p-4">
                                            <Spinner animation="border" variant="primary" />
                                            <p className="mt-2">Đang tải dữ liệu hóa đơn...</p>
                                        </div>
                                    ) : invoiceError ? (
                                        <Alert variant="danger">{invoiceError}</Alert>
                                    ) : invoices.length === 0 ? (
                                        <Alert variant="info">
                                            Bạn chưa có hóa đơn nào.
                                        </Alert>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table table-hover">
                                                <thead>
                                                    <tr>
                                                        <th>Mã hóa đơn</th>
                                                        <th>Ngày lập</th>
                                                        <th>Mã đơn hàng</th>
                                                        <th>Phương thức thanh toán</th>
                                                        <th>Trạng thái</th>
                                                        <th>Tổng tiền</th>
                                                        <th></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {invoices.map((invoice) => (
                                                        <tr key={invoice.invoice_id}>
                                                            <td>#{invoice.invoice_id}</td>
                                                            <td>{new Date(invoice.create_at).toLocaleDateString('vi-VN')}</td>
                                                            <td>#{invoice.order_id}</td>
                                                            <td>{invoice.payment_method}</td>
                                                            <td>
                                                                <Badge bg={invoice.is_paid ? "success" : "warning"}>
                                                                    {invoice.is_paid ? "Đã thanh toán" : "Chưa thanh toán"}
                                                                </Badge>
                                                            </td>
                                                            <td>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(invoice.total_price)}</td>
                                                            <td>
                                                                <Button variant="outline-secondary" size="sm">
                                                                    In hóa đơn
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </Tab.Pane>

                                <Tab.Pane eventKey="password" active={activeTab === 'password'}>
                                    <h4 className="mb-4">Đổi mật khẩu</h4>

                                    <Form onSubmit={handlePasswordSubmit}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Mật khẩu hiện tại</Form.Label>
                                            <Form.Control
                                                type="password"
                                                name="currentPassword"
                                                value={passwordData.currentPassword}
                                                onChange={handlePasswordChange}
                                                required
                                            />
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Mật khẩu mới</Form.Label>
                                            <Form.Control
                                                type="password"
                                                name="newPassword"
                                                value={passwordData.newPassword}
                                                onChange={handlePasswordChange}
                                                required
                                            />
                                            <Form.Text className="text-muted">
                                                Mật khẩu phải có ít nhất 6 ký tự
                                            </Form.Text>
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Xác nhận mật khẩu mới</Form.Label>
                                            <Form.Control
                                                type="password"
                                                name="confirmPassword"
                                                value={passwordData.confirmPassword}
                                                onChange={handlePasswordChange}
                                                required
                                            />
                                        </Form.Group>

                                        <div className="text-end mt-4">
                                            <Button
                                                type="submit"
                                                className="btn-primary-red"
                                                disabled={loading}
                                            >
                                                {loading ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
                                            </Button>
                                        </div>
                                    </Form>
                                </Tab.Pane>
                                
                                {/* New tab for motorcycles and their order history */}
                                <Tab.Pane eventKey="motorcycles" active={activeTab === 'motorcycles'}>
                                    <h4 className="mb-4">Xe máy của tôi và lịch sử sửa chữa</h4>
                                    
                                    {loadingMotorcycles ? (
                                        <div className="text-center p-4">
                                            <Spinner animation="border" variant="primary" />
                                            <p className="mt-2">Đang tải dữ liệu xe máy...</p>
                                        </div>
                                    ) : motorcycleError ? (
                                        <Alert variant="danger">{motorcycleError}</Alert>
                                    ) : motorcycles.length === 0 ? (
                                        <Alert variant="info">
                                            Bạn chưa có xe máy nào được đăng ký.
                                        </Alert>
                                    ) : (
                                        <>
                                            {motorcycles.map((motorcycle) => (
                                                <Card className="mb-4" key={motorcycle.motocycle_id}>
                                                    <Card.Header>
                                                        <h5 className="mb-0">
                                                            {motorcycle.brand} {motorcycle.model} - Biển số: {motorcycle.license_plate}
                                                        </h5>
                                                    </Card.Header>
                                                    <Card.Body>
                                                        <div className="mb-3">
                                                            <strong>Loại xe:</strong> {motorcycle.moto_type_name || "Không xác định"}
                                                        </div>
                                                        
                                                        <h6 className="mt-4 mb-3">Lịch sử sửa chữa:</h6>
                                                        
                                                        {!motorcycleOrders[motorcycle.motocycle_id] || motorcycleOrders[motorcycle.motocycle_id].length === 0 ? (
                                                            <p className="text-muted">Chưa có lịch sử sửa chữa nào.</p>
                                                        ) : (
                                                            <div className="table-responsive">
                                                                <table className="table table-hover">
                                                                    <thead>
                                                                        <tr>
                                                                            <th>Mã đơn</th>
                                                                            <th>Ngày tạo</th>
                                                                            <th>Trạng thái</th>
                                                                            <th>Tổng tiền</th>
                                                                            <th></th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {motorcycleOrders[motorcycle.motocycle_id].map((order) => (
                                                                            <tr key={order.order_id}>
                                                                                <td>#{order.order_id}</td>
                                                                                <td>{new Date(order.created_at).toLocaleDateString('vi-VN')}</td>
                                                                                <td>
                                                                                    <Badge bg={getStatusBadgeColor(order.status)}>
                                                                                        {order.status}
                                                                                    </Badge>
                                                                                </td>
                                                                                <td>{order.total_price ? formatCurrency(order.total_price) : 'Chưa tính'}</td>
                                                                                <td>
                                                                                    <Button 
                                                                                        variant="outline-secondary" 
                                                                                        size="sm"
                                                                                        onClick={() => handleShowOrderDetails(order.order_id, motorcycle.motocycle_id)}
                                                                                    >
                                                                                        Chi tiết
                                                                                    </Button>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}
                                                    </Card.Body>
                                                </Card>
                                            ))}
                                        </>
                                    )}
                                </Tab.Pane>
                            </Tab.Content>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            
            {/* Order Detail Modal */}
            <Modal
                show={showOrderModal}
                onHide={() => setShowOrderModal(false)}
                size="lg"
                backdrop="static"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Chi tiết đơn sửa chữa #{currentOrder?.order_id}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {orderModalLoading ? (
                        <div className="text-center py-4">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-3 text-muted">Đang tải chi tiết đơn hàng...</p>
                        </div>
                    ) : (
                        <div id="order-detail-content">
                            <div className="mb-4">
                                <h5 className="border-bottom pb-2 mb-3">Thông tin đơn hàng</h5>
                                <Row>
                                    <Col md={6}>
                                        <p className="mb-1"><strong>Mã đơn hàng:</strong> {currentOrder?.order_id}</p>
                                        <p className="mb-1"><strong>Ngày tạo:</strong> {currentOrder ? new Date(currentOrder.created_at || currentOrder.create_at).toLocaleDateString('vi-VN', { 
                                            year: 'numeric', 
                                            month: '2-digit', 
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        }) : ''}</p>
                                    </Col>
                                    <Col md={6}>
                                        <p className="mb-1">
                                            <strong>Trạng thái:</strong>{' '}
                                            <Badge bg={getStatusBadgeColor(currentOrder?.status)}>
                                                {currentOrder?.status}
                                            </Badge>
                                        </p>
                                        <p className="mb-1"><strong>Tổng tiền:</strong> <span className="text-primary fw-bold">
                                            {currentOrder?.total_price ? formatCurrency(currentOrder.total_price) : 'Chưa tính'}
                                        </span></p>
                                    </Col>
                                </Row>
                            </div>

                            <div className="mb-4">
                                <h5 className="border-bottom pb-2 mb-3">Thông tin xe</h5>
                                <p className="mb-1"><strong>Biển số:</strong> {motorcycle?.license_plate || 'N/A'}</p>
                                <p className="mb-1"><strong>Loại xe:</strong> {motorcycle?.brand} {motorcycle?.model}</p>
                                <p className="mb-1"><strong>Loại động cơ:</strong> {motorcycle?.moto_type_name || 'N/A'}</p>
                            </div>

                            <div className="mb-4 diagnosis-section">
                                <h5 className="border-bottom pb-2 mb-3">Chuẩn đoán</h5>
                                <div className="p-3 bg-light rounded mb-3">
                                    <p className="mb-1"><strong>Vấn đề:</strong> {diagnosis?.problem || 'Không có thông tin'}</p>
                                    {diagnosis?.estimated_cost && <p className="mb-0"><strong>Chi phí ước tính:</strong> {formatCurrency(diagnosis.estimated_cost)}</p>}
                                </div>
                            </div>

                            {/* Hiển thị chi tiết phụ tùng */}
                            <div className="mb-4">
                                <h5 className="border-bottom pb-2 mb-3">Phụ tùng và vật tư</h5>
                                <div className="table-responsive">
                                    <Table bordered hover className="mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th width="5%">#</th>
                                                <th width="40%">Tên phụ tùng</th>
                                                <th width="15%" className="text-center">Đơn giá</th>
                                                <th width="10%" className="text-center">Số lượng</th>
                                                <th width="15%" className="text-center">Thành tiền</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {partOrderDetails.length > 0 ? (
                                                partOrderDetails.map((item, index) => (
                                                    <tr key={item.part_order_detail_id || index}>
                                                        <td className="text-center">{index + 1}</td>
                                                        <td>
                                                            <span className="fw-medium">{item.part_name}</span>
                                                        </td>
                                                        <td className="text-center">{formatCurrency(item.price / item.quantity)}</td>
                                                        <td className="text-center">{item.quantity}</td>
                                                        <td className="text-end">{formatCurrency(item.price)}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className="text-center py-3 text-muted">
                                                        Không có phụ tùng nào được sử dụng
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                        {partOrderDetails.length > 0 && (
                                            <tfoot className="table-light">
                                                <tr>
                                                    <td colSpan={4} className="text-end fw-bold">Tổng chi phí phụ tùng:</td>
                                                    <td className="text-end fw-bold">
                                                        {formatCurrency(
                                                            partOrderDetails.reduce((sum, part) => sum + (part.price), 0)
                                                        )}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        )}
                                    </Table>
                                </div>
                            </div>

                            {/* Hiển thị chi tiết dịch vụ */}
                            <div className="mb-4">
                                <h5 className="border-bottom pb-2 mb-3">Dịch vụ</h5>
                                <div className="table-responsive">
                                    <Table bordered hover className="mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th width="5%">#</th>
                                                <th width="55%">Tên dịch vụ</th>
                                                <th width="15%" className="text-center">Đơn giá</th>
                                                <th width="15%" className="text-center">Thành tiền</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {serviceOrderDetails.length > 0 ? (
                                                serviceOrderDetails.map((item, index) => (
                                                    <tr key={item.service_order_detail_id || index}>
                                                        <td className="text-center">{index + 1}</td>
                                                        <td>
                                                            <span className="fw-medium">{item.service_name}</span>
                                                        </td>
                                                        <td className="text-center">{formatCurrency(item.price)}</td>
                                                        <td className="text-end">{formatCurrency(item.price)}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={4} className="text-center py-3 text-muted">
                                                        Không có dịch vụ nào được sử dụng
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                        {serviceOrderDetails.length > 0 && (
                                            <tfoot className="table-light">
                                                <tr>
                                                    <td colSpan={3} className="text-end fw-bold">Tổng chi phí dịch vụ:</td>
                                                    <td className="text-end fw-bold">
                                                        {formatCurrency(
                                                            serviceOrderDetails.reduce((sum, service) => sum + service.price, 0)
                                                        )}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        )}
                                    </Table>
                                </div>
                            </div>

                            {/* Hiển thị tổng chi phí */}
                            <div className="mt-4 border-top pt-3">
                                <Row>
                                    <Col md={7}>
                                        <div>
                                            <p className="mb-1 text-muted">Ghi chú:</p>
                                            <p className="small text-muted mb-0">
                                                {currentOrder?.note || 'Không có ghi chú'}
                                            </p>
                                        </div>
                                    </Col>
                                    <Col md={5}>
                                        <div className="bg-light p-3 rounded">
                                            <div className="d-flex justify-content-between mb-2">
                                                <span>Tổng chi phí phụ tùng:</span>
                                                <span>
                                                    {formatCurrency(
                                                        partOrderDetails.reduce((sum, part) => sum + (part.price * part.quantity), 0)
                                                    )}
                                                </span>
                                            </div>
                                            <div className="d-flex justify-content-between mb-2">
                                                <span>Tổng chi phí dịch vụ:</span>
                                                <span>
                                                    {formatCurrency(
                                                        serviceOrderDetails.reduce((sum, service) => sum + service.price, 0)
                                                    )}
                                                </span>
                                            </div>
                                            <div className="d-flex justify-content-between pt-2 border-top mt-2">
                                                <span className="fw-bold">Tổng cộng:</span>
                                                <span className="fw-bold text-primary fs-5">
                                                    {currentOrder?.total_price 
                                                        ? formatCurrency(currentOrder.total_price) 
                                                        : formatCurrency(
                                                            partOrderDetails.reduce((sum, part) => sum + (part.price * part.quantity), 0) +
                                                            serviceOrderDetails.reduce((sum, service) => sum + service.price, 0)
                                                        )
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowOrderModal(false)}>
                        Đóng
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default Profile;
