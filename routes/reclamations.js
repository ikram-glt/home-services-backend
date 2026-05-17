const router = require('express').Router();
const pool = require('../config/db');
const verifierToken = require('../middlewares/verifierToken');
const verifierRole = require('../middlewares/role');

// POST créer réclamation
router.post('/', verifierToken, async (req, res) => {
    try {
        const { user_id, booking_id, sujet, description } = req.body;
        if (!description) {
            return res.status(400).json({ erreur: 'description obligatoire' });
        }
        const result = await pool.query(
            'INSERT INTO reclamations (user_id, booking_id, sujet, description) VALUES ($1, $2, $3, $4) RETURNING *',
            [user_id, booking_id, sujet, description]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
});

// GET réclamations du client connecté
router.get('/', verifierToken, async (req, res) => {
    try {
        const userId = req.userId;
        const result = await pool.query(
            'SELECT * FROM reclamations WHERE user_id=$1 ORDER BY created_at DESC',
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
});

// PATCH admin ajoute solution
router.patch('/:id/solution', verifierToken, verifierRole('admin'), async (req, res) => {
    try {
        const id = req.params.id;
        const { solution, statut } = req.body;
        const result = await pool.query(
            'UPDATE reclamations SET solution=$1, statut=$2 WHERE id=$3 RETURNING *',
            [solution, statut || 'resolu', id]
        );

        // Notifier le client
        const reclam = result.rows[0];
        await pool.query(
            'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
            [reclam.user_id, `Votre réclamation a été traitée : ${solution}`]
        );

        res.json(reclam);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
});

module.exports = router;