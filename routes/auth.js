const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const genererCode = () => Math.floor(100000 + Math.random() * 900000).toString();

router.post('/register', async (req, res) => {
  try {
    const { nom, email, telephone, password, role } = req.body;

    if (!nom || !email || !password) {
      return res.status(400).json({ erreur: 'Champs obligatoires manquants' });
    }

    const rolesAutorises = ['client', 'prestataire'];
    if (!rolesAutorises.includes(role)) {
      return res.status(400).json({ erreur: 'Role invalide' });
    }

    const existant = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    if (existant.rows.length > 0) {
      return res.status(400).json({ erreur: 'Email deja utilise' });
    }

    const hash = await bcrypt.hash(password, 10);
    const code = genererCode();

    const result = await pool.query(
      `INSERT INTO users (nom, email, telephone, password, role, verification_code, is_verified, statut)
       VALUES ($1, $2, $3, $4, $5, $6, false, 'inactif') RETURNING id, nom, email, role`,
      [nom, email, telephone, hash, role, code]
    );

    await transporter.sendMail({
      from: `"HomeServices" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verification de votre compte HomeServices',
      html: `
        <div style="font-family: Arial; max-width: 500px; margin: auto; padding: 30px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #174EA6;">Bienvenue sur HomeServices !</h2>
          <p>Bonjour <strong>${nom}</strong>,</p>
          <p>Votre code de verification est :</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 36px; font-weight: bold; color: #174EA6; letter-spacing: 10px;">${code}</span>
          </div>
          <p style="color: #666;">Ce code expire dans 10 minutes.</p>
        </div>
      `
    });

    res.status(201).json({
      message: 'Code de verification envoye par email',
      userId: result.rows[0].id,
      email: email
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const { userId, code } = req.body;

    const result = await pool.query('SELECT * FROM users WHERE id=$1', [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ erreur: 'Utilisateur non trouve' });
    }

    const user = result.rows[0];
    if (user.verification_code !== code) {
      return res.status(400).json({ erreur: 'Code incorrect' });
    }

    await pool.query(
      `UPDATE users SET is_verified=true, statut='actif', verification_code=null WHERE id=$1`,
      [userId]
    );

    const secret = process.env.JWT_SECRET || 'homeservices_secret_key_2026';
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user.id, nom: user.nom, email: user.email, role: user.role }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

router.post('/resend', async (req, res) => {
  try {
    const { userId } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE id=$1', [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ erreur: 'Utilisateur non trouve' });
    }

    const user = result.rows[0];
    const code = genererCode();

    await pool.query('UPDATE users SET verification_code=$1 WHERE id=$2', [code, userId]);

    await transporter.sendMail({
      from: `"HomeServices" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Nouveau code de verification HomeServices',
      html: `
        <div style="font-family: Arial; max-width: 500px; margin: auto; padding: 30px;">
          <h2 style="color: #174EA6;">Nouveau code de verification</h2>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 36px; font-weight: bold; color: #174EA6; letter-spacing: 10px;">${code}</span>
          </div>
        </div>
      `
    });

    res.json({ message: 'Nouveau code envoye' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ erreur: 'email et password obligatoire' });
    }

    const cherch = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    if (cherch.rows.length === 0) {
      return res.status(404).json({ erreur: 'utilisateur introuvable' });
    }

    const user = cherch.rows[0];

    if (!user.is_verified) {
      return res.status(403).json({
        erreur: 'Compte non verifie',
        userId: user.id,
        needsVerification: true
      });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ erreur: 'password incorrecte' });
    }

    const secret = process.env.JWT_SECRET || 'homeservices_secret_key_2026';
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user.id, nom: user.nom, email: user.email, role: user.role }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

module.exports = router;