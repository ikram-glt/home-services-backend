// Dotenv uniquement en local (pas sur Railway)
if (!process.env.RAILWAY_ENVIRONMENT) {
  require('dotenv').config();
}

const express = require('express');
const cors = require('cors');
const http = require('http');

const app = express();

// Configuration CORS
app.use(cors({ origin: "*" }));
app.use(express.json());

// Création du serveur HTTP (nécessaire pour Socket.io)
const server = http.createServer(app);

// Initialisation de Socket.io
const { initSocket } = require('./middlewares/socket');
const io = initSocket(server);
app.set('io', io);

// Connexion à la base de données
require('./config/db');

// --- IMPORTATION DES ROUTES ---
const authRouter = require('./routes/auth');
const servicesRouter = require('./routes/services');
const bookingsRouter = require('./routes/bookings');
const prestatairesRouter = require('./routes/prestataires');
const adminRouter = require('./routes/admin');
const reviewsRouter = require('./routes/reviews');
const usersRouter = require('./routes/users');
const reclamationsRouter = require('./routes/reclamations');
const notificationsRouter = require('./routes/notifications');
const recommendationsRouter = require('./routes/recommendations');
const iotRouter = require('./routes/iot');
const forgotRouter = require('./routes/forgot');
const adressesRouter = require('./routes/adresses');
const adminStatsRoutes = require('./src/routes/adminStats');
const communicationsRoutes = require('./src/routes/communications');

// --- ENREGISTREMENT DES ROUTES ---
app.use('/api/admin', adminStatsRoutes);
app.use('/api/communications', communicationsRoutes);
app.use('/api/auth', authRouter);
app.use('/api/services', servicesRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/prestataires', prestatairesRouter);
app.use('/api/admin', adminRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/users', usersRouter);
app.use('/api/reclamations', reclamationsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/recommendations', recommendationsRouter);
app.use('/api/iot', iotRouter);
app.use('/api/forgot', forgotRouter);
app.use('/api/adresses', adressesRouter);

app.get('/', (req, res) => {
    res.json({ message: 'API HomeServices opérationnelle !' });
});

// --- LANCEMENT DU SERVEUR ---
const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Serveur démarré sur port ${PORT}`);
    console.log(`🚀 Socket.io est prêt`);
});