const router = require('express').Router();
const pool = require('../config/db');
const verifierToken = require('../middlewares/verifierToken');

router.post('/', verifierToken, async (req, res) => {
    try {
        const {user_id, service_id, note, commentaire} = req.body;
        if (!user_id || !service_id || !note) {
            return res.status(400).json({erreur: 'donnees manquantes'});
        }

        // 1. Insérer l'avis
        const avis = await pool.query(
            `INSERT INTO reviews (user_id, service_id, note, commentaire)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [user_id, service_id, note, commentaire]
        );

        // 2. Trouver le prestataire via booking
        const bookingResult = await pool.query(`
            SELECT b.prestataire_id, p.id as presta_id
            FROM bookings b
            JOIN prestataires p ON p.user_id = b.prestataire_id
            WHERE b.service_id = $1 AND b.user_id = $2
            AND b.status = 'termine'
            ORDER BY b.created_at DESC
            LIMIT 1
        `, [service_id, user_id]);

        if (bookingResult.rows.length > 0) {
            const prestaId = bookingResult.rows[0].presta_id;

            // 3. Recalculer la note moyenne
            await pool.query(`
                UPDATE prestataires 
                SET note_moyenne = (
                    SELECT AVG(r.note)
                    FROM reviews r
                    JOIN bookings b ON b.service_id = r.service_id
                    WHERE b.prestataire_id = $1
                )
                WHERE id = $2
            `, [bookingResult.rows[0].prestataire_id, prestaId]);
        }

        res.status(201).json(avis.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({erreur: 'Erreur serveur'});
    }
});

router.get('/prestataire/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const reviews = await pool.query(`
            SELECT r.*, u.nom as clients_nom
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.service_id = $1
            ORDER BY r.created_at DESC
        `, [id]);
        res.json(reviews.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({erreur: 'Erreur serveur'});
    }
});

router.get('/', async (req, res) => {
    try {
        const reviews = await pool.query(`
            SELECT r.*, u.nom as client_nom
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            ORDER BY r.created_at DESC
        `);
        res.json(reviews.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({erreur: 'Erreur serveur'});
    }
});

module.exports = router;