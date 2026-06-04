const router = require('express').Router();
const pool = require('../config/db');
const verifierToken = require('../middlewares/verifierToken');



// GET prestataire par user_id — AVANT /:id
router.get('/user/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const result = await pool.query(`
            SELECT p.*, u.nom, u.email
            FROM prestataires p
            JOIN users u ON p.user_id = u.id
            WHERE p.user_id = $1
        `, [userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ erreur: 'Prestataire introuvable' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
});
// GET tous les prestataires
router.get('/', async (req, res) => {
    try {
        const resultat = await pool.query(`
            SELECT p.*, u.nom, u.email
            FROM prestataires p
            JOIN users u ON p.user_id = u.id
            WHERE p.disponible = true
            AND p.est_verifie = true
        `);
        res.json(resultat.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
});

// GET profil du prestataire connecté ← DOIT ETRE AVANT /:id
router.get('/me/profil', verifierToken, async (req, res) => {
    try {
        const userId = req.userId;
        const prest = await pool.query(`
            SELECT p.*, u.nom, u.email
            FROM prestataires p
            JOIN users u ON p.user_id = u.id
            WHERE p.user_id = $1
        `, [userId]);
        if (prest.rows.length === 0) {
            return res.status(404).json({ erreur: 'Prestataire non trouve' });
        }
        res.json(prest.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
});

// PATCH profil du prestataire connecté ← DOIT ETRE AVANT /:id
router.patch('/me/profil', verifierToken, async (req, res) => {
    try {
        const userId = req.userId;
        const {
    telephone, adresse, tarif_horaire,
    specialites, disponibilites,
    entreprise, rc, secteur,
    annee_creation, ville, metier,
    latitude, longitude
    } = req.body;

       const update = await pool.query(`
        UPDATE prestataires SET
        telephone = $1,
        adresse = $2,
        tarif_horaire = $3,
        specialites = $4,
        disponibilites = $5,
        entreprise = $6,
        rc = $7,
        secteur = $8,
        annee_creation = $9,
        ville = $10,
        metier = $11,
        latitude = $12,
        longitude = $13
        WHERE user_id = $14
        RETURNING *
    `, [
        telephone, adresse, tarif_horaire,
        specialites, disponibilites,
        entreprise, rc, secteur,
        annee_creation, ville, metier,
        latitude ?? null, longitude ?? null,
        userId
    ]);
        res.json(update.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
});

// GET un prestataire par id ← APRES /me/profil
router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const prest = await pool.query(`
            SELECT p.*, u.nom, u.email
            FROM prestataires p
            JOIN users u ON p.user_id = u.id
            WHERE p.id = $1
        `, [id]);
        if (prest.rows.length === 0) {
            return res.status(404).json({ erreur: 'Prestataire non trouve' });
        }
        res.json(prest.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
});

// POST — créer un profil prestataire
router.post('/', verifierToken, async (req, res) => {
    try {
        const { user_id, specialite, disponible, entreprise } = req.body;
        const result = await pool.query(
            'INSERT INTO prestataires (user_id, specialite, disponible, entreprise) VALUES ($1, $2, $3, $4) RETURNING *',
            [user_id, specialite, disponible ?? true, entreprise || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
});

// PATCH disponibilite
router.patch('/:id', verifierToken, async (req, res) => {
    try {
        const id = req.params.id;
        const disponibilite = req.body.disponibilite;
        const update = await pool.query(
            'UPDATE prestataires SET disponible=$1 WHERE id=$2 RETURNING *',
            [disponibilite, id]
        );
        res.json(update.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
});

// GET services du prestataire
router.get('/:id/services', async (req, res) => {
    try {
        const id = req.params.id;
        const result = await pool.query(`
            SELECT ps.id, ps.tarif, s.id as service_id, s.nom, s.description, s.categorie
            FROM prestataire_services ps
            JOIN services s ON ps.service_id = s.id
            WHERE ps.prestataire_id = $1
            ORDER BY s.nom
        `, [id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
});

// POST ajouter service au prestataire
router.post('/:id/services', verifierToken, async (req, res) => {
    try {
        const id = req.params.id;
        const { service_id, tarif } = req.body;
        const result = await pool.query(`
            INSERT INTO prestataire_services (prestataire_id, service_id, tarif)
            VALUES ($1, $2, $3)
            ON CONFLICT (prestataire_id, service_id) 
            DO UPDATE SET tarif = $3
            RETURNING *
        `, [id, service_id, tarif]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
});

// DELETE supprimer service du prestataire
router.delete('/:id/services/:serviceId', verifierToken, async (req, res) => {
    try {
        const { id, serviceId } = req.params;
        await pool.query(`
            DELETE FROM prestataire_services 
            WHERE prestataire_id = $1 AND service_id = $2
        `, [id, serviceId]);
        res.json({ message: 'Service supprime !' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
});

module.exports = router;