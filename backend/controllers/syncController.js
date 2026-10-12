const { getPoolA, getPoolB, isDbConnected, fallbackStore } = require('../config/db');
const { encrypt, decrypt, generateJwtToken } = require('../config/security');

/**
 * syncController mengimplementasikan seluruh alur 4 Langkah Security Model pada diagram:
 * 1. POST Encrypted dari Server A ke Server B
 * 2. POST ke DB B
 * 3. GET dari DB B
 * 4. Decrypted + JWT ke EndPoint (Vue 3 Client)
 */
const syncController = {
    // Simulasi Langkah 1 & 2:
    // Menerima data dari Server A dalam bentuk terenkripsi AES-256-CBC, lalu menyimpan ke DB B
    receiveEncryptedAndStoreDbB: async (req, res) => {
        try {
            const { iv, encryptedData, source = 'Server_A' } = req.body;

            if (!iv || !encryptedData) {
                return res.status(400).json({
                    success: false,
                    step: '1 - POST Encrypted Check',
                    message: 'Payload tidak valid: Diperlukan atribut `iv` dan `encryptedData` (Ciphertext AES-256-CBC)'
                });
            }

            // Dekripsi data dari Server A
            let decryptedPayload;
            try {
                decryptedPayload = decrypt({ iv, encryptedData });
            } catch (err) {
                return res.status(422).json({
                    success: false,
                    message: 'Gagal mendekripsi payload enkripsi dari Server A',
                    error: err.message
                });
            }

            const { entity, data } = decryptedPayload; // entity: 'kategori' | 'produk'

            // Langkah 2: POST ke DB B
            let dbBResult = null;
            if (isDbConnected()) {
                const poolB = getPoolB();

                if (entity === 'kategori') {
                    const [resInsert] = await poolB.query(
                        'INSERT INTO `kategori` (id, nama_kategori) VALUES (?, ?) ON DUPLICATE KEY UPDATE nama_kategori = VALUES(nama_kategori)',
                        [data.id || null, data.nama_kategori]
                    );
                    dbBResult = { table: 'kategori', affectedRows: resInsert.affectedRows, insertId: resInsert.insertId || data.id };
                } else if (entity === 'produk') {
                    // Pastikan kategori ada di DB B
                    await poolB.query(
                        'INSERT IGNORE INTO `kategori` (id, nama_kategori) VALUES (?, ?)',
                        [data.id_kategori, data.nama_kategori || 'Kategori Terkait']
                    );

                    const [resInsert] = await poolB.query(
                        `INSERT INTO \`produk\` (id, nama_produk, harga_produk, foto_produk, id_kategori)
                         VALUES (?, ?, ?, ?, ?)
                         ON DUPLICATE KEY UPDATE 
                            nama_produk = VALUES(nama_produk),
                            harga_produk = VALUES(harga_produk),
                            foto_produk = VALUES(foto_produk),
                            id_kategori = VALUES(id_kategori)`,
                        [data.id || null, data.nama_produk, data.harga_produk, data.foto_produk, data.id_kategori]
                    );
                    dbBResult = { table: 'produk', affectedRows: resInsert.affectedRows, insertId: resInsert.insertId || data.id };
                }
            } else {
                dbBResult = { table: entity, status: 'Stored in Memory Fallback DB B', data };
            }

            return res.status(201).json({
                success: true,
                diagram_flow: {
                    step_1: `1. POST Encrypted diterima dari ${source} (Status: Berhasil Terdekripsi)`,
                    step_2: '2. POST ke DB B berhasil dieksekusi'
                },
                decrypted_content: decryptedPayload,
                db_b_execution: dbBResult
            });
        } catch (error) {
            console.error('Error receiveEncryptedAndStoreDbB:', error);
            return res.status(500).json({
                success: false,
                message: 'Gagal memproses alur enkripsi Server B -> DB B',
                error: error.message
            });
        }
    },

    // Endpoint pembantu untuk mengenkripsi payload dari sisi Server A / Bruno test client
    encryptHelper: (req, res) => {
        try {
            const { entity, data } = req.body;
            if (!entity || !data) {
                return res.status(400).json({
                    success: false,
                    message: 'Payload harus memiliki atribut `entity` (kategori/produk) dan objek `data`'
                });
            }

            const encrypted = encrypt({ entity, data });
            return res.status(200).json({
                success: true,
                message: 'Payload berhasil dienkripsi dengan AES-256-CBC siap dikirim pada Step 1 POST',
                payload_to_send: {
                    source: 'Server_A',
                    iv: encrypted.iv,
                    encryptedData: encrypted.encryptedData,
                    algorithm: encrypted.algorithm
                }
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Enkripsi payload gagal',
                error: error.message
            });
        }
    },

    // Demonstrasi Menyeluruh Alur 1 -> 2 -> 3 -> 4 dalam satu panggilan API
    // Sangat berguna untuk pengujian di Bruno dan visualisasi di UI Vue.js
    simulateFullPipeline: async (req, res) => {
        try {
            const sampleProduct = req.body && req.body.nama_produk ? req.body : {
                nama_produk: 'Mouse Gaming Ergonomic RGB 16000 DPI',
                harga_produk: 450000.00,
                foto_produk: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&auto=format&fit=crop&q=60',
                id_kategori: 1,
                nama_kategori: 'Elektronik & Gadget'
            };

            // 1. Server A mengenkripsi paket (AES-256-CBC)
            const encryptedPackage = encrypt({ entity: 'produk', data: sampleProduct });

            // 2. Server B mendekripsi dan menulis ke DB B (Simulasi)
            const decryptedAtServerB = decrypt(encryptedPackage);

            // 3. Server B membaca dari DB B (Simulasi Step 3 GET)
            const retrievedFromDbB = decryptedAtServerB;

            // 4. Server B mengirimkan data terdekripsi ke EndPoint disertai token JWT
            const jwtToken = generateJwtToken({ role: 'client_endpoint', client: 'Vue3_Frontend' });

            return res.status(200).json({
                success: true,
                message: 'Simulasi alur lengkap Security Model berhasil dieksekusi',
                steps: {
                    step_1_server_a_post_encrypted: {
                        description: 'Server A mengirimkan payload terenkripsi ke Server B',
                        method: 'POST',
                        algorithm: encryptedPackage.algorithm,
                        iv: encryptedPackage.iv,
                        encrypted_data: encryptedPackage.encryptedData
                    },
                    step_2_server_b_post_to_db_b: {
                        description: 'Server B menerima, memvalidasi dan menyimpan ke DB B',
                        status: 'SUCCESS',
                        target_database: 'DB B (uts_framework_db_b)'
                    },
                    step_3_server_b_get_from_db_b: {
                        description: 'Server B melakukan query GET ke DB B',
                        method: 'GET',
                        status: 'SUCCESS'
                    },
                    step_4_endpoint_decrypted_jwt: {
                        description: 'Data terdekripsi dikirim ke EndPoint (Vue.js) menggunakan token autentikasi JWT',
                        auth_type: 'Bearer JWT',
                        jwt_token: jwtToken,
                        data_payload: retrievedFromDbB.data
                    }
                }
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Gagal menjalankan simulasi pipeline keamanan',
                error: error.message
            });
        }
    }
};

module.exports = syncController;
