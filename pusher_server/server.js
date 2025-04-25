const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const WebSocket = require('ws');
const http = require('http');

// Khởi tạo Express app
const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors({
    origin: '*', // Cho phép tất cả các nguồn trong môi trường phát triển
    methods: ['GET', 'POST'],
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Tạo HTTP server
const server = http.createServer(app);

// Tạo WebSocket server
const wss = new WebSocket.Server({ server });

// Lưu trữ client kết nối theo kênh
const channels = {};

// Xử lý kết nối WebSocket
wss.on('connection', (ws) => {
    console.log('Client kết nối mới');
    let clientChannels = [];

    // Xử lý tin nhắn từ client
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Nhận tin nhắn:', data);

            // Xử lý đăng ký kênh
            if (data.event === 'pusher:subscribe') {
                const channelName = data.data.channel;
                console.log(`Client đăng ký kênh: ${channelName}`);

                // Thêm client vào kênh
                if (!channels[channelName]) {
                    channels[channelName] = new Set();
                }
                channels[channelName].add(ws);
                clientChannels.push(channelName);

                // Xác nhận đăng ký
                ws.send(JSON.stringify({
                    event: 'pusher:subscription_succeeded',
                    channel: channelName
                }));
            }

            // Xử lý sự kiện từ client
            else if (data.event && data.channel) {
                // Gửi đến tất cả clients đã đăng ký kênh này
                broadcastToChannel(data.channel, data.event, data.data);
            }
        } catch (error) {
            console.error('Lỗi xử lý tin nhắn:', error);
        }
    });

    // Xử lý khi client ngắt kết nối
    ws.on('close', () => {
        console.log('Client ngắt kết nối');

        // Xóa client khỏi tất cả các kênh đã đăng ký
        clientChannels.forEach(channelName => {
            if (channels[channelName]) {
                channels[channelName].delete(ws);

                // Dọn dẹp kênh nếu không còn client nào
                if (channels[channelName].size === 0) {
                    delete channels[channelName];
                }
            }
        });
    });

    // Gửi thông báo chào mừng
    ws.send(JSON.stringify({
        event: 'pusher:connection_established',
        data: JSON.stringify({
            socket_id: Date.now().toString(),
            activity_timeout: 120
        })
    }));
});

// Hàm gửi tin nhắn đến tất cả clients trong một kênh
function broadcastToChannel(channelName, eventName, data) {
    console.log(`Gửi sự kiện "${eventName}" đến kênh "${channelName}":`, data);

    if (!channels[channelName]) {
        console.log(`Không có clients nào trong kênh "${channelName}"`);
        return;
    }

    const message = JSON.stringify({
        event: eventName,
        channel: channelName,
        data: data
    });

    channels[channelName].forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// Route Pusher Auth
app.post('/pusher/auth', (req, res) => {
    const socketId = req.body.socket_id;
    const channel = req.body.channel_name;

    console.log(`Xác thực kênh "${channel}" cho socket ${socketId}`);

    // Xử lý xác thực kênh private và presence
    if (channel.startsWith('private-') || channel.startsWith('presence-')) {
        // Trong môi trường thực tế, bạn sẽ kiểm tra quyền của người dùng ở đây

        // Tạo auth signature giả - trong thực tế cần tính toán đúng
        const auth = {
            auth: `app-key:${Date.now()}`,
            channel_data: JSON.stringify({
                user_id: '123',
                user_info: { name: 'Test User' }
            })
        };

        res.json(auth);
    } else {
        res.sendStatus(200);
    }
});

// Route giả lập gửi thông báo - để kiểm tra
app.post('/pusher/trigger', (req, res) => {
    const { channel, event, data } = req.body;

    if (!channel || !event) {
        return res.status(400).json({ error: 'Thiếu channel hoặc event' });
    }

    try {
        broadcastToChannel(channel, event, data || {});
        res.json({ success: true, message: 'Đã gửi thông báo thành công' });
    } catch (error) {
        console.error('Lỗi khi gửi thông báo:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Route chính
app.get('/', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Pusher server đang chạy',
        websocket: `ws://localhost:${port}`
    });
});

// Khởi động server
server.listen(port, () => {
    console.log(`Pusher server đang chạy tại http://localhost:${port}`);
    console.log(`WebSocket server sẵn sàng tại ws://localhost:${port}`);
});
