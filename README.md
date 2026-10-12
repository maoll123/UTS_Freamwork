# UTS Pemrograman Framework - Aplikasi Web & Security Model Client-Server

Aplikasi web lengkap dan terstruktur yang dibangun berdasarkan dokumentasi arsitektur **Security Model (Client-Server Encrypted Communication & JWT Authentication)**.

---

## 🏛️ Arsitektur & Model Keamanan (Berdasarkan Diagram)

Aplikasi ini mengimplementasikan 4 langkah alur keamanan sesuai diagram:

```
[ DB A ] <--- [ Server A ] ===( 1. POST Encrypted )===> [ Server B ] ---> [ DB B ]
                 (Port 5001)                                (Port 5000)      |
                                                                | (3. GET)  v
                                              (4. Decrypted)    | <---------+
                                              (with JWT Key)    v
                                                        [ EndPoint (Vue.js) ]
```

1. **Langkah 1 (POST Encrypted):** Server A (Dark Blue Server) membaca data dari DB A, mengenkripsi payload menggunakan algoritma simetris **AES-256-CBC**, dan mengirimkannya melalui HTTP POST ke Server B.
2. **Langkah 2 (POST ke DB B):** Server B (Light Blue Server) menerima payload terenkripsi, memvalidasi IV dan ciphertext, mendekripsinya, lalu menyimpannya ke **DB B**.
3. **Langkah 3 (GET dari DB B):** Server B membaca data produk dan kategori dari database DB B.
4. **Langkah 4 (Decrypted + JWT ke EndPoint):** Klien Frontend (Vue.js 3) mengakses API dengan header `Authorization: Bearer <JWT_TOKEN>`. Server B memvalidasi token dan mengirimkan data terdekripsi yang bersih dan siap dirender oleh EndPoint.

---

## 📁 Struktur Direktori Proyek

```
UTS Freamwork/
├── database/
│   └── schema.sql              # Skrip SQL untuk phpMyAdmin / MySQL (Tabel kategori & produk)
├── backend/
│   ├── config/
│   │   ├── db.js               # Koneksi MySQL pool (dengan fallback memory mode jika XAMPP mati)
│   │   └── security.js         # Engine Enkripsi AES-256-CBC & Generator JWT Token
│   ├── controllers/
│   │   ├── authController.js   # Handler otentikasi JWT
│   │   ├── kategoriController.js # Handler RESTful API kategori (GET & POST)
│   │   ├── produkController.js   # Handler RESTful API produk (GET & POST)
│   │   └── syncController.js     # Handler Alur Enkripsi Langkah 1 s.d. 4
│   ├── middlewares/
│   │   └── authMiddleware.js   # Validasi Bearer JWT token
│   ├── routes/
│   │   ├── authRoutes.js       # /api/auth/*
│   │   ├── kategoriRoutes.js   # /api/kategori
│   │   ├── produkRoutes.js     # /api/produk
│   │   └── syncRoutes.js       # /api/sync/*
│   ├── scripts/
│   │   └── migrate.js          # Skrip migrasi database otomatis
│   ├── uploads/                # Direktori file upload foto produk
│   ├── .env                    # Variabel environment backend
│   ├── server.js               # Server B (Main API Server - Port 5000)
│   └── server_a.js             # Server A (Source Server - Port 5001)
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   │   └── style.css       # Vanilla CSS Modern Dark Theme & Glassmorphism
│   │   ├── components/
│   │   │   ├── Navbar.vue      # Header dan indikator status backend
│   │   │   ├── ProductCard.vue # Kartu produk dengan formatting Rupiah
│   │   │   ├── ProductModal.vue# Form modal tambah produk (validasi FK)
│   │   │   ├── CategoryFilter.vue # Filter pill dinamis
│   │   │   └── SecurityDrawer.vue # Visualizer & simulator alur enkripsi langsung di browser
│   │   ├── services/
│   │   │   └── api.js          # API client fetcher
│   │   ├── App.vue             # Pure Vue 3 Single File Component
│   │   └── main.js
│   ├── index.html
│   └── vite.config.js
├── bruno/
│   ├── bruno.json              # Koleksi resmi Bruno
│   ├── environments/
│   │   └── Local.bru           # Environment variabel lokal
│   ├── 01_Auth/                # Pengujian JWT Token
│   ├── 02_Kategori/            # Pengujian GET & POST Kategori
│   ├── 03_Produk/              # Pengujian GET & POST Produk (Foreign Key)
│   ├── 04_Security_Model/      # Pengujian alur enkripsi diagram 1 s.d. 4
│   └── uts_security_model_postman_collection.json # Export format JSON
├── package.json
└── README.md
```

---

## 🗄️ 1. Setup Database MySQL (XAMPP / phpMyAdmin)

Terdapat 2 tabel dengan relasi Foreign Key:
- **`kategori`**: `id` (INT PK Auto Increment), `nama_kategori` (VARCHAR 100 UNIQUE).
- **`produk`**: `id` (INT PK Auto Increment), `nama_produk` (VARCHAR 150), `harga_produk` (DECIMAL 12,2), `foto_produk` (VARCHAR 255), `id_kategori` (INT Foreign Key ke `kategori.id` ON DELETE CASCADE).

### Cara A: Melalui phpMyAdmin
1. Buka XAMPP Control Panel dan klik **Start** pada modul **MySQL** & **Apache**.
2. Buka browser ke: `http://localhost/phpmyadmin/`.
3. Klik tab **Import** pada menu atas.
4. Pilih file: `c:\Semester 3\UTS Freamwork\database\schema.sql`.
5. Klik tombol **Import / Go**. Database `uts_framework_db` (DB A) dan `uts_framework_db_b` (DB B) akan dibuat otomatis beserta data awalnya.

### Cara B: Otomatis via Terminal Node.js
Pastikan MySQL di XAMPP sudah aktif, lalu jalankan:
```bash
npm run migrate
```

> **Catatan Senior Engineer:** Backend dilengkapi dengan **Graceful In-Memory Fallback**. Jika Anda menjalankan server saat XAMPP belum aktif, aplikasi tidak akan crash dan otomatis menyediakan dummy data sementara sampai MySQL diaktifkan.

---

## 🚀 2. Menjalankan Aplikasi

Pastikan dependensi sudah terpasang (sudah diinstall).

### Menjalankan Backend (Server B - Main API)
```bash
npm run dev:backend
# Server B akan berjalan pada: http://localhost:5000
```

### Menjalankan Server A (Simulasi Pengirim Enkripsi)
```bash
npm run dev:server-a
# Server A akan berjalan pada: http://localhost:5001
```

### Menjalankan Frontend Vue 3
```bash
npm run dev:frontend
# Akses aplikasi web pada browser: http://localhost:5173
```

---

## 🧪 3. Pengujian API Menggunakan Bruno

Koleksi lengkap Bruno telah disediakan di dalam folder `bruno/`.

### Langkah Membuka di Bruno:
1. Buka aplikasi **Bruno**.
2. Klik menu **Open Collection**.
3. Pilih folder: `c:\Semester 3\UTS Freamwork\bruno`.
4. Pilih environment **Local** di pojok kanan atas Bruno.

### Skenario Pengujian:

#### 1. Modul Otentikasi (`01_Auth`)
- **`01_Generate_JWT`** (`POST /api/auth/token`): Menghasilkan token JWT dengan payload pengguna. Token otomatis tersimpan ke variabel `{{jwtToken}}`.
- **`02_Verify_Token`** (`GET /api/auth/verify`): Memverifikasi status token aktif melalui header `Authorization: Bearer <token>`.

#### 2. Modul Kategori (`02_Kategori`)
- **`01_Get_All_Kategori`** (`GET /api/kategori`): Mengambil daftar semua kategori.
- **`02_Create_Kategori`** (`POST /api/kategori`): Menambahkan kategori baru dengan body JSON:
  ```json
  {
    "nama_kategori": "Kesehatan & Suplemen"
  }
  ```
- **`03_Get_Kategori_By_ID`** (`GET /api/kategori/1`): Mengambil detail satu kategori.

#### 3. Modul Produk (`03_Produk`)
- **`01_Get_All_Produk`** (`GET /api/produk`): Mengambil seluruh produk yang telah di-JOIN dengan nama kategorinya.
- **`02_Create_Produk_Standard`** (`POST /api/produk`): Menambahkan produk baru dengan validasi Foreign Key:
  ```json
  {
    "nama_produk": "Smart Watch Amoled Display Waterproof",
    "harga_produk": 850000,
    "foto_produk": "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=500",
    "id_kategori": 1
  }
  ```
- **`03_Get_Produk_By_ID`** (`GET /api/produk/1`): Mengambil detail produk berdasarkan ID.
- **`04_Filter_Produk_By_Kategori`** (`GET /api/produk?id_kategori=1`): Memfilter produk berdasarkan foreign key kategori.

#### 4. Modul Alur Security Model (`04_Security_Model`)
- **`01_Step1_ServerA_Send_Encrypted_POST`** (`POST http://localhost:5001/api/server-a/trigger-encrypted-sync`): Server A membaca data DB A, mengenkripsi dengan AES-256-CBC, lalu mengirimkan payload ke Server B.
- **`02_Step2_ServerB_Receive_And_Store_DB_B`** (`POST http://localhost:5000/api/sync/receive-encrypted`): Server B mendekripsi ciphertext dan menyimpan ke DB B.
- **`03_Step4_EndPoint_Get_Decrypted_With_JWT`** (`GET http://localhost:5000/api/produk/secure/decrypted`): Menguji akses EndPoint klien dengan otentikasi JWT untuk menerima paket data yang telah didekripsi.
- **`04_Simulate_Full_Security_Pipeline`** (`POST http://localhost:5000/api/sync/simulate-pipeline`): Menjalankan seluruh alur 4 langkah diagram secara berurutan dalam satu request.

---

## 🎨 Fitur Frontend (Vue 3 Single File Component)

- **Pure Vue 3 (No Boilerplate / No AI Slop):** Ditulis secara bersih menggunakan `<script setup>` reaktif.
- **Vanilla CSS Modern:** Tampilan berestetika tinggi (Dark Slate Palette, Neon Tech Accents, Glassmorphism, Micro-animations) tanpa ketergantungan library utilitas berlebih.
- **Interactive Security Inspector:** Menampilkan modal interaktif di browser untuk mensimulasikan dan melihat ciphertext AES, IV, token JWT, dan decrypted payload secara visual.
- **Filter Kategori Dinamis:** Filter produk dengan klik tombol pill kategori secara instan.
- **Tambah Produk Real-time:** Form modal responsif dengan input nama, harga Rupiah, pemilihan kategori foreign key, dan live image preview.
