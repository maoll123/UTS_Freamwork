<template>
  <div id="uts-app">
    <!-- Navbar -->
    <Navbar 
      :is-online="isOnline" 
      :db-connected="dbConnected" 
      @open-security="showSecurityModal = true"
      @open-add-product="showProductModal = true"
    />

    <main class="container">
      <!-- Hero Banner -->
      <section class="hero-banner">
        <div class="hero-box">
          <div class="hero-content">
            <div>
              <h2 class="hero-title">
                Katalog Produk &bull; <span>Security Model</span>
              </h2>
              <p class="hero-desc">
                Implementasi arsitektur komunikasi data terenkripsi (AES-256-CBC) antara Server A dan Server B 
                dengan proteksi otentikasi JWT pada EndPoint klien Vue 3 dan persistensi database relasional MySQL.
              </p>
            </div>

            <!-- Pipeline Diagram Bar -->
            <div class="pipeline-bar">
              <div class="pipeline-step">
                <span class="step-badge">1</span>
                <span>Server A (POST Enkripsi)</span>
              </div>
              <span class="pipeline-arrow">&rarr;</span>
              <div class="pipeline-step">
                <span class="step-badge">2</span>
                <span>Server B & DB B</span>
              </div>
              <span class="pipeline-arrow">&rarr;</span>
              <div class="pipeline-step">
                <span class="step-badge">3</span>
                <span>DB B Query</span>
              </div>
              <span class="pipeline-arrow">&rarr;</span>
              <div class="pipeline-step">
                <span class="step-badge" style="background: var(--accent-emerald);">4</span>
                <span>EndPoint (JWT)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Controls & Filter Section -->
      <section class="controls-bar">
        <!-- Search Input -->
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input 
            v-model="searchQuery" 
            type="text" 
            class="search-input" 
            placeholder="Cari nama produk atau kategori..." 
            @input="debounceSearch"
          />
        </div>

        <!-- Category Pills Filter -->
        <CategoryFilter 
          :categories="categories" 
          :selected-category="selectedCategory"
          :total-all="products.length"
          @select="onSelectCategory"
          @add-category="onAddCategoryPrompt"
        />
      </section>

      <!-- Products Grid Section -->
      <section>
        <!-- Loading State -->
        <div v-if="isLoading" class="state-box">
          <div class="spinner"></div>
          <p style="color: var(--text-muted);">Memuat data produk dari Express API...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="errorMessage" class="state-box" style="border-color: var(--accent-rose);">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">⚠️</div>
          <h3 style="color: var(--accent-rose); margin-bottom: 0.5rem;">Gagal Memuat Produk</h3>
          <p style="color: var(--text-muted); margin-bottom: 1rem;">{{ errorMessage }}</p>
          <button class="btn btn-outline btn-sm" @click="fetchData">Coba Lagi</button>
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredProducts.length === 0" class="state-box">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📦</div>
          <h3 style="margin-bottom: 0.5rem;">Belum Ada Produk Ditemukan</h3>
          <p style="color: var(--text-muted); margin-bottom: 1.25rem;">
            Tidak ada produk yang cocok dengan kriteria filter saat ini.
          </p>
          <button class="btn btn-primary btn-sm" @click="showProductModal = true">
            + Tambah Produk Sekarang
          </button>
        </div>

        <!-- Product Cards -->
        <div v-else class="products-grid">
          <ProductCard 
            v-for="item in filteredProducts" 
            :key="item.id" 
            :product="item" 
          />
        </div>
      </section>
    </main>

    <!-- Modals -->
    <ProductModal 
      v-if="showProductModal" 
      :categories="categories"
      @close="showProductModal = false"
      @saved="handleProductSaved"
    />

    <SecurityDrawer 
      v-if="showSecurityModal"
      @close="showSecurityModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import Navbar from './components/Navbar.vue';
import CategoryFilter from './components/CategoryFilter.vue';
import ProductCard from './components/ProductCard.vue';
import ProductModal from './components/ProductModal.vue';
import SecurityDrawer from './components/SecurityDrawer.vue';
import { api } from './services/api';

// Reactive States
const products = ref([]);
const categories = ref([]);
const selectedCategory = ref(null);
const searchQuery = ref('');
const isLoading = ref(true);
const errorMessage = ref('');
const isOnline = ref(false);
const dbConnected = ref(false);

const showProductModal = ref(false);
const showSecurityModal = ref(false);

let searchTimeout = null;

// Filtered Products (computed)
const filteredProducts = computed(() => {
  return products.value.filter(p => {
    // Filter Kategori
    if (selectedCategory.value !== null && p.id_kategori !== selectedCategory.value) {
      return false;
    }
    // Filter Search
    if (searchQuery.value.trim() !== '') {
      const q = searchQuery.value.toLowerCase();
      const matchName = p.nama_produk.toLowerCase().includes(q);
      const matchCat = (p.nama_kategori || '').toLowerCase().includes(q);
      return matchName || matchCat;
    }
    return true;
  });
});

async function checkStatus() {
  try {
    const status = await api.getSystemStatus();
    isOnline.value = true;
    dbConnected.value = status.database?.connected || false;
  } catch {
    isOnline.value = false;
    dbConnected.value = false;
  }
}

async function fetchData() {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    await checkStatus();
    
    // Ambil data kategori & produk secara paralel
    const [resCat, resProd] = await Promise.all([
      api.getCategories(),
      api.getProducts()
    ]);

    categories.value = resCat.data || [];
    products.value = resProd.data || [];
  } catch (err) {
    console.error('Fetch data error:', err);
    errorMessage.value = err.message || 'Terjadi kesalahan saat memuat data.';
  } finally {
    isLoading.value = false;
  }
}

function onSelectCategory(catId) {
  selectedCategory.value = catId;
}

async function onAddCategoryPrompt() {
  const newCatName = prompt('Masukkan nama kategori baru:');
  if (!newCatName || !newCatName.trim()) return;

  try {
    const res = await api.createCategory(newCatName.trim());
    alert('Kategori berhasil dibuat: ' + res.data.nama_kategori);
    // Refresh kategori
    const resCat = await api.getCategories();
    categories.value = resCat.data || [];
  } catch (err) {
    alert('Gagal menambah kategori: ' + err.message);
  }
}

async function handleProductSaved(newProductData) {
  try {
    await api.createProduct(newProductData);
    showProductModal.value = false;
    // Refresh produk
    const resProd = await api.getProducts();
    products.value = resProd.data || [];
  } catch (err) {
    alert('Gagal menyimpan produk: ' + err.message);
  }
}

function debounceSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    // Filter dilakukan secara reaktif via computed filteredProducts
  }, 200);
}

onMounted(() => {
  fetchData();
});
</script>
