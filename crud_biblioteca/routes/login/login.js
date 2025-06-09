const express = require('express');
const router = express.Router();
const connection = require('../../lib/db');

// Middleware para verificar si el usuario está autenticado
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    res.redirect('/');
};

// Middleware para verificar si el usuario es administrador
const isAdmin = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.rol === 'administrador') {
        return next();
    }
    res.status(403).render('error', {
        message: 'Acceso denegado',
        error: { 
            status: 403,
            stack: 'No tienes permisos para acceder a esta sección. Esta área es solo para administradores.'
        },
        layout: false
    });
};

// Middleware para verificar si el usuario es bibliotecario o administrador
const isBibliotecarioOrAdmin = (req, res, next) => {
    if (req.session && req.session.user && 
        (req.session.user.rol === 'bibliotecario' || req.session.user.rol === 'administrador')) {
        return next();
    }
    res.status(403).render('error', {
        message: 'Acceso denegado',
        error: { 
            status: 403,
            stack: 'No tienes permisos para acceder a esta sección. Esta área es solo para personal de la biblioteca.'
        },
        layout: false
    });
};

// Ruta principal de login
router.get('/', (req, res) => {
    if (req.session && req.session.user) {
        return res.redirect('/admin');
    }
    res.render('login/login', { layout: false, error: null });
});

// Ruta para procesar el login
router.post('/auth', (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.render('login/login', { 
            layout: false, 
            error: 'Por favor ingrese correo y contraseña' 
        });
    }

    // Primero buscamos en la tabla de administradores
    connection.query('SELECT * FROM administradores WHERE email = ? AND password = ? AND estado = true', 
    [email, password], (error, adminResults) => {
        if (error) {
            console.error('Error en la consulta:', error);
            return res.render('login/login', { 
                layout: false, 
                error: 'Error en el servidor. Por favor intente más tarde.' 
            });
        }

        if (adminResults.length > 0) {
            const user = adminResults[0];
            req.session.user = {
                id: user.id,
                nombre: user.nombre,
                apellidos: user.apellidos,
                email: user.email,
                rol: 'administrador'
            };
            // Actualizar última sesión
            connection.query('UPDATE administradores SET ultima_sesion = NOW() WHERE id = ?', [user.id]);
            return res.redirect('/admin');
        }

        // Si no es administrador, buscamos en bibliotecarios
        connection.query('SELECT * FROM bibliotecarios WHERE email = ? AND password = ? AND estado = true', 
        [email, password], (error, biblioResults) => {
            if (error) {
                return res.render('login/login', { 
                    layout: false, 
                    error: 'Error en el servidor. Por favor intente más tarde.' 
                });
            }

            if (biblioResults.length > 0) {
                const user = biblioResults[0];
                req.session.user = {
                    id: user.id,
                    nombre: user.nombre,
                    apellidos: user.apellidos,
                    email: user.email,
                    rol: 'bibliotecario'
                };
                // Actualizar última sesión
                connection.query('UPDATE bibliotecarios SET ultima_sesion = NOW() WHERE id = ?', [user.id]);
                return res.redirect('/admin');
            }

            // Finalmente buscamos en lectores
            connection.query('SELECT * FROM lectores WHERE email = ? AND password = ? AND estado = true', 
            [email, password], (error, lectorResults) => {
                if (error) {
                    return res.render('login/login', { 
                        layout: false, 
                        error: 'Error en el servidor. Por favor intente más tarde.' 
                    });
                }

                if (lectorResults.length > 0) {
                    const user = lectorResults[0];
                    req.session.user = {
                        id: user.id,
                        nombre: user.nombre,
                        apellidos: user.apellidos,
                        email: user.email,
                        rol: 'lector'
                    };
                    // Actualizar última sesión
                    connection.query('UPDATE lectores SET ultima_sesion = NOW() WHERE id = ?', [user.id]);
                    return res.redirect('/lectores');
                }

                // Si no se encuentra en ninguna tabla
                res.render('login/login', { 
                    layout: false, 
                    error: 'Correo electrónico o contraseña incorrectos' 
                });
            });
        });
    });
});

// Ruta para cerrar sesión
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
        }
        res.redirect('/');
    });
});

module.exports = {
    router,
    isAuthenticated,
    isAdmin,
    isBibliotecarioOrAdmin
}; 