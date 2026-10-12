const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const dbConfigA = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'uts_framework_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 2000
};

const dbConfigB = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME_B || 'uts_framework_db_b',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 2000
};

let poolA = null;
let poolB = null;
let isConnected = false;

// In-Memory Fallback Store (Hanya aktif jika XAMPP MySQL belum dinyalakan agar API tetap dapat didemokan tanpa crash)
const fallbackStore = {
    kategori: [
        { id: 1, nama_kategori: 'Elektronik & Gadget' },
        { id: 2, nama_kategori: 'Fashion Pria & Wanita' },
        { id: 3, nama_kategori: 'Makanan & Minuman' },
        { id: 4, nama_kategori: 'Peralatan Rumah Tangga' },
        { id: 5, nama_kategori: 'Buku & Alat Tulis' }
    ],
    produk: [
        { id: 1, nama_produk: 'Laptop Ultra Slim Pro 14 Inch', harga_produk: 12500000.00, foto_produk: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&auto=format&fit=crop&q=60', id_kategori: 1, nama_kategori: 'Elektronik & Gadget' },
        { id: 2, nama_produk: 'Wireless Noise-Cancelling Headphones', harga_produk: 1850000.00, foto_produk: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60', id_kategori: 1, nama_kategori: 'Elektronik & Gadget' },
        { id: 3, nama_produk: 'Mechanical Keyboard RGB Tenkeyless', harga_produk: 799000.00, foto_produk: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60', id_kategori: 1, nama_kategori: 'Elektronik & Gadget' },
        { id: 4, nama_produk: 'Jaket Parka Outdoor Anti Air', harga_produk: 389000.00, foto_produk: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&auto=format&fit=crop&q=60', id_kategori: 2, nama_kategori: 'Fashion Pria & Wanita' },
        { id: 5, nama_produk: 'Sepatu Sneakers Casual Hitam Putih', harga_produk: 499000.00, foto_produk: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&auto=format&fit=crop&q=60', id_kategori: 2, nama_kategori: 'Fashion Pria & Wanita' },
        { id: 6, nama_produk: 'Kopi Arabika Gayo Single Origin 250g', harga_produk: 85000.00, foto_produk: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&auto=format&fit=crop&q=60', id_kategori: 3, nama_kategori: 'Makanan & Minuman' }
    ]
};

async function initDatabases() {
    try {
        // Koneksi awal tanpa spesifikasi database untuk memastikan DB ada
        const rootConnection = await mysql.createConnection({
            host: dbConfigA.host,
            port: dbConfigA.port,
            user: dbConfigA.user,
            password: dbConfigA.password,
            connectTimeout: 2000
        });

        // Buat DB A & DB B jika belum ada
        await rootConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfigA.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        await rootConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfigB.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        await rootConnection.end();

        // Buat connection pools
        poolA = mysql.createPool(dbConfigA);
        poolB = mysql.createPool(dbConfigB);

        // Inisialisasi tabel di DB A jika belum ada
        await poolA.query(`
            CREATE TABLE IF NOT EXISTS \`kategori\` (
                \`id\` INT AUTO_INCREMENT PRIMARY KEY,
                \`nama_kategori\` VARCHAR(100) NOT NULL UNIQUE,
                \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB;
        `);

        await poolA.query(`
            CREATE TABLE IF NOT EXISTS \`produk\` (
                \`id\` INT AUTO_INCREMENT PRIMARY KEY,
                \`nama_produk\` VARCHAR(150) NOT NULL,
                \`harga_produk\` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
                \`foto_produk\` VARCHAR(255) NULL,
                \`id_kategori\` INT NOT NULL,
                \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                CONSTRAINT \`fk_produk_kategori\` 
                    FOREIGN KEY (\`id_kategori\`) 
                    REFERENCES \`kategori\` (\`id\`) 
                    ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB;
        `);

        // Inisialisasi tabel di DB B jika belum ada
        await poolB.query(`
            CREATE TABLE IF NOT EXISTS \`kategori\` (
                \`id\` INT AUTO_INCREMENT PRIMARY KEY,
                \`nama_kategori\` VARCHAR(100) NOT NULL UNIQUE,
                \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB;
        `);

        await poolB.query(`
            CREATE TABLE IF NOT EXISTS \`produk\` (
                \`id\` INT AUTO_INCREMENT PRIMARY KEY,
                \`nama_produk\` VARCHAR(150) NOT NULL,
                \`harga_produk\` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
                \`foto_produk\` VARCHAR(255) NULL,
                \`id_kategori\` INT NOT NULL,
                \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                CONSTRAINT \`fk_produk_kategori_b\` 
                    FOREIGN KEY (\`id_kategori\`) 
                    REFERENCES \`kategori\` (\`id\`) 
                    ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB;
        `);

        // Cek data awal di DB A
        const [rowsKat] = await poolA.query('SELECT COUNT(*) as total FROM `kategori`');
        if (rowsKat[0].total === 0) {
            console.log('🌱 Seeding initial categories into DB A...');
            await poolA.query(`
                INSERT INTO \`kategori\` (\`id\`, \`nama_kategori\`) VALUES
                (1, 'Elektronik & Gadget'),
                (2, 'Fashion Pria & Wanita'),
                (3, 'Makanan & Minuman'),
                (4, 'Peralatan Rumah Tangga'),
                (5, 'Buku & Alat Tulis');
            `);
            await poolA.query(`
                INSERT INTO \`produk\` (\`nama_produk\`, \`harga_produk\`, \`foto_produk\`, \`id_kategori\`) VALUES
                ('Laptop Ultra Slim Pro 14 Inch', 12500000.00, 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&auto=format&fit=crop&q=60', 1),
                ('Wireless Noise-Cancelling Headphones', 1850000.00, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60', 1),
                ('Mechanical Keyboard RGB Tenkeyless', 799000.00, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60', 1),
                ('Jaket Parka Outdoor Anti Air', 389000.00, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&auto=format&fit=crop&q=60', 2),
                ('Sepatu Sneakers Casual Hitam Putih', 499000.00, 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&auto=format&fit=crop&q=60', 2),
                ('Kopi Arabika Gayo Single Origin 250g', 85000.00, 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&auto=format&fit=crop&q=60', 3);
            `);
        }

        // Cek data awal di DB B
        const [rowsKatB] = await poolB.query('SELECT COUNT(*) as total FROM `kategori`');
        if (rowsKatB[0].total === 0) {
            console.log('🌱 Syncing initial categories & products into DB B...');
            await poolB.query(`INSERT IGNORE INTO \`kategori\` (\`id\`, \`nama_kategori\`) SELECT \`id\`, \`nama_kategori\` FROM \`${dbConfigA.database}\`.\`kategori\``);
            await poolB.query(`INSERT IGNORE INTO \`produk\` (\`nama_produk\`, \`harga_produk\`, \`foto_produk\`, \`id_kategori\`) SELECT \`nama_produk\`, \`harga_produk\`, \`foto_produk\`, \`id_kategori\` FROM \`${dbConfigA.database}\`.\`produk\``);
        }

        isConnected = true;
        console.log('✅ Berhasil terhubung ke MySQL XAMPP (DB A & DB B)');
    } catch (error) {
        isConnected = false;
        console.warn('⚠️ Gagal terhubung ke MySQL XAMPP:', error.message);
        console.warn('💡 Pastikan modul MySQL pada XAMPP Control Panel sudah dinyalakan (Status: Running).');
        console.warn('💡 Mode Fallback Memory aktif sementara untuk pengujian API.');
    }
}

// Jalankan inisialisasi
initDatabases();

module.exports = {
    getPoolA: () => poolA,
    getPoolB: () => poolB,
    isDbConnected: () => isConnected,
    fallbackStore,
    reconnect: initDatabases
};
