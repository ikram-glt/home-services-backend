// ============================================================
// FICHIER : src/routes/service.js
// Gestion des services & catégories
// Acteurs : Client (consulte), Prestataire (propose), Admin (gère)
// ============================================================

const express = require('express');
const router  = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({});

// ── GET /api/services ─────────────────────────────────────────
// Lister tous les services (avec filtres optionnels)
router.get('/', async (req, res) => {
  try {
    const { categorieId, prestataireId, minPrix, maxPrix, isActif } = req.query;

    const where = {};
    if (categorieId)   where.categorieId   = parseInt(categorieId);
    if (prestataireId) where.prestataireId = parseInt(prestataireId);
    if (isActif !== undefined) where.isActif = isActif === 'true';
    if (minPrix || maxPrix) {
      where.prix = {};
      if (minPrix) where.prix.gte = parseFloat(minPrix);
      if (maxPrix) where.prix.lte = parseFloat(maxPrix);
    }

    const services = await prisma.service.findMany({
      where,
      include: {
        categorie:   { select: { id: true, nom: true, description: true } },
        prestataire: {
          select: {
            id: true, nom: true, noteMoyenne: true,
            latitude: true, longitude: true, estVerifie: true,
          },
        },
      },
      orderBy: { titre: 'asc' },
    });

    res.json({ success: true, data: services });
  } catch (err) {
    console.error('[Services] GET /', err);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
  }
});

// ── GET /api/services/categories ─────────────────────────────
// Lister toutes les catégories de services (plomberie, électricité, etc.)
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.categorie.findMany({
      where: { estActif: true },
      include: {
        _count: { select: { services: true } },
      },
      orderBy: { nom: 'asc' },
    });
    res.json({ success: true, data: categories });
  } catch (err) {
    console.error('[Services] GET /categories', err);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
  }
});

// ── GET /api/services/:id ─────────────────────────────────────
// Détail d'un service
router.get('/:id', async (req, res) => {
  try {
    const service = await prisma.service.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        categorie:   true,
        prestataire: {
          select: {
            id: true, nom: true, email: true, telephone: true,
            competences: true, noteMoyenne: true, estVerifie: true,
            latitude: true, longitude: true, heureDebut: true, heureFin: true,
          },
        },
      },
    });

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service introuvable' });
    }

    res.json({ success: true, data: service });
  } catch (err) {
    console.error('[Services] GET /:id', err);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
  }
});

// ── POST /api/services ────────────────────────────────────────
// Prestataire crée un nouveau service
router.post('/', async (req, res) => {
  try {
    const {
      prestataireId,
      categorieId,
      titre,
      description,
      prix,
      dureeEstimeeMin,
    } = req.body;

    if (!prestataireId || !categorieId || !titre || !prix) {
      return res.status(400).json({
        success: false,
        message: 'prestataireId, categorieId, titre et prix sont requis',
      });
    }

    const service = await prisma.service.create({
      data: {
        prestataireId:  parseInt(prestataireId),
        categorieId:    parseInt(categorieId),
        titre,
        description:    description || null,
        prix:           parseFloat(prix),
        dureeEstimeeMin: dureeEstimeeMin ? parseInt(dureeEstimeeMin) : null,
        isActif:        true,
      },
      include: {
        categorie:   { select: { id: true, nom: true } },
        prestataire: { select: { id: true, nom: true } },
      },
    });

    res.status(201).json({ success: true, data: service });
  } catch (err) {
    console.error('[Services] POST /', err);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
  }
});

// ── PUT /api/services/:id ─────────────────────────────────────
// Prestataire met à jour un service existant
router.put('/:id', async (req, res) => {
  try {
    const { titre, description, prix, dureeEstimeeMin, isActif, categorieId } = req.body;

    const updated = await prisma.service.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(titre           && { titre }),
        ...(description     !== undefined && { description }),
        ...(prix            && { prix: parseFloat(prix) }),
        ...(dureeEstimeeMin && { dureeEstimeeMin: parseInt(dureeEstimeeMin) }),
        ...(isActif         !== undefined && { isActif }),
        ...(categorieId     && { categorieId: parseInt(categorieId) }),
      },
      include: {
        categorie:   { select: { id: true, nom: true } },
        prestataire: { select: { id: true, nom: true } },
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('[Services] PUT /:id', err);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
  }
});

// ── DELETE /api/services/:id ──────────────────────────────────
// Désactiver (soft delete) ou supprimer un service
router.delete('/:id', async (req, res) => {
  try {
    // Soft delete : on désactive plutôt que supprimer pour garder l'historique
    const updated = await prisma.service.update({
      where: { id: parseInt(req.params.id) },
      data:  { isActif: false },
    });
    res.json({ success: true, message: 'Service désactivé', data: updated });
  } catch (err) {
    console.error('[Services] DELETE /:id', err);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
  }
});

// ── GET /api/services/prestataire/:prestataireId/disponibilites ──
// Vérifier les disponibilités d'un prestataire pour un service
router.get('/prestataire/:prestataireId/disponibilites', async (req, res) => {
  try {
    const { date } = req.query; // format : YYYY-MM-DD

    const prestataire = await prisma.prestataire.findUnique({
      where: { id: parseInt(req.params.prestataireId) },
      select: { id: true, nom: true, heureDebut: true, heureFin: true, jourDisponible: true },
    });

    if (!prestataire) {
      return res.status(404).json({ success: false, message: 'Prestataire introuvable' });
    }

    // Récupérer les réservations déjà existantes ce jour
    let reservationsExistantes = [];
    if (date) {
      const debut = new Date(date);
      const fin   = new Date(date);
      fin.setDate(fin.getDate() + 1);

      reservationsExistantes = await prisma.demande.findMany({
        where: {
          prestataireId: parseInt(req.params.prestataireId),
          datePlanifiee: { gte: debut, lt: fin },
          status: { in: ['EN_ATTENTE', 'ACCEPTEE', 'EN_COURS'] },
        },
        select: { datePlanifiee: true, status: true },
      });
    }

    res.json({
      success: true,
      data: {
        prestataire,
        reservationsExistantes,
        creneauxOccupes: reservationsExistantes.map(r => r.datePlanifiee),
      },
    });
  } catch (err) {
    console.error('[Services] GET /prestataire/:id/disponibilites', err);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
  }
});

module.exports = router;