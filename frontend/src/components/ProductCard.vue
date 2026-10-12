<template>
  <article class="product-card">
    <div class="card-image-wrapper">
      <span class="category-tag">{{ product.nama_kategori || 'Kategori #' + product.id_kategori }}</span>
      <img 
        :src="product.foto_produk || fallbackImage" 
        :alt="product.nama_produk" 
        class="card-img" 
        loading="lazy"
        @error="onImageError"
      />
    </div>

    <div class="card-body">
      <h2 class="product-title">{{ product.nama_produk }}</h2>
      
      <div class="product-meta">
        <div>
          <span class="currency">IDR </span>
          <span class="price-tag">{{ formatRupiah(product.harga_produk) }}</span>
        </div>
        <span class="id-badge mono">ID: #{{ product.id }}</span>
      </div>
    </div>
  </article>
</template>

<script setup>
const props = defineProps({
  product: {
    type: Object,
    required: true
  }
});

const fallbackImage = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&auto=format&fit=crop&q=60';

function formatRupiah(number) {
  if (number === undefined || number === null) return '0';
  return new Intl.NumberFormat('id-ID').format(number);
}

function onImageError(e) {
  e.target.src = fallbackImage;
}
</script>
