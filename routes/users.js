const router = require('express').Router();
const pool = require('../config/db');
const verifierToken = require('../middlewares/verifierToken');

// GET un utilisateur par id
router.get('/:id', verifierToken, async (req, res) => {
    try {
        const id = req.params.id;
        const result = await pool.query(
            'SELECT id, nom, email, telephone, role FROM users WHERE id=$1',
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ erreur: 'Utilisateur introuvable' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
});

// PATCH mettre à jour un utilisateur
router.patch('/:id', verifierToken, async (req, res) => {
    try {
        const id = req.params.id;
        const { nom, email, latitude, longitude, adresse } = req.body;
        const update = await pool.query(`
            UPDATE users SET 
            nom=COALESCE($1, nom), 
            email=COALESCE($2, email),
            latitude=COALESCE($3, latitude),
            longitude=COALESCE($4, longitude),
            adresse=COALESCE($5, adresse)
            WHERE id=$6
            RETURNING id, nom, email, role, telephone, latitude, longitude, adresse
        `, [nom, email, latitude, longitude, adresse, id]);
        res.json(update.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
});

module.exports = router;