const express = require('express');
const router = express.Router();
const { isAuthenticated, isBibliotecarioOrAdmin } = require('../../login/login');
const db = require('../../../lib/db');

// Importar rutas modulares
const prestamoRoutes = require('./prestamo/prestamos');
const historialRoutes = require('./historial/historial');

// Usar las rutas modulares
router.use('/prestamos', prestamoRoutes);
router.use('/historial', historialRoutes);

// Ruta principal de préstamos
router.get('/', isAuthenticated, isBibliotecarioOrAdmin, async (req, res) => {
    try {
        // Obtener parámetros de la solicitud
        const activeTab = req.query.tab || 'prestamos';
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;
        const busqueda = req.query.busqueda || '';

        // Objeto para almacenar todos los datos
        const data = {
            layout: 'admin/base_panel',
            title: 'Gestión de Préstamos',
            active: 'prestamos',
            activeTab,
            busqueda,
            success: req.flash('success'),
            error: req.flash('error'),
            filtros: {
                busqueda
            }
        };

        // Construir la cláusula WHERE según los filtros
        let whereClause = '';
        const params = [];

        if (busqueda) {
            whereClause = ' AND (l.nombre LIKE ? OR l.apellidos LIKE ? OR li.titulo LIKE ?)';
            const searchParam = `%${busqueda}%`;
            params.push(searchParam, searchParam, searchParam);
        }

        // Agregar filtro de fecha si está presente
        const fecha_prestamo = req.query.fecha_prestamo;
        if (fecha_prestamo) {
            whereClause += ` AND DATE(p.fecha_prestamo) = ?`;
            params.push(fecha_prestamo);
            data.filtros.fecha_prestamo = fecha_prestamo;
        }

        // Consulta para contar el total de registros
        let countQuery = '';
        switch(activeTab) {
            case 'prestamos':
                countQuery = `SELECT COUNT(*) as total FROM prestamos p
                             JOIN lectores l ON p.lector_id = l.id
                             JOIN libros li ON p.libro_id = li.id
                             WHERE p.estado = 'prestado' ${whereClause}`;
                break;
            case 'historial':
                countQuery = `SELECT COUNT(*) as total FROM prestamos p
                             JOIN lectores l ON p.lector_id = l.id
                             JOIN libros li ON p.libro_id = li.id
                             ${whereClause}`;
                break;
        }

        // Obtener total de registros
        db.query(countQuery, params, (err, totalRows) => {
            if (err) {
                console.error('Error al contar registros:', err);
                return res.status(500).render('error', {
                    message: 'Error al cargar los datos',
                    error: process.env.NODE_ENV === 'development' ? err : {}
                });
            }

            const total = totalRows[0].total;
            const totalPages = Math.ceil(total / limit);

            // Preparar datos de paginación
            data.paginacion = {
                [activeTab]: {
                    pagina: page,
                    totalPaginas: totalPages,
                    total: total,
                    inicio: offset + 1,
                    fin: Math.min(offset + limit, total)
                }
            };

            // Consulta para obtener los registros
            let query = '';
            switch(activeTab) {
                case 'prestamos':
                    query = `SELECT p.*, 
                            CONCAT(l.nombre, ' ', l.apellidos) as lector_nombre,
                            li.titulo as libro_titulo,
                            a.nombre_completo as autor,
                            b.nombre as bibliotecario_nombre
                            FROM prestamos p
                            JOIN lectores l ON p.lector_id = l.id
                            JOIN libros li ON p.libro_id = li.id
                            JOIN autores a ON li.autor_id = a.id
                            JOIN bibliotecarios b ON p.bibliotecario_id = b.id
                            WHERE p.estado = 'prestado' ${whereClause}
                            ORDER BY p.fecha_prestamo DESC
                            LIMIT ? OFFSET ?`;
                    break;
                case 'historial':
                    query = `SELECT p.*, 
                            CONCAT(l.nombre, ' ', l.apellidos) as lector_nombre,
                            li.titulo as libro_titulo,
                            a.nombre_completo as autor,
                            b.nombre as bibliotecario_nombre
                            FROM prestamos p
                            JOIN lectores l ON p.lector_id = l.id
                            JOIN libros li ON p.libro_id = li.id
                            JOIN autores a ON li.autor_id = a.id
                            JOIN bibliotecarios b ON p.bibliotecario_id = b.id
                            ${whereClause}
                            ORDER BY p.fecha_prestamo DESC
                            LIMIT ? OFFSET ?`;
                    break;
            }

            // Obtener registros
            db.query(query, [...params, limit, offset], (err, results) => {
                if (err) {
                    console.error('Error al obtener registros:', err);
                    return res.status(500).render('error', {
                        message: 'Error al cargar los datos',
                        error: process.env.NODE_ENV === 'development' ? err : {}
                    });
                }

                // Asignar los resultados a la clave correcta según el tab activo
                if (activeTab === 'prestamos') {
                    data.prestamos = results;
                } else if (activeTab === 'historial') {
                    data.historial = results;
                }

                res.render('admin/prestamos/index', data);
            });
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', {
            message: 'Error al cargar los datos',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// Ruta para ver detalles de un préstamo
router.get('/prestamos/ver/:id', isAuthenticated, isBibliotecarioOrAdmin, (req, res) => {
    const prestamoId = req.params.id;
    
    const query = `
        SELECT p.*, 
               CONCAT(l.nombre, ' ', l.apellidos) as lector_nombre,
               l.numero_documento as lector_documento,
               l.email as lector_email,
               l.telefono as lector_telefono,
               li.titulo as libro_titulo,
               li.isbn as libro_isbn,
               a.nombre_completo as libro_autor,
               e.nombre as libro_editorial,
               CASE 
                   WHEN p.fecha_devolucion_real IS NULL THEN 'Prestado'
                   ELSE 'Devuelto'
               END as estado
        FROM prestamos p
        JOIN lectores l ON p.lector_id = l.id
        JOIN libros li ON p.libro_id = li.id
        JOIN autores a ON li.autor_id = a.id
        JOIN editoriales e ON li.editorial_id = e.id
        WHERE p.id = ?
    `;

    db.query(query, [prestamoId], (err, results) => {
        if (err) {
            console.error('Error al obtener el préstamo:', err);
            req.session.error = 'Error al cargar los detalles del préstamo';
            return res.redirect('/admin/prestamos');
        }

        if (!results || results.length === 0) {
            req.session.error = 'Préstamo no encontrado';
            return res.redirect('/admin/prestamos');
        }

        res.render('admin/prestamos/prestamos/ver', {
            active: 'prestamos',
            prestamo: results[0]
        });
    });
});

// Ruta para mostrar el formulario de registro de préstamo
router.get('/prestamos/registrar', isAuthenticated, isBibliotecarioOrAdmin, (req, res) => {
    // Obtener lista de lectores
    const lectoresQuery = 'SELECT id, CONCAT(nombre, " ", apellidos) as nombre_completo FROM lectores WHERE activo = 1';
    
    // Obtener lista de libros disponibles
    const librosQuery = `
        SELECT l.id, l.titulo, a.nombre_completo as autor, e.nombre as editorial 
        FROM libros l
        JOIN autores a ON l.autor_id = a.id
        JOIN editoriales e ON l.editorial_id = e.id
        WHERE l.stock > 0
    `;

    db.query(lectoresQuery, (err, lectores) => {
        if (err) {
            console.error('Error al obtener lectores:', err);
            req.session.error = 'Error al cargar el formulario de registro';
            return res.redirect('/admin/prestamos');
        }

        db.query(librosQuery, (err, libros) => {
            if (err) {
                console.error('Error al obtener libros:', err);
                req.session.error = 'Error al cargar el formulario de registro';
                return res.redirect('/admin/prestamos');
            }

            res.render('admin/prestamos/prestamos/registrar', {
                active: 'prestamos',
                lectores: lectores || [],
                libros: libros || []
            });
        });
    });
});

// Ruta para mostrar el formulario de registro de devolución
router.get('/devoluciones/registrar/:id', isAuthenticated, isBibliotecarioOrAdmin, (req, res) => {
    const prestamoId = req.params.id;
    
    const query = `
        SELECT p.*, 
               CONCAT(l.nombre, ' ', l.apellidos) as lector_nombre,
               li.titulo as libro_titulo,
               a.nombre_completo as libro_autor,
               e.nombre as libro_editorial,
               p.fecha_prestamo,
               p.fecha_devolucion_esperada
        FROM prestamos p
        JOIN lectores l ON p.lector_id = l.id
        JOIN libros li ON p.libro_id = li.id
        JOIN autores a ON li.autor_id = a.id
        JOIN editoriales e ON li.editorial_id = e.id
        WHERE p.id = ? AND p.fecha_devolucion_real IS NULL
    `;

    db.query(query, [prestamoId], (err, results) => {
        if (err) {
            console.error('Error al obtener el préstamo:', err);
            req.session.error = 'Error al cargar el formulario de devolución';
            return res.redirect('/admin/prestamos');
        }

        if (!results || results.length === 0) {
            req.session.error = 'Préstamo no encontrado o ya devuelto';
            return res.redirect('/admin/prestamos');
        }

        res.render('admin/prestamos/devoluciones/registrar', {
            active: 'prestamos',
            prestamo: results[0]
        });
    });
});

// Ruta para mostrar el formulario de editar préstamo
router.get('/prestamos/editar/:id', isAuthenticated, isBibliotecarioOrAdmin, async (req, res) => {
    try {
        const prestamoId = req.params.id;
        
        // Obtener datos del préstamo
        const prestamo = await new Promise((resolve, reject) => {
            const query = `
                SELECT p.*, 
                       CONCAT(l.nombre, ' ', l.apellidos) as lector_nombre,
                       li.titulo as libro_titulo,
                       a.nombre_completo as libro_autor,
                       e.nombre as libro_editorial
                FROM prestamos p
                JOIN lectores l ON p.lector_id = l.id
                JOIN libros li ON p.libro_id = li.id
                JOIN autores a ON li.autor_id = a.id
                JOIN editoriales e ON li.editorial_id = e.id
                WHERE p.id = ? AND p.fecha_devolucion_real IS NULL
            `;
            
            db.query(query, [prestamoId], (err, results) => {
                if (err) reject(err);
                if (results.length === 0) reject(new Error('Préstamo no encontrado o ya devuelto'));
                resolve(results[0]);
            });
        });

        // Obtener lista de lectores
        const lectores = await new Promise((resolve, reject) => {
            db.query('SELECT id, CONCAT(nombre, " ", apellidos) as nombre_completo FROM lectores WHERE activo = 1', (err, results) => {
                if (err) reject(err);
                resolve(results);
            });
        });

        // Obtener lista de libros disponibles
        const libros = await new Promise((resolve, reject) => {
            const query = `
                SELECT l.id, l.titulo, a.nombre_completo as autor, e.nombre as editorial 
                FROM libros l
                JOIN autores a ON l.autor_id = a.id
                JOIN editoriales e ON l.editorial_id = e.id
                WHERE l.stock > 0 OR l.id = ?
            `;
            db.query(query, [prestamo.libro_id], (err, results) => {
                if (err) reject(err);
                resolve(results);
            });
        });

        // Formatear fechas para los inputs type="date"
        if (prestamo.fecha_prestamo) {
            const fecha = new Date(prestamo.fecha_prestamo);
            prestamo.fecha_prestamo = fecha.toISOString().split('T')[0];
        }
        if (prestamo.fecha_devolucion_esperada) {
            const fecha = new Date(prestamo.fecha_devolucion_esperada);
            prestamo.fecha_devolucion_esperada = fecha.toISOString().split('T')[0];
        }

        res.render('admin/prestamos/prestamos/editar', {
            active: 'prestamos',
            prestamo,
            lectores: lectores || [],
            libros: libros || [],
            error: req.session?.error || '',
            success: req.session?.success || ''
        });

        // Limpiar mensajes después de usarlos
        if (req.session) {
            req.session.error = '';
            req.session.success = '';
        }
    } catch (error) {
        console.error('Error al cargar datos del préstamo:', error);
        if (req.session) req.session.error = 'Error al cargar los datos del préstamo';
        res.redirect('/admin/prestamos');
    }
});

// Ruta para procesar el formulario de editar préstamo
router.post('/prestamos/editar/:id', isAuthenticated, isBibliotecarioOrAdmin, async (req, res) => {
    try {
        const prestamoId = req.params.id;
        const { lector_id, libro_id, fecha_prestamo, fecha_devolucion_esperada, observaciones } = req.body;

        // Validaciones básicas
        if (!lector_id || !libro_id || !fecha_prestamo || !fecha_devolucion_esperada) {
            if (req.session) req.session.error = 'Todos los campos marcados con * son obligatorios';
            return res.redirect(`/admin/prestamos/prestamos/editar/${prestamoId}`);
        }

        // Verificar si el libro está disponible (si se cambió el libro)
        const prestamoActual = await new Promise((resolve, reject) => {
            db.query('SELECT libro_id FROM prestamos WHERE id = ?', [prestamoId], (err, results) => {
                if (err) reject(err);
                if (results.length === 0) reject(new Error('Préstamo no encontrado'));
                resolve(results[0]);
            });
        });

        if (prestamoActual.libro_id !== parseInt(libro_id)) {
            const libroDisponible = await new Promise((resolve, reject) => {
                db.query('SELECT stock FROM libros WHERE id = ?', [libro_id], (err, results) => {
                    if (err) reject(err);
                    resolve(results[0]?.stock > 0);
                });
            });

            if (!libroDisponible) {
                if (req.session) req.session.error = 'El libro seleccionado no está disponible';
                return res.redirect(`/admin/prestamos/prestamos/editar/${prestamoId}`);
            }
        }

        // Actualizar el préstamo
        const query = `
            UPDATE prestamos 
            SET lector_id = ?,
                libro_id = ?,
                fecha_prestamo = ?,
                fecha_devolucion_esperada = ?,
                observaciones = ?,
                ultima_actualizacion = CURRENT_TIMESTAMP
            WHERE id = ? AND fecha_devolucion_real IS NULL
        `;

        const result = await new Promise((resolve, reject) => {
            db.query(query, [
                lector_id,
                libro_id,
                fecha_prestamo,
                fecha_devolucion_esperada,
                observaciones || null,
                prestamoId
            ], (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        });

        if (result.affectedRows === 1) {
            if (req.session) req.session.success = 'Préstamo actualizado exitosamente';
            res.redirect('/admin/prestamos');
        } else {
            throw new Error('No se pudo actualizar el préstamo');
        }
    } catch (error) {
        console.error('Error al actualizar préstamo:', error);
        if (req.session) req.session.error = 'Error al actualizar el préstamo: ' + error.message;
        res.redirect(`/admin/prestamos/prestamos/editar/${req.params.id}`);
    }
});

module.exports = router;
