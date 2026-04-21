function verifierRole(role) {
    return (req, res, next) => {
        if (req.userRole !== role) {
            return res.status(403).json({ 
                erreur: 'Acces interdit' 
            });
        }
        next();
    }
}

module.exports = verifierRole;