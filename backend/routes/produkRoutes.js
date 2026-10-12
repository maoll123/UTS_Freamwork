const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const produkController = require('../controllers/produkController');
const { authenticateJWT } = require('../middlewares/authMiddleware');

// Konfigurasi Multer untuk upload foto produk
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'produk-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp|gif/;
        const mimeCheck = allowedTypes.test(file.mimetype);
        const extCheck = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        if (mimeCheck && extCheck) {
            return cb(null, true);
        }
        cb(new Error('Hanya file gambar (jpg, png, webp, gif) yang diizinkan!'));
    }
});

// GET /api/produk/secure/decrypted - Endpoint terproteksi JWT mengembalikan data terdekripsi ke EndPoint (Step 4)
router.get('/secure/decrypted', authenticateJWT, produkController.getDecryptedFlow);

// GET /api/produk - Ambil semua produk (dengan filter ?id_kategori & ?q)
router.get('/', produkController.getAll);

// GET /api/produk/:id - Ambil detail produk
router.get('/:id', produkController.getById);

// POST /api/produk - Tambah produk baru (Mendukung Multipart FormData dengan file 'foto' atau JSON biasa)
router.post('/', upload.single('foto'), produkController.create);

module.exports = router;
