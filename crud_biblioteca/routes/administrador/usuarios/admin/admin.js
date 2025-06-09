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
        cb(null, 'admin-' + Date.now() + path.extname(file.originalname));
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

// Ruta para mostrar el formulario de agregar administrador
router.get('/agregar', isAuthenticated, isAdmin, (req, res) => {
    const error = req.session && req.session.error ? req.session.error : '';
    const success = req.session && req.session.success ? req.session.success : '';
    
    // Limpiar mensajes después de usarlos
    if (req.session) {
        req.session.error = '';
        req.session.success = '';
    }

    res.render('admin/usuarios/administrador/agregar', { 
        active: 'usuarios',
        error: error,
        success: success,
        tab: 'administradores'
    });
});

// Ruta para procesar el formulario de agregar administrador
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
            fecha_nacimiento
        } = req.body;

        // Validaciones básicas
        if (!nombre || !apellidos || !tipo_documento || !numero_documento || !email || !password) {
            if (req.session) req.session.error = 'Los campos nombre, apellidos, tipo de documento, número de documento, email y contraseña son obligatorios';
            return res.redirect('/admin/usuarios/administrador/agregar');
        }

        // Verificar si el email ya existe
        const emailExists = await new Promise((resolve, reject) => {
            db.query('SELECT id FROM administradores WHERE email = ?', [email], (err, results) => {
                if (err) reject(err);
                resolve(results.length > 0);
            });
        });

        if (emailExists) {
            if (req.session) req.session.error = 'El email ya está registrado';
            return res.redirect('/admin/usuarios/administrador/agregar');
        }

        // Verificar si el número de documento ya existe
        const docExists = await new Promise((resolve, reject) => {
            db.query('SELECT id FROM administradores WHERE numero_documento = ?', [numero_documento], (err, results) => {
                if (err) reject(err);
                resolve(results.length > 0);
            });
        });

        if (docExists) {
            if (req.session) req.session.error = 'El número de documento ya está registrado';
            return res.redirect('/admin/usuarios/administrador/agregar');
        }

        // Obtener el nombre del archivo de la foto si se subió una
        const foto_perfil = req.file ? req.file.filename : 'default.png';

        // Insertar administrador
        const query = `
            INSERT INTO administradores (
                nombre, 
                apellidos, 
                tipo_documento, 
                numero_documento, 
                email, 
                password, 
                telefono, 
                direccion, 
                fecha_nacimiento,
                foto_perfil,
                estado
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true)
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

        if (req.session) req.session.success = 'Administrador agregado exitosamente';
        res.redirect('/admin/usuarios?tab=administradores');
    } catch (error) {
        console.error('Error al agregar administrador:', error);
        // Si hay error y se subió una imagen, eliminarla
        if (req.file) {
            const filePath = path.join('public/uploads/usuarios', req.file.filename);
            fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr) console.error('Error al eliminar archivo:', unlinkErr);
            });
        }
        if (req.session) req.session.error = 'Error al agregar el administrador: ' + error.message;
        res.redirect('/admin/usuarios/administrador/agregar');
    }
});

// Ruta para mostrar el formulario de editar administrador
router.get('/editar/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const adminId = req.params.id;
        
        // Obtener datos del administrador
        const administrador = await new Promise((resolve, reject) => {
            db.query('SELECT * FROM administradores WHERE id = ?', [adminId], (err, results) => {
                if (err) reject(err);
                if (results.length === 0) reject(new Error('Administrador no encontrado'));
                resolve(results[0]);
            });
        });

        // Formatear la fecha de nacimiento para el input type="date"
        if (administrador.fecha_nacimiento) {
            const fecha = new Date(administrador.fecha_nacimiento);
            administrador.fecha_nacimiento = fecha.toISOString().split('T')[0];
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

        res.render('admin/usuarios/administrador/editar', { 
            active: 'usuarios',
            administrador,
            error: error,
            success: success,
            oldData: oldData,
            tab: 'administradores'
        });
    } catch (error) {
        console.error('Error al cargar datos del administrador:', error);
        if (req.session) {
            req.session.error = 'Error al cargar los datos del administrador';
            req.session.oldData = null;
        }
        res.redirect('/admin/usuarios?tab=administradores');
    }
});

// Ruta para procesar el formulario de editar administrador
router.post('/editar/:id', upload.single('foto_perfil'), async (req, res) => {
    try {
        const { nombre, apellidos, tipo_documento, numero_documento, email, password, confirm_password, telefono, fecha_nacimiento, direccion } = req.body;
        const id = req.params.id;

        // Validaciones básicas
        if (!nombre || !apellidos || !tipo_documento || !numero_documento || !email) {
            console.log('Error: Campos requeridos faltantes');
            req.flash('error', 'Todos los campos marcados con * son obligatorios');
            return res.redirect(`/admin/usuarios/administrador/editar/${id}`);
        }

        // Validar que las contraseñas coincidan si se proporcionó una nueva
        if (password && password !== confirm_password) {
            console.log('Error: Las contraseñas no coinciden');
            req.flash('error', 'Las contraseñas no coinciden');
            return res.redirect(`/admin/usuarios/administrador/editar/${id}`);
        }

        // Verificar si el email ya existe (excluyendo el administrador actual)
        const emailExists = await new Promise((resolve, reject) => {
            db.query('SELECT id FROM administradores WHERE email = ? AND id != ?', [email, id], (err, results) => {
                if (err) reject(err);
                resolve(results.length > 0);
            });
        });

        if (emailExists) {
            console.log('Error: Email ya existe');
            req.flash('error', 'El email ya está registrado por otro administrador');
            return res.redirect(`/admin/usuarios/administrador/editar/${id}`);
        }

        // Verificar si el número de documento ya existe (excluyendo el administrador actual)
        const docExists = await new Promise((resolve, reject) => {
            db.query('SELECT id FROM administradores WHERE numero_documento = ? AND id != ?', [numero_documento, id], (err, results) => {
                if (err) reject(err);
                resolve(results.length > 0);
            });
        });

        if (docExists) {
            console.log('Error: Número de documento ya existe');
            req.flash('error', 'El número de documento ya está registrado por otro administrador');
            return res.redirect(`/admin/usuarios/administrador/editar/${id}`);
        }

        // Obtener datos actuales del administrador
        const currentAdmin = await new Promise((resolve, reject) => {
            db.query('SELECT * FROM administradores WHERE id = ?', [id], (err, results) => {
                if (err) reject(err);
                if (results.length === 0) reject(new Error('Administrador no encontrado'));
                resolve(results[0]);
            });
        });

        // Preparar la consulta SQL base
        let sql = 'UPDATE administradores SET nombre = ?, apellidos = ?, tipo_documento = ?, numero_documento = ?, email = ?, telefono = ?, fecha_nacimiento = ?, direccion = ?, ultima_actualizacion = CURRENT_TIMESTAMP';
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
            if (currentAdmin.foto_perfil && currentAdmin.foto_perfil !== 'default.png') {
                const oldFilePath = path.join('public/uploads/usuarios', currentAdmin.foto_perfil);
                fs.unlink(oldFilePath, (unlinkErr) => {
                    if (unlinkErr) console.error('Error al eliminar archivo anterior:', unlinkErr);
                });
            }
            sql += ', foto_perfil = ?';
            params.push(req.file.filename);
        }

        sql += ' WHERE id = ?';
        params.push(id);

        // Ejecutar la actualización
        const result = await new Promise((resolve, reject) => {
            db.query(sql, params, (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        });

        if (result.affectedRows > 0) {
            console.log('Administrador actualizado exitosamente');
            req.flash('success', 'Administrador actualizado exitosamente');
            res.redirect('/admin/usuarios?tab=administradores');
        } else {
            console.log('Error: No se pudo actualizar el administrador');
            req.flash('error', 'No se pudo actualizar el administrador');
            res.redirect(`/admin/usuarios/administrador/editar/${id}`);
        }
    } catch (error) {
        console.error('Error al actualizar administrador:', error);
        // Si hay error y se subió una imagen, eliminarla
        if (req.file) {
            const filePath = path.join('public/uploads/usuarios', req.file.filename);
            fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr) console.error('Error al eliminar archivo:', unlinkErr);
            });
        }
        req.flash('error', 'Error al actualizar el administrador');
        res.redirect(`/admin/usuarios/administrador/editar/${req.params.id}`);
    }
});

// Ruta para eliminar el administrador (enviar al historial)
router.get('/eliminar/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const adminId = req.params.id;
        
        // Actualizar estado del administrador
        await new Promise((resolve, reject) => {
            db.query('UPDATE administradores SET estado = false WHERE id = ?', [adminId], (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        });

        if (req.session) req.session.success = 'Administrador enviado al historial exitosamente';
        res.redirect('/admin/usuarios?tab=administradores');
    } catch (error) {
        console.error('Error al eliminar administrador:', error);
        if (req.session) req.session.error = 'Error al eliminar el administrador: ' + error.message;
        res.redirect('/admin/usuarios?tab=administradores');
    }
});

// Ruta para restaurar administrador
router.get('/restaurar/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const adminId = req.params.id;
        
        // Restaurar estado del administrador
        await new Promise((resolve, reject) => {
            db.query('UPDATE administradores SET estado = true WHERE id = ?', [adminId], (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        });

        if (req.session) req.session.success = 'Administrador restaurado exitosamente';
        res.redirect('/admin/usuarios?tab=historial');
    } catch (error) {
        console.error('Error al restaurar administrador:', error);
        if (req.session) req.session.error = 'Error al restaurar el administrador: ' + error.message;
        res.redirect('/admin/usuarios?tab=historial');
    }
});

// Ruta para ver detalles del administrador
router.get('/ver/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const adminId = req.params.id;
        
        // Obtener detalles del administrador incluyendo la foto
        const administrador = await new Promise((resolve, reject) => {
            db.query('SELECT id, nombre, apellidos, tipo_documento, numero_documento, email, telefono, direccion, fecha_nacimiento, estado, fecha_registro, ultima_sesion, foto_perfil FROM administradores WHERE id = ?', [adminId], (err, results) => {
                if (err) reject(err);
                if (results.length === 0) reject(new Error('Administrador no encontrado'));
                resolve(results[0]);
            });
        });

        console.log('Datos del administrador:', administrador); // Para debugging

        const error = req.session && req.session.error ? req.session.error : '';
        const success = req.session && req.session.success ? req.session.success : '';
        
        // Limpiar mensajes después de usarlos
        if (req.session) {
            req.session.error = '';
            req.session.success = '';
        }

        res.render('admin/usuarios/administrador/ver', {
            active: 'usuarios',
            administrador,
            error: error,
            success: success,
            tab: 'administradores'
        });
    } catch (error) {
        console.error('Error al cargar detalles del administrador:', error);
        if (req.session) req.session.error = 'Error al cargar los detalles del administrador';
        res.redirect('/admin/usuarios?tab=administradores');
    }
});

// Ruta para ver el historial de administradores
router.get('/historial', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const busqueda = req.query.busqueda || '';
        const pagina = parseInt(req.query.page) || 1;
        const porPagina = 10;
        const offset = (pagina - 1) * porPagina;

        // Construir la consulta base
        let query = 'SELECT * FROM administradores WHERE estado = false';
        let countQuery = 'SELECT COUNT(*) as total FROM administradores WHERE estado = false';
        let params = [];

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
            params = [searchParam, searchParam, searchParam, searchParam];
        }

        // Agregar ordenamiento y paginación
        query += ' ORDER BY fecha_registro DESC LIMIT ? OFFSET ?';
        params.push(porPagina, offset);

        // Obtener total de registros
        const totalResult = await new Promise((resolve, reject) => {
            db.query(countQuery, params.slice(0, -2), (err, results) => {
                if (err) reject(err);
                resolve(results[0].total);
            });
        });

        // Obtener administradores
        const administradores = await new Promise((resolve, reject) => {
            db.query(query, params, (err, results) => {
                if (err) reject(err);
                resolve(results);
            });
        });

        const totalPaginas = Math.ceil(totalResult / porPagina);

        const error = req.session && req.session.error ? req.session.error : '';
        const success = req.session && req.session.success ? req.session.success : '';
        
        // Limpiar mensajes después de usarlos
        if (req.session) {
            req.session.error = '';
            req.session.success = '';
        }

        res.render('admin/usuarios/administrador/historial', {
            active: 'usuarios',
            administradores,
            paginacion: {
                pagina,
                totalPaginas,
                total: totalResult,
                inicio: offset + 1,
                fin: Math.min(offset + porPagina, totalResult)
            },
            busqueda,
            error,
            success,
            tab: 'historial'
        });
    } catch (error) {
        console.error('Error al cargar historial de administradores:', error);
        if (req.session) req.session.error = 'Error al cargar el historial';
        res.redirect('/admin/usuarios?tab=historial');
    }
});

// Ruta principal de usuarios
router.get('/', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;
        const busqueda = req.query.busqueda || '';
        const estado = req.query.estado || '';

        // Obtener administradores activos
        const administradores = await new Promise((resolve, reject) => {
            let query = `
                SELECT * FROM administradores 
                WHERE estado = true
            `;
            const params = [];

            if (busqueda) {
                query += ` AND (
                    nombre LIKE ? OR 
                    apellidos LIKE ? OR 
                    email LIKE ? OR 
                    numero_documento LIKE ?
                )`;
                const searchTerm = `%${busqueda}%`;
                params.push(searchTerm, searchTerm, searchTerm, searchTerm);
            }

            if (estado) {
                query += ` AND estado = ?`;
                params.push(estado === 'activo');
            }

            query += ` ORDER BY fecha_registro DESC LIMIT ? OFFSET ?`;
            params.push(limit, offset);

            db.query(query, params, (err, results) => {
                if (err) reject(err);
                resolve(results);
            });
        });

        // Obtener total de administradores activos
        const totalActivos = await new Promise((resolve, reject) => {
            let query = `SELECT COUNT(*) as total FROM administradores WHERE estado = true`;
            const params = [];

            if (busqueda) {
                query += ` AND (
                    nombre LIKE ? OR 
                    apellidos LIKE ? OR 
                    email LIKE ? OR 
                    numero_documento LIKE ?
                )`;
                const searchTerm = `%${busqueda}%`;
                params.push(searchTerm, searchTerm, searchTerm, searchTerm);
            }

            if (estado) {
                query += ` AND estado = ?`;
                params.push(estado === 'activo');
            }

            db.query(query, params, (err, results) => {
                if (err) reject(err);
                resolve(results[0].total);
            });
        });

        // Obtener administradores inactivos (historial)
        const historial = await new Promise((resolve, reject) => {
            let query = `
                SELECT * FROM administradores 
                WHERE estado = false
            `;
            const params = [];

            if (busqueda) {
                query += ` AND (
                    nombre LIKE ? OR 
                    apellidos LIKE ? OR 
                    email LIKE ? OR 
                    numero_documento LIKE ?
                )`;
                const searchTerm = `%${busqueda}%`;
                params.push(searchTerm, searchTerm, searchTerm, searchTerm);
            }

            query += ` ORDER BY fecha_registro DESC LIMIT ? OFFSET ?`;
            params.push(limit, offset);

            db.query(query, params, (err, results) => {
                if (err) reject(err);
                resolve(results);
            });
        });

        // Obtener total de administradores inactivos
        const totalInactivos = await new Promise((resolve, reject) => {
            let query = `SELECT COUNT(*) as total FROM administradores WHERE estado = false`;
            const params = [];

            if (busqueda) {
                query += ` AND (
                    nombre LIKE ? OR 
                    apellidos LIKE ? OR 
                    email LIKE ? OR 
                    numero_documento LIKE ?
                )`;
                const searchTerm = `%${busqueda}%`;
                params.push(searchTerm, searchTerm, searchTerm, searchTerm);
            }

            db.query(query, params, (err, results) => {
                if (err) reject(err);
                resolve(results[0].total);
            });
        });

        // Calcular paginación (por defecto para administradores activos)
        const paginacion = {
            pagina: page,
            totalPaginas: Math.ceil(totalActivos / limit),
            total: totalActivos,
            inicio: offset + 1,
            fin: Math.min(offset + limit, totalActivos)
        };

        res.render('admin/usuarios/index', {
            title: 'Gestión de Usuarios',
            administradores: administradores,
            historial: historial,
            paginacion: paginacion,
            busqueda: busqueda,
            query: req.query
        });
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).send('Error al obtener usuarios');
    }
});

module.exports = router;
