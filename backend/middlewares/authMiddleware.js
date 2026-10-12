const { verifyJwtToken } = require('../config/security');

/**
 * Middleware untuk validasi JWT Token pada Endpoint Terproteksi
 * Sesuai Security Model panah 4: Akses Endpoint dengan validasi JWT
 */
function authenticateJWT(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            success: false,
            message: 'Akses ditolak: Token autentikasi JWT tidak ditemukan pada Header Authorization',
            security_note: 'Harap sertakan Bearer <token> sesuai model keamanan diagram'
        });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({
            success: false,
            message: 'Format token tidak valid. Gunakan: Bearer <JWT_TOKEN>'
        });
    }

    const token = parts[1];

    try {
        const decoded = verifyJwtToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: 'Token tidak valid atau telah kedaluwarsa',
            error: error.message
        });
    }
}

/**
 * Middleware opsional: jika token ada maka didecode, jika tidak ada req.user null
 */
function optionalJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            req.user = verifyJwtToken(token);
        } catch {
            req.user = null;
        }
    }
    next();
}

module.exports = {
    authenticateJWT,
    optionalJWT
};
