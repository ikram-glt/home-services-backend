const router = require('express').Router();
const { recommanderPrestataires } = require('../algorithmes/recommendation');
const { classerUrgence } = require('../algorithmes/urgencyClassifier');
const verifierToken = require('../middlewares/verifierToken');

// GET /api/recommendations?serviceId=1&lat=33.5&lon=-7.6
router.get('/', verifierToken, async (req, res) => {
    try {
        const { serviceId, lat, lon } = req.query;

        if (!serviceId || !lat || !lon) {
            return res.status(400).json({
                erreur: 'serviceId, lat et lon sont obligatoires'
            });
        }

        const recommandations = await recommanderPrestataires(
            serviceId,
            parseFloat(lat),
            parseFloat(lon)
        );

        res.json(recommandations);

    } catch (err) {
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
});

// POST /api/recommendations/urgence
router.post('/urgence', async (req, res) => {
    try {
        const { description } = req.body;

        if (!description) {
            return res.status(400).json({ erreur: 'description obligatoire' });
        }

        const urgence = classerUrgence(description);
        res.json(urgence);

    } catch (err) {
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
});

module.exports = router;