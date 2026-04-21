const jwt = require('jsonwebtoken');
const pool=require('../config/db');

async function verifierToken(req, res, next) {
    const authHeader = req.headers.authorization;
    console.log('authHeader:', authHeader);
    if (!authHeader) {
        return res.status(401).json({ error: 'Token manquant' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        const result = await pool.query(
        'SELECT role FROM users WHERE id = $1',
        [decoded.userId]);
        req.userRole = result.rows[0].role;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token invalide' });
    }
}

module.exports = verifierToken;
