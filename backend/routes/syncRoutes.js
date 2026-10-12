const express = require('express');
const router = express.Router();
const syncController = require('../controllers/syncController');

// POST /api/sync/receive-encrypted
// Sesuai Panah 1 & 2: Server B menerima payload terenkripsi dari Server A dan menyimpannya ke DB B
router.post('/receive-encrypted', syncController.receiveEncryptedAndStoreDbB);

// POST /api/sync/encrypt-payload
// Utility helper untuk mengenkripsi payload objek menjadi format ciphertext AES-256-CBC
router.post('/encrypt-payload', syncController.encryptHelper);

// POST /api/sync/simulate-pipeline
// Menjalankan simulasi utuh alur Step 1 -> 2 -> 3 -> 4
router.post('/simulate-pipeline', syncController.simulateFullPipeline);

module.exports = router;
