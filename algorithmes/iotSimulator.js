// ============================================================
// FICHIER : src/algorithmes/iotSimulator.js
// ============================================================
// Simule 2 appareils électroménagers intelligents :
//   - Machine à laver  (id: wm-001)
//   - Réfrigérateur    (id: fr-001)
//
// Chaque appareil hérite de EventEmitter Node.js.
// Il émet 2 types d'événements :
//   - 'fault'   → panne détectée  (reçu dans src/routes/iot.js)
//   - 'metrics' → métriques temps réel toutes les 5s
// ============================================================

const EventEmitter = require('events');

// ─── Classe mère commune aux 2 appareils ─────────────────────────────────────
class ApplianceSimulator extends EventEmitter {

  constructor(id, name, type, clientId) {
    super();                      // Active .emit() et .on() de EventEmitter
    this.id           = id;       // Identifiant fixe : "wm-001" ou "fr-001"
    this.name         = name;     // Nom lisible affiché dans les notifications
    this.type         = type;     // "washing_machine" ou "refrigerator"
    this.clientId     = clientId; // ID du client propriétaire (lié à Prisma User.id)
    this.status       = 'normal'; // "normal" | "fault"
    this.metrics      = {};       // Dernières valeurs des capteurs simulés
    this.faultTimer   = null;     // Référence setTimeout → panne planifiée
    this.metricsTimer = null;     // Référence setInterval → mise à jour métriques
  }

  // Démarre la surveillance : métriques toutes les 5s + planifie 1ère panne
  start() {
    this._initMetrics();
    this.metricsTimer = setInterval(() => this._updateMetrics(), 5000);
    this._scheduleFault();
    console.log(`[IoT] ${this.name} — surveillance démarrée (client ${this.clientId})`);
  }

  // Arrête proprement les timers (appelé si le client se déconnecte)
  stop() {
    if (this.faultTimer)   clearTimeout(this.faultTimer);
    if (this.metricsTimer) clearInterval(this.metricsTimer);
    console.log(`[IoT] ${this.name} — surveillance arrêtée`);
  }

  // Déclenche une panne manuellement ou depuis _scheduleFault
  // → émet 'fault' que routes/iot.js écoute via wm.on('fault', handler)
  triggerFault(faultType) {
    this.status = 'fault';
    this.emit('fault', {
      deviceId:   this.id,
      deviceName: this.name,
      deviceType: this.type,
      clientId:   this.clientId,   // Identique à prisma.utilisateur.id du client
      faultType,                   // ex: "surchauffe", "fuite_eau"
      severity:   this._getSeverity(faultType), // "urgent" | "normal"
      timestamp:  new Date().toISOString(),
      metrics:    { ...this.metrics }, // Snapshot des capteurs au moment de la panne
    });
  }

  // Remet l'appareil en état normal après intervention du prestataire
  // Appelé depuis POST /api/iot/resolve-fault
  resolveIfActive() {
    if (this.status === 'fault') {
      this.status = 'normal';
      this._initMetrics();
      console.log(`[IoT] ${this.name} — panne résolue, retour à la normale`);
    }
  }

  // Pannes urgentes = celles qui génèrent une demande de service urgente
  // Correspond au champ isUrgent de votre modèle Prisma Demande
  _getSeverity(faultType) {
    const urgentes = ['surchauffe', 'fuite_eau', 'court_circuit', 'fuite_refrigerant'];
    return urgentes.includes(faultType) ? 'urgent' : 'normal';
  }

  // Planifie une panne aléatoire dans 30 à 90 secondes
  // Se rappelle lui-même pour simuler des pannes récurrentes
  _scheduleFault() {
    const delayMs = 30000 + Math.random() * 60000; // Entre 30s et 90s
    this.faultTimer = setTimeout(() => {
      if (this.status === 'normal') {
        const fault = this._pickFault();
        this.triggerFault(fault);
      }
      this._scheduleFault(); // Planifie la panne suivante
    }, delayMs);
  }

  // Méthodes abstraites — surchargées dans WashingMachine et Refrigerator
  _initMetrics()   {}
  _updateMetrics() {}
  _pickFault()     { return 'erreur_generique'; }
}


// ─── Machine à laver ─────────────────────────────────────────────────────────
class WashingMachine extends ApplianceSimulator {

  constructor(clientId) {
    super(
      'wm-001',                      // deviceId fixe
      'Machine à laver Samsung WW90T', // deviceName affiché dans les notifs
      'washing_machine',             // deviceType
      clientId                       // clientId Prisma
    );
    this._initMetrics();
  }

  // Valeurs initiales normales (appelé au start() et après resolveIfActive)
  _initMetrics() {
    this.metrics = {
      temperature: 20 + Math.random() * 5,  // 20–25°C au repos
      vibration:   Math.random() * 10,       // 0–10 Hz au repos
      waterLevel:  0,
      rpm:         0,
      cycle:       'idle',
      errorCode:   null,
    };
  }

  // Mise à jour toutes les 5s
  // En état normal  : légères variations aléatoires réalistes
  // En état fault   : température et vibration qui montent progressivement
  _updateMetrics() {
    if (this.status === 'normal') {
      this.metrics.temperature += (Math.random() - 0.48) * 2;
      this.metrics.temperature  = Math.max(18, Math.min(40, this.metrics.temperature));
      this.metrics.vibration    = Math.random() * 15;
    } else {
      // Simulation d'une panne active : les valeurs dérivent vers le danger
      this.metrics.temperature += 3;  // Surchauffe progressive
      this.metrics.vibration   += 5;  // Vibrations qui s'emballent
    }
    // Émet les métriques → routes/iot.js → Socket.io → useIoTAlerts (React Native)
    this.emit('metrics', { deviceId: this.id, metrics: { ...this.metrics } });
  }

  // 5 types de pannes possibles pour la machine à laver
  _pickFault() {
    const pannes = [
      'surchauffe',          // Urgente → catégorie Électricité
      'fuite_eau',           // Urgente → catégorie Plomberie
      'vibration_excessive', // Normale → Réparation électroménager
      'blocage_tambour',     // Normale → Réparation électroménager
      'erreur_vidange',      // Normale → Plomberie
    ];
    return pannes[Math.floor(Math.random() * pannes.length)];
  }
}


// ─── Réfrigérateur ────────────────────────────────────────────────────────────
class Refrigerator extends ApplianceSimulator {

  constructor(clientId) {
    super(
      'fr-001',
      'Réfrigérateur LG GBB72PZEFN',
      'refrigerator',
      clientId
    );
    this._initMetrics();
  }

  _initMetrics() {
    this.metrics = {
      fridgeTemp:      4  + Math.random() * 2,   // Normal : 4–6°C
      freezerTemp:   -18  + Math.random() * 2,   // Normal : -18 à -16°C
      compressorLoad:  30 + Math.random() * 20,  // Normal : 30–50%
      doorOpenCount:   0,
      defrostCycle:    false,
      errorCode:       null,
    };
  }

  _updateMetrics() {
    if (this.status === 'normal') {
      this.metrics.fridgeTemp    += (Math.random() - 0.5) * 0.3;
      this.metrics.fridgeTemp     = Math.max(2,  Math.min(8,   this.metrics.fridgeTemp));
      this.metrics.freezerTemp   += (Math.random() - 0.5) * 0.2;
      this.metrics.freezerTemp    = Math.max(-22, Math.min(-14, this.metrics.freezerTemp));
      this.metrics.compressorLoad = 30 + Math.random() * 20;
    } else {
      // Panne : températures qui montent = aliments en danger, compresseur saturé
      this.metrics.fridgeTemp    += 1.5;
      this.metrics.freezerTemp   += 2;
      this.metrics.compressorLoad = 95 + Math.random() * 5; // Compresseur à bloc
    }
    this.emit('metrics', { deviceId: this.id, metrics: { ...this.metrics } });
  }

  // 5 types de pannes possibles pour le réfrigérateur
  _pickFault() {
    const pannes = [
      'compresseur_defaillant', // Urgente → Électricité
      'temperature_elevee',     // Urgente → Réparation électroménager
      'fuite_refrigerant',      // Urgente → Électricité
      'givre_excessif',         // Normale → Réparation électroménager
      'ventilateur_bloque',     // Normale → Réparation électroménager
    ];
    return pannes[Math.floor(Math.random() * pannes.length)];
  }
}

module.exports = { WashingMachine, Refrigerator };