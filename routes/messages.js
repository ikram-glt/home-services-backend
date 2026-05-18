const router = require('express').Router();
const pool = require('../config/db');
const verifierToken = require('../middlewares/verifierToken');

// GET conversations groupées (admin)
router.get('/all', verifierToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        m.booking_id,
        u1.nom as client_nom,
        u2.nom as prestataire_nom,
        COUNT(m.id) as nombre_messages,
        MAX(m.created_at) as derniere_activite,
        (SELECT contenu FROM messages 
         WHERE booking_id = m.booking_id 
         ORDER BY created_at DESC LIMIT 1) as dernier_message
      FROM messages m
      JOIN bookings b ON m.booking_id = b.id
      JOIN users u1 ON b.user_id = u1.id
      LEFT JOIN users u2 ON b.prestataire_user_id = u2.id
      GROUP BY m.booking_id, u1.nom, u2.nom
      ORDER BY derniere_activite DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// GET messages d'une conversation (booking)
router.get('/:bookingId', verifierToken, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const result = await pool.query(`
      SELECT m.*, u.nom as sender_nom
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.booking_id = $1
      ORDER BY m.created_at ASC
    `, [bookingId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// POST envoyer un message
router.post('/', verifierToken, async (req, res) => {
  try {
    const { booking_id, receiver_id, contenu } = req.body;
    const sender_id = req.userId;

    const result = await pool.query(`
      INSERT INTO messages (booking_id, sender_id, receiver_id, contenu)
      VALUES ($1, $2, $3, $4) RETURNING *
    `, [booking_id, sender_id, receiver_id, contenu]);

    const message = result.rows[0];

    const io = req.app.get('io');
    if (io) {
      io.to(`booking_${booking_id}`).emit('nouveau_message', {
        ...message,
        sender_nom: req.userName
      });
    }

    res.status(201).json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// PATCH marquer messages comme lus
router.patch('/:bookingId/lu', verifierToken, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.userId;
    await pool.query(
      'UPDATE messages SET lu=true WHERE booking_id=$1 AND receiver_id=$2',
      [bookingId, userId]
    );
    res.json({ message: 'Messages lus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

module.exports = router;