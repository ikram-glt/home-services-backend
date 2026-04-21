const router = require('express').Router();
const pool=require('../config/db');
const verifierToken = require('../middlewares/verifierToken');
router.post('/',verifierToken,async(req,res)=>{
    try{
        const {user_id,booking_id,description}=req.body
        if(!description){
            return res.status(400).json({erreur:'description obligatoire'})
        }
        const review= await pool.query('INSERT INTO reclamations (user_id, booking_id, description) VALUES ($1, $2, $3) RETURNING * ',[user_id, booking_id, description])
        res.status(201).json(review.rows[0])
    }catch(err){
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
})

router.get('/', verifierToken,async(req,res)=>{
    try{
        const userId=req.userId
        const result=await pool.query('SELECT * FROM reclamations WHERE user_id = $1 ORDER BY created_at DESC',[userId])
        res.json(result.rows)
    }catch(err){
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
})

module.exports = router;