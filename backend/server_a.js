const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { getPoolA, isDbConnected, fallbackStore } = require('./config/db');
const { encrypt } = require('./config/security');

dotenv.config();

const app = express();
const PORT = process.env.SERVER_A_PORT || 5001;
const SERVER_B_URL = process.env.SERVER_B_URL || 'http://localhost:5000';

app.use(cors());
app.use(express.json());

// Status Server A
app.get('/api/server-a/status', (req, res) => {
    res.status(200).json({
        service: 'Server A (Producer / Source Server)',
        diagram_role: 'Dark Blue Server (DB A Source Gateway)',
        status: 'ONLINE',
        port: PORT,
        target_server_b: SERVER_B_URL
    });
});

/**
 * Endpoint pemicu Step 1 pada diagram:
 * Server A mengambil data dari DB A -> Mengenkripsi data -> Mengirimkan via HTTP POST ke Server B
 */
app.post('/api/server-a/trigger-encrypted-sync', async (req, res) => {
    try {
        const { entity = 'produk', custom_data } = req.body;
        let dataToEncrypt;

        if (custom_data) {
            dataToEncrypt = custom_data;
        } else {
            // Ambil data terbaru dari DB A
            if (isDbConnected()) {
                const poolA = getPoolA();
                if (entity === 'kategori') {
                    const [rows] = await poolA.query('SELECT * FROM `kategori` ORDER BY id DESC LIMIT 1');
                    dataToEncrypt = rows[0] || { id: 99, nama_kategori: 'Kategori Uji Sinkron' };
                } else {
                    const [rows] = await poolA.query(`
                        SELECT p.*, k.nama_kategori 
                        FROM \`produk\` p 
                        LEFT JOIN \`kategori\` k ON p.id_kategori = k.id 
                        ORDER BY p.id DESC LIMIT 1
                    `);
                    dataToEncrypt = rows[0] || {
                        id: 999,
                        nama_produk: 'Produk Sinkronisasi Server A',
                        harga_produk: 250000.00,
                        foto_produk: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60',
                        id_kategori: 1
                    };
                }
            } else {
                dataToEncrypt = entity === 'kategori' 
                    ? fallbackStore.kategori[0] 
                    : fallbackStore.produk[0];
            }
        }

        // Enkripsi data menggunakan AES-256-CBC
        const encryptedPayload = encrypt({ entity, data: dataToEncrypt });

        // Step 1: POST Encrypted ke Server B
        console.log(`[Server A] 📤 Mengirim Step 1 POST Encrypted ke ${SERVER_B_URL}/api/sync/receive-encrypted...`);

        const response = await fetch(`${SERVER_B_URL}/api/sync/receive-encrypted`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                source: 'Dark_Blue_Server_A',
                iv: encryptedPayload.iv,
                encryptedData: encryptedPayload.encryptedData,
                algorithm: encryptedPayload.algorithm
            })
        });

        const serverBResult = await response.json();

        return res.status(200).json({
            success: true,
            diagram_execution: {
                step_1_source: 'Server A (Dark Blue Server)',
                step_1_action: 'POST Encrypted payload transmitted to Server B',
                encryption_details: {
                    algorithm: encryptedPayload.algorithm,
                    iv: encryptedPayload.iv,
                    ciphertext_preview: encryptedPayload.encryptedData.substring(0, 40) + '...'
                },
                server_b_response: serverBResult
            }
        });
    } catch (error) {
        console.error('[Server A] Error saat sinkronisasi:', error);
        return res.status(500).json({
            success: false,
            message: 'Gagal mengirimkan payload terenkripsi ke Server B',
            error: error.message,
            tip: 'Pastikan Server B (port 5000) sedang berjalan.'
        });
    }
});

app.listen(PORT, () => {
    console.log(`🔷 Server A (Dark Blue Server) berjalan pada http://localhost:${PORT}`);
});

module.exports = app;
