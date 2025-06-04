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
                if (err) reject(err);
                resolve(results[0].total);
            });
        });

        // Obtener los 8 libros más recientes con información relacionada
        const librosRecientes = await new Promise((resolve, reject) => {
            db.query(`
                SELECT l.*, 
                       a.nombre_completo as autor_nombre,
                       c.nombre as categoria_nombre
                FROM libros l
                LEFT JOIN autores a ON l.autor_id = a.id
                LEFT JOIN categorias c ON l.categoria_id = c.id
                WHERE l.estado = true
                ORDER BY l.fecha_registro DESC
                LIMIT 8
            `, (err, results) => {
                if (err) reject(err);
                resolve(results);
            });
        });

        res.render('admin/panel', { 
            active: 'panel',
            totalLibros,
            librosRecientes
        });
    } catch (error) {
        console.error('Error al cargar el panel:', error);
        res.render('admin/panel', { 
            active: 'panel',
            totalLibros: 0,
            librosRecientes: [],
            error: 'Error al cargar los datos del panel'
        });
    }
});

module.exports = router; 