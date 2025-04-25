const { notifyCustomer, notifyStaff } = require('../utils/notificationSender');

// Ví dụ hàm cập nhật trạng thái đơn hàng
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    
    // Xử lý cập nhật order trong database
    // ...
    
    // Gửi thông báo cho khách hàng
    notifyCustomer(
      order.customer_id,
      'Cập nhật đơn hàng',
      `Đơn hàng #${orderId} đã được cập nhật thành trạng thái "${status}"`,
      'info',
      { orderId, status }
    );
    
    // Gửi thông báo cho nhân viên phụ trách
    notifyStaff(
      order.staff_id,
      'Đơn hàng đã cập nhật',
      `Đơn hàng #${orderId} đã được cập nhật thành "${status}"`,
      'info',
      { orderId, status }
    );
    
    res.json({ success: true, message: 'Cập nhật thành công' });
  } catch (error) {
    console.error('Lỗi khi cập nhật đơn hàng:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};