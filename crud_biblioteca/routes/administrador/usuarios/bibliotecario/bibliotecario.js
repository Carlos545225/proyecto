const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../../../login/login');
const db = require('../../../../lib/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de multer para subir imágenes
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'public/uploads/usuarios';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, 'bibliotecario-' + Date.now() + path.extname(file.originalname));
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

// Ruta para mostrar el formulario de agregar bibliotecario
router.get('/agregar', isAuthenticated, isAdmin, (req, res) => {
    const error = req.session && req.session.error ? req.session.error : '';
    const success = req.session && req.session.success ? req.session.success : '';
    
    // Limpiar mensajes después de usarlos
    if (req.session) {
        req.session.error = '';
        req.session.success = '';
    }

    res.render('admin/usuarios/bibliotecarios/agregar', { 
        active: 'usuarios',
        error: error,
        success: success,
        tab: 'bibliotecarios'
    });
});

// Ruta para procesar el formulario de agregar bibliotecario
router.post('/agregar', isAuthenticated, isAdmin, upload.single('foto_perfil'), async (req, res) => {
    try {
        const {
            nombre,
            apellidos,
            tipo_documento,
            numero_documento,
            email,
            password,
            telefono,
            direccion,
            fecha_nacimiento,
            turno,
            fecha_contratacion
        } = req.body;

        // Validaciones básicas
        if (!nombre || !apellidos || !tipo_documento || !numero_documento || !email || !password || !turno || !fecha_contratacion) {
            if (req.session) req.session.error = 'Los campos nombre, apellidos, tipo de documento, número de documento, email, contraseña, turno y fecha de contratación son obligatorios';
            return res.redirect('/admin/usuarios/bibliotecario/agregar');
        }

        // Verificar si el email ya existe
        const emailExists = await new Promise((resolve, reject) => {
            db.query('SELECT id FROM bibliotecarios WHERE email = ?', [email], (err, results) => {
                if (err) reject(err);
                resolve(results.length > 0);
            });
        });

        if (emailExists) {
            if (req.session) req.session.error = 'El email ya está registrado';
            return res.redirect('/admin/usuarios/bibliotecario/agregar');
        }

        // Verificar si el número de documento ya existe
        const docExists = await new Promise((resolve, reject) => {
            db.query('SELECT id FROM bibliotecarios WHERE numero_documento = ?', [numero_documento], (err, results) => {
                if (err) reject(err);
                resolve(results.length > 0);
            });
        });

        if (docExists) {
            if (req.session) req.session.error = 'El número de documento ya está registrado';
            return res.redirect('/admin/usuarios/bibliotecario/agregar');
        }

        // Obtener el nombre del archivo de la foto si se subió una
        const foto_perfil = req.file ? req.file.filename : 'default.png';

        // Insertar bibliotecario
        const query = `
            INSERT INTO bibliotecarios (
                nombre, 
                apellidos, 
                tipo_documento, 
                numero_documento, 
                email, 
                password, 
                telefono, 
                direccion, 
                fecha_nacimiento,
                turno,
                fecha_contratacion,
                foto_perfil,
                estado
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true)
        `;

        await new Promise((resolve, reject) => {
            db.query(query, [
                nombre,
                apellidos,
                tipo_documento,
                numero_documento,
                email,
                password,
                telefono || null,
                direccion || null,
                fecha_nacimiento || null,
                turno,
                fecha_contratacion,
                foto_perfil
            ], (err, result) => {
                if (err) {
                    // Si hay error y se subió una imagen, eliminarla
                    if (req.file) {
                        const filePath = path.join('public/uploads/usuarios', req.file.filename);
                        fs.unlink(filePath, (unlinkErr) => {
                            if (unlinkErr) console.error('Error al eliminar archivo:', unlinkErr);
                        });
                    }
                    reject(err);
                }
                resolve(result);
            });
        });

        if (req.session) req.session.success = 'Bibliotecario agregado exitosamente';
        res.redirect('/admin/usuarios?tab=bibliotecarios');
    } catch (error) {
        console.error('Error al agregar bibliotecario:', error);
        // Si hay error y se subió una imagen, eliminarla
        if (req.file) {
            const filePath = path.join('public/uploads/usuarios', req.file.filename);
            fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr) console.error('Error al eliminar archivo:', unlinkErr);
            });
        }
        if (req.session) req.session.error = 'Error al agregar el bibliotecario: ' + error.message;
        res.redirect('/admin/usuarios/bibliotecario/agregar');
    }
});

// Ruta para mostrar el formulario de editar bibliotecario
router.get('/editar/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const biblioId = req.params.id;
        
        // Obtener datos del bibliotecario
        const bibliotecario = await new Promise((resolve, reject) => {
            db.query('SELECT * FROM bibliotecarios WHERE id = ?', [biblioId], (err, results) => {
                if (err) reject(err);
                if (results.length === 0) reject(new Error('Bibliotecario no encontrado'));
                resolve(results[0]);
            });
        });

        // Formatear las fechas para los inputs type="date"
        if (bibliotecario.fecha_nacimiento) {
            const fecha = new Date(bibliotecario.fecha_nacimiento);
            bibliotecario.fecha_nacimiento = fecha.toISOString().split('T')[0];
        }
        if (bibliotecario.fecha_contratacion) {
            const fecha = new Date(bibliotecario.fecha_contratacion);
            bibliotecario.fecha_contratacion = fecha.toISOString().split('T')[0];
        }

        const error = req.session && req.session.error ? req.session.error : '';
        const success = req.session && req.session.success ? req.session.success : '';
        const oldData = req.session && req.session.oldData ? req.session.oldData : null;
        
        // Limpiar mensajes y datos antiguos después de usarlos
        if (req.session) {
            req.session.error = '';
            req.session.success = '';
            req.session.oldData = null;
        }

        res.render('admin/usuarios/bibliotecarios/editar', { 
            active: 'usuarios',
            bibliotecario,
            error: error,
            success: success,
            oldData: oldData,
            tab: 'bibliotecarios'
        });
    } catch (error) {
        console.error('Error al cargar datos del bibliotecario:', error);
        if (req.session) {
            req.session.error = 'Error al cargar los datos del bibliotecario';
            req.session.oldData = null;
        }
        res.redirect('/admin/usuarios?tab=bibliotecarios');
    }
});

// Ruta para procesar el formulario de editar bibliotecario
router.post('/editar/:id', isAuthenticated, isAdmin, upload.single('foto_perfil'), async (req, res) => {
    try {
        const {
            nombre,
            apellidos,
            tipo_documento,
            numero_documento,
            email,
            password,
            confirm_password,
            telefono,
            direccion,
            fecha_nacimiento,
            turno,
            fecha_contratacion
        } = req.body;
        const id = req.params.id;

        // Validaciones básicas
        if (!nombre || !apellidos || !tipo_documento || !numero_documento || !email || !turno || !fecha_contratacion) {
            if (req.session) req.session.error = 'Los campos nombre, apellidos, tipo de documento, número de documento, email, turno y fecha de contratación son obligatorios';
            return res.redirect(`/admin/usuarios/bibliotecario/editar/${id}`);
        }

        // Validar que las contraseñas coincidan si se proporcionó una nueva
        if (password && password !== confirm_password) {
            if (req.session) req.session.error = 'Las contraseñas no coinciden';
            return res.redirect(`/admin/usuarios/bibliotecario/editar/${id}`);
        }

        // Verificar si el email ya existe (excluyendo el bibliotecario actual)
        const emailExists = await new Promise((resolve, reject) => {
            db.query('SELECT id FROM bibliotecarios WHERE email = ? AND id != ?', [email, id], (err, results) => {
                if (err) reject(err);
                resolve(results.length > 0);
            });
        });

        if (emailExists) {
            if (req.session) req.session.error = 'El email ya está registrado por otro bibliotecario';
            return res.redirect(`/admin/usuarios/bibliotecario/editar/${id}`);
        }

        // Verificar si el número de documento ya existe (excluyendo el bibliotecario actual)
        const docExists = await new Promise((resolve, reject) => {
            db.query('SELECT id FROM bibliotecarios WHERE numero_documento = ? AND id != ?', [numero_documento, id], (err, results) => {
                if (err) reject(err);
                resolve(results.length > 0);
            });
        });

        if (docExists) {
            if (req.session) req.session.error = 'El número de documento ya está registrado por otro bibliotecario';
            return res.redirect(`/admin/usuarios/bibliotecario/editar/${id}`);
        }

        // Obtener la foto actual
        const currentBiblio = await new Promise((resolve, reject) => {
            db.query('SELECT foto_perfil FROM bibliotecarios WHERE id = ?', [id], (err, results) => {
                if (err) reject(err);
                if (results.length === 0) reject(new Error('Bibliotecario no encontrado'));
                resolve(results[0]);
            });
        });

        let foto_perfil = currentBiblio.foto_perfil;
        if (req.file) {
            if (foto_perfil !== 'default.png') {
                const oldPath = path.join('public/uploads/usuarios', foto_perfil);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }
            foto_perfil = req.file.filename;
        }

        // Construir la consulta de actualización
        let query = `
            UPDATE bibliotecarios SET 
                nombre = ?, 
                apellidos = ?, 
                tipo_documento = ?, 
                numero_documento = ?, 
                email = ?, 
                telefono = ?, 
                direccion = ?, 
                fecha_nacimiento = ?, 
                turno = ?, 
                fecha_contratacion = ?, 
                foto_perfil = ?
        `;

        const queryParams = [
            nombre,
            apellidos,
            tipo_documento,
            numero_documento,
            email,
            telefono || null,
            direccion || null,
            fecha_nacimiento || null,
            turno,
            fecha_contratacion,
            foto_perfil
        ];

        // Si se proporcionó una nueva contraseña, actualizarla
        if (password) {
            query += ', password = ?';
            queryParams.push(password);
        }

        query += ' WHERE id = ?';
        queryParams.push(id);

        // Actualizar el bibliotecario
        const result = await new Promise((resolve, reject) => {
            db.query(query, queryParams, (err, result) => {
                if (err) {
                    // Si hay error y se subió una nueva imagen, eliminarla
                    if (req.file) {
                        const filePath = path.join('public/uploads/usuarios', req.file.filename);
                        fs.unlink(filePath, (unlinkErr) => {
                            if (unlinkErr) console.error('Error al eliminar archivo:', unlinkErr);
                        });
                    }
                    reject(err);
                }
                resolve(result);
            });
        });

        if (result.affectedRows === 1) {
            if (req.session) req.session.success = 'Bibliotecario actualizado exitosamente';
            res.redirect('/admin/usuarios?tab=bibliotecarios');
        } else {
            throw new Error('No se pudo actualizar el bibliotecario');
        }
    } catch (error) {
        console.error('Error al actualizar bibliotecario:', error);
        if (req.session) req.session.error = 'Error al actualizar el bibliotecario: ' + error.message;
        res.redirect(`/admin/usuarios/bibliotecario/editar/${req.params.id}`);
    }
});

// Ruta para ver detalles de un bibliotecario
router.get('/ver/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const biblioId = req.params.id;
        
        // Obtener datos del bibliotecario
        const bibliotecario = await new Promise((resolve, reject) => {
            db.query('SELECT * FROM bibliotecarios WHERE id = ?', [biblioId], (err, results) => {
                if (err) reject(err);
                if (results.length === 0) reject(new Error('Bibliotecario no encontrado'));
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

        res.render('admin/usuarios/bibliotecarios/ver', { 
            active: 'usuarios',
            bibliotecario,
            error: error,
            success: success,
            tab: 'bibliotecarios'
        });
    } catch (error) {
        console.error('Error al cargar detalles del bibliotecario:', error);
        if (req.session) req.session.error = 'Error al cargar los detalles del bibliotecario';
        res.redirect('/admin/usuarios?tab=bibliotecarios');
    }
});

// Ruta para ver el historial de bibliotecarios
router.get('/historial', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;
        const busqueda = req.query.busqueda || '';

        let query = 'SELECT * FROM bibliotecarios WHERE estado = false';
        let countQuery = 'SELECT COUNT(*) as total FROM bibliotecarios WHERE estado = false';
        const queryParams = [];
        const countQueryParams = [];

        if (busqueda) {
            const searchCondition = ' AND (nombre LIKE ? OR apellidos LIKE ? OR email LIKE ? OR numero_documento LIKE ?)';
            query += searchCondition;
            countQuery += searchCondition;
            const searchParam = `%${busqueda}%`;
            queryParams.push(searchParam, searchParam, searchParam, searchParam);
            countQueryParams.push(searchParam, searchParam, searchParam, searchParam);
        }

        // Obtener total de registros
        const countResult = await new Promise((resolve, reject) => {
            db.query(countQuery, countQueryParams, (err, results) => {
                if (err) reject(err);
                resolve(results[0].total);
            });
        });

        const total = countResult;
        const totalPaginas = Math.ceil(total / limit);

        // Agregar ordenamiento y límite
        query += ' ORDER BY fecha_registro DESC LIMIT ? OFFSET ?';
        queryParams.push(limit, offset);

        // Obtener registros
        const bibliotecarios = await new Promise((resolve, reject) => {
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

        res.render('admin/usuarios/bibliotecarios/historial', {
            bibliotecarios,
            paginacion: {
                pagina: page,
                totalPaginas,
                total,
                inicio: offset + 1,
                fin: Math.min(offset + limit, total)
            },
            busqueda,
            active: 'usuarios',
            error: error,
            success: success,
            tab: 'bibliotecarios'
        });
    } catch (error) {
        console.error('Error al obtener historial de bibliotecarios:', error);
        res.status(500).render('error', {
            message: 'Error al obtener el historial de bibliotecarios',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// Ruta para restaurar un bibliotecario
router.get('/restaurar/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const result = await new Promise((resolve, reject) => {
            db.query('UPDATE bibliotecarios SET estado = true WHERE id = ?', [req.params.id], (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        });

        if (result.affectedRows === 1) {
            if (req.session) req.session.success = 'Bibliotecario restaurado exitosamente';
        } else {
            if (req.session) req.session.error = 'No se pudo restaurar el bibliotecario';
        }
    } catch (error) {
        console.error('Error al restaurar bibliotecario:', error);
        if (req.session) req.session.error = 'Error al restaurar el bibliotecario';
    }
    res.redirect('/admin/usuarios/bibliotecario/historial');
});

// Ruta para eliminar un bibliotecario
router.get('/eliminar/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const result = await new Promise((resolve, reject) => {
            db.query('UPDATE bibliotecarios SET estado = false WHERE id = ?', [req.params.id], (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        });

        if (result.affectedRows === 1) {
            if (req.session) req.session.success = 'Bibliotecario eliminado exitosamente';
        } else {
            if (req.session) req.session.error = 'No se pudo eliminar el bibliotecario';
        }
    } catch (error) {
        console.error('Error al eliminar bibliotecario:', error);
        if (req.session) req.session.error = 'Error al eliminar el bibliotecario';
    }
    res.redirect('/admin/usuarios?tab=bibliotecarios');
});

module.exports = router;