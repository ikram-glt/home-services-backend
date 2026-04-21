const router = require('express').Router();
const pool=require('../config/db');
router.get('/',async(req,res)=>{
    try{
        const {categorie,prix_max}= req.query;
        let resultat;
        if(categorie && prix_max){
            resultat=await pool.query('SELECT * FROM services WHERE categorie = $1 AND prix <= $2 ORDER BY id',[categorie,prix_max]);
        } else if(categorie){
            resultat=await pool.query('SELECT * FROM services WHERE categorie = $1 ORDER BY id', [categorie]);
        }else if(prix_max){
            resultat= await pool.query('SELECT * FROM services WHERE prix<= $1 ORDER BY id',[prix_max]);
        } else{
            resultat= await pool.query('SELECT * FROM services ORDER BY id');
        }
        res.json(resultat.rows)
    }catch(err){
        console.error(err)
        res.status(500).json({erreur:'Erreur serveur'})
    }
})
router.get('/:id',async(req,res)=>{
    try{
        const id=req.params.id
        const recherch= await pool.query('SELECT * FROM services WHERE id=$1',[id])
        if(recherch.rows.length===0){
            return res.status(404).json({erreur:'service introuvable'})
        }
        res.json(recherch.rows[0])
    }catch(err){
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
})
router.post('/',async(req,res)=>{
    try{
        const {nom,description,categorie,prix}=req.body
        if(!nom || !prix){
            return res.status(400).json({erreur:'nom et prix obligatoires'})
        }
        const service= await pool.query('INSERT INTO services (nom,description,categorie,prix) VALUES ($1,$2,$3,$4) RETURNING nom,description,categorie,prix',[nom,description,categorie,prix])
        res.status(201).json(service.rows[0])

    }catch(err){
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
})
router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await pool.query('DELETE FROM services WHERE id = $1', [id]);
        res.json({ message: 'Service supprime !' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await pool.query('DELETE FROM services WHERE id = $1', [id]);
        res.json({ message: 'Service supprime !' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
});
module.exports = router;