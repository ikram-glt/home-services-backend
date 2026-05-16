const { Pool } = require('pg');

if (!process.env.RAILWAY_ENVIRONMENT && !process.env.RENDER) {
  require('dotenv').config();
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.RENDER ? { rejectUnauthorized: false } : false
});

pool.connect()
    .then(() => console.log('PostgreSQL connecte !'))
    .catch(err => console.error('Erreur connexion BDD :', err));

module.exports = pool;