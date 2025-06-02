const express = require('express');
const router = express.Router();
const { isAuthenticated, isBibliotecarioOrAdmin } = require('../../../login/login');
const db = require('../../../../lib/db');

// Redireccionar a la vista principal con la pestaña de autores activa
router.get('/', isAuthenticated, isBibliotecarioOrAdmin, (req, res) => {
    res.redirect('/admin/libros?tab=autores');
});

// Formulario agregar autor
router.get('/agregar', isAuthenticated, isBibliotecarioOrAdmin, (req, res) => {
    // Usar session en lugar de flash
    const error = req.session && req.session.error ? req.session.error : '';
    const success = req.session && req.session.success ? req.session.success : '';
    
    // Limpiar mensajes después de usarlos
    if (req.session) {
        req.session.error = '';
        req.session.success = '';
    }
    
    res.render('admin/libros/autores/agregar', { 
        active: 'libros',
        autor: null,
        error: error,
        success: success
    });
});

// Guardar autor
router.post('/agregar', isAuthenticated, isBibliotecarioOrAdmin, (req, res) => {
    const { nombre_completo, nacionalidad, fecha_nacimiento, fecha_fallecimiento, biografia } = req.body;
    
    // Validaciones
    if (!nombre_completo || !nacionalidad || !fecha_nacimiento) {
        if (req.session) req.session.error = 'Los campos nombre, nacionalidad y fecha de nacimiento son obligatorios';
        return res.redirect('/admin/libros/autor/agregar');
    }

    // Insertar autor
    const query = `
        INSERT INTO autores (
            nombre_completo, 
            nacionalidad, 
            fecha_nacimiento, 
            fecha_fallecimiento, 
            biografia,
            estado
        ) VALUES (?, ?, ?, ?, ?, true)
    `;

    db.query(query, [
        nombre_completo,
        nacionalidad,
        fecha_nacimiento,
        fecha_fallecimiento || null,
        biografia || null
    ], (err, result) => {
        if (err) {
            console.error('Error al agregar autor:', err);
            if (req.session) req.session.error = 'Error al agregar el autor: ' + err.message;
            return res.redirect('/admin/libros/autor/agregar');
        }
        
        if (req.session) req.session.success = 'Autor agregado exitosamente';
        res.redirect('/admin/libros?tab=autores');
    });
});

// Desactivar autor (enviar al historial)
router.get('/eliminar/:id', isAuthenticated, isBibliotecarioOrAdmin, (req, res) => {
    const { id } = req.params;
    
    // Actualizar estado del autor
    db.query('UPDATE autores SET estado = false WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error('Error al desactivar autor:', err);
            if (req.session) req.session.error = 'Error al desactivar el autor: ' + err.message;
            return res.redirect('/admin/libros?tab=autores');
        }
        
        if (req.session) req.session.success = 'Autor enviado al historial exitosamente';
        res.redirect('/admin/libros?tab=autores');
    });
});

// Historial de autores
router.get('/historial', isAuthenticated, isBibliotecarioOrAdmin, (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const busqueda = req.query.busqueda || '';

    // Consulta base para autores inactivos
    let query = 'SELECT * FROM autores WHERE estado = false';
    let countQuery = 'SELECT COUNT(*) as total FROM autores WHERE estado = false';
    const queryParams = [];

    // Agregar búsqueda si existe
    if (busqueda) {
        const searchCondition = ' AND (nombre_completo LIKE ? OR nacionalidad LIKE ?)';
        query += searchCondition;
        countQuery += searchCondition;
        queryParams.push(`%${busqueda}%`, `%${busqueda}%`);
    }

    // Obtener total de registros
    db.query(countQuery, queryParams, (err, totalRows) => {
        if (err) {
            console.error('Error al obtener total de autores inactivos:', err);
            if (req.session) req.session.error = 'Error al cargar el historial de autores';
            return res.redirect('/admin/libros?tab=autores');
        }
        
        const total = totalRows[0].total;
        const totalPages = Math.ceil(total / limit);

        // Agregar ordenamiento y paginación
        query += ' ORDER BY nombre_completo LIMIT ? OFFSET ?';
        queryParams.push(limit, offset);

        // Obtener autores inactivos
        db.query(query, queryParams, (err, autores) => {
            if (err) {
                console.error('Error al obtener autores inactivos:', err);
                if (req.session) req.session.error = 'Error al cargar el historial de autores';
                return res.redirect('/admin/libros?tab=autores');
            }
            
            res.render('admin/libros/autores/historial', {
                active: 'libros',
                autores: autores,
                paginacion: {
                    pagina: page,
                    totalPaginas: totalPages,
                    total,
                    inicio: offset + 1,
                    fin: Math.min(offset + limit, total)
                },
                filtros: {
                    busqueda
                },
                success: req.session && req.session.success ? req.session.success : '',
                error: req.session && req.session.error ? req.session.error : ''
            });
            
            // Limpiar mensajes de sesión después de usarlos
            if (req.session) {
                req.session.success = '';
                req.session.error = '';
            }
        });
    });
});

// Restaurar autor
router.get('/restaurar/:id', isAuthenticated, isBibliotecarioOrAdmin, (req, res) => {
    const { id } = req.params;
    
    // Restaurar autor
    db.query('UPDATE autores SET estado = true WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error('Error al restaurar autor:', err);
            if (req.session) req.session.error = 'Error al restaurar el autor: ' + err.message;
            return res.redirect('/admin/libros?tab=autores');
        }
        
        if (req.session) req.session.success = 'Autor restaurado exitosamente';
        res.redirect('/admin/libros?tab=autores');
    });
});

// Formulario editar autor
router.get('/editar/:id', isAuthenticated, isBibliotecarioOrAdmin, (req, res) => {
    const { id } = req.params;
    
    // Obtener datos del autor
    db.query('SELECT * FROM autores WHERE id = ?', [id], (err, results) => {
        if (err) {
            console.error('Error al obtener datos del autor:', err);
            if (req.session) req.session.error = 'Error al cargar los datos del autor: ' + err.message;
            return res.redirect('/admin/libros?tab=autores');
        }
        
        if (results.length === 0) {
            if (req.session) req.session.error = 'Autor no encontrado';
            return res.redirect('/admin/libros?tab=autores');
        }
        
        // Usar session en lugar de flash
        const error = req.session && req.session.error ? req.session.error : '';
        const success = req.session && req.session.success ? req.session.success : '';
        
        // Limpiar mensajes después de usarlos
        if (req.session) {
            req.session.error = '';
            req.session.success = '';
        }
        
        res.render('admin/libros/autores/editar', { 
            active: 'libros',
            autor: results[0],
            error: error,
            success: success
        });
    });
});

// Actualizar autor
router.post('/editar/:id', isAuthenticated, isBibliotecarioOrAdmin, (req, res) => {
    const { id } = req.params;
    const { nombre_completo, nacionalidad, fecha_nacimiento, fecha_fallecimiento, biografia } = req.body;
    
    // Validaciones
    if (!nombre_completo || !nacionalidad || !fecha_nacimiento) {
        if (req.session) req.session.error = 'Los campos nombre, nacionalidad y fecha de nacimiento son obligatorios';
        return res.redirect(`/admin/libros/autor/editar/${id}`);
    }

    // Actualizar autor
    const query = `
        UPDATE autores SET 
            nombre_completo = ?, 
            nacionalidad = ?, 
            fecha_nacimiento = ?, 
            fecha_fallecimiento = ?, 
            biografia = ?
        WHERE id = ?
    `;

    db.query(query, [
        nombre_completo,
        nacionalidad,
        fecha_nacimiento,
        fecha_fallecimiento || null,
        biografia || null,
        id
    ], (err, result) => {
        if (err) {
            console.error('Error al actualizar autor:', err);
            if (req.session) req.session.error = 'Error al actualizar el autor: ' + err.message;
            return res.redirect(`/admin/libros/autor/editar/${id}`);
        }
        
        if (req.session) req.session.success = 'Autor actualizado exitosamente';
        res.redirect('/admin/libros?tab=autores');
    });
});

module.exports = router;