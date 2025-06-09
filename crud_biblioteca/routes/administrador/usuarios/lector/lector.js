const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../../../login/login');
const db = require('../../../../lib/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de multer para subida de imágenes
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'public/uploads/usuarios';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, 'lector-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 2000000 }, // 2MB
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Solo se permiten imágenes (JPG, JPEG, PNG, GIF)'));
    }
});

// Ruta para mostrar el formulario de agregar lector
router.get('/agregar', isAuthenticated, isAdmin, (req, res) => {
    res.render('admin/usuarios/lectores/agregar', {
        active: 'usuarios',
        activeTab: 'lectores',
        success: req.flash('success'),
        error: req.flash('error')
    });
});

// Ruta para procesar el formulario de agregar lector
router.post('/agregar', isAuthenticated, isAdmin, upload.single('foto_perfil'), async (req, res) => {
    try {
        const {
            nombre,
            apellidos,
            tipo_documento,
            numero_documento,
            fecha_nacimiento,
            telefono,
            email,
            password,
            confirm_password,
            direccion
        } = req.body;

        // Validar campos requeridos
        if (!nombre || !apellidos || !tipo_documento || !numero_documento || !email || !password || !confirm_password) {
            req.flash('error', 'Todos los campos marcados con * son obligatorios');
            return res.redirect('/admin/usuarios/lector/agregar');
        }

        // Validar que las contraseñas coincidan
        if (password !== confirm_password) {
            req.flash('error', 'Las contraseñas no coinciden');
            return res.redirect('/admin/usuarios/lector/agregar');
        }

        // Verificar si el email ya existe
        const emailExists = await new Promise((resolve, reject) => {
            db.query('SELECT * FROM lectores WHERE email = ?', [email], (err, results) => {
                if (err) reject(err);
                resolve(results.length > 0);
            });
        });

        if (emailExists) {
            req.flash('error', 'El email ya está registrado');
            return res.redirect('/admin/usuarios/lector/agregar');
        }

        // Verificar si el número de documento ya existe
        const docExists = await new Promise((resolve, reject) => {
            db.query('SELECT * FROM lectores WHERE tipo_documento = ? AND numero_documento = ?', 
                [tipo_documento, numero_documento], 
                (err, results) => {
                    if (err) reject(err);
                    resolve(results.length > 0);
                });
        });

        if (docExists) {
            req.flash('error', 'Ya existe un lector con ese número de documento');
            return res.redirect('/admin/usuarios/lector/agregar');
        }

        // Procesar la imagen si se subió una
        let foto_perfil = 'default.png';
        if (req.file) {
            foto_perfil = req.file.filename;
        }

        // Insertar el nuevo lector
        const query = `
            INSERT INTO lectores (
                nombre, apellidos, tipo_documento, numero_documento,
                fecha_nacimiento, telefono, email, password,
                direccion, foto_perfil, fecha_registro, estado
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), true)
        `;

        await new Promise((resolve, reject) => {
            db.query(query, [
                nombre, apellidos, tipo_documento, numero_documento,
                fecha_nacimiento || null, telefono || null, email,
                password, direccion || null, foto_perfil
            ], (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        });

        req.flash('success', 'Lector agregado exitosamente');
        res.redirect('/admin/usuarios?tab=lectores');

    } catch (error) {
        console.error('Error al agregar lector:', error);
        req.flash('error', 'Error al agregar el lector');
        res.redirect('/admin/usuarios/lector/agregar');
    }
});

// Ruta para mostrar el formulario de editar lector
router.get('/editar/:id', isAuthenticated, isAdmin, (req, res) => {
    const id = req.params.id;
    
    db.query('SELECT * FROM lectores WHERE id = ?', [id], (err, results) => {
        if (err) {
            console.error('Error al obtener lector:', err);
            req.flash('error', 'Error al obtener los datos del lector');
            return res.redirect('/admin/usuarios?tab=lectores');
        }

        if (results.length === 0) {
            req.flash('error', 'Lector no encontrado');
            return res.redirect('/admin/usuarios?tab=lectores');
        }

        // Formatear la fecha de nacimiento para el input type="date"
        const lector = results[0];
        if (lector.fecha_nacimiento) {
            const fecha = new Date(lector.fecha_nacimiento);
            lector.fecha_nacimiento = fecha.toISOString().split('T')[0];
        }

        res.render('admin/usuarios/lectores/editar', {
            lector: lector,
            active: 'usuarios',
            activeTab: 'lectores',
            success: req.flash('success'),
            error: req.flash('error')
        });
    });
});

// Ruta para procesar el formulario de editar lector
router.post('/editar/:id', isAuthenticated, isAdmin, upload.single('foto_perfil'), async (req, res) => {
    try {
        console.log('Iniciando actualización del lector');
        console.log('ID del lector:', req.params.id);
        console.log('Datos recibidos:', req.body);
        
        const {
            nombre, apellidos, tipo_documento, numero_documento,
            fecha_nacimiento, telefono, email, password,
            confirm_password, direccion
        } = req.body;
        const id = req.params.id;

        // Validar campos requeridos
        if (!nombre || !apellidos || !tipo_documento || !numero_documento || !email || !password || !confirm_password) {
            req.flash('error', 'Todos los campos marcados con * son obligatorios');
            return res.redirect(`/admin/usuarios/lector/editar/${id}`);
        }

        // Validar que las contraseñas coincidan
        if (password !== confirm_password) {
            req.flash('error', 'Las contraseñas no coinciden');
            return res.redirect(`/admin/usuarios/lector/editar/${id}`);
        }

        // Verificar si el email ya existe (excluyendo el lector actual)
        const emailExists = await new Promise((resolve, reject) => {
            db.query('SELECT id FROM lectores WHERE email = ? AND id != ?', [email, id], (err, results) => {
                if (err) {
                    console.error('Error al verificar email:', err);
                    reject(err);
                }
                    resolve(results.length > 0);
                });
        });

        if (emailExists) {
            console.log('Error: Email ya existe');
            req.flash('error', 'El email ya está registrado por otro lector');
            return res.redirect(`/admin/usuarios/lector/editar/${id}`);
        }

        // Verificar si el número de documento ya existe (excluyendo el lector actual)
        const docExists = await new Promise((resolve, reject) => {
            db.query('SELECT id FROM lectores WHERE numero_documento = ? AND id != ?', [numero_documento, id], (err, results) => {
                if (err) {
                    console.error('Error al verificar número de documento:', err);
                    reject(err);
                }
                    resolve(results.length > 0);
                });
        });

        if (docExists) {
            console.log('Error: Número de documento ya existe');
            req.flash('error', 'El número de documento ya está registrado por otro lector');
            return res.redirect(`/admin/usuarios/lector/editar/${id}`);
        }

        // Obtener datos actuales del lector
        const currentLector = await new Promise((resolve, reject) => {
            db.query('SELECT * FROM lectores WHERE id = ?', [id], (err, results) => {
                if (err) {
                    console.error('Error al obtener datos actuales del lector:', err);
                    reject(err);
                }
                if (results.length === 0) {
                    console.error('Lector no encontrado');
                    reject(new Error('Lector no encontrado'));
                }
                resolve(results[0]);
            });
        });

        console.log('Datos actuales del lector:', currentLector);

        // Preparar la consulta SQL base
        let sql = 'UPDATE lectores SET nombre = ?, apellidos = ?, tipo_documento = ?, numero_documento = ?, email = ?, telefono = ?, fecha_nacimiento = ?, direccion = ?, ultima_actualizacion = CURRENT_TIMESTAMP';
        let params = [
            nombre,
            apellidos,
            tipo_documento,
            numero_documento,
            email, 
            telefono || null, 
            fecha_nacimiento || null,
            direccion || null
        ];

        // Si se proporcionó una nueva contraseña, incluirla en la actualización
        if (password) {
            sql += ', password = ?';
            params.push(password);
        }

        // Si se subió una nueva foto, incluirla en la actualización
        if (req.file) {
            // Eliminar la foto anterior si existe
            if (currentLector.foto_perfil && currentLector.foto_perfil !== 'default.png') {
                const oldFilePath = path.join('public/uploads/usuarios', currentLector.foto_perfil);
                fs.unlink(oldFilePath, (unlinkErr) => {
                    if (unlinkErr) console.error('Error al eliminar archivo anterior:', unlinkErr);
                });
            }
            sql += ', foto_perfil = ?';
            params.push(req.file.filename);
        }

        sql += ' WHERE id = ?';
        params.push(id);

        console.log('SQL a ejecutar:', sql);
        console.log('Parámetros:', params);

        // Ejecutar la actualización
        const result = await new Promise((resolve, reject) => {
            db.query(sql, params, (err, result) => {
                if (err) {
                    console.error('Error al ejecutar la actualización:', err);
                    reject(err);
                }
                resolve(result);
            });
        });

        if (result.affectedRows > 0) {
            console.log('Lector actualizado exitosamente');
        req.flash('success', 'Lector actualizado exitosamente');
        res.redirect('/admin/usuarios?tab=lectores');
        } else {
            console.log('Error: No se pudo actualizar el lector');
            req.flash('error', 'No se pudo actualizar el lector');
            res.redirect(`/admin/usuarios/lector/editar/${id}`);
        }
    } catch (error) {
        console.error('Error al actualizar lector:', error);
        // Si hay error y se subió una imagen, eliminarla
        if (req.file) {
            const filePath = path.join('public/uploads/usuarios', req.file.filename);
            fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr) console.error('Error al eliminar archivo:', unlinkErr);
            });
        }
        req.flash('error', 'Error al actualizar el lector: ' + error.message);
        res.redirect(`/admin/usuarios/lector/editar/${req.params.id}`);
    }
});

// Ruta para ver detalles del lector
router.get('/ver/:id', isAuthenticated, isAdmin, (req, res) => {
    const id = req.params.id;
    
    db.query('SELECT * FROM lectores WHERE id = ?', [id], (err, results) => {
        if (err) {
            console.error('Error al obtener lector:', err);
            req.flash('error', 'Error al obtener los datos del lector');
            return res.redirect('/admin/usuarios?tab=lectores');
        }

        if (results.length === 0) {
            req.flash('error', 'Lector no encontrado');
            return res.redirect('/admin/usuarios?tab=lectores');
        }

        res.render('admin/usuarios/lectores/ver', {
            lector: results[0],
            active: 'usuarios',
            activeTab: 'lectores',
            success: req.flash('success'),
            error: req.flash('error')
        });
    });
});

// Ruta para mostrar el historial de lectores
router.get('/historial', isAuthenticated, isAdmin, (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const busqueda = req.query.busqueda || '';

    let query = 'SELECT * FROM lectores WHERE estado = false';
    let countQuery = 'SELECT COUNT(*) as total FROM lectores WHERE estado = false';
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
    db.query(countQuery, countQueryParams, (err, results) => {
        if (err) {
            console.error('Error al contar lectores:', err);
            req.flash('error', 'Error al obtener el historial');
            return res.redirect('/admin/usuarios?tab=lectores');
        }

        const total = results[0].total;
        const totalPaginas = Math.ceil(total / limit);

        // Agregar ordenamiento y límite
        query += ' ORDER BY fecha_registro DESC LIMIT ? OFFSET ?';
        queryParams.push(limit, offset);

        // Obtener registros
        db.query(query, queryParams, (err, results) => {
            if (err) {
                console.error('Error al obtener lectores:', err);
                req.flash('error', 'Error al obtener el historial');
                return res.redirect('/admin/usuarios?tab=lectores');
            }

            res.render('admin/usuarios/lectores/historial', {
                lectores: results,
                paginacion: {
                    pagina: page,
                    totalPaginas,
                    total,
                    inicio: offset + 1,
                    fin: Math.min(offset + limit, total)
                },
                busqueda,
                active: 'usuarios',
                activeTab: 'lectores',
                success: req.flash('success'),
                error: req.flash('error')
            });
        });
    });
});

// Ruta para eliminar un lector (borrado lógico)
router.get('/eliminar/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        await new Promise((resolve, reject) => {
            db.query('UPDATE lectores SET estado = false WHERE id = ?', [req.params.id], (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        });

        req.flash('success', 'Lector eliminado exitosamente');
        res.redirect('/admin/usuarios?tab=lectores');

    } catch (error) {
        console.error('Error al eliminar lector:', error);
        req.flash('error', 'Error al eliminar el lector');
        res.redirect('/admin/usuarios?tab=lectores');
    }
});

// Ruta para restaurar un lector
router.get('/restaurar/:id', isAuthenticated, isAdmin, (req, res) => {
    db.query('UPDATE lectores SET estado = true WHERE id = ?', [req.params.id], (err, result) => {
        if (err) {
            console.error('Error al restaurar lector:', err);
            req.flash('error', 'Error al restaurar el lector');
        } else {
        req.flash('success', 'Lector restaurado exitosamente');
        }
        res.redirect('/admin/usuarios/lector/historial');
    });
});

module.exports = router;
