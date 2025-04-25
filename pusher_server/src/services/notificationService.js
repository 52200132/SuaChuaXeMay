const { notifyStaff, notifyCustomer, notifyAll } = require('../utils/pusher');

// Các loại thông báo
const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error'
};

// Thông báo cập nhật đơn hàng
const notifyOrderUpdate = async (order, oldStatus, newStatus) => {
  try {
    // Thông báo đến khách hàng
    if (order.customer_id) {
      await notifyCustomer(order.customer_id, {
        title: 'Cập nhật đơn hàng',
        message: `Đơn hàng #${order.order_id} đã chuyển từ trạng thái "${oldStatus}" sang "${newStatus}"`,
        type: NOTIFICATION_TYPES.INFO,
        data: { orderId: order.order_id, oldStatus, newStatus }
      });
    }

    // Thông báo đến nhân viên
    if (order.staff_id) {
      await notifyStaff(order.staff_id, {
        title: 'Cập nhật đơn hàng',
        message: `Đơn hàng #${order.order_id} đã chuyển từ trạng thái "${oldStatus}" sang "${newStatus}"`,
        type: NOTIFICATION_TYPES.INFO,
        data: { orderId: order.order_id, oldStatus, newStatus }
      });
    }

    return true;
  } catch (error) {
    console.error('Lỗi khi gửi thông báo cập nhật đơn hàng:', error);
    return false;
  }
};

// Thông báo phân công nhân viên mới
const notifyStaffAssignment = async (order, staffId, staffName) => {
  try {
    // Thông báo đến nhân viên được phân công
    await notifyStaff(staffId, {
      title: 'Đơn hàng mới',
      message: `Bạn đã được phân công đơn hàng #${order.order_id}`,
      type: NOTIFICATION_TYPES.SUCCESS,
      data: { orderId: order.order_id }
    });

    // Thông báo đến khách hàng về việc phân công nhân viên
    if (order.customer_id) {
      await notifyCustomer(order.customer_id, {
        title: 'Thông tin đơn hàng',
        message: `Đơn hàng #${order.order_id} của bạn đã được phân công cho kỹ thuật viên ${staffName}`,
        type: NOTIFICATION_TYPES.INFO,
        data: { orderId: order.order_id, staffId, staffName }
      });
    }

    return true;
  } catch (error) {
    console.error('Lỗi khi gửi thông báo phân công nhân viên:', error);
    return false;
  }
};

// Thông báo hoàn thành đơn hàng
const notifyOrderCompletion = async (order) => {
  try {
    // Thông báo đến khách hàng
    if (order.customer_id) {
      await notifyCustomer(order.customer_id, {
        title: 'Đơn hàng đã hoàn thành',
        message: `Đơn hàng #${order.order_id} đã được hoàn thành và sẵn sàng để giao`,
        type: NOTIFICATION_TYPES.SUCCESS,
        data: { orderId: order.order_id }
      });
    }

    return true;
  } catch (error) {
    console.error('Lỗi khi gửi thông báo hoàn thành đơn hàng:', error);
    return false;
  }
};

// Thông báo hệ thống
const notifySystemEvent = async (title, message, type = NOTIFICATION_TYPES.INFO) => {
  try {
    await notifyAll({
      title,
      message,
      type,
      timestamp: new Date().toISOString()
    });

    return true;
  } catch (error) {
    console.error('Lỗi khi gửi thông báo hệ thống:', error);
    return false;
  }
};

module.exports = {
  NOTIFICATION_TYPES,
  notifyOrderUpdate,
  notifyStaffAssignment,
  notifyOrderCompletion,
  notifySystemEvent
};
