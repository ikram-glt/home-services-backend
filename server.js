const express = require('express');
const cors = require('cors');
const http = require('http');

if (!process.env.RAILWAY_ENVIRONMENT && !process.env.RENDER) {
  require('dotenv').config();
}

const app = express();
app.use(cors({ origin: '*' }));
const server = http.createServer(app);
app.use(express.json());

const { initSocket } = require('./middlewares/socket');
const io = initSocket(server);
app.set('io', io);
require('./config/db');

// Keep-alive pour Render
if (process.env.RENDER) {
  const https = require('https');
  setInterval(() => {
    https.get('https://home-services-backend-1fl1.onrender.com', (res) => {
      console.log(`[Keep-alive] ${res.statusCode}`);
    }).on('error', (err) => {
      console.error('[Keep-alive] Erreur:', err.message);
    });
  }, 10 * 60 * 1000);
}

const authRouter=require('./routes/auth')
const servicesRouter=require('./routes/services')
const bookingsRouter=require('./routes/bookings')
const prestatairesRouter = require('./routes/prestataires');
const adminRouter        = require('./routes/admin');
const reviewsRouter = require('./routes/reviews');
const usersRouter = require('./routes/users');
const reclamationsRouter = require('./routes/reclamations');
const notificationsRouter = require('./routes/notifications');
const recommendationsRouter = require('./routes/recommendations');
const iotRouter = require('./routes/iot');
const forgotRouter = require('./routes/forgot');
const adressesRouter = require('./routes/adresses');
const messagesRouter = require('./routes/messages');
app.use('/api/messages', messagesRouter);
app.use('/api/adresses', adressesRouter);
app.use('/api/forgot', forgotRouter);
app.use('/api/iot', iotRouter);
app.use('/api/recommendations', recommendationsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/reclamations', reclamationsRouter);
app.use('/api/users', usersRouter);
app.use('/api/auth',authRouter)
app.use('/api/services',servicesRouter)
app.use('/api/bookings',bookingsRouter)
app.use('/api/prestataires', prestatairesRouter);
app.use('/api/admin',        adminRouter);
app.use('/api/reviews', reviewsRouter);

app.get('/',(req,res)=>{
    res.json({ message: 'API HomeServices operationnelle !' });
});
const port= process.env.PORT || 3000;
server.listen(port, () => { // ← server.listen au lieu de app.listen
    console.log(`Serveur demarre sur http://localhost:${port}`);});