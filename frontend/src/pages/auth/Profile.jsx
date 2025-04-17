import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert, Card, Tab, Nav } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';

const Profile = () => {
    const { currentUser, updateProfile } = useAuth();

    const [profileData, setProfileData] = useState({
        displayName: currentUser.displayName || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        address: currentUser.address || ''
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [activeTab, setActiveTab] = useState('profile');

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
                            </Tab.Content>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Profile;
