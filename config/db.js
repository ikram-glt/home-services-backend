const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:ycKKQtKvuSsgNZbJHiSrsmuEfxdbSVUm@postgres.railway.internal:5432/railway',
    ssl: false
});

pool.connect()
    .then(() => console.log('PostgreSQL connecte !'))
    .catch(err => console.error('Erreur connexion BDD :', err));

module.exports = pool;