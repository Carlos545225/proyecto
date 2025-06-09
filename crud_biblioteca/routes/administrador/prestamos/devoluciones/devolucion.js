const express = require('express');
const router = express.Router();
const { isAuthenticated, isBibliotecarioOrAdmin } = require('../../../login/login');
const db = require('../../../../lib/db');

// Función para calcular la multa
function calcularMulta(fechaDevolucionEsperada, fechaDevolucionReal) {
    const fechaEsperada = new Date(fechaDevolucionEsperada);
    const fechaReal = new Date(fechaDevolucionReal);
    const diasAtraso = Math.ceil((fechaReal - fechaEsperada) / (1000 * 60 * 60 * 24));
    const montoPorDia = 5.00;
    return {
        diasAtraso: diasAtraso > 0 ? diasAtraso : 0,
        montoTotal: diasAtraso > 0 ? diasAtraso * montoPorDia : 0
    };
}

// Ruta para mostrar el formulario de devolución
router.get('/registrar/:id', isAuthenticated, isBibliotecarioOrAdmin, async (req, res) => {
    try {
        const prestamoId = req.params.id;
        
        // Obtener datos del préstamo
        const prestamo = await new Promise((resolve, reject) => {
            const query = `
                SELECT p.*, 
                       CONCAT(l.nombre, ' ', l.apellidos) as lector_nombre,
                       li.titulo as libro_titulo
                FROM prestamos p
                JOIN lectores l ON p.lector_id = l.id
                JOIN libros li ON p.libro_id = li.id
                WHERE p.id = ? AND p.fecha_devolucion_real IS NULL
            `;
            
            db.query(query, [prestamoId], (err, results) => {
                if (err) reject(err);
                if (!results || results.length === 0) reject(new Error('Préstamo no encontrado o ya devuelto'));
                resolve(results[0]);
            });
        });

        // Calcular multa inicial
        const fechaActual = new Date();
        const { diasAtraso, montoTotal } = calcularMulta(prestamo.fecha_devolucion_esperada, fechaActual);

        res.render('admin/prestamos/devoluciones/registrar', {
            layout: 'admin/base_panel',
            active: 'prestamos',
            prestamo,
            diasAtraso,
            multaTotal: montoTotal,
            fecha_devolucion: fechaActual.toISOString().slice(0, 16),
            estado_libro: ''
        });

    } catch (error) {
        console.error('Error al cargar datos del préstamo:', error);
        if (req.session) req.session.error = 'Error al cargar los datos del préstamo';
        res.redirect('/admin/prestamos');
    }
});

// Ruta para procesar la devolución
router.post('/registrar/:id', isAuthenticated, isBibliotecarioOrAdmin, async (req, res) => {
    try {
        const prestamoId = req.params.id;
        const { estado_libro, fecha_devolucion, observaciones } = req.body;

        // Validaciones básicas
        if (!estado_libro || !fecha_devolucion) {
            if (req.session) req.session.error = 'Todos los campos marcados con * son obligatorios';
            return res.redirect(`/admin/prestamos/devoluciones/registrar/${prestamoId}`);
        }

        // Obtener datos del préstamo
        const prestamo = await new Promise((resolve, reject) => {
            db.query('SELECT * FROM prestamos WHERE id = ?', [prestamoId], (err, results) => {
                if (err) reject(err);
                if (!results || results.length === 0) reject(new Error('Préstamo no encontrado'));
                resolve(results[0]);
            });
        });

        // Calcular multa
        const { montoTotal } = calcularMulta(prestamo.fecha_devolucion_esperada, fecha_devolucion);

        // Actualizar el préstamo
        await new Promise((resolve, reject) => {
            const query = `
                UPDATE prestamos 
                SET fecha_devolucion_real = ?,
                    estado_libro = ?,
                    monto_multa = ?,
                    observaciones = ?
                WHERE id = ?
            `;
            db.query(query, [fecha_devolucion, estado_libro, montoTotal, observaciones, prestamoId], (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        });

        // Actualizar el stock del libro
        await new Promise((resolve, reject) => {
            db.query('UPDATE libros SET stock = stock + 1 WHERE id = ?', [prestamo.libro_id], (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        });

        if (req.session) req.session.success = 'Devolución registrada exitosamente';
        res.redirect('/admin/prestamos?tab=historial');

    } catch (error) {
        console.error('Error al procesar la devolución:', error);
        if (req.session) req.session.error = 'Error al procesar la devolución: ' + error.message;
        res.redirect(`/admin/prestamos/devoluciones/registrar/${req.params.id}`);
    }
});

module.exports = router; 