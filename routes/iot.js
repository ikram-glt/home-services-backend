// ============================================================
// FICHIER : src/routes/iot.js
// ============================================================
// Routes Express pour le module IoT.
// Monte dans server.js avec : app.use('/api/iot', require('./routes/iot'))
//
// Endpoints :
//   POST /api/iot/register          → Démarre les simulateurs d'un client
//   GET  /api/iot/devices/:clientId → État actuel des appareils
//   POST /api/iot/simulate-fault    → Déclenche une panne manuellement (tests)
//   POST /api/iot/resolve-fault     → Marque un appareil comme réparé
// ============================================================

const express = require('express');
const router  = express.Router();

// ─── Dictionnaires partagés ───────────────────────────────────────────────────

// Description lisible de chaque type de panne
// Correspond à ce qui sera affiché dans la notification et la demande Prisma
const FAULT_LABELS = {
  surchauffe:             'Surchauffe détectée — risque incendie',
  fuite_eau:              "Fuite d'eau détectée",
  vibration_excessive:    'Vibrations anormales',
  blocage_tambour:        'Tambour bloqué',
  erreur_vidange:         'Erreur de vidange',
  compresseur_defaillant: 'Compresseur défaillant',
  temperature_elevee:     'Température trop élevée — aliments en danger',
  givre_excessif:         'Givrage excessif',
  fuite_refrigerant:      'Fuite de réfrigérant',
  ventilateur_bloque:     'Ventilateur bloqué',
};

// Catégorie de service → correspond aux catégories dans votre BDD Prisma
const FAULT_CATEGORIES = {
  surchauffe:             'Électricité / Électroménager',
  fuite_eau:              'Plomberie',
  erreur_vidange:         'Plomberie',
  court_circuit:          'Électricité / Électroménager',
  compresseur_defaillant: 'Électricité / Électroménager',
  fuite_refrigerant:      'Électricité / Électroménager',
};
const getCategory = (f) => FAULT_CATEGORIES[f] || 'Réparation électroménager';


// ─── POST /api/iot/register ───────────────────────────────────────────────────
// Instancie les 2 simulateurs pour un client et démarre la surveillance.
// Appelé une seule fois à la connexion du client dans l'app mobile.
// Body : { clientId: "1" }  ← doit correspondre à un User.id valide dans Prisma
router.post('/register', (req, res) => {
  const { clientId } = req.body;

  if (!clientId) {
    return res.status(400).json({ success: false, message: 'clientId requis' });
  }

  const { WashingMachine, Refrigerator } = require('../algorithmes/iotSimulator');
  const io         = req.app.get('io');           // Instance Socket.io (depuis server.js)
  const simulators = req.app.get('iotSimulators') || {};

  // Évite de créer des doublons si le client appelle register 2 fois
  if (simulators[clientId]) {
    return res.json({ success: true, message: 'Appareils déjà enregistrés' });
  }

  // Création des 2 simulateurs liés à ce client
  const wm = new WashingMachine(clientId);
  const fr = new Refrigerator(clientId);

  // ── Handler de panne ────────────────────────────────────────────────────────
  // Reçoit l'événement EventEmitter 'fault' depuis le simulateur
  // et l'injecte dans Socket.io pour déclencher le flux 4 étapes
  const onFault = (data) => {
    console.log(`[IoT] PANNE — client ${clientId} | ${data.deviceName} | ${data.faultType}`);

    // Enrichit les données avec la description et la catégorie
    const enrichedData = {
      ...data,
      label:    FAULT_LABELS[data.faultType] || data.faultType,
      category: getCategory(data.faultType),
    };

    // Envoie vers la room privée du client → middleware/socket.js gère les étapes
    io.to(`client_${clientId}`).emit('iot:panne_detectee', enrichedData);
  };

  // ── Handler de métriques ────────────────────────────────────────────────────
  // Reçoit l'événement 'metrics' toutes les 5s et le diffuse en temps réel
  const onMetrics = (data) => {
    io.to(`client_${clientId}`).emit('iot:metrics', data);
  };

  // Branche les handlers sur les 2 appareils
  wm.on('fault',   onFault);
  fr.on('fault',   onFault);
  wm.on('metrics', onMetrics);
  fr.on('metrics', onMetrics);

  // Démarre les timers de simulation
  wm.start();
  fr.start();

  // Stocke les instances en mémoire pour les réutiliser dans les autres routes
  simulators[clientId] = [wm, fr];
  req.app.set('iotSimulators', simulators);

  console.log(`[IoT] Simulateurs démarrés pour client ${clientId}`);

  res.json({
    success: true,
    message: 'Surveillance IoT démarrée',
    devices: [
      { id: 'wm-001', name: 'Machine à laver Samsung WW90T',  type: 'washing_machine' },
      { id: 'fr-001', name: 'Réfrigérateur LG GBB72PZEFN',   type: 'refrigerator'    },
    ],
  });
});


// ─── GET /api/iot/devices/:clientId ──────────────────────────────────────────
// Retourne l'état actuel des appareils du client.
// Appelé par useIoTAlerts._fetchDevices() au chargement de l'écran IoT.
router.get('/devices/:clientId', (req, res) => {
  const simulators = req.app.get('iotSimulators') || {};
  const appareils  = simulators[req.params.clientId] || [];

  const devices = appareils.map((sim) => ({
    id:       sim.id,
    name:     sim.name,
    type:     sim.type,
    status:   sim.status,   // "normal" | "fault"
    metrics:  sim.metrics,
    lastSeen: new Date().toISOString(),
  }));

  res.json({ success: true, devices });
});


// ─── POST /api/iot/simulate-fault ─────────────────────────────────────────────
// Déclenche manuellement une panne pour les tests et démonstrations.
// Body : { clientId: "1", deviceId: "wm-001", faultType: "surchauffe" }
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
      message: 'Appareil introuvable. Avez-vous appelé /register ?',
    });
  }

  device.triggerFault(faultType); // Déclenche onFault → Socket.io → flux 4 étapes

  res.json({
    success: true,
    message: `Panne "${faultType}" déclenchée sur ${device.name}`,
  });
});


// ─── POST /api/iot/resolve-fault ──────────────────────────────────────────────
// Remet un appareil en état normal après intervention du prestataire.
// Appelé depuis IoTScreen ou depuis la route de clôture de réservation.
// Body : { clientId: "1", deviceId: "wm-001" }
router.post('/resolve-fault', (req, res) => {
  const { clientId, deviceId } = req.body;

  if (!clientId || !deviceId) {
    return res.status(400).json({
      success: false,
      message: 'clientId et deviceId sont requis',
    });
  }

  const simulators = req.app.get('iotSimulators') || {};
  const device     = (simulators[clientId] || []).find((d) => d.id === deviceId);

  if (!device) {
    return res.status(404).json({ success: false, message: 'Appareil introuvable' });
  }

  device.resolveIfActive(); // Remet status = "normal", métriques normales

  // Notifie le client en temps réel que son appareil est réparé
  const io = req.app.get('io');
  io.to(`client_${clientId}`).emit('iot:appareil_repare', {
    deviceId,
    deviceName: device.name,
    message:    `${device.name} est de nouveau opérationnel.`,
    timestamp:  new Date().toISOString(),
  });

  res.json({ success: true, message: `${device.name} marqué comme réparé` });
});

module.exports = router;