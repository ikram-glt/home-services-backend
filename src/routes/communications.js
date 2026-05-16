const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.post('/call', async (req, res) => {
  try {
    const { bookingId, duration, status } = req.body;
    if (!bookingId || typeof duration !== 'number' || !status) {
      return res.status(400).json({ error: 'bookingId, duration et status requis' });
    }

    const booking = await prisma.demande.findUnique({
      where: { id: bookingId },
      select: { clientId: true, prestataireId: true },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Réservation introuvable' });
    }

    const communication = await prisma.communication.create({
      data: {
        type: 'CALL',
        duration,
        status,
        clientId: booking.clientId,
        prestataireId: booking.prestataireId,
      },
    });

    res.json({ success: true, communication });
  } catch (error) {
    console.error('Erreur en créant la communication :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
