const express = require('express');
const router = express.Router();
const { isAuthenticated, isBibliotecarioOrAdmin } = require('../../../login/login');
const db = require('../../../../lib/db');

// Ruta para ver detalles de un préstamo
router.get('/ver/:id', isAuthenticated, isBibliotecarioOrAdmin, (req, res) => {
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
            layout: 'admin/base_panel',
            active: 'prestamos',
            prestamo: results[0]
        });
    });
});

// Ruta para mostrar el formulario de registro de préstamo
router.get('/registrar', isAuthenticated, isBibliotecarioOrAdmin, (req, res) => {
    // Obtener lista de lectores
    const lectoresQuery = `
        SELECT id, 
               nombre,
               apellidos,
               numero_documento
        FROM lectores 
        WHERE estado = 1 
        ORDER BY nombre, apellidos
    `;
    
    // Obtener lista de libros disponibles
    const librosQuery = `
        SELECT l.id, 
               l.titulo, 
               a.nombre_completo as autor, 
               e.nombre as editorial 
        FROM libros l
        JOIN autores a ON l.autor_id = a.id
        JOIN editoriales e ON l.editorial_id = e.id
        WHERE l.stock > 0
        ORDER BY l.titulo
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
                layout: 'admin/base_panel',
                active: 'prestamos',
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
        });
    });
});

// Ruta para mostrar el formulario de editar préstamo
router.get('/editar/:id', isAuthenticated, isBibliotecarioOrAdmin, async (req, res) => {
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
                if (!results || results.length === 0) reject(new Error('Préstamo no encontrado o ya devuelto'));
                resolve(results[0]);
            });
        });

        // Obtener lista de lectores
        const lectores = await new Promise((resolve, reject) => {
            const query = `
                SELECT id, 
                       nombre,
                       apellidos,
                       numero_documento
                FROM lectores 
                WHERE estado = 1 
                ORDER BY nombre, apellidos
            `;
            db.query(query, (err, results) => {
                if (err) reject(err);
                resolve(results);
            });
        });

        // Obtener lista de libros disponibles
        const libros = await new Promise((resolve, reject) => {
            const query = `
                SELECT l.id, 
                       l.titulo, 
                       a.nombre_completo as autor, 
                       e.nombre as editorial 
                FROM libros l
                JOIN autores a ON l.autor_id = a.id
                JOIN editoriales e ON l.editorial_id = e.id
                WHERE l.stock > 0 OR l.id = ?
                ORDER BY l.titulo
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
            layout: 'admin/base_panel',
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
router.post('/editar/:id', isAuthenticated, isBibliotecarioOrAdmin, async (req, res) => {
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
                if (!results || results.length === 0) reject(new Error('Préstamo no encontrado'));
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

            // Actualizar el stock de los libros
            await new Promise((resolve, reject) => {
                db.query('UPDATE libros SET stock = stock + 1 WHERE id = ?', [prestamoActual.libro_id], (err, result) => {
                    if (err) reject(err);
                    resolve(result);
                });
            });

            await new Promise((resolve, reject) => {
                db.query('UPDATE libros SET stock = stock - 1 WHERE id = ?', [libro_id], (err, result) => {
                    if (err) reject(err);
                    resolve(result);
                });
            });
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

// Ruta para procesar el formulario de registro de préstamo
router.post('/registrar', isAuthenticated, isBibliotecarioOrAdmin, async (req, res) => {
    try {
        // Verificar que el usuario esté autenticado y tenga un ID válido
        if (!req.session || !req.session.user || !req.session.user.id) {
            if (req.session) req.session.error = 'Sesión inválida. Por favor inicie sesión nuevamente.';
            return res.redirect('/');
        }

        const { lector_id, libro_id, fecha_prestamo, fecha_devolucion_esperada, observaciones } = req.body;

        // Validaciones básicas
        if (!lector_id || !libro_id || !fecha_prestamo || !fecha_devolucion_esperada) {
            if (req.session) req.session.error = 'Todos los campos marcados con * son obligatorios';
            return res.redirect('/admin/prestamos/prestamos/registrar');
        }

        // Verificar si el libro está disponible
        const libroDisponible = await new Promise((resolve, reject) => {
            db.query('SELECT stock FROM libros WHERE id = ?', [libro_id], (err, results) => {
                if (err) reject(err);
                resolve(results[0]?.stock > 0);
            });
        });

        if (!libroDisponible) {
            if (req.session) req.session.error = 'El libro seleccionado no está disponible';
            return res.redirect('/admin/prestamos/prestamos/registrar');
        }

        // Insertar el préstamo
        const query = `
            INSERT INTO prestamos (
                lector_id,
                libro_id,
                bibliotecario_id,
                fecha_prestamo,
                fecha_devolucion_esperada,
                observaciones,
                fecha_registro
            ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `;

        const result = await new Promise((resolve, reject) => {
            db.query(query, [
                lector_id,
                libro_id,
                req.session.user.id, // ID del bibliotecario autenticado desde la sesión
                fecha_prestamo,
                fecha_devolucion_esperada,
                observaciones || null
            ], (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        });

        if (result.affectedRows === 1) {
            // Actualizar el stock del libro
            await new Promise((resolve, reject) => {
                db.query('UPDATE libros SET stock = stock - 1 WHERE id = ?', [libro_id], (err, result) => {
                    if (err) reject(err);
                    resolve(result);
                });
            });

            if (req.session) req.session.success = 'Préstamo registrado exitosamente';
            res.redirect('/admin/prestamos');
        } else {
            throw new Error('No se pudo registrar el préstamo');
        }
    } catch (error) {
        console.error('Error al registrar préstamo:', error);
        if (req.session) req.session.error = 'Error al registrar el préstamo: ' + error.message;
        res.redirect('/admin/prestamos/prestamos/registrar');
    }
});

module.exports = router;
