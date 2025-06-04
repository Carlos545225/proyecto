const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../../login/login');
const adminRoutes = require('./admin/admin');
const db = require('../../../lib/db');

// Ruta principal de usuarios
router.get('/', isAuthenticated, isAdmin, async (req, res) => {
    try {
        // Obtener parámetros de la solicitud
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;
        const busqueda = req.query.busqueda || '';
        
        // Objeto para almacenar todos los datos
        const data = {
            administradores: [],
            paginacion: {
                pagina: page,
                totalPaginas: 0,
                total: 0,
                inicio: 0,
                fin: 0
            },
            busqueda,
            active: 'usuarios',
            success: req.session && req.session.success ? req.session.success : '',
            error: req.session && req.session.error ? req.session.error : ''
        };
        
        // Limpiar mensajes de sesión después de usarlos
        if (req.session) {
            req.session.success = '';
            req.session.error = '';
        }

        // Construir la consulta base
        let query = `
            SELECT * FROM administradores 
            WHERE estado = true
        `;
        let countQuery = 'SELECT COUNT(*) as total FROM administradores WHERE estado = true';
        const queryParams = [];
        const countQueryParams = [];

        // Agregar búsqueda si existe
        if (busqueda) {
            const searchCondition = `
                AND (
                    nombre LIKE ? OR 
                    apellidos LIKE ? OR 
                    email LIKE ? OR 
                    numero_documento LIKE ?
                )
            `;
            const searchParam = `%${busqueda}%`;
            query += searchCondition;
            countQuery += searchCondition;
            queryParams.push(searchParam, searchParam, searchParam, searchParam);
            countQueryParams.push(searchParam, searchParam, searchParam, searchParam);
        }

        // Obtener total de registros
        const totalResult = await new Promise((resolve, reject) => {
            db.query(countQuery, countQueryParams, (err, results) => {
                if (err) reject(err);
                resolve(results[0].total);
            });
        });

        const totalPaginas = Math.ceil(totalResult / limit);
        
        // Agregar ordenamiento y límite
        query += ' ORDER BY fecha_registro DESC LIMIT ? OFFSET ?';
        queryParams.push(limit, offset);

        // Obtener administradores
        const administradores = await new Promise((resolve, reject) => {
            db.query(query, queryParams, (err, results) => {
                if (err) reject(err);
                resolve(results);
            });
        });

        // Actualizar datos de paginación
        data.administradores = administradores;
        data.paginacion = {
            pagina: page,
            totalPaginas: totalPaginas,
            total: totalResult,
            inicio: offset + 1,
            fin: Math.min(offset + limit, totalResult)
        };

        res.render('admin/usuarios/index', data);
    } catch (error) {
        console.error('Error al cargar lista de administradores:', error);
        if (req.session) req.session.error = 'Error al cargar la lista de administradores';
        res.render('admin/usuarios/index', {
            active: 'usuarios',
            administradores: [],
            paginacion: {
                pagina: 1,
                totalPaginas: 0,
                total: 0,
                inicio: 0,
                fin: 0
            },
            busqueda: '',
            error: 'Error al cargar la lista de administradores'
        });
    }
});

// Usar las rutas de administrador
router.use('/administrador', adminRoutes);

module.exports = router; 