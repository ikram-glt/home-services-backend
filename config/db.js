const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

pool.connect()
    .then(() => console.log('PostgreSQL connecte !'))
    .catch(err => console.error('Erreur connexion BDD :', err));

module.exports = pool;