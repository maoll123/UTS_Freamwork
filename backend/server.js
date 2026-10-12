const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const { isDbConnected } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const kategoriRoutes = require('./routes/kategoriRoutes');
const produkRoutes = require('./routes/produkRoutes');
const syncRoutes = require('./routes/syncRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static directory untuk upload file
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health Check & Security Model Metadata API
app.get('/api/status', (req, res) => {
    res.status(200).json({
        service: 'Server B (Main API & EndPoint Provider)',
        diagram_role: 'Light Blue Server (Central API & DB B Gateway)',
        status: 'ONLINE',
        port: PORT,
        timestamp: new Date().toISOString(),
        database: {
            connected: isDbConnected(),
            target_a: process.env.DB_NAME || 'uts_framework_db',
            target_b: process.env.DB_NAME_B || 'uts_framework_db_b',
            driver: 'MySQL / MariaDB via XAMPP'
        },
        security_specifications: {
            inter_server_encryption: 'AES-256-CBC (Locked Payload)',
            endpoint_authentication: 'JSON Web Token (JWT)',
            diagram_steps: [
                '1. POST Encrypted from Server A to Server B',
                '2. POST Encrypted to DB B',
                '3. GET Encrypted/Record from DB B',
                '4. Decrypted with JWT to EndPoint (Vue 3 Client)'
            ]
        }
    });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/kategori', kategoriRoutes);
app.use('/api/produk', produkRoutes);
app.use('/api/sync', syncRoutes);

// Root Welcome Endpoint
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'UTS Framework RESTful API Server is Running',
        documentation: 'Gunakan Bruno atau Vue.js Frontend untuk berinteraksi dengan API ini',
        endpoints: {
            kategori: '/api/kategori',
            produk: '/api/produk',
            jwt_auth: '/api/auth/token',
            security_pipeline: '/api/sync/simulate-pipeline',
            system_status: '/api/status'
        }
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan`
    });
});

// Centralized Error Handler
app.use((err, req, res, next) => {
    console.error('Server Unhandled Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Terjadi kesalahan internal pada server',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Jalankan Server
const server = app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Server B (Main API) aktif pada: http://localhost:${PORT}`);
    console.log(`🔐 Enkripsi : AES-256-CBC & JWT Auth`);
    console.log(`📡 Endpoints:`);
    console.log(`   - GET/POST Kategori: http://localhost:${PORT}/api/kategori`);
    console.log(`   - GET/POST Produk  : http://localhost:${PORT}/api/produk`);
    console.log(`   - Security Pipeline: http://localhost:${PORT}/api/sync/simulate-pipeline`);
    console.log(`   - Status System    : http://localhost:${PORT}/api/status`);
    console.log(`=======================================================`);
});

module.exports = app;
