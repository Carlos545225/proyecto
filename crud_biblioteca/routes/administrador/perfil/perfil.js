const express = require('express');
const router = express.Router();
const { isAuthenticated, isBibliotecarioOrAdmin } = require('../../login/login');

// Ruta principal del perfil
router.get('/', isAuthenticated, isBibliotecarioOrAdmin, (req, res) => {
    res.render('admin/perfil/index', { active: 'perfil' });
});

module.exports = router;
