const express = require('express');
const { chat } = require('../controllers/aiController');
// Assuming userAuth is needed, but for now we might just allow it or use a middleware
// If you have a middleware like userMiddleware, you can import and use it.
const router = express.Router();

router.post('/chat', chat);

module.exports = router;
