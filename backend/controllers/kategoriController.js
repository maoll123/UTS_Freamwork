const { getPoolA, isDbConnected, fallbackStore } = require('../config/db');

const kategoriController = {
    // GET /api/kategori
    getAll: async (req, res) => {
        try {
            if (isDbConnected()) {
                const pool = getPoolA();
                const [rows] = await pool.query('SELECT id, nama_kategori, created_at, updated_at FROM `kategori` ORDER BY id ASC');
                return res.status(200).json({
                    success: true,
                    total: rows.length,
                    data: rows
                });
            } else {
                return res.status(200).json({
                    success: true,
                    total: fallbackStore.kategori.length,
                    data: fallbackStore.kategori,
                    mode: 'fallback_memory',
                    note: 'Koneksi MySQL belum aktif, menampilkan data memori sementara.'
                });
            }
        } catch (error) {
            console.error('Error getAll kategori:', error);
            return res.status(500).json({
                success: false,
                message: 'Gagal mengambil data kategori',
                error: error.message
            });
        }
    },

    // GET /api/kategori/:id
    getById: async (req, res) => {
        try {
            const { id } = req.params;
            if (isDbConnected()) {
                const pool = getPoolA();
                const [rows] = await pool.query('SELECT id, nama_kategori, created_at, updated_at FROM `kategori` WHERE id = ?', [id]);
                if (rows.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: `Kategori dengan ID ${id} tidak ditemukan`
                    });
                }
                return res.status(200).json({
                    success: true,
                    data: rows[0]
                });
            } else {
                const item = fallbackStore.kategori.find(k => k.id === parseInt(id, 10));
                if (!item) {
                    return res.status(404).json({
                        success: false,
                        message: `Kategori dengan ID ${id} tidak ditemukan`
                    });
                }
                return res.status(200).json({
                    success: true,
                    data: item
                });
            }
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Gagal mengambil detail kategori',
                error: error.message
            });
        }
    },

    // POST /api/kategori
    create: async (req, res) => {
        try {
            const { nama_kategori } = req.body;

            if (!nama_kategori || typeof nama_kategori !== 'string' || nama_kategori.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Field `nama_kategori` wajib diisi dan tidak boleh kosong'
                });
            }

            const cleanName = nama_kategori.trim();

            if (isDbConnected()) {
                const pool = getPoolA();
                // Periksa apakah nama kategori sudah ada
                const [existing] = await pool.query('SELECT id FROM `kategori` WHERE nama_kategori = ?', [cleanName]);
                if (existing.length > 0) {
                    return res.status(409).json({
                        success: false,
                        message: `Kategori "${cleanName}" sudah terdaftar dalam database`
                    });
                }

                const [result] = await pool.query('INSERT INTO `kategori` (nama_kategori) VALUES (?)', [cleanName]);
                
                return res.status(201).json({
                    success: true,
                    message: 'Kategori baru berhasil ditambahkan',
                    data: {
                        id: result.insertId,
                        nama_kategori: cleanName
                    }
                });
            } else {
                const nextId = fallbackStore.kategori.length > 0 
                    ? Math.max(...fallbackStore.kategori.map(k => k.id)) + 1 
                    : 1;
                const newKategori = { id: nextId, nama_kategori: cleanName };
                fallbackStore.kategori.push(newKategori);

                return res.status(201).json({
                    success: true,
                    message: 'Kategori berhasil ditambahkan (Mode Fallback Memory)',
                    data: newKategori
                });
            }
        } catch (error) {
            console.error('Error create kategori:', error);
            return res.status(500).json({
                success: false,
                message: 'Gagal membuat kategori baru',
                error: error.message
            });
        }
    }
};

module.exports = kategoriController;
