const express = require('express');
const router = express.Router();
const { isAuthenticated, isBibliotecarioOrAdmin } = require('../../login/login');
const db = require('../../../lib/db');
const ExcelJS = require('exceljs');

// Importar rutas modulares
const prestamoRoutes = require('./prestamo/prestamos');
const historialRoutes = require('./historial/historial');
const devolucionesRoutes = require('./devoluciones/devolucion');

// Usar las rutas modulares
router.use('/prestamos', prestamoRoutes);
router.use('/historial', historialRoutes);
router.use('/devoluciones', devolucionesRoutes);

// Ruta para exportar préstamos a Excel
router.get('/exportar', isAuthenticated, isBibliotecarioOrAdmin, async (req, res) => {
    try {
        const busqueda = req.query.busqueda || '';
        const fecha_prestamo = req.query.fecha_prestamo || '';

        // Construir la consulta SQL con los filtros
        let query = `
            SELECT 
                p.id,
                CONCAT(l.nombre, ' ', l.apellidos) as lector_nombre,
                l.numero_documento as lector_documento,
                li.titulo as libro_titulo,
                li.isbn,
                p.fecha_prestamo,
                p.fecha_devolucion_esperada,
                p.fecha_devolucion_real,
                p.estado,
                p.monto_multa,
                p.observaciones
            FROM prestamos p
            JOIN lectores l ON p.lector_id = l.id
            JOIN libros li ON p.libro_id = li.id
            WHERE 1=1
        `;
        const params = [];

        if (busqueda) {
            query += ` AND (l.nombre LIKE ? OR l.apellidos LIKE ? OR li.titulo LIKE ?)`;
            const searchParam = `%${busqueda}%`;
            params.push(searchParam, searchParam, searchParam);
        }

        if (fecha_prestamo) {
            query += ` AND DATE(p.fecha_prestamo) = ?`;
            params.push(fecha_prestamo);
        }

        query += ` ORDER BY p.fecha_prestamo DESC`;

        // Ejecutar la consulta
        const prestamos = await new Promise((resolve, reject) => {
            db.query(query, params, (err, results) => {
                if (err) reject(err);
                resolve(results);
            });
        });

        // Crear un nuevo libro de Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Préstamos');

        // Definir las columnas
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Lector', key: 'lector_nombre', width: 30 },
            { header: 'Documento', key: 'lector_documento', width: 15 },
            { header: 'Libro', key: 'libro_titulo', width: 40 },
            { header: 'ISBN', key: 'isbn', width: 15 },
            { header: 'Fecha Préstamo', key: 'fecha_prestamo', width: 20 },
            { header: 'Fecha Devolución Esperada', key: 'fecha_devolucion_esperada', width: 25 },
            { header: 'Fecha Devolución Real', key: 'fecha_devolucion_real', width: 20 },
            { header: 'Estado', key: 'estado', width: 15 },
            { header: 'Multa', key: 'monto_multa', width: 15 },
            { header: 'Observaciones', key: 'observaciones', width: 40 }
        ];

        // Estilo para el encabezado
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4F81BD' }
        };
        worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' } };

        // Agregar los datos
        prestamos.forEach(prestamo => {
            worksheet.addRow({
                id: prestamo.id,
                lector_nombre: prestamo.lector_nombre,
                lector_documento: prestamo.lector_documento,
                libro_titulo: prestamo.libro_titulo,
                isbn: prestamo.isbn,
                fecha_prestamo: new Date(prestamo.fecha_prestamo).toLocaleDateString(),
                fecha_devolucion_esperada: new Date(prestamo.fecha_devolucion_esperada).toLocaleDateString(),
                fecha_devolucion_real: prestamo.fecha_devolucion_real ? new Date(prestamo.fecha_devolucion_real).toLocaleDateString() : 'Pendiente',
                estado: prestamo.estado,
                monto_multa: prestamo.monto_multa ? `$${prestamo.monto_multa.toFixed(2)}` : '$0.00',
                observaciones: prestamo.observaciones || ''
            });
        });

        // Configurar la respuesta
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=prestamos.xlsx');

        // Enviar el archivo
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error al exportar a Excel:', error);
        if (req.session) req.session.error = 'Error al exportar los datos: ' + error.message;
        res.redirect('/admin/prestamos');
    }
});

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

        // Consulta para obtener préstamos
        const prestamosQuery = `
            SELECT 
                p.*,
                CONCAT(l.nombre, ' ', l.apellidos) as lector_nombre,
                li.titulo as libro_titulo,
                CASE 
                    WHEN CURRENT_TIMESTAMP > p.fecha_devolucion_esperada THEN 'atrasado'
                    ELSE 'prestado'
                END as estado
            FROM prestamos p
            JOIN lectores l ON p.lector_id = l.id
            JOIN libros li ON p.libro_id = li.id
            WHERE p.fecha_devolucion_real IS NULL ${whereClause}
            ORDER BY p.fecha_prestamo DESC
            LIMIT ? OFFSET ?
        `;

        // Consulta para obtener historial
        const historialQuery = `
            SELECT 
                p.*,
                CONCAT(l.nombre, ' ', l.apellidos) as lector_nombre,
                li.titulo as libro_titulo,
                'Devuelto' as estado
            FROM prestamos p
            JOIN lectores l ON p.lector_id = l.id
            JOIN libros li ON p.libro_id = li.id
            WHERE p.fecha_devolucion_real IS NOT NULL ${whereClause}
            ORDER BY p.fecha_devolucion_real DESC
            LIMIT ? OFFSET ?
        `;

        // Ejecutar la consulta según la pestaña activa
        const query = activeTab === 'historial' ? historialQuery : prestamosQuery;
        const results = await new Promise((resolve, reject) => {
            db.query(query, [...params, limit, offset], (err, results) => {
                if (err) reject(err);
                resolve(results);
            });
        });

        // Asignar los resultados a la pestaña correspondiente
        if (activeTab === 'historial') {
            data.historial = results;
        } else {
            data.prestamos = results;
        }

        // Consulta para contar el total de registros
        let countQuery = '';
        switch(activeTab) {
            case 'prestamos':
                countQuery = `SELECT COUNT(*) as total FROM prestamos p
                             JOIN lectores l ON p.lector_id = l.id
                             JOIN libros li ON p.libro_id = li.id
                             WHERE p.fecha_devolucion_real IS NULL ${whereClause}`;
                break;
            case 'historial':
                countQuery = `SELECT COUNT(*) as total FROM prestamos p
                             JOIN lectores l ON p.lector_id = l.id
                             JOIN libros li ON p.libro_id = li.id
                             WHERE p.fecha_devolucion_real IS NOT NULL ${whereClause}`;
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

            res.render('admin/prestamos/index', data);
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

// Función para calcular la multa
function calcularMulta(fechaDevolucionEsperada, fechaDevolucionReal) {
    const fechaEsperada = new Date(fechaDevolucionEsperada);
    const fechaReal = new Date(fechaDevolucionReal);
    const diasAtraso = Math.ceil((fechaReal - fechaEsperada) / (1000 * 60 * 60 * 24));
    const montoPorDia = 5.00;
    return {
        diasAtraso: diasAtraso > 0 ? diasAtraso : 0,
        montoTotal: diasAtraso > 0 ? diasAtraso * montoPorDia : 0
    };
}

// Ruta para mostrar el formulario de devolución
router.get('/devoluciones/registrar/:id', isAuthenticated, isBibliotecarioOrAdmin, async (req, res) => {
    try {
        const prestamoId = req.params.id;
        
        // Obtener datos del préstamo
        const prestamo = await new Promise((resolve, reject) => {
            const query = `
                SELECT p.*, 
                       CONCAT(l.nombre, ' ', l.apellidos) as lector_nombre,
                       li.titulo as libro_titulo
                FROM prestamos p
                JOIN lectores l ON p.lector_id = l.id
                JOIN libros li ON p.libro_id = li.id
                WHERE p.id = ? AND p.fecha_devolucion_real IS NULL
            `;
            
            db.query(query, [prestamoId], (err, results) => {
                if (err) reject(err);
                if (!results || results.length === 0) reject(new Error('Préstamo no encontrado o ya devuelto'));
                resolve(results[0]);
            });
        });

        // Calcular multa inicial
        const fechaActual = new Date();
        const { diasAtraso, montoTotal } = calcularMulta(prestamo.fecha_devolucion_esperada, fechaActual);

        res.render('admin/prestamos/devoluciones/registrar', {
            layout: 'admin/base_panel',
            active: 'prestamos',
            prestamo,
            diasAtraso,
            multaTotal: montoTotal,
            fecha_devolucion: fechaActual.toISOString().slice(0, 16),
            estado_libro: ''
        });

    } catch (error) {
        console.error('Error al cargar datos del préstamo:', error);
        if (req.session) req.session.error = 'Error al cargar los datos del préstamo';
        res.redirect('/admin/prestamos');
    }
});

// Ruta para procesar la devolución
router.post('/devoluciones/registrar/:id', isAuthenticated, isBibliotecarioOrAdmin, async (req, res) => {
    try {
        const prestamoId = req.params.id;
        const { estado_libro, fecha_devolucion, observaciones } = req.body;

        // Validaciones básicas
        if (!estado_libro || !fecha_devolucion) {
            if (req.session) req.session.error = 'Todos los campos marcados con * son obligatorios';
            return res.redirect(`/admin/prestamos/devoluciones/registrar/${prestamoId}`);
        }

        // Obtener datos del préstamo
        const prestamo = await new Promise((resolve, reject) => {
            db.query('SELECT * FROM prestamos WHERE id = ?', [prestamoId], (err, results) => {
                if (err) reject(err);
                if (!results || results.length === 0) reject(new Error('Préstamo no encontrado'));
                resolve(results[0]);
            });
        });

        // Calcular multa
        const { montoTotal } = calcularMulta(prestamo.fecha_devolucion_esperada, fecha_devolucion);

        // Actualizar el préstamo
        await new Promise((resolve, reject) => {
            const query = `
                UPDATE prestamos 
                SET fecha_devolucion_real = ?,
                    estado_libro = ?,
                    monto_multa = ?,
                    observaciones = ?
                WHERE id = ?
            `;
            db.query(query, [fecha_devolucion, estado_libro, montoTotal, observaciones, prestamoId], (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        });

        // Actualizar el stock del libro
        await new Promise((resolve, reject) => {
            db.query('UPDATE libros SET stock = stock + 1 WHERE id = ?', [prestamo.libro_id], (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        });

        if (req.session) req.session.success = 'Devolución registrada exitosamente';
        res.redirect('/admin/prestamos?tab=historial');

    } catch (error) {
        console.error('Error al procesar la devolución:', error);
        if (req.session) req.session.error = 'Error al procesar la devolución: ' + error.message;
        res.redirect(`/admin/prestamos/devoluciones/registrar/${req.params.id}`);
    }
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

// Ruta para eliminar un préstamo
router.get('/eliminar/:id', isAuthenticated, isBibliotecarioOrAdmin, async (req, res) => {
    try {
        const prestamoId = req.params.id;

        // Verificar si el préstamo existe y no está devuelto
        const prestamo = await new Promise((resolve, reject) => {
            db.query('SELECT * FROM prestamos WHERE id = ? AND fecha_devolucion_real IS NULL', [prestamoId], (err, results) => {
                if (err) reject(err);
                if (!results || results.length === 0) reject(new Error('Préstamo no encontrado o ya devuelto'));
                resolve(results[0]);
            });
        });

        // Actualizar el stock del libro
        await new Promise((resolve, reject) => {
            db.query('UPDATE libros SET stock = stock + 1 WHERE id = ?', [prestamo.libro_id], (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        });

        // Eliminar el préstamo
        const result = await new Promise((resolve, reject) => {
            db.query('DELETE FROM prestamos WHERE id = ?', [prestamoId], (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        });

        if (result.affectedRows === 1) {
            if (req.session) req.session.success = 'Préstamo eliminado exitosamente';
        } else {
            throw new Error('No se pudo eliminar el préstamo');
        }
    } catch (error) {
        console.error('Error al eliminar préstamo:', error);
        if (req.session) req.session.error = 'Error al eliminar el préstamo: ' + error.message;
    }
    res.redirect('/admin/prestamos');
});

module.exports = router;
