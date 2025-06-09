const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { isAuthenticated, isBibliotecarioOrAdmin } = require('../../../login/login');
const db = require('../../../../lib/db');

// Configuración de multer para subir imágenes
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'public/uploads/libros';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, 'libro-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Solo se permiten archivos de imagen (jpeg, jpg, png, gif)'));
    }
});

// Redireccionar a la vista principal con la pestaña de libros activa
router.get('/', isAuthenticated, isBibliotecarioOrAdmin, (req, res) => {
    res.redirect('/admin/libros?tab=libros');
});

// Obtener datos para el formulario de libro
async function getFormData() {
    try {
        const autores = await new Promise((resolve, reject) => {
            db.query('SELECT id, nombre_completo FROM autores WHERE estado = true ORDER BY nombre_completo', (err, results) => {
                if (err) reject(err);
                resolve(results);
            });
        });

        const categorias = await new Promise((resolve, reject) => {
            db.query('SELECT id, nombre FROM categorias WHERE estado = true ORDER BY nombre', (err, results) => {
                if (err) reject(err);
                resolve(results);
            });
        });

        const editoriales = await new Promise((resolve, reject) => {
            db.query('SELECT id, nombre FROM editoriales WHERE estado = true ORDER BY nombre', (err, results) => {
                if (err) reject(err);
                resolve(results);
            });
        });

        const idiomas = await new Promise((resolve, reject) => {
            db.query('SELECT id, nombre FROM idiomas ORDER BY nombre', (err, results) => {
                if (err) reject(err);
                resolve(results);
            });
        });

        return { autores, categorias, editoriales, idiomas };
    } catch (error) {
        console.error('Error al obtener datos del formulario:', error);
        throw error;
    }
}

// Formulario agregar libro
router.get('/agregar', isAuthenticated, isBibliotecarioOrAdmin, async (req, res) => {
    try {
        const formData = await getFormData();
        const error = req.session && req.session.error ? req.session.error : '';
        const success = req.session && req.session.success ? req.session.success : '';
        
        // Limpiar mensajes después de usarlos
        if (req.session) {
            req.session.error = '';
            req.session.success = '';
        }
        
        res.render('admin/libros/libros/agregar', { 
            active: 'libros',
            ...formData,
            error: error,
            success: success
        });
    } catch (error) {
        if (req.session) req.session.error = 'Error al cargar el formulario';
        res.redirect('/admin/libros?tab=libros');
    }
});

// Guardar libro
router.post('/agregar', isAuthenticated, isBibliotecarioOrAdmin, upload.single('portada'), async (req, res) => {
    const {
        titulo, isbn, autor_id, categoria_id, editorial_id,
        anio_publicacion, idioma_id, numero_paginas, stock,
        ubicacion, sinopsis
    } = req.body;
    
    // Validaciones
    if (!titulo || !isbn || !autor_id || !categoria_id || !editorial_id || !idioma_id) {
        if (req.session) req.session.error = 'Los campos título, ISBN, autor, categoría, editorial e idioma son obligatorios';
        return res.redirect('/admin/libros/libro/agregar');
    }

    // Verificar ISBN único
    try {
        const isbnExists = await new Promise((resolve, reject) => {
            db.query('SELECT id FROM libros WHERE isbn = ? AND estado = true', [isbn], (err, results) => {
                if (err) reject(err);
                resolve(results.length > 0);
            });
        });

        if (isbnExists) {
            if (req.session) req.session.error = 'El ISBN ya existe en la base de datos';
            return res.redirect('/admin/libros/libro/agregar');
        }

        // Obtener el nombre del archivo de la portada si se subió una
        const portada = req.file ? req.file.filename : null;

        // Insertar libro
        db.query(`
            INSERT INTO libros (
                titulo, isbn, autor_id, categoria_id, editorial_id,
                anio_publicacion, idioma_id, numero_paginas, stock,
                ubicacion, sinopsis, portada, estado
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true)
        `, [
            titulo, isbn, autor_id, categoria_id, editorial_id,
            anio_publicacion || null, idioma_id, numero_paginas || 0,
            stock || 0, ubicacion || null, sinopsis || null, portada
        ], (err, result) => {
            if (err) {
                console.error('Error al agregar libro:', err);
                // Si hay error y se subió una imagen, eliminarla
                if (portada) {
                    const filePath = path.join('public/uploads/libros', portada);
                    fs.unlink(filePath, (unlinkErr) => {
                        if (unlinkErr) console.error('Error al eliminar archivo:', unlinkErr);
                    });
                }
                if (req.session) req.session.error = 'Error al agregar el libro: ' + err.message;
                return res.redirect('/admin/libros/libro/agregar');
            }
            
            if (req.session) req.session.success = 'Libro agregado exitosamente';
            res.redirect('/admin/libros?tab=libros');
        });
    } catch (error) {
        console.error('Error en el proceso de agregar libro:', error);
        // Si hay error y se subió una imagen, eliminarla
        if (req.file) {
            const filePath = path.join('public/uploads/libros', req.file.filename);
            fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr) console.error('Error al eliminar archivo:', unlinkErr);
            });
        }
        if (req.session) req.session.error = 'Error al procesar la solicitud';
        res.redirect('/admin/libros/libro/agregar');
    }
});

// Formulario editar libro
router.get('/editar/:id', isAuthenticated, isBibliotecarioOrAdmin, async (req, res) => {
    try {
        const libroId = req.params.id;
        const formData = await getFormData();
        
        // Obtener datos del libro
        const libro = await new Promise((resolve, reject) => {
            db.query('SELECT * FROM libros WHERE id = ?', [libroId], (err, results) => {
                if (err) reject(err);
                if (results.length === 0) reject(new Error('Libro no encontrado'));
                resolve(results[0]);
            });
        });

        const error = req.session && req.session.error ? req.session.error : '';
        const success = req.session && req.session.success ? req.session.success : '';
        
        // Limpiar mensajes después de usarlos
        if (req.session) {
            req.session.error = '';
            req.session.success = '';
        }
        
        res.render('admin/libros/libros/editar', {
            active: 'libros',
            libro,
            ...formData,
            error: error,
            success: success
        });
    } catch (error) {
        console.error('Error al cargar formulario de edición:', error);
        if (req.session) req.session.error = 'Error al cargar el libro';
        res.redirect('/admin/libros?tab=libros');
    }
});

// Actualizar libro
router.post('/editar/:id', isAuthenticated, isBibliotecarioOrAdmin, upload.single('portada'), async (req, res) => {
    try {
        const libroId = req.params.id;
        const {
            titulo, isbn, autor_id, categoria_id, editorial_id,
            anio_publicacion, idioma_id, numero_paginas, stock,
            ubicacion, sinopsis
        } = req.body;
        
        // Validaciones
        if (!titulo || !isbn || !autor_id || !categoria_id || !editorial_id || !idioma_id) {
            if (req.session) req.session.error = 'Los campos título, ISBN, autor, categoría, editorial e idioma son obligatorios';
            return res.redirect(`/admin/libros/libro/editar/${libroId}`);
        }

        // Verificar ISBN único (excluyendo el libro actual)
        const isbnExists = await new Promise((resolve, reject) => {
            db.query('SELECT id FROM libros WHERE isbn = ? AND id != ? AND estado = true', [isbn, libroId], (err, results) => {
                if (err) reject(err);
                resolve(results.length > 0);
            });
        });

        if (isbnExists) {
            if (req.session) req.session.error = 'El ISBN ya existe en la base de datos';
            return res.redirect(`/admin/libros/libro/editar/${libroId}`);
        }

        // Obtener el libro actual para verificar si tiene portada
        const libroActual = await new Promise((resolve, reject) => {
            db.query('SELECT portada FROM libros WHERE id = ?', [libroId], (err, results) => {
                if (err) reject(err);
                if (results.length === 0) reject(new Error('Libro no encontrado'));
                resolve(results[0]);
            });
        });

        // Si se subió una nueva portada, eliminar la anterior si existe
        if (req.file && libroActual.portada) {
            const oldFilePath = path.join('public/uploads/libros', libroActual.portada);
            fs.unlink(oldFilePath, (unlinkErr) => {
                if (unlinkErr) console.error('Error al eliminar archivo anterior:', unlinkErr);
            });
        }

        // Preparar la consulta SQL y los parámetros
        let query = `
            UPDATE libros 
            SET titulo = ?,
                isbn = ?,
                autor_id = ?,
                categoria_id = ?,
                editorial_id = ?,
                anio_publicacion = ?,
                idioma_id = ?,
                numero_paginas = ?,
                stock = ?,
                ubicacion = ?,
                sinopsis = ?,
                ultima_actualizacion = CURRENT_TIMESTAMP
        `;

        let params = [
            titulo, isbn, autor_id, categoria_id, editorial_id,
            anio_publicacion || null, idioma_id, numero_paginas || 0,
            stock || 0, ubicacion || null, sinopsis || null
        ];

        // Si se subió una nueva portada, actualizarla
        if (req.file) {
            query += ', portada = ?';
            params.push(req.file.filename);
        }

        query += ' WHERE id = ?';
        params.push(libroId);

        // Actualizar libro
        db.query(query, params, (err, result) => {
            if (err) {
                console.error('Error al actualizar libro:', err);
                // Si hay error y se subió una nueva imagen, eliminarla
                if (req.file) {
                    const filePath = path.join('public/uploads/libros', req.file.filename);
                    fs.unlink(filePath, (unlinkErr) => {
                        if (unlinkErr) console.error('Error al eliminar archivo:', unlinkErr);
                    });
                }
                if (req.session) req.session.error = 'Error al actualizar el libro: ' + err.message;
                return res.redirect(`/admin/libros/libro/editar/${libroId}`);
            }
            
            if (req.session) req.session.success = 'Libro actualizado exitosamente';
            res.redirect('/admin/libros?tab=libros');
        });
    } catch (error) {
        console.error('Error en el proceso de editar libro:', error);
        // Si hay error y se subió una nueva imagen, eliminarla
        if (req.file) {
            const filePath = path.join('public/uploads/libros', req.file.filename);
            fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr) console.error('Error al eliminar archivo:', unlinkErr);
            });
        }
        if (req.session) req.session.error = 'Error al procesar la solicitud';
        res.redirect(`/admin/libros/libro/editar/${req.params.id}`);
    }
});

// Ver libro
router.get('/ver/:id', isAuthenticated, async (req, res) => {
    try {
        const libroId = req.params.id;
        
        // Obtener detalles del libro con información relacionada
        const libro = await new Promise((resolve, reject) => {
            db.query(`
                SELECT l.*, 
                       a.nombre_completo as autor_nombre,
                       c.nombre as categoria_nombre,
                       e.nombre as editorial_nombre,
                       i.nombre as idioma_nombre
                FROM libros l
                LEFT JOIN autores a ON l.autor_id = a.id
                LEFT JOIN categorias c ON l.categoria_id = c.id
                LEFT JOIN editoriales e ON l.editorial_id = e.id
                LEFT JOIN idiomas i ON l.idioma_id = i.id
                WHERE l.id = ?
            `, [libroId], (err, results) => {
                if (err) reject(err);
                if (results.length === 0) reject(new Error('Libro no encontrado'));
                resolve(results[0]);
            });
        });

        const error = req.session && req.session.error ? req.session.error : '';
        const success = req.session && req.session.success ? req.session.success : '';
        
        // Limpiar mensajes después de usarlos
        if (req.session) {
            req.session.error = '';
            req.session.success = '';
        }

        res.render('admin/libros/libros/ver', {
            active: 'libros',
            libro,
            error: error,
            success: success
        });
    } catch (error) {
        console.error('Error al cargar detalles del libro:', error);
        if (req.session) req.session.error = 'Error al cargar los detalles del libro';
        res.redirect('/admin/libros?tab=libros');
    }
});

// Desactivar libro (enviar al historial)
router.get('/eliminar/:id', isAuthenticated, isBibliotecarioOrAdmin, async (req, res) => {
    try {
        const libroId = req.params.id;
        
        // Verificar que el libro exista y esté activo
        const libro = await new Promise((resolve, reject) => {
            db.query('SELECT * FROM libros WHERE id = ? AND estado = true', [libroId], (err, results) => {
                if (err) reject(err);
                if (results.length === 0) reject(new Error('Libro no encontrado o ya está en el historial'));
                resolve(results[0]);
            });
        });

        // Desactivar libro
        db.query('UPDATE libros SET estado = false WHERE id = ?', [libroId], (err, result) => {
            if (err) {
                console.error('Error al desactivar libro:', err);
                if (req.session) req.session.error = 'Error al desactivar el libro';
                return res.redirect('/admin/libros?tab=libros');
            }

            if (req.session) req.session.success = 'Libro enviado al historial exitosamente';
            res.redirect('/admin/libros?tab=libros');
        });
    } catch (error) {
        console.error('Error en el proceso de eliminar libro:', error);
        if (req.session) req.session.error = 'Error al procesar la solicitud';
        res.redirect('/admin/libros?tab=libros');
    }
});

// Historial de libros
router.get('/historial', isAuthenticated, isBibliotecarioOrAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;
        const busqueda = req.query.busqueda || '';

        // Consulta base para libros inactivos
        let query = `
            SELECT l.*, 
                   a.nombre_completo as autor_nombre,
                   c.nombre as categoria_nombre,
                   e.nombre as editorial_nombre,
                   i.nombre as idioma_nombre
            FROM libros l
            LEFT JOIN autores a ON l.autor_id = a.id
            LEFT JOIN categorias c ON l.categoria_id = c.id
            LEFT JOIN editoriales e ON l.editorial_id = e.id
            LEFT JOIN idiomas i ON l.idioma_id = i.id
            WHERE l.estado = false
        `;
        let countQuery = 'SELECT COUNT(*) as total FROM libros l WHERE l.estado = false';
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

        // Obtener total de registros
        const totalRows = await new Promise((resolve, reject) => {
            db.query(countQuery, countQueryParams, (err, results) => {
                if (err) reject(err);
                resolve(results[0].total);
            });
        });

        const totalPaginas = Math.ceil(totalRows / limit);
        
        // Agregar ordenamiento y límite
        query += ' ORDER BY l.ultima_actualizacion DESC LIMIT ? OFFSET ?';
        queryParams.push(limit, offset);

        // Obtener libros
        const libros = await new Promise((resolve, reject) => {
            db.query(query, queryParams, (err, results) => {
                if (err) reject(err);
                resolve(results);
            });
        });

        const error = req.session && req.session.error ? req.session.error : '';
        const success = req.session && req.session.success ? req.session.success : '';
        
        // Limpiar mensajes después de usarlos
        if (req.session) {
            req.session.error = '';
            req.session.success = '';
        }

        res.render('admin/libros/libros/historial', {
            active: 'libros',
            libros,
            paginacion: {
                pagina: page,
                totalPaginas: totalPaginas,
                total: totalRows,
                inicio: offset + 1,
                fin: Math.min(offset + limit, totalRows)
            },
            busqueda,
            error,
            success
        });
    } catch (error) {
        console.error('Error al cargar historial de libros:', error);
        if (req.session) req.session.error = 'Error al cargar el historial';
        res.redirect('/admin/libros?tab=libros');
    }
});

// Restaurar libro
router.get('/restaurar/:id', isAuthenticated, isBibliotecarioOrAdmin, async (req, res) => {
    try {
        const libroId = req.params.id;
        
        // Restaurar libro
        db.query('UPDATE libros SET estado = true WHERE id = ?', [libroId], (err, result) => {
            if (err) {
                console.error('Error al restaurar libro:', err);
                if (req.session) req.session.error = 'Error al restaurar el libro: ' + err.message;
                return res.redirect('/admin/libros/libro/historial');
            }
            
            if (req.session) req.session.success = 'Libro restaurado exitosamente';
            res.redirect('/admin/libros?tab=libros');
        });
    } catch (error) {
        console.error('Error en el proceso de restaurar libro:', error);
        if (req.session) req.session.error = 'Error al procesar la solicitud';
        res.redirect('/admin/libros/libro/historial');
    }
});

module.exports = router;
