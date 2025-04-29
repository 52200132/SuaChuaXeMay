import React, { useState } from 'react';
import { Form, Button, Card } from 'react-bootstrap';

const TestNotificationSender = () => {
    const [notification, setNotification] = useState({
        channel: 'broadcast',
        title: 'Thông báo kiểm tra',
        message: 'Đây là thông báo thử nghiệm',
        type: 'info'
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setNotification(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const sendTestNotification = async () => {
        try {
            const socket = new WebSocket('ws://localhost:4000');

            socket.onopen = () => {
                const payload = {
                    event: 'notification',
                    channel: notification.channel,
                    data: {
                        title: notification.title,
                        message: notification.message,
                        type: notification.type,
                        timestamp: new Date().toISOString(),
                        id: Date.now().toString()
                    }
                };

                socket.send(JSON.stringify(payload));
                console.log('Đã gửi thông báo thử nghiệm', payload);

                // Đóng socket sau khi gửi
                setTimeout(() => {
                    socket.close();
                }, 1000);
            };

            socket.onerror = (error) => {
                console.error('Lỗi WebSocket:', error);
                alert('Không thể kết nối đến server WebSocket');
            };
        } catch (error) {
            console.error('Lỗi khi gửi thông báo thử nghiệm:', error);
            alert('Có lỗi khi gửi thông báo');
        }
    };

    return (
        <Card className="my-3">
            <Card.Header>Gửi thông báo thử nghiệm</Card.Header>
            <Card.Body>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Kênh</Form.Label>
                        <Form.Select
                            name="channel"
                            value={notification.channel}
                            onChange={handleChange}
                        >
                            <option value="broadcast">Tất cả (broadcast)</option>
                            <option value="staff-1">Nhân viên ID: 1</option>
                            <option value="customer-1">Khách hàng ID: 1</option>
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Tiêu đề</Form.Label>
                        <Form.Control
                            type="text"
                            name="title"
                            value={notification.title}
                            onChange={handleChange}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Nội dung</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={2}
                            name="message"
                            value={notification.message}
                            onChange={handleChange}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Kiểu thông báo</Form.Label>
                        <Form.Select
                            name="type"
                            value={notification.type}
                            onChange={handleChange}
                        >
                            <option value="info">Thông tin (info)</option>
                            <option value="success">Thành công (success)</option>
                            <option value="warning">Cảnh báo (warning)</option>
                            <option value="error">Lỗi (error)</option>
                        </Form.Select>
                    </Form.Group>

                    <Button variant="primary" onClick={sendTestNotification}>
                        Gửi thông báo
                    </Button>
                </Form>
            </Card.Body>
        </Card>
    );
};

export default TestNotificationSender;
