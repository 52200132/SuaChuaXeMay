const Pusher = require('pusher');

// Cấu hình Pusher với thông tin xác thực và webhook URL mới
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || 'app_id_của_bạn',
  key: process.env.PUSHER_KEY || 'key_của_bạn',
  secret: process.env.PUSHER_SECRET || 'secret_của_bạn',
  cluster: process.env.PUSHER_CLUSTER || 'ap1',
  useTLS: true,
  // Thêm cổng 4000 cho webhook URL nếu bạn đã cấu hình webhooks trong dashboard Pusher
  webhookUrl: process.env.PUSHER_WEBHOOK_URL || 'http://localhost:4000/pusher/webhook'
});

module.exports = pusher;