const { pusher } = require('../utils/pusher');

// Controller để xác thực kênh Pusher
const authorizeChannel = (req, res) => {
  const { socket_id, channel_name, user_id } = req.body;
  
  try {
    // Xác thực kênh riêng tư
    if (channel_name.startsWith('private-')) {
      const auth = pusher.authorizeChannel(socket_id, channel_name);
      return res.send(auth);
    }
    
    // Xác thực kênh hiện diện (presence)
    if (channel_name.startsWith('presence-')) {
      // Lấy thông tin người dùng để kênh hiện diện
      // Ví dụ: truy vấn CSDL để lấy thông tin người dùng với user_id
      const userData = {
        user_id: user_id, // ID người dùng từ request
        user_info: {
          name: req.user?.fullname || 'Người dùng', // Nếu có thông tin người dùng trong request
        }
      };
      
      const auth = pusher.authorizeChannel(socket_id, channel_name, userData);
      return res.send(auth);
    }
    
    // Trường hợp kênh không yêu cầu xác thực
    return res.sendStatus(200);
    
  } catch (error) {
    console.error('Lỗi xác thực kênh Pusher:', error);
    return res.status(403).json({ error: 'Không thể xác thực kênh' });
  }
};

// Xử lý webhook từ Pusher (thông báo sự kiện từ Pusher)
const handleWebhook = (req, res) => {
  try {
    const webhookData = req.body;
    
    // Xử lý dữ liệu webhook dựa trên sự kiện
    console.log('Nhận webhook từ Pusher:', webhookData);
    
    // Thực hiện các thao tác cần thiết với dữ liệu webhook
    
    return res.sendStatus(200);
  } catch (error) {
    console.error('Lỗi xử lý webhook Pusher:', error);
    return res.status(500).json({ error: 'Lỗi xử lý webhook' });
  }
};

module.exports = {
  authorizeChannel,
  handleWebhook
};
