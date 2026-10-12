<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Tambah Produk Baru</h3>
        <button class="modal-close" @click="$emit('close')">&times;</button>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="modal-body">
          <!-- Alert Pesan Error jika ada -->
          <div v-if="errorMessage" style="background: rgba(244, 63, 94, 0.15); border: 1px solid var(--accent-rose); color: #fca5a5; padding: 0.75rem 1rem; border-radius: var(--radius-md); font-size: 0.85rem; margin-bottom: 1rem;">
            {{ errorMessage }}
          </div>

          <!-- Nama Produk -->
          <div class="form-group">
            <label class="form-label">Nama Produk *</label>
            <input 
              v-model="form.nama_produk" 
              type="text" 
              class="form-control" 
              placeholder="Contoh: Wireless Mechanical Keyboard" 
              required
            />
          </div>

          <!-- Harga Produk -->
          <div class="form-group">
            <label class="form-label">Harga Produk (IDR) *</label>
            <input 
              v-model.number="form.harga_produk" 
              type="number" 
              class="form-control" 
              placeholder="Contoh: 750000" 
              min="0" 
              required
            />
          </div>

          <!-- Kategori (Foreign Key Relasi) -->
          <div class="form-group">
            <label class="form-label">Kategori (Foreign Key: id_kategori) *</label>
            <select v-model="form.id_kategori" class="form-control" required>
              <option :value="''" disabled>Pilih Kategori</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.nama_kategori }} (ID: {{ cat.id }})
              </option>
            </select>
          </div>

          <!-- URL Foto Produk -->
          <div class="form-group">
            <label class="form-label">URL Foto Produk (Opsional)</label>
            <input 
              v-model="form.foto_produk" 
              type="url" 
              class="form-control" 
              placeholder="https://images.unsplash.com/..." 
            />
          </div>

          <!-- Preview Gambar -->
          <div v-if="form.foto_produk" style="margin-top: 0.75rem; border-radius: var(--radius-md); overflow: hidden; height: 140px; background: #1a2234;">
            <img :src="form.foto_produk" alt="Preview" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-outline" @click="$emit('close')">Batal</button>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            <span v-if="loading">Menyimpan...</span>
            <span v-else>Simpan Produk (POST)</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';

const props = defineProps({
  categories: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['close', 'saved']);

const form = reactive({
  nama_produk: '',
  harga_produk: '',
  id_kategori: props.categories.length > 0 ? props.categories[0].id : '',
  foto_produk: ''
});

const loading = ref(false);
const errorMessage = ref('');

async function handleSubmit() {
  if (!form.nama_produk || !form.harga_produk || !form.id_kategori) {
    errorMessage.value = 'Harap isi semua field wajib!';
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    emit('saved', { ...form });
  } catch (err) {
    errorMessage.value = err.message || 'Gagal menyimpan produk';
  } finally {
    loading.value = false;
  }
}
</script>
