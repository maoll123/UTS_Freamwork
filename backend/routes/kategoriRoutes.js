const express = require('express');
const router = express.Router();
const kategoriController = require('../controllers/kategoriController');

// GET /api/kategori - Ambil seluruh data kategori
router.get('/', kategoriController.getAll);

// GET /api/kategori/:id - Ambil detail kategori berdasarkan ID
router.get('/:id', kategoriController.getById);

// POST /api/kategori - Tambah kategori baru
router.post('/', kategoriController.create);

module.exports = router;
