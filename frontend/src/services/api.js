/**
 * API Service untuk Frontend Vue 3
 * Menghubungkan client ke backend Express.js (Port 5000)
 */

const BASE_URL = '/api';

export const api = {
  // Ambil semua kategori
  async getCategories() {
    const res = await fetch(`${BASE_URL}/kategori`);
    if (!res.ok) throw new Error('Gagal mengambil data kategori');
    return await res.json();
  },

  // Tambah kategori baru
  async createCategory(nama_kategori) {
    const res = await fetch(`${BASE_URL}/kategori`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama_kategori })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Gagal menambahkan kategori');
    return data;
  },

  // Ambil daftar produk (dengan filter kategori & search keyword)
  async getProducts(params = {}) {
    const query = new URLSearchParams();
    if (params.id_kategori) query.append('id_kategori', params.id_kategori);
    if (params.q) query.append('q', params.q);

    const url = `${BASE_URL}/produk${query.toString() ? '?' + query.toString() : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Gagal mengambil data produk');
    return await res.json();
  },

  // Tambah produk baru
  async createProduct(productData) {
    const res = await fetch(`${BASE_URL}/produk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Gagal menambahkan produk');
    return data;
  },

  // Generate atau ambil JWT Token untuk EndPoint Client
  async getJwtToken(username = 'admin_uts', role = 'client_endpoint') {
    const res = await fetch(`${BASE_URL}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, role })
    });
    if (!res.ok) throw new Error('Gagal men-generate token JWT');
    return await res.json();
  },

  // Step 4: EndPoint mengambil data terdekripsi dari Server B menggunakan token JWT
  async getDecryptedProducts(jwtToken) {
    const res = await fetch(`${BASE_URL}/produk/secure/decrypted`, {
      headers: {
        'Authorization': `Bearer ${jwtToken}`
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Gagal mengambil data terdekripsi');
    return data;
  },

  // Menjalankan simulasi penuh 4 langkah alur Security Model
  async runSecurityPipelineSimulation(payload) {
    const res = await fetch(`${BASE_URL}/sync/simulate-pipeline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {})
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Gagal menjalankan simulasi pipeline');
    return data;
  },

  // Cek status server & database
  async getSystemStatus() {
    const res = await fetch(`${BASE_URL}/status`);
    if (!res.ok) throw new Error('Backend offline');
    return await res.json();
  }
};
