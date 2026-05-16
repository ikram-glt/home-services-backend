// keep-alive.js
const https = require('https');

const URL = 'home-services-backend-1fl1.onrender.com';

setInterval(() => {
  https.get(`https://${URL}`, (res) => {
    console.log(`[Keep-alive] Status: ${res.statusCode}`);
  }).on('error', (err) => {
    console.error('[Keep-alive] Erreur:', err.message);
  });
}, 10 * 60 * 1000); // toutes les 10 minutes

module.exports = { startKeepAlive: () => console.log('[Keep-alive] Demarre') };