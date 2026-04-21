const router = require('express').Router();
const pool=require('../config/db');
const verifierToken = require('../middlewares/verifierToken');
router.post('/',verifierToken,async(req,res)=>{
    try{
        const {user_id,service_id,note, commentaire}=req.body;
        if(!user_id || !service_id || !note){
            return res.status(400).json({erreur:'donnees manquantes'})
        }
        const avis = await pool.query(`INSERT INTO reviews (user_id, service_id, note, commentaire)
            VALUES ($1, $2, $3, $4)
            RETURNING *`,[user_id,service_id,note, commentaire])
        res.status(201).json(avis.rows[0])
    }catch(err){
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
})
router.get('/prestataire/:id',async(req,res)=>{
    try{
        const id=req.params.id;
        const reviews= await pool.query(`SELECT r.*,u.nom as clients_nom
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.service_id = $1
            ORDER BY r.created_at DESC`,[id])
        res.json(reviews.rows)
    }catch(err){
        console.error(err)
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
})
router.get('/', async (req, res) => {
    try {
        const reviews = await pool.query(`
            SELECT r.*, u.nom as client_nom
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            ORDER BY r.created_at DESC
        `);
        res.json(reviews.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
});
module.exports = router;