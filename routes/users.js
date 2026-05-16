const router = require('express').Router();
const pool = require('../config/db');
const verifierToken = require('../middlewares/verifierToken');

router.patch('/:id', verifierToken, async (req, res) => {
    try {
        const id = req.params.id;
        const { nom, email, adresse, latitude, longitude } = req.body;

        const update = await pool.query(`
            UPDATE users
            SET nom=$1, email=$2, adresse=$3, latitude=$4, longitude=$5
            WHERE id=$6
            RETURNING id, nom, email, role, adresse, latitude, longitude`,
            [nom, email, adresse, latitude, longitude, id]
        );
        res.json(update.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
});

router.get('/:id', verifierToken, async (req, res) => {
    try {
        const id = req.params.id;
        const result = await pool.query(
            'SELECT id, nom, email, role, adresse, latitude, longitude, telephone FROM users WHERE id=$1',
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ erreur: 'Utilisateur non trouve' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
});

module.exports = router;