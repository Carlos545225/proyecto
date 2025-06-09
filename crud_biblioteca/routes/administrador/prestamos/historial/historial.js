const express = require('express');
const router = express.Router();
const { isAuthenticated, isBibliotecarioOrAdmin } = require('../../../login/login');
const db = require('../../../../lib/db');

// Ruta para ver el historial de préstamos
router.get('/', isAuthenticated, isBibliotecarioOrAdmin, (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const busqueda = req.query.busqueda || '';

    const query = `
        SELECT p.*, 
               CONCAT(l.nombre, ' ', l.apellidos) as lector_nombre,
               li.titulo as libro_titulo,
               'Devuelto' as estado
        FROM prestamos p
        JOIN lectores l ON p.lector_id = l.id
        JOIN libros li ON p.libro_id = li.id
        WHERE p.fecha_devolucion_real IS NOT NULL
        AND (l.nombre LIKE ? OR l.apellidos LIKE ? OR li.titulo LIKE ?)
        ORDER BY p.fecha_devolucion_real DESC
        LIMIT ? OFFSET ?
    `;

    const countQuery = `
        SELECT COUNT(*) as total
        FROM prestamos p
        JOIN lectores l ON p.lector_id = l.id
        JOIN libros li ON p.libro_id = li.id
        WHERE p.fecha_devolucion_real IS NOT NULL
        AND (l.nombre LIKE ? OR l.apellidos LIKE ? OR li.titulo LIKE ?)
    `;

    const searchParams = [`%${busqueda}%`, `%${busqueda}%`, `%${busqueda}%`];
    const queryParams = [...searchParams, limit, offset];

    db.query(countQuery, searchParams, (err, results) => {
        if (err) {
            console.error('Error al contar registros:', err);
            return res.status(500).render('error', {
                message: 'Error al cargar el historial de préstamos',
                error: process.env.NODE_ENV === 'development' ? err : {},
                layout: false
            });
        }

        const total = results[0].total || 0;
        const totalPaginas = Math.ceil(total / limit);

        db.query(query, queryParams, (err, results) => {
            if (err) {
                console.error('Error al obtener registros:', err);
                return res.status(500).render('error', {
                    message: 'Error al cargar el historial de préstamos',
                    error: process.env.NODE_ENV === 'development' ? err : {},
                    layout: false
                });
            }

            res.render('admin/prestamos/historial/index', {
                active: 'prestamos',
                historial: results || [],
                paginacion: {
                    pagina: page,
                    totalPaginas,
                    total,
                    inicio: offset + 1,
                    fin: Math.min(offset + limit, total)
                },
                filtros: { busqueda }
            });
        });
    });
});

module.exports = router;
