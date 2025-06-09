const express = require('express');
const router = express.Router();
const { isAuthenticated, isBibliotecarioOrAdmin } = require('../../login/login');
const db = require('../../../lib/db');

// Ruta principal del panel de administración
router.get('/', isAuthenticated, isBibliotecarioOrAdmin, async (req, res) => {
    try {
        // Obtener el total de libros activos
        const totalLibros = await new Promise((resolve, reject) => {
            db.query('SELECT COUNT(*) as total FROM libros WHERE estado = true', (err, results) => {
                if (err) {
                    console.error('Error al obtener total de libros:', err);
                    resolve(0);
                } else {
                    resolve(results[0].total || 0);
                }
            });
        });

        // Obtener el total de préstamos
        const totalPrestamos = await new Promise((resolve, reject) => {
            db.query('SELECT COUNT(*) as total FROM prestamos', (err, results) => {
                if (err) {
                    console.error('Error al obtener total de préstamos:', err);
                    resolve(0);
                } else {
                    resolve(results[0].total || 0);
                }
            });
        });

        // Obtener libros recientes
        const librosRecientes = await new Promise((resolve, reject) => {
            db.query(`
                SELECT l.*, 
                       a.nombre_completo as autor_nombre,
                       c.nombre as categoria_nombre,
                       e.nombre as editorial_nombre
                FROM libros l
                LEFT JOIN autores a ON l.autor_id = a.id
                LEFT JOIN categorias c ON l.categoria_id = c.id
                LEFT JOIN editoriales e ON l.editorial_id = e.id
                WHERE l.estado = true
                ORDER BY l.fecha_registro DESC
                LIMIT 5
            `, (err, results) => {
                if (err) {
                    console.error('Error al obtener libros recientes:', err);
                    resolve([]);
                } else {
                    resolve(results || []);
                }
            });
        });

        res.render('admin/panel', { 
            active: 'panel',
            totalLibros,
            totalPrestamos,
            librosRecientes,
            user: req.session.user
        });
    } catch (error) {
        console.error('Error en el panel:', error);
        res.status(500).render('error', {
            message: 'Error en el servidor',
            error: { status: 500, stack: error.message },
            layout: false
        });
    }
});

module.exports = router; 