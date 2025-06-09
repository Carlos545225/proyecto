const express = require('express');
const router = express.Router();
const { isAuthenticated, isBibliotecarioOrAdmin } = require('../../login/login');
const db = require('../../../lib/db');

// Ruta principal para mostrar libros con pestañas
router.get('/', isAuthenticated, isBibliotecarioOrAdmin, (req, res) => {
    // Obtener parámetros de la solicitud
    const activeTab = req.query.tab || 'libros';
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const busqueda = req.query.busqueda || '';
    const nacionalidad = req.query.nacionalidad || '';
    
    // Objeto para almacenar todos los datos
    const data = {
        libros: [],
        autores: [],
        categorias: [],
        editoriales: [],
        nacionalidades: [],
        paginacion: {
            libros: {},
            autores: {},
            categorias: {},
            editoriales: {}
        },
        filtros: {
            busqueda,
            nacionalidad
        },
        active: 'libros',
        activeTab,
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
        res.render('admin/libros/index', data);
    };

    // Consulta para libros
    if (activeTab === 'libros') {
        let query = `
            SELECT l.*, 
                   a.nombre_completo as autor_nombre,
                   c.nombre as categoria_nombre,
                   e.nombre as editorial_nombre
            FROM libros l
            LEFT JOIN autores a ON l.autor_id = a.id
            LEFT JOIN categorias c ON l.categoria_id = c.id
            LEFT JOIN editoriales e ON l.editorial_id = e.id
            WHERE l.estado = true
        `;
        let countQuery = `
            SELECT COUNT(DISTINCT l.id) as total 
            FROM libros l
            LEFT JOIN autores a ON l.autor_id = a.id
            LEFT JOIN categorias c ON l.categoria_id = c.id
            LEFT JOIN editoriales e ON l.editorial_id = e.id
            WHERE l.estado = true
        `;
        const queryParams = [];
        const countQueryParams = [];

        // Agregar búsqueda si existe
        if (busqueda) {
            const searchCondition = ' AND (l.titulo LIKE ? OR l.isbn LIKE ? OR a.nombre_completo LIKE ? OR c.nombre LIKE ? OR e.nombre LIKE ?)';
            query += searchCondition;
            countQuery += searchCondition;
            const searchParam = `%${busqueda}%`;
            queryParams.push(searchParam, searchParam, searchParam, searchParam, searchParam);
            countQueryParams.push(searchParam, searchParam, searchParam, searchParam, searchParam);
        }

        // Agregar filtro de categoría si existe
        if (req.query.categoria) {
            const categoriaCondition = ' AND l.categoria_id = ?';
            query += categoriaCondition;
            countQuery += categoriaCondition;
            queryParams.push(req.query.categoria);
            countQueryParams.push(req.query.categoria);
        }

        // Agregar filtro de editorial si existe
        if (req.query.editorial) {
            const editorialCondition = ' AND l.editorial_id = ?';
            query += editorialCondition;
            countQuery += editorialCondition;
            queryParams.push(req.query.editorial);
            countQueryParams.push(req.query.editorial);
        }

        // Obtener categorías y editoriales para los filtros
        Promise.all([
            new Promise((resolve, reject) => {
                db.query('SELECT id, nombre FROM categorias WHERE estado = true ORDER BY nombre', (err, results) => {
                    if (err) reject(err);
                    resolve(results);
                });
            }),
            new Promise((resolve, reject) => {
                db.query('SELECT id, nombre FROM editoriales WHERE estado = true ORDER BY nombre', (err, results) => {
                    if (err) reject(err);
                    resolve(results);
                });
            })
        ]).then(([categorias, editoriales]) => {
            data.categorias = categorias;
            data.editoriales = editoriales;

            // Obtener total de registros
            db.query(countQuery, countQueryParams, (err, results) => {
                if (err) {
                    console.error('Error en la consulta de conteo:', err);
                    return handleError(err, 'Error al contar libros');
                }
                
                const totalRows = results[0].total;
                const totalPaginas = Math.ceil(totalRows / limit);
                
                data.paginacion.libros = {
                    pagina: page,
                    totalPaginas: totalPaginas,
                    total: totalRows,
                    inicio: offset + 1,
                    fin: Math.min(offset + limit, totalRows)
                };

                // Agregar ordenamiento y límite
                query += ' ORDER BY l.titulo ASC LIMIT ? OFFSET ?';
                queryParams.push(limit, offset);

                // Obtener libros
                db.query(query, queryParams, (err, libros) => {
                    if (err) {
                        console.error('Error en la consulta de libros:', err);
                        return handleError(err, 'Error al obtener libros');
                    }
                    
                    data.libros = libros;
                    res.render('admin/libros/index', data);
                });
            });
        }).catch(err => {
            console.error('Error al cargar datos de filtros:', err);
            handleError(err, 'Error al cargar datos de filtros');
        });

        return; // Importante: evitar que el código continúe ejecutándose
    }
    // Consulta para autores
    else if (activeTab === 'autores') {
        let query = `
            SELECT a.*, 
                   COUNT(l.id) as total_libros
            FROM autores a
            LEFT JOIN libros l ON a.id = l.autor_id AND l.estado = true
            WHERE a.estado = true
        `;
        let countQuery = 'SELECT COUNT(*) as total FROM autores WHERE estado = true';
        const queryParams = [];
        const countQueryParams = [];

        if (busqueda) {
            const searchCondition = ' AND (a.nombre_completo LIKE ? OR a.biografia LIKE ?)';
            query += searchCondition;
            countQuery += searchCondition;
            const searchParam = `%${busqueda}%`;
            queryParams.push(searchParam, searchParam);
            countQueryParams.push(searchParam, searchParam);
        }

        if (nacionalidad) {
            const nacionalidadCondition = ' AND a.nacionalidad = ?';
            query += nacionalidadCondition;
            countQuery += nacionalidadCondition;
            queryParams.push(nacionalidad);
            countQueryParams.push(nacionalidad);
        }

        // Obtener nacionalidades para el filtro
        db.query('SELECT DISTINCT nacionalidad FROM autores WHERE nacionalidad IS NOT NULL ORDER BY nacionalidad', (err, nacionalidades) => {
            if (err) return handleError(err, 'Error al obtener nacionalidades');
            
            data.nacionalidades = nacionalidades.map(n => n.nacionalidad);

            // Obtener total de registros
            db.query(countQuery, countQueryParams, (err, results) => {
                if (err) return handleError(err, 'Error al contar autores');
                
                const totalRows = results[0].total;
                const totalPaginas = Math.ceil(totalRows / limit);
                
                data.paginacion.autores = {
                    pagina: page,
                    totalPaginas: totalPaginas,
                    total: totalRows,
                    inicio: offset + 1,
                    fin: Math.min(offset + limit, totalRows)
                };

                // Agregar ordenamiento y límite
                query += ' GROUP BY a.id ORDER BY a.nombre_completo ASC LIMIT ? OFFSET ?';
                queryParams.push(limit, offset);

                // Obtener autores
                db.query(query, queryParams, (err, autores) => {
                    if (err) return handleError(err, 'Error al obtener autores');
                    
                    data.autores = autores;
                    res.render('admin/libros/index', data);
                });
            });
        });
    }
    // Consulta para categorías
    else if (activeTab === 'categorias') {
        let query = `
            SELECT c.*, 
                   cp.nombre as categoria_padre_nombre,
                   COUNT(l.id) as total_libros
            FROM categorias c
            LEFT JOIN categorias_padre cp ON c.categoria_padre_id = cp.id
            LEFT JOIN libros l ON c.id = l.categoria_id AND l.estado = true
            WHERE c.estado = true
        `;
        let countQuery = 'SELECT COUNT(*) as total FROM categorias WHERE estado = true';
        const queryParams = [];
        const countQueryParams = [];

        if (busqueda) {
            const searchCondition = ' AND (c.nombre LIKE ? OR cp.nombre LIKE ?)';
            query += searchCondition;
            countQuery += searchCondition;
            const searchParam = `%${busqueda}%`;
            queryParams.push(searchParam, searchParam);
            countQueryParams.push(searchParam, searchParam);
        }

        // Obtener total de registros
        db.query(countQuery, countQueryParams, (err, results) => {
            if (err) return handleError(err, 'Error al contar categorías');
            
            const totalRows = results[0].total;
            const totalPaginas = Math.ceil(totalRows / limit);
            
            data.paginacion.categorias = {
                pagina: page,
                totalPaginas: totalPaginas,
                total: totalRows,
                inicio: offset + 1,
                fin: Math.min(offset + limit, totalRows)
            };

            // Agregar ordenamiento y límite
            query += ' GROUP BY c.id ORDER BY c.nombre ASC LIMIT ? OFFSET ?';
            queryParams.push(limit, offset);

            // Obtener categorías
            db.query(query, queryParams, (err, categorias) => {
                if (err) return handleError(err, 'Error al obtener categorías');
                
                data.categorias = categorias;
                res.render('admin/libros/index', data);
            });
        });
    }
    // Consulta para editoriales
    else if (activeTab === 'editoriales') {
        let query = `
            SELECT e.*, 
                   COUNT(l.id) as total_libros
            FROM editoriales e
            LEFT JOIN libros l ON e.id = l.editorial_id AND l.estado = true
            WHERE e.estado = true
        `;
        let countQuery = 'SELECT COUNT(*) as total FROM editoriales WHERE estado = true';
        const queryParams = [];
        const countQueryParams = [];

        if (busqueda) {
            const searchCondition = ' AND (e.nombre LIKE ? OR e.codigo LIKE ? OR e.pais LIKE ?)';
            query += searchCondition;
            countQuery += searchCondition;
            const searchParam = `%${busqueda}%`;
            queryParams.push(searchParam, searchParam, searchParam);
            countQueryParams.push(searchParam, searchParam, searchParam);
        }

        // Obtener total de registros
        db.query(countQuery, countQueryParams, (err, results) => {
            if (err) return handleError(err, 'Error al contar editoriales');
            
            const totalRows = results[0].total;
            const totalPaginas = Math.ceil(totalRows / limit);
            
            data.paginacion.editoriales = {
                pagina: page,
                totalPaginas: totalPaginas,
                total: totalRows,
                inicio: offset + 1,
                fin: Math.min(offset + limit, totalRows)
            };

            // Agregar ordenamiento y límite
            query += ' GROUP BY e.id ORDER BY e.nombre ASC LIMIT ? OFFSET ?';
            queryParams.push(limit, offset);

            // Obtener editoriales
            db.query(query, queryParams, (err, editoriales) => {
                if (err) return handleError(err, 'Error al obtener editoriales');
                
                data.editoriales = editoriales;
                res.render('admin/libros/index', data);
            });
        });
    }
});

// Rutas para cada sección
router.use('/autor', require('./autor/autor'));
router.use('/categoria', require('./categoria/categoria'));
router.use('/editorial', require('./editorial/editorial'));
router.use('/libro', require('./libro/libro'));

module.exports = router;
