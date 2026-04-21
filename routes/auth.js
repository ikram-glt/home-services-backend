const router= require('express').Router();
const bcrypt = require('bcrypt');
const jwt=require('jsonwebtoken');
const pool=require('../config/db');

router.post('/register',async(req,res)=>{
    try{
        const {nom,email,password,role,specialite}=req.body;
        
        if(!nom || !email || !password){
            return res.status(400).json({erreur:'le nom , email et password sont obligatoire'});
        }
        const rolesAutorises=['client','prestataire'];
        if(!rolesAutorises.includes(role)){
            return res.status(400).json({erreur:'role invalide'})
        }
        const existant= await pool.query('SELECT * FROM users WHERE email=$1',[email]);
        if (existant.rows.length >0){
            return res.status(400).json({erreur:'Email deja utilise'});
        }
        const hash= await bcrypt.hash(password,10)
        const result= await pool.query('INSERT INTO users (nom,email,password,role) VALUES ($1,$2,$3,$4) RETURNING id,nom,email',[nom,email,hash,role]);
        // Après avoir créé le user
        if (role === 'prestataire') {
            await pool.query(
                'INSERT INTO prestataires (user_id, specialite, disponible) VALUES ($1, $2, $3)',
                [newUser.id, 'General', true]
            );
        }
        res.status(201).json({user:result.rows[0]})
    }
    catch(err){
        console.error(err);
        res.status(500).json({erreur:'Erreur serveur'})
    }
})


router.post('/login',async(req,res)=>{
    try{
        const {email,password}=req.body;
        if(!email || !password){
            return res.status(400).json({erreur:'email et password obligatoire'});
        }
        const cherch= await pool.query('SELECT * FROM users WHERE email=$1',[email]);
        if (cherch.rows.length===0){
            return res.status(404).json({erreur:'utilisateur introuvable'});
        }
        const user=cherch.rows[0];
        const ok=await bcrypt.compare(password,user.password)
        if(!ok){
            return res.status(401).json({erreur:'password incorrecte'})
        }
        const token=jwt.sign(
            {userId:user.id,
             email:user.email,
             role:user.role
            },
            process.env.JWT_SECRET,
            {expiresIn:'7d'}
        )
        res.json({
            token:token,
            user:{id: user.id, nom: user.nom, email: user.email, role: user.role }
        });

    }catch(err){
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
})
module.exports = router;