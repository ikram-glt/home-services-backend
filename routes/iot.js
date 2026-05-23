// ============================================================
// FICHIER : backend/routes/iot.js
// ============================================================
const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');

// --- Dictionnaires -------------------------------------------
const FAULT_LABELS = {
  surchauffe:             'Surchauffe detectee - risque incendie',
  fuite_eau:              "Fuite d'eau detectee",
  vibration_excessive:    'Vibrations anormales',
  blocage_tambour:        'Tambour bloque',
  erreur_vidange:         'Erreur de vidange',
  compresseur_defaillant: 'Compresseur defaillant',
  temperature_elevee:     'Temperature trop elevee - aliments en danger',
  givre_excessif:         'Givrage excessif',
  fuite_refrigerant:      'Fuite de refrigerant',
  ventilateur_bloque:     'Ventilateur bloque',
};

const FAULT_CATEGORIES = {
  surchauffe:             'Electricite / Electromenager',
  fuite_eau:              'Plomberie',
  erreur_vidange:         'Plomberie',
  court_circuit:          'Electricite / Electromenager',
  compresseur_defaillant: 'Electricite / Electromenager',
  fuite_refrigerant:      'Electricite / Electromenager',
};
const getCategory = (f) => FAULT_CATEGORIES[f] || 'Reparation electromenager';

// --- Crée un booking automatique depuis une panne IoT --------
async function createIoTBooking(clientId, data) {
  try {
    // Chercher un service directement par categorie
    const category = getCategory(data.faultType);
    const serviceRes = await pool.query(
      `SELECT id FROM services WHERE LOWER(categorie) LIKE LOWER($1) AND est_actif = true LIMIT 1`,
      [`%${category.split('/')[0].trim()}%`]
    );

    let serviceId;
    if (serviceRes.rows.length > 0) {
      serviceId = serviceRes.rows[0].id;
    } else {
      const fallback = await pool.query('SELECT id FROM services WHERE est_actif = true LIMIT 1');
      if (fallback.rows.length === 0) return null;
      serviceId = fallback.rows[0].id;
    }

    // Trouver le meilleur prestataire disponible pour cette categorie
    const prestaRes = await pool.query(
      `SELECT p.user_id FROM prestataires p
       WHERE p.disponible = true
       AND LOWER(p.specialite) LIKE LOWER($1)
       ORDER BY p.note_moyenne DESC NULLS LAST
       LIMIT 1`,
      [`%${category.split('/')[0].trim()}%`]
    );
    const prestataireUserId = prestaRes.rows[0]?.user_id || null;
    console.log(`[IoT] Prestataire assigne : user_id=${prestataireUserId}`);

    const label       = FAULT_LABELS[data.faultType] || data.faultType;
    const description = `[IoT] Panne automatique detectee sur ${data.deviceName} : ${label}`;
    const today       = new Date().toISOString().split('T')[0];
    const isUrgent    = data.severity === 'urgent';

    const bookingRes = await pool.query(
      `INSERT INTO bookings
         (user_id, service_id, date, heure, description_intervention,
          est_urgent, niveau_urgence, status, prestataire_user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'en_attente', $8)
       RETURNING *`,
      [
        clientId,
        serviceId,
        today,
        new Date().toTimeString().substring(0, 5),
        description,
        isUrgent,
        isUrgent ? 'Urgente' : 'Normale',
        prestataireUserId,
      ]
    );

    const booking = bookingRes.rows[0];

    // Notifier le client
    await pool.query(
      `INSERT INTO notifications (user_id, message) VALUES ($1, $2)`,
      [clientId, `Panne IoT detectee : ${label} sur ${data.deviceName}. Une demande d intervention a ete creee automatiquement.`]
    );

    // Notifier le prestataire
    if (prestataireUserId) {
      await pool.query(
        `INSERT INTO notifications (user_id, message) VALUES ($1, $2)`,
        [prestataireUserId, `Nouvelle demande IoT urgente : ${label} sur ${data.deviceName}.`]
      );
    }

    console.log(`[IoT] Booking cree : id=${booking.id} pour client ${clientId}`);
    return booking;

  } catch (err) {
    console.error('[IoT] Erreur creation booking automatique :', err);
    return null;
  }
}


// --- POST /api/iot/register ----------------------------------
router.post('/register', async (req, res) => {
  const { clientId } = req.body;

  if (!clientId) {
    return res.status(400).json({ success: false, message: 'clientId requis' });
  }

  // Verification @hotel.com
  try {
    const result = await pool.query('SELECT email FROM users WHERE id = $1', [clientId]);
    const user = result.rows[0];
    if (!user || !user.email.endsWith('@hotel.com')) {
      return res.status(403).json({
        success: false,
        message: 'Acces reserve aux comptes @hotel.com'
      });
    }
  } catch (err) {
    console.error('[IoT] Erreur verification email :', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }

  const { WashingMachine, Refrigerator } = require('../algorithmes/iotSimulator');
  const io         = req.app.get('io');
  const simulators = req.app.get('iotSimulators') || {};

  if (simulators[clientId]) {
    return res.json({ success: true, message: 'Appareils deja enregistres' });
  }

  const wm = new WashingMachine(clientId);
  const fr = new Refrigerator(clientId);

  const onFault = async (data) => {
    console.log(`[IoT] PANNE - client ${clientId} | ${data.deviceName} | ${data.faultType}`);

    const booking = await createIoTBooking(parseInt(clientId), data);

    const enrichedData = {
      ...data,
      id:       booking?.id || null,
      label:    FAULT_LABELS[data.faultType] || data.faultType,
      category: getCategory(data.faultType),
    };

    io.to(`client_${clientId}`).emit('iot:panne_detectee', enrichedData);
  };

  const onMetrics = (data) => {
    io.to(`client_${clientId}`).emit('iot:metrics', data);
  };

  wm.on('fault',   onFault);
  fr.on('fault',   onFault);
  wm.on('metrics', onMetrics);
  fr.on('metrics', onMetrics);

  wm.start();
  fr.start();

  simulators[clientId] = [wm, fr];
  req.app.set('iotSimulators', simulators);

  console.log(`[IoT] Simulateurs demarres pour client ${clientId}`);

  res.json({
    success: true,
    message: 'Surveillance IoT demarree',
    devices: [
      { id: 'wm-001', name: 'Machine a laver Samsung WW90T', type: 'washing_machine' },
      { id: 'fr-001', name: 'Refrigerateur LG GBB72PZEFN',  type: 'refrigerator'    },
    ],
  });
});


// --- GET /api/iot/devices/:clientId --------------------------
router.get('/devices/:clientId', (req, res) => {
  const simulators = req.app.get('iotSimulators') || {};
  const appareils  = simulators[req.params.clientId] || [];

  const devices = appareils.map((sim) => ({
    id:       sim.id,
    name:     sim.name,
    type:     sim.type,
    status:   sim.status,
    metrics:  sim.metrics,
    lastSeen: new Date().toISOString(),
  }));

  res.json({ success: true, devices });
});


// --- POST /api/iot/simulate-fault ----------------------------
router.post('/simulate-fault', (req, res) => {
  const { clientId, deviceId, faultType } = req.body;

  if (!clientId || !deviceId || !faultType) {
    return res.status(400).json({
      success: false,
      message: 'clientId, deviceId et faultType sont requis',
    });
  }

  const simulators = req.app.get('iotSimulators') || {};
  const device     = (simulators[clientId] || []).find((d) => d.id === deviceId);

  if (!device) {
    return res.status(404).json({
      success: false,
      message: 'Appareil introuvable. Avez-vous appele /register ?',
    });
  }

  device.triggerFault(faultType);

  res.json({
    success: true,
    message: `Panne "${faultType}" declenchee sur ${device.name}`,
  });
});


// --- POST /api/iot/accepter ----------------------------------
router.post('/accepter', async (req, res) => {
  const { demandeId } = req.body;
  if (!demandeId) return res.status(400).json({ success: false });

  try {
    await pool.query(
      `UPDATE bookings SET status = 'en_attente' WHERE id = $1`,
      [demandeId]
    );
    res.json({ success: true, message: 'Intervention acceptee' });
  } catch (err) {
    console.error('[IoT] Erreur accepter :', err);
    res.status(500).json({ success: false });
  }
});


// --- POST /api/iot/refuser -----------------------------------
router.post('/refuser', async (req, res) => {
  const { demandeId } = req.body;
  if (!demandeId) return res.status(400).json({ success: false });

  try {
    await pool.query('DELETE FROM bookings WHERE id = $1', [demandeId]);
    res.json({ success: true, message: 'Intervention refusee et demande supprimee' });
  } catch (err) {
    console.error('[IoT] Erreur refuser :', err);
    res.status(500).json({ success: false });
  }
});


// --- POST /api/iot/resolve-fault -----------------------------
router.post('/resolve-fault', (req, res) => {
  const { clientId, deviceId } = req.body;

  if (!clientId || !deviceId) {
    return res.status(400).json({ success: false, message: 'clientId et deviceId requis' });
  }

  const simulators = req.app.get('iotSimulators') || {};
  const device     = (simulators[clientId] || []).find((d) => d.id === deviceId);

  if (!device) {
    return res.status(404).json({ success: false, message: 'Appareil introuvable' });
  }

  device.resolveIfActive();

  const io = req.app.get('io');
  io.to(`client_${clientId}`).emit('iot:appareil_repare', {
    deviceId,
    deviceName: device.name,
    message:    `${device.name} est de nouveau operationnel.`,
    timestamp:  new Date().toISOString(),
  });

  res.json({ success: true, message: `${device.name} marque comme repare` });
});

module.exports = router;