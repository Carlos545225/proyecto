const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../../login/login');

// Ruta principal de usuarios
router.get('/', isAuthenticated, isAdmin, (req, res) => {
    res.render('admin/usuarios/index', { active: 'usuarios' });
});

module.exports = router; 