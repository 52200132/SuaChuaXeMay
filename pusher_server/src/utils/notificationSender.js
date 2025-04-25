const WebSocket = require('ws');

// Kết nối tới WebSocket server
const socket = new WebSocket('ws://localhost:4000');

// Biến đếm ID thông báo
let notificationId = 1;

// Hàm gửi thông báo chung
const sendNotification = (channel, data) => {
  try {
    if (socket.readyState === WebSocket.OPEN) {
      const notification = {
        id: notificationId++,
        channel,
        event: 'notification',
        data: {
          ...data,
          timestamp: new Date().toISOString(),
          read: false
        }
      };
      
      socket.send(JSON.stringify(notification));
      return true;
    } else {
      console.error('WebSocket không được kết nối');
      return false;
    }
  } catch (error) {
    console.error('Lỗi khi gửi thông báo:', error);
    return false;
  }
};

// Gửi thông báo tới khách hàng cụ thể
const notifyCustomer = (customerId, title, message, type = 'info', extraData = {}) => {
  return sendNotification(`customer-${customerId}`, {
    title,
    message,
    type, // 'info', 'success', 'warning', 'error'
    ...extraData
  });
};

// Gửi thông báo tới nhân viên cụ thể
const notifyStaff = (staffId, title, message, type = 'info', extraData = {}) => {
  return sendNotification(`staff-${staffId}`, {
    title,
    message,
    type,
    ...extraData
  });
};

// Gửi thông báo tới tất cả người dùng
const notifyAll = (title, message, type = 'info', extraData = {}) => {
  return sendNotification('broadcast', {
    title,
    message,
    type,
    ...extraData
  });
};

module.exports = {
  notifyCustomer,
  notifyStaff,
  notifyAll
};
