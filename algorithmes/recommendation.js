const pool = require('../config/db');
const { haversineDistance } = require('./haversine');

async function recommanderPrestataires(serviceId, clientLat, clientLon) {
    try {
        // Chercher les prestataires disponibles
        const result = await pool.query(`
            SELECT 
                p.id,
                p.specialite,
                p.disponible,
                p.note_moyenne,
                p.latitude,
                p.longitude,
                u.nom
            FROM prestataires p
            JOIN users u ON p.user_id = u.id
            WHERE p.disponible = true
        `);

        const prestataires = result.rows;

        // Calculer le score pour chaque prestataire
        const scored = prestataires.map((p) => {
            // Calculer la distance si coordonnées disponibles
            const distance = (p.latitude && p.longitude)
                ? haversineDistance(clientLat, clientLon, p.latitude, p.longitude)
                : 50; // distance max si pas de coordonnées

            const noteMoyenne = p.note_moyenne || 0;

            const maxDist = 50;
            const scoreDistance      = Math.max(0, (1 - distance / maxDist) * 50);
            const scoreNote          = (noteMoyenne / 5) * 30;
            const scoreDisponibilite = p.disponible ? 20 : 0;
            const scoreTotal         = scoreDistance + scoreNote + scoreDisponibilite;

            return {
                id:          p.id,
                nom:         p.nom,
                specialite:  p.specialite,
                noteMoyenne: parseFloat(noteMoyenne),
                distance:    parseFloat(distance.toFixed(2)),
                disponible:  p.disponible,
                scoreTotal:  parseFloat(scoreTotal.toFixed(2)),
            };
        });

        // Trier par score décroissant
        return scored.sort((a, b) => b.scoreTotal - a.scoreTotal);

    } catch (err) {
        console.error('Erreur recommandation:', err);
        throw err;
    }
}

module.exports = { recommanderPrestataires };