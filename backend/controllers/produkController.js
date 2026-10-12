const { getPoolA, isDbConnected, fallbackStore } = require('../config/db');
const { encrypt, decrypt } = require('../config/security');

const produkController = {
    // GET /api/produk (Mendukung filter ?id_kategori=... dan search ?q=...)
    getAll: async (req, res) => {
        try {
            const { id_kategori, q } = req.query;

            if (isDbConnected()) {
                const pool = getPoolA();
                let query = `
                    SELECT 
                        p.id, 
                        p.nama_produk, 
                        p.harga_produk, 
                        p.foto_produk, 
                        p.id_kategori, 
                        k.nama_kategori,
                        p.created_at,
                        p.updated_at
                    FROM \`produk\` p
                    INNER JOIN \`kategori\` k ON p.id_kategori = k.id
                    WHERE 1=1
                `;
                const params = [];

                if (id_kategori) {
                    query += ' AND p.id_kategori = ?';
                    params.push(parseInt(id_kategori, 10));
                }

                if (q) {
                    query += ' AND (p.nama_produk LIKE ? OR k.nama_kategori LIKE ?)';
                    params.push(`%${q}%`, `%${q}%`);
                }

                query += ' ORDER BY p.id DESC';

                const [rows] = await pool.query(query, params);

                return res.status(200).json({
                    success: true,
                    total: rows.length,
                    data: rows
                });
            } else {
                let filtered = [...fallbackStore.produk];

                if (id_kategori) {
                    filtered = filtered.filter(p => p.id_kategori === parseInt(id_kategori, 10));
                }
                if (q) {
                    const searchLower = q.toLowerCase();
                    filtered = filtered.filter(p => 
                        p.nama_produk.toLowerCase().includes(searchLower) ||
                        (p.nama_kategori && p.nama_kategori.toLowerCase().includes(searchLower))
                    );
                }

                return res.status(200).json({
                    success: true,
                    total: filtered.length,
                    data: filtered,
                    mode: 'fallback_memory'
                });
            }
        } catch (error) {
            console.error('Error getAll produk:', error);
            return res.status(500).json({
                success: false,
                message: 'Gagal mengambil data produk',
                error: error.message
            });
        }
    },

    // GET /api/produk/:id
    getById: async (req, res) => {
        try {
            const { id } = req.params;

            if (isDbConnected()) {
                const pool = getPoolA();
                const [rows] = await pool.query(`
                    SELECT 
                        p.id, 
                        p.nama_produk, 
                        p.harga_produk, 
                        p.foto_produk, 
                        p.id_kategori, 
                        k.nama_kategori,
                        p.created_at,
                        p.updated_at
                    FROM \`produk\` p
                    INNER JOIN \`kategori\` k ON p.id_kategori = k.id
                    WHERE p.id = ?
                `, [id]);

                if (rows.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: `Produk dengan ID ${id} tidak ditemukan`
                    });
                }

                return res.status(200).json({
                    success: true,
                    data: rows[0]
                });
            } else {
                const item = fallbackStore.produk.find(p => p.id === parseInt(id, 10));
                if (!item) {
                    return res.status(404).json({
                        success: false,
                        message: `Produk dengan ID ${id} tidak ditemukan`
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
                message: 'Gagal mengambil detail produk',
                error: error.message
            });
        }
    },

    // POST /api/produk
    create: async (req, res) => {
        try {
            let { nama_produk, harga_produk, foto_produk, id_kategori } = req.body;

            // Jika upload file melalui Multer
            if (req.file) {
                foto_produk = `/uploads/${req.file.filename}`;
            }

            // Validasi Input
            if (!nama_produk || typeof nama_produk !== 'string' || nama_produk.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Field `nama_produk` wajib diisi'
                });
            }

            if (harga_produk === undefined || isNaN(Number(harga_produk)) || Number(harga_produk) < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Field `harga_produk` harus berupa angka bernilai non-negatif'
                });
            }

            if (!id_kategori || isNaN(Number(id_kategori))) {
                return res.status(400).json({
                    success: false,
                    message: 'Field `id_kategori` wajib diisi dengan ID kategori yang valid'
                });
            }

            const cleanNama = nama_produk.trim();
            const cleanHarga = parseFloat(harga_produk);
            const cleanIdKategori = parseInt(id_kategori, 10);
            const cleanFoto = foto_produk && typeof foto_produk === 'string' && foto_produk.trim() !== ''
                ? foto_produk.trim()
                : 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&auto=format&fit=crop&q=60';

            if (isDbConnected()) {
                const pool = getPoolA();

                // Validasi integritas referensial Foreign Key (apakah id_kategori ada di tabel kategori)
                const [katCheck] = await pool.query('SELECT id, nama_kategori FROM `kategori` WHERE id = ?', [cleanIdKategori]);
                if (katCheck.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: `Foreign Key Constraint Gagal: id_kategori ${cleanIdKategori} tidak ditemukan di tabel kategori.`
                    });
                }

                const [result] = await pool.query(
                    'INSERT INTO `produk` (nama_produk, harga_produk, foto_produk, id_kategori) VALUES (?, ?, ?, ?)',
                    [cleanNama, cleanHarga, cleanFoto, cleanIdKategori]
                );

                const newProduk = {
                    id: result.insertId,
                    nama_produk: cleanNama,
                    harga_produk: cleanHarga,
                    foto_produk: cleanFoto,
                    id_kategori: cleanIdKategori,
                    nama_kategori: katCheck[0].nama_kategori
                };

                return res.status(201).json({
                    success: true,
                    message: 'Produk berhasil ditambahkan ke database',
                    data: newProduk
                });
            } else {
                // Fallback in-memory
                const kat = fallbackStore.kategori.find(k => k.id === cleanIdKategori);
                if (!kat) {
                    return res.status(400).json({
                        success: false,
                        message: `Foreign Key Constraint Gagal: id_kategori ${cleanIdKategori} tidak ada di tabel kategori.`
                    });
                }

                const nextId = fallbackStore.produk.length > 0
                    ? Math.max(...fallbackStore.produk.map(p => p.id)) + 1
                    : 1;

                const newProduk = {
                    id: nextId,
                    nama_produk: cleanNama,
                    harga_produk: cleanHarga,
                    foto_produk: cleanFoto,
                    id_kategori: cleanIdKategori,
                    nama_kategori: kat.nama_kategori
                };

                fallbackStore.produk.unshift(newProduk);

                return res.status(201).json({
                    success: true,
                    message: 'Produk berhasil ditambahkan (Mode Fallback Memory)',
                    data: newProduk
                });
            }
        } catch (error) {
            console.error('Error create produk:', error);
            return res.status(500).json({
                success: false,
                message: 'Gagal menambahkan produk baru',
                error: error.message
            });
        }
    },

    // GET /api/produk/secure/decrypted
    // Sesuai alur Panah 3 (GET dari DB) dan Panah 4 (Decrypted + JWT ke EndPoint)
    getDecryptedFlow: async (req, res) => {
        try {
            // Ambil data produk (Step 3: GET from DB B)
            let rawData;
            if (isDbConnected()) {
                const pool = getPoolA();
                const [rows] = await pool.query(`
                    SELECT p.id, p.nama_produk, p.harga_produk, p.foto_produk, p.id_kategori, k.nama_kategori
                    FROM \`produk\` p
                    INNER JOIN \`kategori\` k ON p.id_kategori = k.id
                    ORDER BY p.id DESC
                `);
                rawData = rows;
            } else {
                rawData = fallbackStore.produk;
            }

            // Demonstrasikan proses enkripsi internal & dekripsi untuk EndPoint
            const encryptedPackage = encrypt(rawData);
            const decryptedData = decrypt(encryptedPackage);

            return res.status(200).json({
                success: true,
                security_model_step: '4 (Decrypted payload delivered to EndPoint with JWT verification)',
                authenticated_user: req.user,
                encryption_details: {
                    algorithm: encryptedPackage.algorithm,
                    iv: encryptedPackage.iv,
                    cipher_preview: encryptedPackage.encryptedData.substring(0, 48) + '...'
                },
                decrypted_payload: decryptedData
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Gagal memproses alur enkripsi-dekripsi endpoint',
                error: error.message
            });
        }
    }
};

module.exports = produkController;
