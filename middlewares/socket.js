const { Server } = require('socket.io');
const pool = require('../config/db');

const DECISION_TIMEOUT_MS = 5 * 60 * 1000;

const initSocket = (server) => {
    const io = new Server(server, {
        cors: { origin: '*', methods: ['GET', 'POST'] }
    });

    const pendingDemandes = new Map();

    io.on('connection', (socket) => {
        console.log(`[Socket] Connecte : ${socket.id}`);

        // Client rejoint sa room privée
        socket.on('join', ({ clientId }) => {
            socket.join(`client_${clientId}`);
            socket.data.clientId = clientId;
            console.log(`[Socket] Client ${clientId} → room client_${clientId}`);
        });

        // ── CHAT EN TEMPS RÉEL ──
        socket.on('join_booking', ({ bookingId, userId }) => {
            socket.join(`booking_${bookingId}`);
            console.log(`[Chat] User ${userId} rejoint booking_${bookingId}`);
        });

        socket.on('envoyer_message', async ({ bookingId, senderId, receiverId, contenu }) => {
            try {
                const result = await pool.query(`
                    INSERT INTO messages (booking_id, sender_id, receiver_id, contenu)
                    VALUES ($1, $2, $3, $4) RETURNING *
                `, [bookingId, senderId, receiverId, contenu]);

                const message = result.rows[0];

                // Récupérer le nom de l'expéditeur
                const userResult = await pool.query(
                    'SELECT nom FROM users WHERE id=$1', [senderId]
                );
                const senderNom = userResult.rows[0]?.nom || 'Inconnu';

                // Émettre à tous dans la room
                io.to(`booking_${bookingId}`).emit('nouveau_message', {
                    ...message,
                    sender_nom: senderNom
                });

                // Notification au destinataire
                await pool.query(
                    'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
                    [receiverId, `Nouveau message de ${senderNom}`]
                );

            } catch (err) {
                console.error('[Chat] Erreur:', err);
                socket.emit('erreur_message', { message: 'Erreur envoi message' });
            }
        });

        socket.on('leave_booking', ({ bookingId }) => {
            socket.leave(`booking_${bookingId}`);
        });

        // ── IOT ──
        socket.on('client:accepter_demande', async ({ demandeId }) => {
            const entry = pendingDemandes.get(demandeId);
            if (!entry) {
                socket.emit('iot:erreur', { message: 'Demande introuvable ou expiree.' });
                return;
            }

            clearTimeout(entry.timer);
            pendingDemandes.delete(demandeId);

            const { demande } = entry;

            try {
                const result = await pool.query(
                    `INSERT INTO bookings (user_id, service_id, date, heure, status) 
                     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                    [
                        demande.clientId,
                        demande.serviceId || 1,
                        new Date().toISOString().split('T')[0],
                        new Date().toTimeString().split(' ')[0],
                        'en_attente'
                    ]
                );

                const nouvelleReservation = result.rows[0];

                await pool.query(
                    'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
                    [demande.clientId, `Votre demande IoT a ete enregistree !`]
                );

                io.to(`client_${demande.clientId}`).emit('iot:demande_confirmee', {
                    demandeId,
                    reservationId: nouvelleReservation.id,
                    status: 'acceptee',
                    message: 'Votre demande a ete enregistree. Nous recherchons un prestataire.',
                    demande: { ...demande, status: 'acceptee' }
                });

            } catch (error) {
                console.error('[IoT] Erreur PostgreSQL :', error);
                socket.emit('iot:erreur', { message: 'Erreur lors de la creation de la demande.' });
            }
        });

        socket.on('client:refuser_demande', ({ demandeId, raison }) => {
            const entry = pendingDemandes.get(demandeId);
            if (!entry) return;

            clearTimeout(entry.timer);
            pendingDemandes.delete(demandeId);

            const { demande } = entry;

            io.to(`client_${demande.clientId}`).emit('iot:demande_refusee', {
                demandeId,
                status: 'refusee',
                raison: raison || 'Refuse par le client',
                message: "Demande annulee."
            });
        });

        socket.on('iot:panne_detectee', async ({ clientId, deviceId, faultType, description }) => {
            const demandeId = `iot_${Date.now()}`;
            const demande = { id: demandeId, clientId, deviceId, faultType, description, createdAt: new Date() };

            io.to(`client_${clientId}`).emit('iot:notification', {
                title: `Panne detectee : ${faultType}`,
                body: description, deviceId, demandeId
            });

            setTimeout(() => {
                const timer = setTimeout(() => {
                    pendingDemandes.delete(demandeId);
                    io.to(`client_${clientId}`).emit('iot:demande_expiree', {
                        demandeId, message: 'Demande expiree apres 5 minutes.'
                    });
                }, DECISION_TIMEOUT_MS);

                pendingDemandes.set(demandeId, { demande, timer, clientId });
                io.to(`client_${clientId}`).emit('iot:demande_proposee', demande);
            }, 2000);
        });

        socket.on('disconnect', () => {
            console.log(`[Socket] Deconnecte : ${socket.id}`);
        });
    });

    return io;
};

module.exports = { initSocket };