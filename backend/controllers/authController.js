const { generateJwtToken, verifyJwtToken } = require('../config/security');

/**
 * Controller untuk otentikasi JWT
 */
const authController = {
    // Generate JWT Token untuk client / Bruno testing
    getToken: (req, res) => {
        const { username = 'admin_uts', role = 'developer' } = req.body || {};
        
        const payload = {
            username,
            role,
            endpoint: 'Vue3_Frontend_Client',
            issued_at: new Date().toISOString()
        };

        const token = generateJwtToken(payload);

        return res.status(200).json({
            success: true,
            message: 'JWT Token berhasil digenerate untuk akses Endpoint terenkripsi/terproteksi',
            token_type: 'Bearer',
            token,
            expires_in: process.env.JWT_EXPIRES_IN || '24h',
            payload
        });
    },

    // Verifikasi status token saat ini
    verifyStatus: (req, res) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(400).json({
                success: false,
                message: 'Kirimkan header Authorization: Bearer <token>'
            });
        }

        const token = authHeader.split(' ')[1];
        try {
            const decoded = verifyJwtToken(token);
            return res.status(200).json({
                success: true,
                message: 'Token aktif dan valid',
                data: decoded
            });
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Token tidak valid',
                error: error.message
            });
        }
    }
};

module.exports = authController;
