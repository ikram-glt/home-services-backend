// ============================================================
// FICHIER : src/routes/bookings.js
// Gestion des réservations (Demande dans le diagramme de classes)
// Acteurs : Client, Prestataire
// ============================================================

const express = require('express');
const router  = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({});

// ── GET /api/bookings ─────────────────────────────────────────
// Récupérer toutes les réservations (admin) ou celles d'un client/prestataire
router.get('/', async (req, res) => {
  try {
    const { clientId, prestataire_id, status } = req.query;

    const where = {};
    if (clientId)        where.clientId       = parseInt(clientId);
    if (prestataire_id)  where.prestataireId  = parseInt(prestataire_id);
    if (status)          where.status         = status;

    const bookings = await prisma.demande.findMany({
      where,
      include: {
        client:      { select: { id: true, nom: true, email: true, telephone: true } },
        prestataire: { select: { id: true, nom: true, email: true, competences: true, noteMoyenne: true } },
        service:     { select: { id: true, titre: true, prix: true, description: true } },
      },
      orderBy: { dateDepot: 'desc' },
    });

    res.json({ success: true, data: bookings });
  } catch (err) {
    console.error('[Bookings] GET /', err);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
  }
});

// ── GET /api/bookings/:id ─────────────────────────────────────
// Récupérer une réservation par ID
router.get('/:id', async (req, res) => {
  try {
    const booking = await prisma.demande.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        client:      true,
        prestataire: true,
        service:     true,
        avis:        true,
      },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Réservation introuvable' });
    }

    res.json({ success: true, data: booking });
  } catch (err) {
    console.error('[Bookings] GET /:id', err);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
  }
});

// ── POST /api/bookings ────────────────────────────────────────
// Créer une nouvelle réservation (Client demande un service)
router.post('/', async (req, res) => {
  try {
    const {
      clientId,
      prestataireId,
      serviceId,
      dateDepot,
      datePlanifiee,
      adresseIntervention,
      montantEstime,
      isUrgent,
      description,
    } = req.body;

    if (!clientId || !serviceId) {
      return res.status(400).json({ success: false, message: 'clientId et serviceId sont requis' });
    }

    const newBooking = await prisma.demande.create({
      data: {
        clientId:            parseInt(clientId),
        prestataireId:       prestataireId ? parseInt(prestataireId) : null,
        serviceId:           parseInt(serviceId),
        dateDepot:           dateDepot      ? new Date(dateDepot)      : new Date(),
        datePlanifiee:       datePlanifiee  ? new Date(datePlanifiee)  : null,
        adresseIntervention: adresseIntervention || null,
        montantEstime:       montantEstime  ? parseFloat(montantEstime) : null,
        isUrgent:            isUrgent       || false,
        description:         description   || null,
        status:              'EN_ATTENTE',
      },
      include: {
        service: true,
        client:  { select: { id: true, nom: true, email: true } },
      },
    });

    // Notifier via Socket.io si un prestataire est déjà assigné
    const io = req.app.get('io');
    if (io && prestataireId) {
      io.emit(`booking:new:${prestataireId}`, newBooking);
    }

    res.status(201).json({ success: true, data: newBooking });
  } catch (err) {
    console.error('[Bookings] POST /', err);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
  }
});

// ── PATCH /api/bookings/:id/status ───────────────────────────
// Changer le statut d'une réservation
// Statuts : EN_ATTENTE | ACCEPTEE | REFUSEE | EN_COURS | TERMINEE | ANNULEE
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, prestataireId } = req.body;

    const validStatuses = ['EN_ATTENTE', 'ACCEPTEE', 'REFUSEE', 'EN_COURS', 'TERMINEE', 'ANNULEE'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Statut invalide. Valeurs acceptées : ${validStatuses.join(', ')}` });
    }

    const updated = await prisma.demande.update({
      where: { id: parseInt(req.params.id) },
      data: {
        status,
        ...(prestataireId && { prestataireId: parseInt(prestataireId) }),
        ...(status === 'TERMINEE' && { dateFinIntervention: new Date() }),
      },
      include: {
        client:      { select: { id: true, nom: true, email: true } },
        prestataire: { select: { id: true, nom: true, email: true } },
        service:     { select: { id: true, titre: true } },
      },
    });

    // Notifier le client en temps réel
    const io = req.app.get('io');
    if (io) {
      io.emit(`booking:status:${updated.clientId}`, { id: updated.id, status: updated.status });
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('[Bookings] PATCH /:id/status', err);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
  }
});

// ── DELETE /api/bookings/:id ──────────────────────────────────
// Annuler / supprimer une réservation
router.delete('/:id', async (req, res) => {
  try {
    await prisma.demande.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.json({ success: true, message: 'Réservation supprimée' });
  } catch (err) {
    console.error('[Bookings] DELETE /:id', err);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
  }
});

// ── POST /api/bookings/:id/avis ───────────────────────────────
// Client soumet un avis après prestation terminée
router.post('/:id/avis', async (req, res) => {
  try {
    const { clientId, note, commentaires } = req.body;

    if (!note || note < 1 || note > 5) {
      return res.status(400).json({ success: false, message: 'La note doit être entre 1 et 5' });
    }

    const booking = await prisma.demande.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!booking) return res.status(404).json({ success: false, message: 'Réservation introuvable' });
    if (booking.status !== 'TERMINEE') {
      return res.status(400).json({ success: false, message: 'Impossible de noter une prestation non terminée' });
    }

    const avis = await prisma.avis.create({
      data: {
        clientId:   parseInt(clientId),
        prestataireId: booking.prestataireId,
        demandeId:  booking.id,
        note:       parseInt(note),
        commentaires: commentaires || null,
        date:       new Date(),
      },
    });

    // Recalculer la note moyenne du prestataire
    if (booking.prestataireId) {
      const allAvis = await prisma.avis.findMany({ where: { prestataireId: booking.prestataireId } });
      const moyenne = allAvis.reduce((sum, a) => sum + a.note, 0) / allAvis.length;
      await prisma.prestataire.update({
        where: { id: booking.prestataireId },
        data:  { noteMoyenne: Math.round(moyenne * 10) / 10 },
      });
    }

    res.status(201).json({ success: true, data: avis });
  } catch (err) {
    console.error('[Bookings] POST /:id/avis', err);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
  }
});

module.exports = router;