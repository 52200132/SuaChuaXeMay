import Pusher from 'pusher-js';

// Cấu hình cho kết nối tới self-hosted Pusher server
const pusher = new Pusher('app-key', {
    wsHost: 'localhost',
    wsPort: 4000,
    wssPort: 4000,
    cluster: 'mt1',
    forceTLS: false,
    enabledTransports: ['ws'],
    disableStats: true,
    encrypted: false,
    authTransport: 'ajax',
    auth: {
        headers: {
            'Access-Control-Allow-Origin': '*',
        }
    }
});

// Lưu trữ các callback đã đăng ký để tránh trùng lặp
const registeredCallbacks = {};

// Tạo hàm để đăng ký kênh với cơ chế chống trùng lặp
export const subscribeToChannel = (channelName, eventName, callback) => {
    // Tạo key duy nhất cho cặp kênh+sự kiện
    const callbackKey = `${channelName}:${eventName}`;
    
    // Kiểm tra xem callback đã được đăng ký chưa
    if (registeredCallbacks[callbackKey]) {
        console.log(`Callback cho ${callbackKey} đã được đăng ký trước đó. Bỏ qua.`);
        return pusher.channel(channelName); // Trả về kênh hiện có
    }
    
    // Đăng ký callback mới
    const channel = pusher.subscribe(channelName);
    
    // Tạo wrapper cho callback để theo dõi ID thông báo đã xử lý
    const processedMessageIds = new Set();
    const callbackWrapper = (data) => {
        // Nếu thông báo có ID, kiểm tra và lọc trùng lặp
        const messageId = data.id || JSON.stringify(data);
        if (processedMessageIds.has(messageId)) {
            console.log(`Thông báo đã xử lý trước đó, ID: ${messageId}`);
            return;
        }
        
        // Lưu ID thông báo đã xử lý
        processedMessageIds.add(messageId);
        
        // Giới hạn kích thước Set để tránh rò rỉ bộ nhớ
        if (processedMessageIds.size > 100) {
            const iterator = processedMessageIds.values();
            processedMessageIds.delete(iterator.next().value);
        }
        
        // Gọi callback gốc với dữ liệu
        callback(data);
    };
    
    // Đăng ký sự kiện với wrapper
    channel.bind(eventName, callbackWrapper);
    
    // Lưu lại reference của callback wrapper
    registeredCallbacks[callbackKey] = callbackWrapper;
    
    return channel;
};

// Tạo hàm để hủy đăng ký kênh
export const unsubscribeFromChannel = (channelName) => {
    // Xóa tất cả callbacks đã đăng ký cho kênh này
    Object.keys(registeredCallbacks).forEach(key => {
        if (key.startsWith(`${channelName}:`)) {
            const eventName = key.split(':')[1];
            const channel = pusher.channel(channelName);
            
            if (channel && registeredCallbacks[key]) {
                channel.unbind(eventName, registeredCallbacks[key]);
                delete registeredCallbacks[key];
            }
        }
    });
    
    pusher.unsubscribe(channelName);
};

export default pusher;
