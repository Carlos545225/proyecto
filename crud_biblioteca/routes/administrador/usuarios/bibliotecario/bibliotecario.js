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
        cb(null, 'biblio-' + Date.now() + path.extname(file.originalname));
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

        // Verificar si el email ya existe
        const [existingEmail] = await db.query(
            'SELECT id FROM bibliotecarios WHERE email = ?',
            [email]
        );

        if (existingEmail.length > 0) {
            req.session.error = 'El email ya está registrado';
            return res.redirect('/admin/usuarios/bibliotecario/agregar');
        }

        // Verificar si el número de documento ya existe
        const [existingDoc] = await db.query(
            'SELECT id FROM bibliotecarios WHERE numero_documento = ?',
            [numero_documento]
        );

        if (existingDoc.length > 0) {
            req.session.error = 'El número de documento ya está registrado';
            return res.redirect('/admin/usuarios/bibliotecario/agregar');
        }

        // Procesar la foto de perfil si se subió una
        let foto_perfil = 'default.png';
        if (req.file) {
            foto_perfil = req.file.filename;
        }

        // Insertar el nuevo bibliotecario
        const [result] = await db.query(
            `INSERT INTO bibliotecarios (
                nombre, apellidos, tipo_documento, numero_documento, 
                email, password, telefono, direccion, fecha_nacimiento,
                turno, fecha_contratacion, foto_perfil
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nombre, apellidos, tipo_documento, numero_documento,
                email, password, telefono, direccion, fecha_nacimiento,
                turno, fecha_contratacion, foto_perfil
            ]
        );

        if (result.affectedRows === 1) {
            req.session.success = 'Bibliotecario agregado exitosamente';
            res.redirect('/admin/usuarios?tab=bibliotecarios');
        } else {
            throw new Error('Error al agregar el bibliotecario');
        }
    } catch (error) {
        console.error('Error al agregar bibliotecario:', error);
        req.session.error = 'Error al agregar el bibliotecario';
        res.redirect('/admin/usuarios/bibliotecario/agregar');
    }
});

// Ruta para mostrar el formulario de editar bibliotecario
router.get('/editar/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const [bibliotecario] = await db.query(
            'SELECT * FROM bibliotecarios WHERE id = ?',
            [req.params.id]
        );

        if (bibliotecario.length === 0) {
            req.session.error = 'Bibliotecario no encontrado';
            return res.redirect('/admin/usuarios?tab=bibliotecarios');
        }

        res.render('admin/usuarios/bibliotecarios/editar', {
            active: 'usuarios',
            bibliotecario: bibliotecario[0],
            tab: 'bibliotecarios'
        });
    } catch (error) {
        console.error('Error al cargar bibliotecario:', error);
        req.session.error = 'Error al cargar el bibliotecario';
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
            telefono,
            direccion,
            fecha_nacimiento,
            turno,
            fecha_contratacion
        } = req.body;

        // Verificar si el email ya existe (excluyendo el bibliotecario actual)
        const [existingEmail] = await db.query(
            'SELECT id FROM bibliotecarios WHERE email = ? AND id != ?',
            [email, req.params.id]
        );

        if (existingEmail.length > 0) {
            req.session.error = 'El email ya está registrado';
            return res.redirect(`/admin/usuarios/bibliotecario/editar/${req.params.id}`);
        }

        // Verificar si el número de documento ya existe (excluyendo el bibliotecario actual)
        const [existingDoc] = await db.query(
            'SELECT id FROM bibliotecarios WHERE numero_documento = ? AND id != ?',
            [numero_documento, req.params.id]
        );

        if (existingDoc.length > 0) {
            req.session.error = 'El número de documento ya está registrado';
            return res.redirect(`/admin/usuarios/bibliotecario/editar/${req.params.id}`);
        }

        // Obtener el bibliotecario actual para la foto de perfil
        const [currentBiblio] = await db.query(
            'SELECT foto_perfil FROM bibliotecarios WHERE id = ?',
            [req.params.id]
        );

        let foto_perfil = currentBiblio[0].foto_perfil;
        if (req.file) {
            // Eliminar la foto anterior si no es la predeterminada
            if (foto_perfil !== 'default.png') {
                const oldPath = path.join(__dirname, '../../../../public/uploads/usuarios', foto_perfil);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }
            foto_perfil = req.file.filename;
        }

        // Actualizar el bibliotecario
        const [result] = await db.query(
            `UPDATE bibliotecarios SET 
                nombre = ?, apellidos = ?, tipo_documento = ?, numero_documento = ?,
                email = ?, telefono = ?, direccion = ?, fecha_nacimiento = ?,
                turno = ?, fecha_contratacion = ?, foto_perfil = ?
            WHERE id = ?`,
            [
                nombre, apellidos, tipo_documento, numero_documento,
                email, telefono, direccion, fecha_nacimiento,
                turno, fecha_contratacion, foto_perfil, req.params.id
            ]
        );

        if (result.affectedRows === 1) {
            req.session.success = 'Bibliotecario actualizado exitosamente';
            res.redirect('/admin/usuarios?tab=bibliotecarios');
        } else {
            throw new Error('Error al actualizar el bibliotecario');
        }
    } catch (error) {
        console.error('Error al actualizar bibliotecario:', error);
        req.session.error = 'Error al actualizar el bibliotecario';
        res.redirect(`/admin/usuarios/bibliotecario/editar/${req.params.id}`);
    }
});

// Ruta para eliminar el bibliotecario (enviar al historial)
router.get('/eliminar/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const [result] = await db.query(
            'UPDATE bibliotecarios SET estado = false WHERE id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 1) {
            req.session.success = 'Bibliotecario eliminado exitosamente';
        } else {
            req.session.error = 'Error al eliminar el bibliotecario';
        }
    } catch (error) {
        console.error('Error al eliminar bibliotecario:', error);
        req.session.error = 'Error al eliminar el bibliotecario';
    }
    res.redirect('/admin/usuarios?tab=bibliotecarios');
});

// Ruta para restaurar bibliotecario
router.get('/restaurar/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const [result] = await db.query(
            'UPDATE bibliotecarios SET estado = true WHERE id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 1) {
            req.session.success = 'Bibliotecario restaurado exitosamente';
        } else {
            req.session.error = 'Error al restaurar el bibliotecario';
        }
    } catch (error) {
        console.error('Error al restaurar bibliotecario:', error);
        req.session.error = 'Error al restaurar el bibliotecario';
    }
    res.redirect('/admin/usuarios/bibliotecario/historial');
});

// Ruta para ver detalles del bibliotecario
router.get('/ver/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const [bibliotecario] = await db.query(
            'SELECT * FROM bibliotecarios WHERE id = ?',
            [req.params.id]
        );

        if (bibliotecario.length === 0) {
            req.session.error = 'Bibliotecario no encontrado';
            return res.redirect('/admin/usuarios?tab=bibliotecarios');
        }

        res.render('admin/usuarios/bibliotecarios/ver', {
            active: 'usuarios',
            bibliotecario: bibliotecario[0],
            tab: 'bibliotecarios'
        });
    } catch (error) {
        console.error('Error al cargar bibliotecario:', error);
        req.session.error = 'Error al cargar el bibliotecario';
        res.redirect('/admin/usuarios?tab=bibliotecarios');
    }
});

// Ruta para ver el historial de bibliotecarios
router.get('/historial', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const [bibliotecarios] = await db.query(
            'SELECT * FROM bibliotecarios WHERE estado = false ORDER BY fecha_registro DESC'
        );

        res.render('admin/usuarios/bibliotecarios/historial', {
            active: 'usuarios',
            bibliotecarios: bibliotecarios,
            tab: 'bibliotecarios'
        });
    } catch (error) {
        console.error('Error al cargar historial:', error);
        req.session.error = 'Error al cargar el historial de bibliotecarios';
        res.redirect('/admin/usuarios?tab=bibliotecarios');
    }
});

module.exports = router;
