const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const flash = require('connect-flash');

const app = express();

// Configuración de la sesión
app.use(session({
    secret: 'biblioteca-secreta-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

// Configuración de flash messages
app.use(flash());

// Middleware para mensajes flash
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Configure express-ejs-layouts
app.use(expressLayouts);
app.set('layout', 'admin/base_panel');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Importar rutas y middlewares de login
const { router: loginRoutes, isAuthenticated, isAdmin, isBibliotecarioOrAdmin } = require('./routes/login/login');

// Importar rutas del panel de administración
const panelRoutes = require('./routes/administrador/panel/panel');

// Importar ruta centralizada de libros
const librosRoutes = require('./routes/administrador/libros/index');

// Importar rutas específicas para operaciones CRUD
const autorRoutes = require('./routes/administrador/libros/autor/autor');
const categoriaRoutes = require('./routes/administrador/libros/categoria/categoria');
const editorialRoutes = require('./routes/administrador/libros/editorial/editorial');
const libroRoutes = require('./routes/administrador/libros/libro/libro');

// Importar rutas de usuarios, perfil y reportes
const usuariosRoutes = require('./routes/administrador/usuarios/usuarios');
const perfilRoutes = require('./routes/administrador/perfil/perfil');
const reportesRoutes = require('./routes/administrador/reportes/reportes');

// Usar las rutas de login
app.use('/', loginRoutes);

// Usar las rutas del panel de administración (protegidas)
app.use('/admin', isAuthenticated, isBibliotecarioOrAdmin, panelRoutes);

// Usar la ruta centralizada de libros para la vista principal (protegida)
app.use('/admin/libros', isAuthenticated, isBibliotecarioOrAdmin, librosRoutes);

// Usar las rutas específicas para operaciones CRUD (protegidas)
app.use('/admin/libros/autor', isAuthenticated, isBibliotecarioOrAdmin, autorRoutes);
app.use('/admin/libros/categoria', isAuthenticated, isBibliotecarioOrAdmin, categoriaRoutes);
app.use('/admin/libros/editorial', isAuthenticated, isBibliotecarioOrAdmin, editorialRoutes);
app.use('/admin/libros/libro', isAuthenticated, isBibliotecarioOrAdmin, libroRoutes);

// Usar las rutas modulares de usuarios, perfil y reportes (solo administradores)
app.use('/admin/usuarios', isAuthenticated, isAdmin, usuariosRoutes);
app.use('/admin/perfil', isAuthenticated, isBibliotecarioOrAdmin, perfilRoutes);
app.use('/admin/reportes', isAuthenticated, isAdmin, reportesRoutes);

// Catch 404 and forward to error handler
app.use(function(req, res, next) {
  res.status(404).render('error', {
    message: 'Página no encontrada',
    error: { status: 404 },
    layout: false
  });
});

// Error handler
app.use(function(err, req, res, next) {
  // Set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Render the error page
  res.status(err.status || 500);
  res.render('error', { layout: false });
});

module.exports = app;