<template>
  <header class="navbar">
    <div class="container nav-container">
      <div class="nav-brand">
        <div class="brand-icon">🛡️</div>
        <div>
          <h1 class="brand-title">UTS Framework &bull; Security Model</h1>
          <p class="brand-subtitle">Express.js &bull; MySQL XAMPP &bull; Vue 3</p>
        </div>
      </div>

      <div class="nav-actions">
        <!-- Status MySQL & Server B -->
        <div class="status-pill">
          <span class="status-dot" :class="isOnline ? 'online' : 'offline'"></span>
          <span>{{ isOnline ? 'Backend Online' : 'Backend Offline' }}</span>
        </div>

        <!-- Tombol Buka Security Model Inspector -->
        <button class="btn btn-outline btn-sm" @click="$emit('open-security')">
          <span>🔐</span>
          <span>Security Inspector</span>
        </button>

        <!-- Tombol Tambah Produk -->
        <button class="btn btn-primary btn-sm" @click="$emit('open-add-product')">
          <span>+</span>
          <span>Tambah Produk</span>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
defineProps({
  isOnline: {
    type: Boolean,
    default: false
  },
  dbConnected: {
    type: Boolean,
    default: false
  }
});

defineEmits(['open-security', 'open-add-product']);
</script>
