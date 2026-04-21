const router = require('express').Router();
const pool = require('../config/db');
const verifierToken = require('../middlewares/verifierToken');

// GET — adresses du client connecté
router.get('/', verifierToken, async (req, res) => {
    try {
        const userId = req.userId;
        const result = await pool.query(
            'SELECT * FROM adresses WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
});

// POST — ajouter une adresse
router.post('/', verifierToken, async (req, res) => {
    try {
        const userId = req.userId;
        const { label } = req.body;
        if (!label) return res.status(400).json({ erreur: 'Adresse obligatoire' });

        const result = await pool.query(
            'INSERT INTO adresses (user_id, label) VALUES ($1, $2) RETURNING *',
            [userId, label]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
});

// DELETE — supprimer une adresse
router.delete('/:id', verifierToken, async (req, res) => {
    try {
        const id = req.params.id;
        await pool.query('DELETE FROM adresses WHERE id = $1', [id]);
        res.json({ message: 'Adresse supprimee !' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
});

module.exports = router;