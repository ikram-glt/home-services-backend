const express = require('express');
const cors = require('cors');
const http    = require('http');
require('dotenv').config();
const app= express();
const server = http.createServer(app); // ← créer un serveur HTTP
app.use(express.json());
app.use(cors());
const { initSocket } = require('./middlewares/socket');
const io = initSocket(server); // ← initialiser avec le serveur HTTP
app.set('io', io);
require('./config/db')

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