const NIVEAUX_URGENCE = {
  CRITIQUE: { niveau: 3, label: 'Critique', delaiMax: 30 },
  HAUTE:    { niveau: 2, label: 'Haute',    delaiMax: 120 },
  NORMALE:  { niveau: 1, label: 'Normale',  delaiMax: 1440 },
};

const MOTS_CLES = {
  critique: [
    'fuite', 'incendie', 'inondation', 'panne totale',
    'urgence', 'danger', 'explosion', 'court-circuit',
  ],
  haute: [
    'casse', 'urgent', 'rapide', 'immediat',
    'probleme grave', 'ne fonctionne plus', 'en panne',
  ],
};

function classerUrgence(description) {
  const texte = description.toLowerCase();
  if (MOTS_CLES.critique.some((mot) => texte.includes(mot)))
    return NIVEAUX_URGENCE.CRITIQUE;
  if (MOTS_CLES.haute.some((mot) => texte.includes(mot)))
    return NIVEAUX_URGENCE.HAUTE;
  return NIVEAUX_URGENCE.NORMALE;
}

module.exports = { classerUrgence, NIVEAUX_URGENCE };