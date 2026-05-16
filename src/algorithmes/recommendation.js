const { PrismaClient } = require('@prisma/client');
const { haversineDistance } = require('./utiles/haversine');

const prisma = new PrismaClient({});

async function recommanderPrestataires(serviceId, clientLat, clientLon) {
  const prestataires = await prisma.prestataire.findMany({
    where: {
      services: {
        some: { id: parseInt(serviceId) }
      },
      disponible: true,
      estVerifie: true,
    },
    include: {
      avis: { select: { note: true } },
      utilisateur: { select: { nom: true } },
    },
  });

  const scored = prestataires.map((p) => {
    const distance = haversineDistance(
      clientLat, clientLon,
      p.latitude, p.longitude
    );

    const noteMoyenne =
      p.avis.length > 0
        ? p.avis.reduce((sum, a) => sum + a.note, 0) / p.avis.length
        : 0;

    const maxDist = 50;
    const scoreDistance     = Math.max(0, (1 - distance / maxDist) * 50);
    const scoreNote         = (noteMoyenne / 5) * 30;
    const scoreDisponibilite = p.disponible ? 20 : 0;
    const scoreTotal        = scoreDistance + scoreNote + scoreDisponibilite;

    return {
      id:           p.id,
      nom:          p.utilisateur.nom,
      noteMoyenne:  parseFloat(noteMoyenne.toFixed(2)),
      distance:     parseFloat(distance.toFixed(2)),
      disponible:   p.disponible,
      scoreTotal:   parseFloat(scoreTotal.toFixed(2)),
    };
  });

  return scored.sort((a, b) => b.scoreTotal - a.scoreTotal);
}

module.exports = { recommanderPrestataires };