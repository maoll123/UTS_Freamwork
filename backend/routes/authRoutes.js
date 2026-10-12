const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/token - Dapatkan JWT token baru
router.post('/token', authController.getToken);

// GET /api/auth/verify - Cek validitas token JWT saat ini
router.get('/verify', authController.verifyStatus);

module.exports = router;
