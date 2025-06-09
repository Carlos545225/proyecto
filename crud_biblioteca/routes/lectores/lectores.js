const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../../lib/db');

// Configuración de multer para subida de fotos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/perfiles')
    },
    filename: function (req, file, cb) {
        cb(null, 'perfil_' + req.session.user.id + path.extname(file.originalname))
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Solo se permiten archivos de imagen (jpg, jpeg, png)'));
    }
});

// Middleware para verificar si el usuario es lector
const isLector = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.rol === 'lector') {
        return next();
    }
    res.redirect('/');
};

// Aplicar middleware a todas las rutas
router.use(isLector);

// Ruta principal del panel de lector
router.get('/', async (req, res) => {
    try {
        // Obtener estadísticas del lector
        const [prestamosActivos] = await db.query(
            'SELECT COUNT(*) as count FROM prestamos WHERE lector_id = ? AND estado = "prestado"',
            [req.session.user.id]
        );

        const [prestamosCompletados] = await db.query(
            'SELECT COUNT(*) as count FROM prestamos WHERE lector_id = ? AND estado = "devuelto"',
            [req.session.user.id]
        );

        let multasCount = 0;
        try {
            const [multas] = await db.query(
                'SELECT COUNT(*) as count FROM multas WHERE lector_id = ? AND estado = "pendiente"',
                [req.session.user.id]
            );
            multasCount = multas[0].count;
        } catch (error) {
            console.log('Tabla multas no disponible:', error.message);
        }

        res.render('lectores/panel', {
            user: req.session.user,
            stats: {
                prestamos_activos: prestamosActivos[0].count,
                prestamos_completados: prestamosCompletados[0].count,
                multas: multasCount
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error al cargar el panel');
    }
});

// Ruta para ver libros disponibles
router.get('/libros', async (req, res) => {
    try {
        const [libros] = await db.query(`
            SELECT l.*, c.nombre as categoria_nombre 
            FROM libros l 
            LEFT JOIN categorias c ON l.categoria_id = c.id 
            WHERE l.estado = 'disponible'
        `);
        res.render('lectores/libros', { libros });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error al cargar los libros');
    }
});

// Ruta para ver préstamos
router.get('/prestamos', async (req, res) => {
    try {
        const [prestamosActivos] = await db.query(`
            SELECT p.*, l.titulo, l.isbn 
            FROM prestamos p 
            JOIN libros l ON p.libro_id = l.id 
            WHERE p.lector_id = ? AND p.estado = 'prestado'
        `, [req.session.user.id]);

        const [prestamosCompletados] = await db.query(`
            SELECT p.*, l.titulo, l.isbn 
            FROM prestamos p 
            JOIN libros l ON p.libro_id = l.id 
            WHERE p.lector_id = ? AND p.estado = 'devuelto'
        `, [req.session.user.id]);

        res.render('lectores/prestamos', {
            prestamosActivos,
            prestamosCompletados
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error al cargar los préstamos');
    }
});

// Ruta para ver perfil
router.get('/perfil', async (req, res) => {
    try {
        // Obtener estadísticas del lector
        const [prestamosActivos] = await db.query(
            'SELECT COUNT(*) as count FROM prestamos WHERE lector_id = ? AND estado = "prestado"',
            [req.session.user.id]
        );

        const [prestamosCompletados] = await db.query(
            'SELECT COUNT(*) as count FROM prestamos WHERE lector_id = ? AND estado = "devuelto"',
            [req.session.user.id]
        );

        const [multas] = await db.query(
            'SELECT COUNT(*) as count FROM multas WHERE lector_id = ? AND estado = "pendiente"',
            [req.session.user.id]
        );

        res.render('lectores/perfil', {
            user: req.session.user,
            stats: {
                prestamos_activos: prestamosActivos[0].count,
                prestamos_completados: prestamosCompletados[0].count,
                multas: multas[0].count
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error al cargar el perfil');
    }
});

// Ruta para actualizar perfil
router.post('/perfil', async (req, res) => {
    try {
        const { nombre, apellidos, email, telefono, direccion, password_actual, password_nueva } = req.body;

        if (password_nueva) {
            // Verificar contraseña actual
            const [user] = await db.query(
                'SELECT * FROM usuarios WHERE id = ?',
                [req.session.user.id]
            );

            if (password_actual !== user[0].password) {
                return res.status(400).json({ error: 'La contraseña actual es incorrecta' });
            }

            // Actualizar con nueva contraseña
            await db.query(
                'UPDATE usuarios SET nombre = ?, apellidos = ?, email = ?, telefono = ?, direccion = ?, password = ? WHERE id = ?',
                [nombre, apellidos, email, telefono, direccion, password_nueva, req.session.user.id]
            );
        } else {
            // Actualizar sin cambiar contraseña
            await db.query(
                'UPDATE usuarios SET nombre = ?, apellidos = ?, email = ?, telefono = ?, direccion = ? WHERE id = ?',
                [nombre, apellidos, email, telefono, direccion, req.session.user.id]
            );
        }

        res.json({ message: 'Perfil actualizado correctamente' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al actualizar el perfil' });
    }
});

// Ruta para actualizar foto de perfil
router.post('/perfil/foto', upload.single('foto'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se ha subido ninguna imagen' });
        }

        // Actualizar la foto en la base de datos
        await db.query(
            'UPDATE usuarios SET foto_perfil = ? WHERE id = ?',
            [req.file.filename, req.session.user.id]
        );

        res.json({ message: 'Foto actualizada correctamente' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al actualizar la foto' });
    }
});

// Ruta para solicitar préstamo
router.post('/prestamos/solicitar', async (req, res) => {
    try {
        const { libro_id } = req.body;

        // Verificar si el libro está disponible
        const [libro] = await db.query(
            'SELECT * FROM libros WHERE id = ?',
            [libro_id]
        );

        if (!libro[0] || libro[0].estado !== 'disponible') {
            return res.status(400).json({ error: 'El libro no está disponible' });
        }

        // Verificar si el usuario tiene multas pendientes
        const [multasPendientes] = await db.query(
            'SELECT COUNT(*) as count FROM multas WHERE lector_id = ? AND estado = "pendiente"',
            [req.session.user.id]
        );

        if (multasPendientes[0].count > 0) {
            return res.status(400).json({ error: 'Tienes multas pendientes. No puedes solicitar préstamos.' });
        }

        // Verificar si el usuario ya tiene el máximo de préstamos permitidos
        const [prestamosActivos] = await db.query(
            'SELECT COUNT(*) as count FROM prestamos WHERE lector_id = ? AND estado = "prestado"',
            [req.session.user.id]
        );

        if (prestamosActivos[0].count >= 3) {
            return res.status(400).json({ error: 'Ya tienes el máximo de préstamos permitidos (3)' });
        }

        // Crear el préstamo
        const fechaPrestamo = new Date();
        const fechaDevolucion = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 días

        const [result] = await db.query(
            'INSERT INTO prestamos (lector_id, libro_id, fecha_prestamo, fecha_devolucion_esperada, estado) VALUES (?, ?, ?, ?, "prestado")',
            [req.session.user.id, libro_id, fechaPrestamo, fechaDevolucion]
        );

        // Actualizar estado del libro
        await db.query(
            'UPDATE libros SET estado = "prestado" WHERE id = ?',
            [libro_id]
        );

        res.json({ 
            message: 'Préstamo solicitado correctamente',
            prestamo: {
                id: result.insertId,
                fecha_prestamo: fechaPrestamo,
                fecha_devolucion: fechaDevolucion
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al solicitar el préstamo' });
    }
});

// Ruta para renovar préstamo
router.post('/prestamos/renovar', async (req, res) => {
    try {
        const { prestamo_id } = req.body;

        const [prestamo] = await db.query(
            'SELECT * FROM prestamos WHERE id = ?',
            [prestamo_id]
        );

        if (!prestamo[0] || prestamo[0].id_lector !== req.session.user.id) {
            return res.status(400).json({ error: 'Préstamo no encontrado' });
        }

        if (prestamo[0].estado !== 'activo') {
            return res.status(400).json({ error: 'El préstamo no está activo' });
        }

        // Verificar si ya se ha renovado antes
        if (prestamo[0].renovaciones >= 2) {
            return res.status(400).json({ error: 'No se pueden hacer más renovaciones' });
        }

        // Actualizar fecha de devolución y renovaciones
        const nuevaFechaDevolucion = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 días más
        await db.query(
            'UPDATE prestamos SET fecha_devolucion = ?, renovaciones = renovaciones + 1 WHERE id = ?',
            [nuevaFechaDevolucion, prestamo_id]
        );

        res.json({ message: 'Préstamo renovado correctamente' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al renovar el préstamo' });
    }
});

// Ruta para devolver préstamo
router.post('/prestamos/devolver', async (req, res) => {
    try {
        const { prestamo_id } = req.body;

        const [prestamo] = await db.query(`
            SELECT p.*, l.id as libro_id 
            FROM prestamos p 
            JOIN libros l ON p.libro_id = l.id 
            WHERE p.id = ?
        `, [prestamo_id]);

        if (!prestamo[0] || prestamo[0].id_lector !== req.session.user.id) {
            return res.status(400).json({ error: 'Préstamo no encontrado' });
        }

        if (prestamo[0].estado !== 'activo') {
            return res.status(400).json({ error: 'El préstamo no está activo' });
        }

        // Verificar si hay multa por retraso
        const fechaActual = new Date();
        const fechaDevolucion = new Date(prestamo[0].fecha_devolucion);
        let multa = 0;

        if (fechaActual > fechaDevolucion) {
            const diasRetraso = Math.ceil((fechaActual - fechaDevolucion) / (1000 * 60 * 60 * 24));
            multa = diasRetraso * 1; // $1 por día de retraso
        }

        // Actualizar estado del préstamo
        await db.query(
            'UPDATE prestamos SET estado = "devuelto", fecha_devolucion_real = ? WHERE id = ?',
            [fechaActual, prestamo_id]
        );

        // Actualizar estado del libro
        await db.query(
            'UPDATE libros SET estado = "disponible" WHERE id = ?',
            [prestamo[0].libro_id]
        );

        // Crear multa si hay retraso
        if (multa > 0) {
            await db.query(
                'INSERT INTO multas (id_lector, id_prestamo, monto, estado, fecha_creacion) VALUES (?, ?, ?, "pendiente", ?)',
                [req.session.user.id, prestamo_id, multa, fechaActual]
            );
        }

        res.json({ 
            message: 'Préstamo devuelto correctamente',
            multa: multa > 0 ? multa : null
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al devolver el préstamo' });
    }
});

module.exports = router; 