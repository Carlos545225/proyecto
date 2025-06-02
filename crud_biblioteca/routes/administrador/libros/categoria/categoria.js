const express = require('express');
const router = express.Router();
const { isAuthenticated, isBibliotecarioOrAdmin } = require('../../../login/login');
const db = require('../../../../lib/db');

// Redireccionar a la vista principal con la pestaña de categorías activa
router.get('/', isAuthenticated, isBibliotecarioOrAdmin, (req, res) => {
    res.redirect('/admin/libros?tab=categorias');
});

// Formulario agregar categoría
router.get('/agregar', isAuthenticated, isBibliotecarioOrAdmin, (req, res) => {
    // Obtener categorías padre para el select
    db.query('SELECT id, nombre FROM categorias_padre ORDER BY nombre', (err, categorias_padre) => {
        const error = req.session && req.session.error ? req.session.error : '';
        const success = req.session && req.session.success ? req.session.success : '';
        
        // Limpiar mensajes después de usarlos
        if (req.session) {
            req.session.error = '';
            req.session.success = '';
        }
        
        res.render('admin/libros/categoria/agregar', { 
            active: 'libros',
            categorias_padre: categorias_padre || [],
            error: error,
            success: success
        });
    });
});

// Guardar categoría
router.post('/agregar', isAuthenticated, isBibliotecarioOrAdmin, (req, res) => {
    const { nombre, codigo, descripcion, categoria_padre } = req.body;
    
    // Validaciones
    if (!nombre || !descripcion) {
        if (req.session) req.session.error = 'Los campos nombre y descripción son obligatorios';
        return res.redirect('/admin/libros/categoria/agregar');
    }

    // Insertar categoría
    const query = `
        INSERT INTO categorias (
            nombre,
            codigo,
            descripcion,
            categoria_padre_id,
            estado
        ) VALUES (?, ?, ?, ?, true)
    `;

    db.query(query, [
        nombre,
        codigo || null,
        descripcion,
        categoria_padre || null
    ], (err, result) => {
        if (err) {
            console.error('Error al agregar categoría:', err);
            if (req.session) req.session.error = 'Error al agregar la categoría: ' + err.message;
            return res.redirect('/admin/libros/categoria/agregar');
        }
        
        if (req.session) req.session.success = 'Categoría agregada exitosamente';
        res.redirect('/admin/libros?tab=categorias');
    });
});

// Formulario editar categoría
router.get('/editar/:id', isAuthenticated, isBibliotecarioOrAdmin, (req, res) => {
    const categoriaId = req.params.id;
    
    // Obtener la categoría a editar junto con su categoría padre
    const query = `
        SELECT 
            c.*,
            COALESCE(cp.nombre, 'Sin Categoría Padre') as categoria_padre_nombre
        FROM categorias c 
        LEFT JOIN categorias_padre cp ON c.categoria_padre_id = cp.id 
        WHERE c.id = ?
    `;

    db.query(query, [categoriaId], (err, categoria) => {
        if (err || !categoria[0]) {
            if (req.session) req.session.error = 'Error al cargar la categoría';
            return res.redirect('/admin/libros?tab=categorias');
        }

        // Obtener todas las categorías padre para el select
        db.query('SELECT id, nombre FROM categorias_padre ORDER BY nombre', (err, categorias_padre) => {
            const error = req.session && req.session.error ? req.session.error : '';
            const success = req.session && req.session.success ? req.session.success : '';
            
            // Limpiar mensajes después de usarlos
            if (req.session) {
                req.session.error = '';
                req.session.success = '';
            }
            
            res.render('admin/libros/categoria/editar', { 
                active: 'libros',
                categoria: categoria[0],
                categorias_padre: categorias_padre || [],
                error: error,
                success: success
            });
        });
    });
});

// Actualizar categoría
router.post('/editar/:id', isAuthenticated, isBibliotecarioOrAdmin, (req, res) => {
    const categoriaId = req.params.id;
    const { nombre, codigo, descripcion, categoria_padre } = req.body;
    
    // Validaciones
    if (!nombre || !descripcion) {
        if (req.session) req.session.error = 'Los campos nombre y descripción son obligatorios';
        return res.redirect(`/admin/libros/categoria/editar/${categoriaId}`);
    }

    // Actualizar categoría
    const query = `
        UPDATE categorias 
        SET nombre = ?,
            codigo = ?,
            descripcion = ?,
            categoria_padre_id = ?,
            ultima_actualizacion = CURRENT_TIMESTAMP
        WHERE id = ?
    `;

    db.query(query, [
        nombre,
        codigo || null,
        descripcion,
        categoria_padre || null,
        categoriaId
    ], (err, result) => {
        if (err) {
            console.error('Error al actualizar categoría:', err);
            if (req.session) req.session.error = 'Error al actualizar la categoría: ' + err.message;
            return res.redirect(`/admin/libros/categoria/editar/${categoriaId}`);
        }
        
        if (req.session) req.session.success = 'Categoría actualizada exitosamente';
        res.redirect('/admin/libros?tab=categorias');
    });
});

// Desactivar categoría (enviar al historial)
router.get('/eliminar/:id', isAuthenticated, isBibliotecarioOrAdmin, (req, res) => {
    const categoriaId = req.params.id;
    
    // Primero verificamos que la categoría exista y esté activa
    db.query('SELECT * FROM categorias WHERE id = ? AND estado = true', [categoriaId], (err, categoria) => {
        if (err) {
            console.error('Error al buscar la categoría:', err);
            if (req.session) req.session.error = 'Error al buscar la categoría';
            return res.redirect('/admin/libros?tab=categorias');
        }

        if (!categoria || categoria.length === 0) {
            if (req.session) req.session.error = 'La categoría no existe o ya está en el historial';
            return res.redirect('/admin/libros?tab=categorias');
        }

        // Procedemos a desactivar la categoría
        const updateQuery = `
            UPDATE categorias 
            SET estado = false, 
                ultima_actualizacion = CURRENT_TIMESTAMP 
            WHERE id = ?
        `;

        db.query(updateQuery, [categoriaId], (err, result) => {
            if (err) {
                console.error('Error al desactivar categoría:', err);
                if (req.session) req.session.error = 'Error al desactivar la categoría';
                return res.redirect('/admin/libros?tab=categorias');
            }

            if (result.affectedRows === 0) {
                if (req.session) req.session.error = 'No se pudo desactivar la categoría';
                return res.redirect('/admin/libros?tab=categorias');
            }
            
            if (req.session) req.session.success = 'Categoría enviada al historial exitosamente';
            res.redirect('/admin/libros?tab=categorias');
        });
    });
});

// Historial de categorías
router.get('/historial', isAuthenticated, isBibliotecarioOrAdmin, (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const busqueda = req.query.busqueda || '';

    // Consulta base para categorías inactivas
    let query = `
        SELECT c.*, COALESCE(cp.nombre, 'Sin Categoría Padre') as categoria_padre_nombre 
        FROM categorias c 
        LEFT JOIN categorias_padre cp ON c.categoria_padre_id = cp.id 
        WHERE c.estado = false
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM categorias WHERE estado = false';
    const queryParams = [];

    // Agregar búsqueda si existe
    if (busqueda) {
        const searchCondition = ' AND (c.nombre LIKE ? OR c.descripcion LIKE ?)';
        query += searchCondition;
        countQuery += searchCondition;
        queryParams.push(`%${busqueda}%`, `%${busqueda}%`);
    }

    // Obtener total de registros
    db.query(countQuery, queryParams, (err, totalRows) => {
        if (err) {
            console.error('Error al obtener total de categorías:', err);
            if (req.session) req.session.error = 'Error al cargar el historial de categorías';
            return res.render('admin/libros/categoria/historial', { 
                active: 'libros',
                categorias: [],
                paginacion: {
                    pagina: 1,
                    totalPaginas: 1
                },
                busqueda: busqueda,
                error: 'Error al cargar el historial'
            });
        }

        const total = totalRows[0].total;
        const totalPaginas = Math.ceil(total / limit);
        
        // Agregar ordenamiento y límite
        query += ' ORDER BY c.ultima_actualizacion DESC LIMIT ? OFFSET ?';
        queryParams.push(limit, offset);

        // Obtener categorías
        db.query(query, queryParams, (err, categorias) => {
            if (err) {
                console.error('Error al obtener categorías:', err);
                if (req.session) req.session.error = 'Error al cargar el historial de categorías';
                categorias = [];
            }

            res.render('admin/libros/categoria/historial', {
                active: 'libros',
                categorias: categorias,
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

// Restaurar categoría
router.get('/restaurar/:id', isAuthenticated, isBibliotecarioOrAdmin, (req, res) => {
    const categoriaId = req.params.id;
    
    // Restaurar categoría
    db.query('UPDATE categorias SET estado = true WHERE id = ?', [categoriaId], (err, result) => {
        if (err) {
            console.error('Error al restaurar categoría:', err);
            if (req.session) req.session.error = 'Error al restaurar la categoría: ' + err.message;
            return res.redirect('/admin/libros/categoria/historial');
        }
        
        if (req.session) req.session.success = 'Categoría restaurada exitosamente';
        res.redirect('/admin/libros?tab=categorias');
    });
});

// Actualizar la tabla principal para mostrar los nombres de las categorías padre
router.get('/', isAuthenticated, isBibliotecarioOrAdmin, (req, res) => {
    const query = `
        SELECT 
            c.*,
            COALESCE(cp.nombre, 'Sin Categoría Padre') as categoria_padre_nombre
        FROM categorias c 
        LEFT JOIN categorias_padre cp ON c.categoria_padre_id = cp.id 
        WHERE c.estado = true 
        ORDER BY c.nombre
    `;

    db.query(query, (err, categorias) => {
        if (err) {
            if (req.session) req.session.error = 'Error al cargar las categorías';
            return res.redirect('/admin/libros?tab=categorias');
        }

        res.render('admin/libros', {
            active: 'libros',
            categorias: categorias,
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

module.exports = router;
