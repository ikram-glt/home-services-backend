const router = require('express').Router();
const pool = require('../config/db');
const verifierToken = require('../middlewares/verifierToken');
const verifierRole = require('../middlewares/role');

// GET tous les services actifs
router.get('/', async (req, res) => {
    try {
        const { categorie, prix_max } = req.query;
        let resultat;
        if (categorie && prix_max) {
            resultat = await pool.query(
                'SELECT * FROM services WHERE categorie=$1 AND prix<=$2 AND est_actif=true ORDER BY id',
                [categorie, prix_max]
            );
        } else if (categorie) {
            resultat = await pool.query(
                'SELECT * FROM services WHERE categorie=$1 AND est_actif=true ORDER BY id',
                [categorie]
            );
        } else if (prix_max) {
            resultat = await pool.query(
                'SELECT * FROM services WHERE prix<=$1 AND est_actif=true ORDER BY id',
                [prix_max]
            );
        } else {
            resultat = await pool.query(
                'SELECT * FROM services WHERE est_actif=true ORDER BY id'
            );
        }
        res.json(resultat.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
});

// GET un service
router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const recherch = await pool.query('SELECT * FROM services WHERE id=$1', [id]);
        if (recherch.rows.length === 0) {
            return res.status(404).json({ erreur: 'service introuvable' });
        }
        res.json(recherch.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
});

// POST créer service
router.post('/', async (req, res) => {
    try {
        const { nom, description, categorie, prix } = req.body;
        if (!nom || !prix) {
            return res.status(400).json({ erreur: 'nom et prix obligatoires' });
        }
        const service = await pool.query(
            'INSERT INTO services (nom, description, categorie, prix, est_actif) VALUES ($1,$2,$3,$4,true) RETURNING *',
            [nom, description, categorie, prix]
        );
        res.status(201).json(service.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
});

// PATCH activer/désactiver service (admin)
router.patch('/:id/actif', verifierToken, verifierRole('admin'), async (req, res) => {
    try {
        const id = req.params.id;
        const { est_actif } = req.body;
        const result = await pool.query(
            'UPDATE services SET est_actif=$1 WHERE id=$2 RETURNING *',
            [est_actif, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
});

// DELETE service
router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await pool.query('DELETE FROM services WHERE id=$1', [id]);
        res.json({ message: 'Service supprime !' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
});

module.exports = router;