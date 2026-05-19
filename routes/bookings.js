const router = require('express').Router();
const pool = require('../config/db');
const verifierToken = require('../middlewares/verifierToken');

// GET — reservations selon le role
router.get('/', verifierToken, async (req, res) => {
    try {
        const userId = req.userId;
        const role = req.userRole;

        let result;

        if (role === 'admin') {
            result = await pool.query(`
                SELECT b.*, s.nom as service_nom 
                FROM bookings b 
                JOIN services s ON b.service_id = s.id 
                ORDER BY b.created_at DESC
            `);
        } else if (role === 'prestataire') {
            result = await pool.query(`
                SELECT b.*, s.nom as service_nom,
                u.nom as client_nom, u.telephone as client_telephone,
                u.latitude as client_latitude, u.longitude as client_longitude,
                u.adresse as client_adresse
                FROM bookings b 
                JOIN services s ON b.service_id = s.id
                JOIN users u ON b.user_id = u.id
                WHERE b.prestataire_user_id = $1
                OR (
                    b.status = 'confirme'
                    AND b.prestataire_id = $1
                )
                OR (
                    b.status IN ('termine', 'refuse')
                    AND b.prestataire_user_id = $1
                )
                ORDER BY b.created_at DESC
            `, [userId]);
        } else {
            result = await pool.query(`
                SELECT b.*, s.nom as service_nom,
                p.user_id as prestataire_user_id,
                u.nom as prestataire_nom
                FROM bookings b 
                JOIN services s ON b.service_id = s.id
                LEFT JOIN prestataires p ON b.prestataire_id = p.id
                LEFT JOIN users u ON p.user_id = u.id
                WHERE b.user_id = $1
                ORDER BY b.created_at DESC
            `, [userId]);
        }

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
});

// POST — créer une reservation
router.post('/', verifierToken, async (req, res) => {
    try {
        const { user_id, service_id, date, heure, description_intervention, prestataire_user_id } = req.body;
        if (!user_id || !service_id || !date) {
            return res.status(400).json({ erreur: 'donnees obligatoires' });
        }

        const { classerUrgence } = require('../algorithmes/urgencyClassifier');
        const urgence = description_intervention 
            ? classerUrgence(description_intervention) 
            : { label: 'Normale', niveau: 1 };
        const estUrgent = urgence.niveau >= 2;

        const booking = await pool.query(
            `INSERT INTO bookings 
             (user_id, service_id, date, heure, description_intervention, est_urgent, niveau_urgence, prestataire_user_id) 
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
            [user_id, service_id, date, heure, description_intervention, estUrgent, urgence.label, prestataire_user_id || null]
        );

        const service = await pool.query(
            'SELECT nom FROM services WHERE id = $1', [service_id]
        );
        const serviceNom = service.rows[0]?.nom || 'Service';
        
        let notifMsg = `Votre reservation pour "${serviceNom}" le ${date} a ete envoyee !`;
        if (estUrgent) notifMsg += ` ⚠️ Urgence ${urgence.label} detectee.`;
        
        await pool.query(
            'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
            [user_id, notifMsg]
        );

        // Notifier le prestataire
        if (prestataire_user_id) {
            await pool.query(
                'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
                [prestataire_user_id, `Nouvelle demande de service : ${serviceNom}`]
            );
        }

        res.status(201).json(booking.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
});

// DELETE — annuler une reservation
router.delete('/:id', verifierToken, async (req, res) => {
    try {
        const id = req.params.id;
        await pool.query('DELETE FROM bookings WHERE id = $1', [id]);
        res.json({ message: 'Reservation annulee !' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
});

// PATCH — changer le statut
router.patch('/:id/status', verifierToken, async (req, res) => {
    try {
        const id = req.params.id;
        const status = req.body.status;
        const userId = req.userId;

        let result;

        if (status === 'confirme') {
            result = await pool.query(
                'UPDATE bookings SET status=$1, prestataire_id=$2, prestataire_user_id=$2 WHERE id=$3 RETURNING *',
                [status, userId, id]
            );
        } else {
            result = await pool.query(
                'UPDATE bookings SET status=$1 WHERE id=$2 RETURNING *',
                [status, id]
            );
        }

        const booking = result.rows[0];

        let message = '';
        if (status === 'confirme') {
            message = 'Votre reservation a ete acceptee par le prestataire !';
        } else if (status === 'refuse') {
            message = 'Votre reservation a ete refusee.';
        } else if (status === 'termine') {
            message = 'Votre mission est terminee. Donnez votre avis !';
        }

        if (message && booking.user_id) {
            await pool.query(
                'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
                [booking.user_id, message]
            );
        }

        res.json(booking);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
});

module.exports = router;