const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../../login/login');
const adminRoutes = require('./admin/admin');
const bibliotecarioRoutes = require('./bibliotecario/bibliotecario');
const db = require('../../../lib/db');

// Ruta principal de usuarios
router.get('/', isAuthenticated, isAdmin, (req, res) => {
    // Obtener parámetros de la solicitud
    const activeTab = req.query.tab || 'administradores';
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const busqueda = req.query.busqueda || '';
    const turno = req.query.turno || '';
    
    // Objeto para almacenar todos los datos
    const data = {
        administradores: [],
        bibliotecarios: [],
        lectores: [],
        paginacion: {
            administradores: {},
            bibliotecarios: {},
            lectores: {}
        },
        filtros: {
            busqueda,
            turno
        },
        active: 'usuarios',
        activeTab,
        busqueda, // Agregar busqueda al nivel raíz
        success: req.session && req.session.success ? req.session.success : '',
        error: req.session && req.session.error ? req.session.error : ''
    };
    
    // Limpiar mensajes de sesión después de usarlos
    if (req.session) {
        req.session.success = '';
        req.session.error = '';
    }

    // Función para manejar errores
    const handleError = (err, message) => {
        console.error(message, err);
        data.error = message;
        res.render('admin/usuarios/index', data);
    };

    // Consulta para administradores
    if (activeTab === 'administradores') {
        let query = 'SELECT * FROM administradores WHERE estado = true';
        let countQuery = 'SELECT COUNT(*) as total FROM administradores WHERE estado = true';
        const queryParams = [];
        const countQueryParams = [];

        // Agregar búsqueda si existe
        if (busqueda) {
            const searchCondition = ' AND (nombre LIKE ? OR apellidos LIKE ? OR email LIKE ? OR numero_documento LIKE ?)';
            query += searchCondition;
            countQuery += searchCondition;
            const searchParam = `%${busqueda}%`;
            queryParams.push(searchParam, searchParam, searchParam, searchParam);
            countQueryParams.push(searchParam, searchParam, searchParam, searchParam);
        }

        // Obtener total de registros
        db.query(countQuery, countQueryParams, (err, results) => {
            if (err) return handleError(err, 'Error al contar administradores');
            
            const total = results[0].total;
            const totalPaginas = Math.ceil(total / limit);
            
            data.paginacion.administradores = {
                pagina: page,
                totalPaginas,
                total,
                inicio: offset + 1,
                fin: Math.min(offset + limit, total)
            };

            // Agregar ordenamiento y límite
            query += ' ORDER BY fecha_registro DESC LIMIT ? OFFSET ?';
            queryParams.push(limit, offset);

            // Obtener registros
            db.query(query, queryParams, (err, results) => {
                if (err) return handleError(err, 'Error al obtener administradores');
                
                data.administradores = results;
                res.render('admin/usuarios/index', data);
            });
        });
    }
    // Consulta para bibliotecarios
    else if (activeTab === 'bibliotecarios') {
        let query = 'SELECT * FROM bibliotecarios WHERE estado = true';
        let countQuery = 'SELECT COUNT(*) as total FROM bibliotecarios WHERE estado = true';
        const queryParams = [];
        const countQueryParams = [];

        // Agregar búsqueda si existe
        if (busqueda) {
            const searchCondition = ' AND (nombre LIKE ? OR apellidos LIKE ? OR email LIKE ? OR numero_documento LIKE ?)';
            query += searchCondition;
            countQuery += searchCondition;
            const searchParam = `%${busqueda}%`;
            queryParams.push(searchParam, searchParam, searchParam, searchParam);
            countQueryParams.push(searchParam, searchParam, searchParam, searchParam);
        }

        // Agregar filtro de turno si existe
        if (turno) {
            const turnoCondition = ' AND turno = ?';
            query += turnoCondition;
            countQuery += turnoCondition;
            queryParams.push(turno);
            countQueryParams.push(turno);
        }

        // Obtener total de registros
        db.query(countQuery, countQueryParams, (err, results) => {
            if (err) return handleError(err, 'Error al contar bibliotecarios');
            
            const total = results[0].total;
            const totalPaginas = Math.ceil(total / limit);
            
            data.paginacion.bibliotecarios = {
                pagina: page,
                totalPaginas,
                total,
                inicio: offset + 1,
                fin: Math.min(offset + limit, total)
            };

            // Agregar ordenamiento y límite
            query += ' ORDER BY fecha_registro DESC LIMIT ? OFFSET ?';
            queryParams.push(limit, offset);

            // Obtener registros
            db.query(query, queryParams, (err, results) => {
                if (err) return handleError(err, 'Error al obtener bibliotecarios');
                
                data.bibliotecarios = results;
                res.render('admin/usuarios/index', data);
            });
        });
    }
    // Consulta para lectores
    else if (activeTab === 'lectores') {
        let query = 'SELECT * FROM lectores WHERE estado = true';
        let countQuery = 'SELECT COUNT(*) as total FROM lectores WHERE estado = true';
        const queryParams = [];
        const countQueryParams = [];

        // Agregar búsqueda si existe
        if (busqueda) {
            const searchCondition = ' AND (nombre LIKE ? OR apellidos LIKE ? OR email LIKE ? OR numero_documento LIKE ?)';
            query += searchCondition;
            countQuery += searchCondition;
            const searchParam = `%${busqueda}%`;
            queryParams.push(searchParam, searchParam, searchParam, searchParam);
            countQueryParams.push(searchParam, searchParam, searchParam, searchParam);
        }

        // Obtener total de registros
        db.query(countQuery, countQueryParams, (err, results) => {
            if (err) return handleError(err, 'Error al contar lectores');
            
            const total = results[0].total;
            const totalPaginas = Math.ceil(total / limit);
            
            data.paginacion.lectores = {
                pagina: page,
                totalPaginas,
                total,
                inicio: offset + 1,
                fin: Math.min(offset + limit, total)
            };

            // Agregar ordenamiento y límite
            query += ' ORDER BY fecha_registro DESC LIMIT ? OFFSET ?';
            queryParams.push(limit, offset);

            // Obtener registros
            db.query(query, queryParams, (err, results) => {
                if (err) return handleError(err, 'Error al obtener lectores');
                
                data.lectores = results;
                res.render('admin/usuarios/index', data);
            });
        });
    }
});

// Usar las rutas de administrador
router.use('/administrador', adminRoutes);

// Usar las rutas de bibliotecario
router.use('/bibliotecario', bibliotecarioRoutes);

module.exports = router; 