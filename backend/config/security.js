const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

// Kunci enkripsi 32-byte (256-bit) untuk AES-256-CBC
const RAW_KEY = process.env.ENCRYPTION_SECRET_KEY || 'uts_framework_super_secret_key_32_bytes_len!';
// Pastikan panjang tepat 32 bytes menggunakan sha256 hash jika string berbeda panjang
const ENCRYPTION_KEY = crypto.createHash('sha256').update(String(RAW_KEY)).digest();
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // 16 bytes untuk AES

const JWT_SECRET = process.env.JWT_SECRET || 'uts_framework_jwt_secret_token_key_2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Enkripsi data (Plain Text / Objek JSON) menggunakan AES-256-CBC
 * Sesuai panah 1 & 2 pada diagram Security Model (Locked Red Document)
 */
function encrypt(data) {
    try {
        const textToEncrypt = typeof data === 'object' ? JSON.stringify(data) : String(data);
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
        
        let encrypted = cipher.update(textToEncrypt, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        return {
            iv: iv.toString('hex'),
            encryptedData: encrypted,
            algorithm: ALGORITHM,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        throw new Error(`Encryption failed: ${error.message}`);
    }
}

/**
 * Dekripsi data terenkripsi kembali ke bentuk aslinya
 * Sesuai panah 4 pada diagram Security Model (Decrypted Document)
 */
function decrypt(payload) {
    try {
        if (!payload || !payload.iv || !payload.encryptedData) {
            throw new Error('Invalid encrypted payload structure. Requires iv and encryptedData.');
        }

        const iv = Buffer.from(payload.iv, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
        
        let decrypted = decipher.update(payload.encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        try {
            return JSON.parse(decrypted);
        } catch {
            return decrypted;
        }
    } catch (error) {
        throw new Error(`Decryption failed: ${error.message}`);
    }
}

/**
 * Generate JWT Token untuk EndPoint (Vue.js / Client)
 * Sesuai icon kunci JWT pada panah 4 diagram
 */
function generateJwtToken(userPayload = { role: 'client_endpoint', client: 'Vue3_Frontend' }) {
    return jwt.sign(userPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verifikasi JWT Token
 */
function verifyJwtToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        throw new Error(`Invalid or expired token: ${error.message}`);
    }
}

module.exports = {
    encrypt,
    decrypt,
    generateJwtToken,
    verifyJwtToken,
    JWT_SECRET
};
