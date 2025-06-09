const express = require('express');
const router = express.Router();
const { isAuthenticated, isBibliotecarioOrAdmin } = require('../../login/login');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../../../lib/db');

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'public/uploads/usuarios';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, 'usuario-' + Date.now() + path.extname(file.originalname));
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

// Ruta principal del perfil
router.get('/', isAuthenticated, isBibliotecarioOrAdmin, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const userType = req.session.user.rol === 'administrador' ? 'admin' : 'bibliotecario';

        let userData;
        if (userType === 'admin') {
            userData = await new Promise((resolve, reject) => {
                db.query('SELECT * FROM administradores WHERE id = ?', [userId], (err, results) => {
                    if (err) reject(err);
                    resolve(results[0]);
                });
            });
        } else if (userType === 'bibliotecario') {
            userData = await new Promise((resolve, reject) => {
                db.query('SELECT * FROM bibliotecarios WHERE id = ?', [userId], (err, results) => {
                    if (err) reject(err);
                    resolve(results[0]);
                });
            });
        }

        // Validación: si no se encuentra el usuario, redirige o muestra error
        if (!userData) {
            req.flash('error', 'Usuario no encontrado');
            return res.redirect('/admin');
        }

        // Asegurarse de que el directorio de uploads existe
        const uploadDir = 'public/uploads/usuarios';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Si el usuario no tiene foto, usar una imagen por defecto
        if (!userData.foto_perfil) {
            userData.foto_perfil = 'default-avatar.png';
        }

        res.render('admin/perfil/index', { 
            layout: 'admin/base_panel',
            active: 'perfil',
            user: userData,
            error: req.flash('error'),
            success: req.flash('success')
        });
    } catch (error) {
        console.error('Error al cargar perfil:', error);
        req.flash('error', 'Error al cargar el perfil');
        res.redirect('/admin');
    }
});

// Ruta para actualizar información personal
router.post('/actualizar', isAuthenticated, isBibliotecarioOrAdmin, async (req, res) => {
    try {
        const { nombre, apellidos, tipo_documento, numero_documento, email, telefono, direccion, fecha_nacimiento } = req.body;
        const userId = req.session.user.id;
        const userType = req.session.user.tipo;

        // Validaciones básicas
        if (!nombre || !apellidos || !tipo_documento || !numero_documento || !email) {
            req.flash('error', 'Todos los campos marcados con * son obligatorios');
            return res.redirect('/admin/perfil');
        }

        // Verificar si el email ya existe (excluyendo el usuario actual)
        const emailExists = await new Promise((resolve, reject) => {
            const table = userType === 'admin' ? 'administradores' : 'bibliotecarios';
            db.query(`SELECT id FROM ${table} WHERE email = ? AND id != ?`, [email, userId], (err, results) => {
                if (err) reject(err);
                resolve(results.length > 0);
            });
        });

        if (emailExists) {
            req.flash('error', 'El email ya está registrado por otro usuario');
            return res.redirect('/admin/perfil');
        }

        // Verificar si el número de documento ya existe (excluyendo el usuario actual)
        const docExists = await new Promise((resolve, reject) => {
            const table = userType === 'admin' ? 'administradores' : 'bibliotecarios';
            db.query(`SELECT id FROM ${table} WHERE numero_documento = ? AND id != ?`, [numero_documento, userId], (err, results) => {
                if (err) reject(err);
                resolve(results.length > 0);
            });
        });

        if (docExists) {
            req.flash('error', 'El número de documento ya está registrado por otro usuario');
            return res.redirect('/admin/perfil');
        }

        // Actualizar información
        const table = userType === 'admin' ? 'administradores' : 'bibliotecarios';
        const query = `
            UPDATE ${table} SET 
                nombre = ?, 
                apellidos = ?, 
                tipo_documento = ?, 
                numero_documento = ?, 
                email = ?, 
                telefono = ?, 
                direccion = ?, 
                fecha_nacimiento = ?,
                ultima_actualizacion = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        await new Promise((resolve, reject) => {
            db.query(query, [
                nombre,
                apellidos,
                tipo_documento,
                numero_documento,
                email,
                telefono || null,
                direccion || null,
                fecha_nacimiento || null,
                userId
            ], (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        });

        req.flash('success', 'Información personal actualizada exitosamente');
        res.redirect('/admin/perfil');
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        req.flash('error', 'Error al actualizar la información personal');
        res.redirect('/admin/perfil');
    }
});

// Ruta para actualizar foto de perfil
router.post('/actualizar-foto', isAuthenticated, isBibliotecarioOrAdmin, upload.single('foto_perfil'), async (req, res) => {
    try {
        if (!req.file) {
            req.flash('error', 'Por favor seleccione una imagen');
            return res.redirect('/admin/perfil');
        }

        const userId = req.session.user.id;
        const userType = req.session.user.rol === 'administrador' ? 'admin' : 'bibliotecario';
        const table = userType === 'admin' ? 'administradores' : 'bibliotecarios';

        // Obtener foto actual
        const currentUser = await new Promise((resolve, reject) => {
            db.query(`SELECT foto_perfil FROM ${table} WHERE id = ?`, [userId], (err, results) => {
                if (err) reject(err);
                resolve(results[0]);
            });
        });

        // Eliminar foto anterior si existe y no es la imagen por defecto
        if (currentUser.foto_perfil && !currentUser.foto_perfil.startsWith('default')) {
            const oldFilePath = path.join('public/uploads/usuarios', currentUser.foto_perfil);
            if (fs.existsSync(oldFilePath)) {
                fs.unlink(oldFilePath, (unlinkErr) => {
                    if (unlinkErr) console.error('Error al eliminar archivo anterior:', unlinkErr);
                });
            }
        }

        // Actualizar foto en la base de datos
        await new Promise((resolve, reject) => {
            db.query(`UPDATE ${table} SET foto_perfil = ? WHERE id = ?`, [req.file.filename, userId], (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        });

        req.flash('success', 'Foto de perfil actualizada exitosamente');
        res.redirect('/admin/perfil');
    } catch (error) {
        console.error('Error al actualizar foto:', error);
        // Si hay error y se subió una imagen, eliminarla
        if (req.file) {
            const filePath = path.join('public/uploads/usuarios', req.file.filename);
            if (fs.existsSync(filePath)) {
                fs.unlink(filePath, (unlinkErr) => {
                    if (unlinkErr) console.error('Error al eliminar archivo:', unlinkErr);
                });
            }
        }
        req.flash('error', 'Error al actualizar la foto de perfil');
        res.redirect('/admin/perfil');
    }
});

// Ruta para cambiar contraseña
router.post('/cambiar-password', isAuthenticated, isBibliotecarioOrAdmin, async (req, res) => {
    try {
        const { current_password, new_password, confirm_password } = req.body;
        const userId = req.session.user.id;
        const userType = req.session.user.tipo;
        const table = userType === 'admin' ? 'administradores' : 'bibliotecarios';

        // Validar campos requeridos
        if (!current_password || !new_password || !confirm_password) {
            req.flash('error', 'Todos los campos son obligatorios');
            return res.redirect('/admin/perfil');
        }

        // Validar que las contraseñas coincidan
        if (new_password !== confirm_password) {
            req.flash('error', 'Las contraseñas no coinciden');
            return res.redirect('/admin/perfil');
        }

        // Validar contraseña actual
        const user = await new Promise((resolve, reject) => {
            db.query(`SELECT password FROM ${table} WHERE id = ?`, [userId], (err, results) => {
                if (err) reject(err);
                resolve(results[0]);
            });
        });

        if (user.password !== current_password) {
            req.flash('error', 'La contraseña actual es incorrecta');
            return res.redirect('/admin/perfil');
        }

        // Validar formato de nueva contraseña
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(new_password)) {
            req.flash('error', 'La nueva contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial');
            return res.redirect('/admin/perfil');
        }

        // Actualizar contraseña
        await new Promise((resolve, reject) => {
            db.query(`UPDATE ${table} SET password = ? WHERE id = ?`, [new_password, userId], (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        });

        req.flash('success', 'Contraseña actualizada exitosamente');
        res.redirect('/admin/perfil');
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        req.flash('error', 'Error al cambiar la contraseña');
        res.redirect('/admin/perfil');
    }
});

module.exports = router;
