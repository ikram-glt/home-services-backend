const router = require('express').Router();
const pool=require('../config/db');
const verifierToken = require('../middlewares/verifierToken');
router.patch('/:id',verifierToken,async(req,res)=>{
    try{
        const id=req.params.id
        const {nom,email}=req.body
        const update= await pool.query(`UPDATE users
            SET nom=$1, email=$2
            WHERE id=$3
            RETURNING id, nom, email, role, created_at`,[nom,email,id])
        res.json(update.rows[0])
    }catch(err){
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
})
module.exports = router;