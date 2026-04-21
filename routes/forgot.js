const router = require('express').Router();
const pool = require('../config/db');

const crypto = require('crypto');

// Stocker les OTP temporairement
const otpStore = {};

// Configurer le transporteur email
const { createTransport } = require('nodemailer');

const transporter = createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// POST /api/forgot/send-otp
router.post('/send-otp', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ erreur: 'Email obligatoire' });

        // Vérifier si l'email existe
        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (user.rows.length === 0) {
            return res.status(404).json({ erreur: 'Aucun compte avec cet email' });
        }

        // Générer OTP 6 chiffres
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Stocker OTP avec expiration 10 minutes
        otpStore[email] = {
            otp,
            expiry: Date.now() + 10 * 60 * 1000
        };

        // Envoyer email
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'HomeServices - Code de réinitialisation',
            html: `
                <h2>Réinitialisation de mot de passe</h2>
                <p>Votre code de vérification est :</p>
                <h1 style="color: #174EA6; font-size: 40px; letter-spacing: 10px">${otp}</h1>
                <p>Ce code expire dans 10 minutes.</p>
                <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
            `
        });

        res.json({ message: 'Code envoyé par email !' });
    } catch (err) {
        console.error('Erreur send-otp:', err);
        res.status(500).json({ erreur: 'Impossible d envoyer l email' });
    }
});

// POST /api/forgot/verify-otp
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        const stored = otpStore[email];
        if (!stored) {
            return res.status(400).json({ erreur: 'Aucun code demande pour cet email' });
        }
        if (Date.now() > stored.expiry) {
            delete otpStore[email];
            return res.status(400).json({ erreur: 'Code expire' });
        }
        if (stored.otp !== otp) {
            return res.status(400).json({ erreur: 'Code incorrect' });
        }

        // Marquer comme vérifié
        otpStore[email].verified = true;
        res.json({ message: 'Code correct !' });
    } catch (err) {
        console.error('Erreur verify-otp:', err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
});

// POST /api/forgot/reset-password
router.post('/reset-password', async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        const stored = otpStore[email];
        if (!stored || !stored.verified) {
            return res.status(400).json({ erreur: 'Verification non completee' });
        }

        // Hasher le nouveau mot de passe
        const bcrypt = require('bcrypt');
        const hash = await bcrypt.hash(newPassword, 10);

        // Mettre à jour le mot de passe
        await pool.query(
            'UPDATE users SET password = $1 WHERE email = $2',
            [hash, email]
        );

        // Supprimer OTP
        delete otpStore[email];

        res.json({ message: 'Mot de passe mis a jour !' });
    } catch (err) {
        console.error('Erreur reset-password:', err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
});

module.exports = router;