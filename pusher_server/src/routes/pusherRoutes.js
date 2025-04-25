const express = require('express');
const { authorizeChannel, handleWebhook } = require('../controllers/pusherController');
const router = express.Router();

// Route để xác thực kênh Pusher
router.post('/auth', authorizeChannel);

// Route để nhận webhook từ Pusher
router.post('/webhook', handleWebhook);

module.exports = router;
