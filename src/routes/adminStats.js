const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

// Le client Prisma doit recevoir un objet vide avec cette version de Prisma
const prisma = new PrismaClient({});

router.get('/communications-metadata', async (req, res) => {
  try {
    const communications = await prisma.communication.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: { id: true, nom: true, email: true },
        },
        prestataire: {
          select: { id: true, nom: true, email: true },
        },
      },
    });

    res.json(communications.map((comm) => ({
      id: comm.id,
      type: comm.type,
      duration: comm.duration,
      status: comm.status,
      createdAt: comm.createdAt,
      client: comm.client ? { id: comm.client.id, nom: comm.client.nom, email: comm.client.email } : null,
      prestataire: comm.prestataire ? { id: comm.prestataire.id, nom: comm.prestataire.nom, email: comm.prestataire.email } : null,
    })));
  } catch (error) {
    console.error("Erreur Prisma:", error);
    res.status(500).json({ error: "Erreur de base de données" });
  }
});

module.exports = router;