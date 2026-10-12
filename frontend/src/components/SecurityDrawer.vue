<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal-content" style="max-width: 760px;">
      <div class="modal-header">
        <div>
          <h3 class="modal-title">🔐 Security Model Architecture Inspector</h3>
          <p style="font-size: 0.8rem; color: var(--text-muted);">
            Implementasi Alur Enkripsi Client-Server (Server A &bull; Server B &bull; EndPoint JWT)
          </p>
        </div>
        <button class="modal-close" @click="$emit('close')">&times;</button>
      </div>

      <div class="modal-body">
        <!-- Visual Diagram Architecture Flow -->
        <div style="background: rgba(0, 0, 0, 0.4); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.5rem;">
          <h4 style="font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-dim); margin-bottom: 1rem;">
            Alur Diagram Komunikasi Terenkripsi
          </h4>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.75rem;">
            <!-- Node 1: Server A & DB A -->
            <div style="background: #1e1b4b; border: 1px solid #4338ca; border-radius: var(--radius-sm); padding: 0.85rem;">
              <span style="font-size: 0.7rem; color: #a5b4fc; font-weight: 700;">1. SERVER A (DB A)</span>
              <p style="font-size: 0.775rem; margin-top: 0.35rem; color: #e0e7ff;">Membaca data DB A & mengenkripsi payload (AES-256-CBC)</p>
            </div>

            <!-- Node 2: Server B (Receiver) -->
            <div style="background: #0f2c44; border: 1px solid #0284c7; border-radius: var(--radius-sm); padding: 0.85rem;">
              <span style="font-size: 0.7rem; color: #7dd3fc; font-weight: 700;">2. SERVER B (API)</span>
              <p style="font-size: 0.775rem; margin-top: 0.35rem; color: #e0f2fe;">Menerima POST terenkripsi & simpan ke DB B</p>
            </div>

            <!-- Node 3: DB B -->
            <div style="background: #064e3b; border: 1px solid #059669; border-radius: var(--radius-sm); padding: 0.85rem;">
              <span style="font-size: 0.7rem; color: #6ee7b7; font-weight: 700;">3. DB B (Storage)</span>
              <p style="font-size: 0.775rem; margin-top: 0.35rem; color: #d1fae5;">Tabel kategori & produk menyimpan rekaman data</p>
            </div>

            <!-- Node 4: EndPoint (JWT) -->
            <div style="background: #312e81; border: 1px solid #6366f1; border-radius: var(--radius-sm); padding: 0.85rem;">
              <span style="font-size: 0.7rem; color: #c7d2fe; font-weight: 700;">4. ENDPOINT (Vue 3)</span>
              <p style="font-size: 0.775rem; margin-top: 0.35rem; color: #e0e7ff;">Menerima data terdekripsi dengan validasi Bearer JWT</p>
            </div>
          </div>
        </div>

        <!-- Tombol Aksi Simulasi -->
        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1.5rem;">
          <button class="btn btn-primary" :disabled="loading" @click="runSimulation">
            <span v-if="loading">Menjalankan Pipeline...</span>
            <span v-else>🚀 Jalankan Simulasi Enkripsi (Step 1 - 4)</span>
          </button>

          <button class="btn btn-outline" :disabled="loading" @click="fetchJwt">
            <span>🔑 Generate Token JWT Baru</span>
          </button>
        </div>

        <!-- JWT Token Display -->
        <div v-if="jwtToken" style="margin-bottom: 1.25rem;">
          <label class="form-label">Active JWT Bearer Token:</label>
          <div style="background: var(--bg-input); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 0.6rem 0.85rem; font-size: 0.75rem; color: #38bdf8; word-break: break-all;" class="mono">
            {{ jwtToken }}
          </div>
        </div>

        <!-- Pipeline Result Display -->
        <div v-if="simulationResult" style="background: #0d1322; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.25rem;">
          <h4 style="font-size: 0.85rem; color: #34d399; margin-bottom: 0.75rem; font-weight: 700;">
            ✓ Hasil Eksekusi Pipeline Enkripsi:
          </h4>

          <div style="display: flex; flex-direction: column; gap: 0.85rem; font-size: 0.8rem;">
            <!-- Step 1 -->
            <div style="border-left: 3px solid var(--primary); padding-left: 0.75rem;">
              <strong style="color: #818cf8;">Step 1 - Server A POST Encrypted:</strong>
              <div class="mono" style="color: var(--text-muted); margin-top: 0.2rem; font-size: 0.75rem;">
                Algorithm: {{ simulationResult.steps.step_1_server_a_post_encrypted.algorithm }} | IV: {{ simulationResult.steps.step_1_server_a_post_encrypted.iv }}
              </div>
              <div class="mono" style="color: #f43f5e; margin-top: 0.2rem; word-break: break-all; font-size: 0.72rem;">
                Cipher: {{ simulationResult.steps.step_1_server_a_post_encrypted.encrypted_data.substring(0, 60) }}...
              </div>
            </div>

            <!-- Step 2 & 3 -->
            <div style="border-left: 3px solid var(--accent-cyan); padding-left: 0.75rem;">
              <strong style="color: #38bdf8;">Step 2 & 3 - Server B & DB B Storage:</strong>
              <div style="color: var(--text-muted); margin-top: 0.2rem;">
                Status: {{ simulationResult.steps.step_2_server_b_post_to_db_b.status }} | Database: {{ simulationResult.steps.step_2_server_b_post_to_db_b.target_database }}
              </div>
            </div>

            <!-- Step 4 -->
            <div style="border-left: 3px solid var(--accent-emerald); padding-left: 0.75rem;">
              <strong style="color: #34d399;">Step 4 - EndPoint Decrypted with JWT:</strong>
              <div style="color: var(--text-muted); margin-top: 0.2rem;">
                Auth Type: {{ simulationResult.steps.step_4_endpoint_decrypted_jwt.auth_type }}
              </div>
              <pre style="background: rgba(0,0,0,0.5); padding: 0.5rem; border-radius: var(--radius-sm); margin-top: 0.35rem; color: #a7f3d0; font-size: 0.75rem; overflow-x: auto;" class="mono">{{ JSON.stringify(simulationResult.steps.step_4_endpoint_decrypted_jwt.data_payload, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-outline" @click="$emit('close')">Tutup</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { api } from '../services/api';

const emit = defineEmits(['close']);

const loading = ref(false);
const jwtToken = ref(localStorage.getItem('uts_jwt_token') || '');
const simulationResult = ref(null);

async function fetchJwt() {
  loading.value = true;
  try {
    const res = await api.getJwtToken();
    jwtToken.value = res.token;
    localStorage.setItem('uts_jwt_token', res.token);
  } catch (err) {
    alert('Gagal mengambil JWT: ' + err.message);
  } finally {
    loading.value = false;
  }
}

async function runSimulation() {
  loading.value = true;
  try {
    const res = await api.runSecurityPipelineSimulation();
    simulationResult.value = res;
    if (res.steps?.step_4_endpoint_decrypted_jwt?.jwt_token) {
      jwtToken.value = res.steps.step_4_endpoint_decrypted_jwt.jwt_token;
      localStorage.setItem('uts_jwt_token', jwtToken.value);
    }
  } catch (err) {
    alert('Gagal menjalankan simulasi: ' + err.message);
  } finally {
    loading.value = false;
  }
}
</script>
