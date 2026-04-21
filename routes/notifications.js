const router = require('express').Router();
const pool=require('../config/db');
const verifierToken = require('../middlewares/verifierToken');
router.get('/', verifierToken,async(req,res)=>{
    try{
        const userId=req.userId
        const result= await pool.query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',[userId])
        res.json(result.rows)
    }catch(err){
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
})
router.patch('/:id', verifierToken,async(req,res)=>{
    try{
        const id=req.params.id
        const update=await pool.query('UPDATE notifications SET lu = true WHERE id = $1 RETURNING *',[id])
        res.json(update.rows[0])

    }catch(err){
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
})

module.exports = router;
