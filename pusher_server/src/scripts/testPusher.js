/**
 * Script kiểm tra kết nối Pusher
 * Chạy script này để xác minh rằng Pusher được cấu hình chính xác
 * 
 * Sử dụng: node testPusher.js
 */

require('dotenv').config();
const { notifyStaff, notifyCustomer, notifyAll } = require('../utils/pusher');

// Thử gửi một thông báo đến kênh broadcast
async function testBroadcast() {
  console.log('Gửi thông báo thử nghiệm đến kênh broadcast...');
  
  try {
    await notifyAll({
      title: 'Kiểm tra hệ thống',
      message: 'Đây là thông báo thử nghiệm từ hệ thống',
      type: 'info',
      timestamp: new Date().toISOString()
    });
    
    console.log('✅ Đã gửi thông báo broadcast thành công!');
  } catch (error) {
    console.error('❌ Lỗi khi gửi thông báo broadcast:', error);
  }
}

// Thử gửi thông báo đến khách hàng
async function testCustomerNotification(customerId = '1') {
  console.log(`Gửi thông báo thử nghiệm đến khách hàng ${customerId}...`);
  
  try {
    await notifyCustomer(customerId, {
      title: 'Kiểm tra thông báo khách hàng',
      message: 'Đây là thông báo thử nghiệm đến khách hàng',
      type: 'success',
      timestamp: new Date().toISOString()
    });
    
    console.log('✅ Đã gửi thông báo đến khách hàng thành công!');
  } catch (error) {
    console.error('❌ Lỗi khi gửi thông báo đến khách hàng:', error);
  }
}

// Thử gửi thông báo đến nhân viên
async function testStaffNotification(staffId = '1') {
  console.log(`Gửi thông báo thử nghiệm đến nhân viên ${staffId}...`);
  
  try {
    await notifyStaff(staffId, {
      title: 'Kiểm tra thông báo nhân viên',
      message: 'Đây là thông báo thử nghiệm đến nhân viên',
      type: 'warning',
      timestamp: new Date().toISOString()
    });
    
    console.log('✅ Đã gửi thông báo đến nhân viên thành công!');
  } catch (error) {
    console.error('❌ Lỗi khi gửi thông báo đến nhân viên:', error);
  }
}

// Chạy tất cả các kiểm tra
async function runAllTests() {
  console.log('=== BẮT ĐẦU KIỂM TRA PUSHER ===');
  
  await testBroadcast();
  await testCustomerNotification();
  await testStaffNotification();
  
  console.log('=== KẾT THÚC KIỂM TRA PUSHER ===');
}

// Chạy các kiểm tra khi script được thực thi trực tiếp
if (require.main === module) {
  runAllTests()
    .then(() => {
      console.log('Kiểm tra hoàn tất!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Lỗi trong quá trình kiểm tra:', error);
      process.exit(1);
    });
}

module.exports = {
  testBroadcast,
  testCustomerNotification,
  testStaffNotification,
  runAllTests
};
