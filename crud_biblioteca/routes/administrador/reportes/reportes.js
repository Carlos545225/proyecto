const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../../login/login');

// Ruta principal de reportes
router.get('/', isAuthenticated, isAdmin, (req, res) => {
    res.render('admin/reportes/index', { active: 'reportes' });
});

module.exports = router;
