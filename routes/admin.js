const router = require('express').Router();
const pool=require('../config/db');
const verifierToken = require('../middlewares/verifierToken');
const verifierRole  = require('../middlewares/role');
router.get('/users',verifierToken, verifierRole('admin'),async(req,res)=>{
    try{
        const cherch=await pool.query(`SELECT id, nom, email, role, created_at 
            FROM users
            ORDER BY created_at DESC`)
        res.json(cherch.rows)

    }catch(err){
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
})
router.get('/bookings',verifierToken, verifierRole('admin'),async(req,res)=>{
    try{
        const reserv=await pool.query(`SELECT b.*, u.nom as client_nom, s.nom as service_nom
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN services s ON b.service_id = s.id
            ORDER BY b.created_at DESC`)
        res.json(reserv.rows)
    }catch(err){
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
})
router.delete('/users/:id', verifierToken, verifierRole('admin'), async (req, res) => {
    try {
        const id = req.params.id;

        // Supprimer dans l'ordre correct
        // 1. Supprimer les réclamations liées aux bookings de l'utilisateur
        await pool.query(`
            DELETE FROM reclamations 
            WHERE booking_id IN (
                SELECT id FROM bookings WHERE user_id = $1
            )
        `, [id]);

        // 2. Supprimer les réclamations directes de l'utilisateur
        await pool.query('DELETE FROM reclamations WHERE user_id = $1', [id]);

        // 3. Supprimer les reviews de l'utilisateur
        await pool.query('DELETE FROM reviews WHERE user_id = $1', [id]);

        // 4. Supprimer les notifications de l'utilisateur
        await pool.query('DELETE FROM notifications WHERE user_id = $1', [id]);

        // 5. Supprimer les bookings de l'utilisateur
        await pool.query('DELETE FROM bookings WHERE user_id = $1', [id]);

        // 6. Supprimer le prestataire si existe
        await pool.query('DELETE FROM prestataires WHERE user_id = $1', [id]);

        // 7. Supprimer l'utilisateur
        await pool.query('DELETE FROM users WHERE id = $1', [id]);

        res.json({ message: 'Utilisateur supprime !' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
});

router.delete('/reviews/:id',verifierToken, verifierRole('admin'),async(req,res)=>{
    try{
        const id=req.params.id
        await pool.query('DELETE FROM reviews WHERE id=$1',[id])
        res.json({message:'avis suppgit push origin mainrime'})
    }catch(err){
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
})

router.get('/reclamations', verifierToken, verifierRole('admin'),async(req,res)=>{
    try{
        const result = await pool.query(`
            SELECT r.*, u.nom as client_nom 
            FROM reclamations r 
            JOIN users u ON r.user_id = u.id 
            ORDER BY r.created_at DESC
        `);
        res.json(result.rows);
    }catch(err){
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
})
router.patch('/reclamations/:id', verifierToken, verifierRole('admin'),async(req,res)=>{
    try{
        const id = req.params.id
        const { statut } = req.body
        const result = await pool.query(
            'UPDATE reclamations SET statut=$1 WHERE id=$2 RETURNING *',
            [statut, id]
        )
        res.json(result.rows[0])
    }catch(err){
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
})
router.delete('/reclamations/:id', verifierToken, verifierRole('admin'), async (req, res) => {
    try {
        const id = req.params.id;
        await pool.query('DELETE FROM reclamations WHERE id = $1', [id]);
        res.json({ message: 'Reclamation supprimee !' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
});
router.get('/reviews', verifierToken, verifierRole('admin'), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT r.*, u.nom as client_nom, s.nom as service_nom
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            JOIN services s ON r.service_id = s.id
            ORDER BY r.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
});
module.exports = router;