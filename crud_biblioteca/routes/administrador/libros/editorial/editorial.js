const express = require('express');
const router = express.Router();
const { isAuthenticated, isBibliotecarioOrAdmin } = require('../../../login/login');
const db = require('../../../../lib/db');

// Redireccionar a la vista principal con la pestaña de editoriales activa
router.get('/', isAuthenticated, isBibliotecarioOrAdmin, (req, res) => {
    res.redirect('/admin/libros?tab=editoriales');
});

// Formulario agregar editorial
router.get('/agregar', isAuthenticated, isBibliotecarioOrAdmin, (req, res) => {
    const error = req.session && req.session.error ? req.session.error : '';
    const success = req.session && req.session.success ? req.session.success : '';
    
    // Limpiar mensajes después de usarlos
    if (req.session) {
        req.session.error = '';
        req.session.success = '';
    }
    
    res.render('admin/libros/editorial/agregar', { 
        active: 'libros',
        error: error,
        success: success
    });
});

// Guardar editorial
router.post('/agregar', isAuthenticated, isBibliotecarioOrAdmin, (req, res) => {
    const { nombre, codigo, pais, anio_fundacion, sitio_web, email_contacto, descripcion } = req.body;
    
    // Validaciones
    if (!nombre || !codigo || !pais) {
        if (req.session) req.session.error = 'Los campos nombre, código y país son obligatorios';
        return res.redirect('/admin/libros/editorial/agregar');
    }

    // Insertar editorial
    const query = `
        INSERT INTO editoriales (
            nombre,
            codigo,
            pais,
            anio_fundacion,
            sitio_web,
            email_contacto,
            descripcion,
            estado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, true)
    `;

    db.query(query, [
        nombre,
        codigo,
        pais,
        anio_fundacion || null,
        sitio_web || null,
        email_contacto || null,
        descripcion || null
    ], (err, result) => {
        if (err) {
            console.error('Error al agregar editorial:', err);
            if (req.session) req.session.error = 'Error al agregar la editorial: ' + err.message;
            return res.redirect('/admin/libros/editorial/agregar');
        }
        
        if (req.session) req.session.success = 'Editorial agregada exitosamente';
        res.redirect('/admin/libros?tab=editoriales');
    });
});

// Formulario editar editorial
router.get('/editar/:id', isAuthenticated, isBibliotecarioOrAdmin, (req, res) => {
    const editorialId = req.params.id;
    
    // Obtener la editorial a editar
    db.query('SELECT * FROM editoriales WHERE id = ?', [editorialId], (err, editorial) => {
        if (err || !editorial[0]) {
            if (req.session) req.session.error = 'Error al cargar la editorial';
            return res.redirect('/admin/libros?tab=editoriales');
        }

        const error = req.session && req.session.error ? req.session.error : '';
        const success = req.session && req.session.success ? req.session.success : '';
        
        // Limpiar mensajes después de usarlos
        if (req.session) {
            req.session.error = '';
            req.session.success = '';
        }
        
        res.render('admin/libros/editorial/editar', { 
            active: 'libros',
            editorial: editorial[0],
            error: error,
            success: success
        });
    });
});

// Actualizar editorial
router.post('/editar/:id', isAuthenticated, isBibliotecarioOrAdmin, (req, res) => {
    const editorialId = req.params.id;
    const { nombre, codigo, pais, anio_fundacion, sitio_web, email_contacto, descripcion } = req.body;
    
    // Validaciones
    if (!nombre || !codigo || !pais) {
        if (req.session) req.session.error = 'Los campos nombre, código y país son obligatorios';
        return res.redirect(`/admin/libros/editorial/editar/${editorialId}`);
    }

    // Actualizar editorial
    const query = `
        UPDATE editoriales 
        SET nombre = ?,
            codigo = ?,
            pais = ?,
            anio_fundacion = ?,
            sitio_web = ?,
            email_contacto = ?,
            descripcion = ?,
            ultima_actualizacion = CURRENT_TIMESTAMP
        WHERE id = ?
    `;

    db.query(query, [
        nombre,
        codigo,
        pais,
        anio_fundacion || null,
        sitio_web || null,
        email_contacto || null,
        descripcion || null,
        editorialId
    ], (err, result) => {
        if (err) {
            console.error('Error al actualizar editorial:', err);
            if (req.session) req.session.error = 'Error al actualizar la editorial: ' + err.message;
            return res.redirect(`/admin/libros/editorial/editar/${editorialId}`);
        }
        
        if (req.session) req.session.success = 'Editorial actualizada exitosamente';
        res.redirect('/admin/libros?tab=editoriales');
    });
});

// Desactivar editorial (enviar al historial)
router.get('/eliminar/:id', isAuthenticated, isBibliotecarioOrAdmin, (req, res) => {
    const editorialId = req.params.id;
    
    // Primero verificamos que la editorial exista y esté activa
    db.query('SELECT * FROM editoriales WHERE id = ? AND estado = true', [editorialId], (err, editorial) => {
        if (err) {
            console.error('Error al buscar la editorial:', err);
            if (req.session) req.session.error = 'Error al buscar la editorial';
            return res.redirect('/admin/libros?tab=editoriales');
        }

        if (!editorial || editorial.length === 0) {
            if (req.session) req.session.error = 'La editorial no existe o ya está en el historial';
            return res.redirect('/admin/libros?tab=editoriales');
        }

        // Procedemos a desactivar la editorial
        const updateQuery = `
            UPDATE editoriales 
            SET estado = false, 
                ultima_actualizacion = CURRENT_TIMESTAMP 
            WHERE id = ?
        `;

        db.query(updateQuery, [editorialId], (err, result) => {
            if (err) {
                console.error('Error al desactivar editorial:', err);
                if (req.session) req.session.error = 'Error al desactivar la editorial';
                return res.redirect('/admin/libros?tab=editoriales');
            }

            if (result.affectedRows === 0) {
                if (req.session) req.session.error = 'No se pudo desactivar la editorial';
                return res.redirect('/admin/libros?tab=editoriales');
            }
            
            if (req.session) req.session.success = 'Editorial enviada al historial exitosamente';
            res.redirect('/admin/libros?tab=editoriales');
        });
    });
});

// Historial de editoriales
router.get('/historial', isAuthenticated, isBibliotecarioOrAdmin, (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const busqueda = req.query.busqueda || '';

    // Consulta base para editoriales inactivas
    let query = 'SELECT * FROM editoriales WHERE estado = false';
    let countQuery = 'SELECT COUNT(*) as total FROM editoriales WHERE estado = false';
    const queryParams = [];

    // Agregar búsqueda si existe
    if (busqueda) {
        const searchCondition = ' AND (nombre LIKE ? OR codigo LIKE ? OR pais LIKE ? OR descripcion LIKE ?)';
        query += searchCondition;
        countQuery += searchCondition;
        queryParams.push(`%${busqueda}%`, `%${busqueda}%`, `%${busqueda}%`, `%${busqueda}%`);
    }

    // Obtener total de registros
    db.query(countQuery, queryParams, (err, totalRows) => {
        if (err) {
            console.error('Error al obtener total de editoriales:', err);
            if (req.session) req.session.error = 'Error al cargar el historial de editoriales';
            return res.render('admin/libros/editorial/historial', { 
                active: 'libros',
                editoriales: [],
                paginacion: {
                    pagina: 1,
                    totalPaginas: 1,
                    total: 0,
                    inicio: 0,
                    fin: 0
                },
                busqueda: busqueda,
                error: 'Error al cargar el historial'
            });
        }

        const total = totalRows[0].total;
        const totalPaginas = Math.ceil(total / limit);
        
        // Agregar ordenamiento y límite
        query += ' ORDER BY ultima_actualizacion DESC LIMIT ? OFFSET ?';
        queryParams.push(limit, offset);

        // Obtener editoriales
        db.query(query, queryParams, (err, editoriales) => {
            if (err) {
                console.error('Error al obtener editoriales:', err);
                if (req.session) req.session.error = 'Error al cargar el historial de editoriales';
                editoriales = [];
            }

            res.render('admin/libros/editorial/historial', {
                active: 'libros',
                editoriales: editoriales,
                paginacion: {
                    pagina: page,
                    totalPaginas: totalPaginas,
                    total: total,
                    inicio: offset + 1,
                    fin: Math.min(offset + limit, total)
                },
                busqueda: busqueda,
                error: req.session && req.session.error ? req.session.error : '',
                success: req.session && req.session.success ? req.session.success : ''
            });

            // Limpiar mensajes
            if (req.session) {
                req.session.error = '';
                req.session.success = '';
            }
        });
    });
});

// Restaurar editorial
router.get('/restaurar/:id', isAuthenticated, isBibliotecarioOrAdmin, (req, res) => {
    const editorialId = req.params.id;
    
    // Restaurar editorial
    db.query('UPDATE editoriales SET estado = true WHERE id = ?', [editorialId], (err, result) => {
        if (err) {
            console.error('Error al restaurar editorial:', err);
            if (req.session) req.session.error = 'Error al restaurar la editorial: ' + err.message;
            return res.redirect('/admin/libros/editorial/historial');
        }
        
        if (req.session) req.session.success = 'Editorial restaurada exitosamente';
        res.redirect('/admin/libros?tab=editoriales');
    });
});

module.exports = router;
