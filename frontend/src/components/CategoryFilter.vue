<template>
  <div class="categories-pills">
    <button 
      class="category-pill" 
      :class="{ active: selectedCategory === null }"
      @click="$emit('select', null)"
    >
      Semua Kategori ({{ totalAll }})
    </button>

    <button 
      v-for="cat in categories" 
      :key="cat.id" 
      class="category-pill"
      :class="{ active: selectedCategory === cat.id }"
      @click="$emit('select', cat.id)"
    >
      {{ cat.nama_kategori }}
    </button>

    <button class="category-pill" style="border-style: dashed;" @click="$emit('add-category')">
      + Tambah Kategori
    </button>
  </div>
</template>

<script setup>
defineProps({
  categories: {
    type: Array,
    default: () => []
  },
  selectedCategory: {
    type: [Number, null],
    default: null
  },
  totalAll: {
    type: Number,
    default: 0
  }
});

defineEmits(['select', 'add-category']);
</script>
