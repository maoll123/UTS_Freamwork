const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function runMigration() {
    console.log('🔄 Memulai proses migrasi database MySQL (XAMPP)...');
    
    const host = process.env.DB_HOST || '127.0.0.1';
    const port = parseInt(process.env.DB_PORT || '3306', 10);
    const user = process.env.DB_USER || 'root';
    const password = process.env.DB_PASS || '';

    let connection;
    try {
        connection = await mysql.createConnection({
            host,
            port,
            user,
            password,
            multipleStatements: true
        });

        console.log(`🔌 Terhubung ke MySQL server pada ${host}:${port}`);

        const sqlFilePath = path.join(__dirname, '../../database/schema.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

        console.log('📦 Menjalankan script database/schema.sql...');
        await connection.query(sqlContent);

        console.log('✅ Migrasi database BERHASIL!');
        console.log('   - Database: uts_framework_db (DB A) & uts_framework_db_b (DB B)');
        console.log('   - Tabel: kategori & produk');
        console.log('   - Foreign Key Constraint: fk_produk_kategori');
        console.log('   - Seed data awal siap digunakan.');
    } catch (err) {
        console.error('❌ Gagal menjalankan migrasi:', err.message);
        console.error('💡 Pastikan MySQL di XAMPP Control Panel sudah dalam status "Start / Running".');
    } finally {
        if (connection) await connection.end();
        process.exit(0);
    }
}

runMigration();
