CREATE TABLE IF NOT EXISTS multas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    lector_id INT NOT NULL,
    prestamo_id INT NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_pago DATETIME,
    estado ENUM('pendiente', 'pagada') DEFAULT 'pendiente',
    FOREIGN KEY (lector_id) REFERENCES usuarios(id),
    FOREIGN KEY (prestamo_id) REFERENCES prestamos(id)
); 