-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS mi_biblioteca
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE mi_biblioteca;

-- Tabla de administradores
CREATE TABLE administradores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    tipo_documento ENUM(
        'CC',  -- Cédula de Ciudadanía
        'CE',  -- Cédula de Extranjería
        'TI',  -- Tarjeta de Identidad
        'PP',  -- Pasaporte
        'PE'   -- Permiso Especial de Permanencia
    ) NOT NULL,
    numero_documento VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    foto_perfil VARCHAR(255) DEFAULT 'default.png',
    telefono VARCHAR(20),
    direccion TEXT,
    fecha_nacimiento DATE,
    rol ENUM('administrador', 'bibliotecario', 'lector') DEFAULT 'administrador',
    estado BOOLEAN DEFAULT true,
    ultima_sesion TIMESTAMP NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


-- Tabla de bibliotecarios
CREATE TABLE bibliotecarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    tipo_documento ENUM(
        'CC',  -- Cédula de Ciudadanía
        'CE',  -- Cédula de Extranjería
        'TI',  -- Tarjeta de Identidad
        'PP',  -- Pasaporte
        'PE'   -- Permiso Especial de Permanencia
    ) NOT NULL,
    numero_documento VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    foto_perfil VARCHAR(255) DEFAULT 'default.png',
    telefono VARCHAR(20),
    direccion TEXT,
    fecha_nacimiento DATE,
    turno ENUM('mañana', 'tarde', 'noche'),
    fecha_contratacion DATE,
    rol ENUM('administrador', 'bibliotecario', 'lector') DEFAULT 'bibliotecario',
    estado BOOLEAN DEFAULT true,
    ultima_sesion TIMESTAMP NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


-- Tabla de lectores
CREATE TABLE lectores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    tipo_documento ENUM(
        'CC',  -- Cédula de Ciudadanía
        'CE',  -- Cédula de Extranjería
        'TI',  -- Tarjeta de Identidad
        'PP',  -- Pasaporte
        'PE'   -- Permiso Especial de Permanencia
    ) NOT NULL,
    numero_documento VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    foto_perfil VARCHAR(255) DEFAULT 'default.png',
    telefono VARCHAR(20),
    direccion TEXT,
    fecha_nacimiento DATE,
    rol ENUM('administrador', 'bibliotecario', 'lector') DEFAULT 'lector',
    estado BOOLEAN DEFAULT true,
    ultima_sesion TIMESTAMP NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


-- Tabla de autores
CREATE TABLE autores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_completo VARCHAR(200) NOT NULL,
    nacionalidad VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    fecha_fallecimiento DATE NULL,
    biografia TEXT,
    estado BOOLEAN DEFAULT true,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


CREATE TABLE categorias_padre (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO categorias_padre (nombre) VALUES
-- Literatura y Ficción
('Literatura General'),
('Novela'),
('Poesía'),
('Teatro'),
('Ensayo'),
('Ciencia Ficción'),
('Fantasía'),
('Terror y Horror'),
('Misterio y Suspense'),
('Romance'),
('Aventuras'),

-- No Ficción
('Historia'),
('Biografías'),
('Periodismo'),
('Filosofía'),
('Psicología'),

-- Arte y Cultura
('Arte'),
('Música'),
('Cine'),
('Fotografía'),
('Arquitectura'),

-- Ciencias
('Ciencias Naturales'),
('Ciencias Sociales'),
('Matemáticas'),
('Física'),
('Química'),
('Biología'),
('Astronomía'),
('Geología'),

-- Educación y Referencia
('Educación'),
('Diccionarios'),
('Enciclopedias'),
('Manuales Técnicos'),

-- Literatura Infantil y Juvenil
('Literatura Infantil'),
('Literatura Juvenil'),
('Cómics y Manga'),

-- Vida Práctica
('Autoayuda'),
('Cocina'),
('Salud y Bienestar'),
('Deportes'),
('Viajes'),
('Jardinería'),
('Hobbies y Manualidades'),

-- Profesional y Técnico
('Derecho'),
('Economía'),
('Medicina'),
('Ingeniería'),
('Informática'),
('Administración'),
('Marketing'),
('Contabilidad'),

-- Religión y Espiritualidad
('Religión'),
('Espiritualidad'),
('Mitología'),
('Ocultismo'),

-- Ciencias Humanas
('Antropología'),
('Sociología'),
('Arqueología'),
('Lingüística'),

-- Política y Sociedad
('Política'),
('Relaciones Internacionales'),
('Estudios Sociales'),
('Medio Ambiente'),

-- Idiomas
('Enseñanza de Idiomas'),
('Lingüística Aplicada'),
('Traducción e Interpretación');

-- Tabla de categorías
CREATE TABLE categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    descripcion TEXT,
    categoria_padre_id INT,
    estado BOOLEAN DEFAULT true,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_padre_id) REFERENCES categorias_padre(id) ON DELETE SET NULL
);


-- Tabla de editoriales
CREATE TABLE editoriales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    pais VARCHAR(100) NOT NULL,
    anio_fundacion INT,
    sitio_web VARCHAR(255),
    email_contacto VARCHAR(100),
    descripcion TEXT,
    estado BOOLEAN DEFAULT true,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de idiomas
CREATE TABLE idiomas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar idiomas
INSERT INTO idiomas (nombre) VALUES 
('Español'),
('Inglés'),
('Chino Mandarín'),
('Hindi'),
('Árabe'),
('Bengalí'),
('Portugués'),
('Ruso'),
('Japonés'),
('Punjabi'),
('Alemán'),
('Javanés'),
('Wu Chino'),
('Coreano'),
('Francés'),
('Telugu'),
('Marathi'),
('Turco'),
('Tamil'),
('Vietnamita'),
('Urdu'),
('Italiano'),
('Tailandés'),
('Gujarati'),
('Persa'),
('Polaco'),
('Pashto'),
('Kannada'),
('Xiang Chino'),
('Malayalam'),
('Sundanés'),
('Hausa'),
('Odia'),
('Burmese'),
('Hakka'),
('Ucraniano'),
('Bhojpuri'),
('Tagalo'),
('Yoruba'),
('Maithili'),
('Uzbeko'),
('Sindhi'),
('Amhárico'),
('Fula'),
('Rumano'),
('Oromo'),
('Igbo'),
('Azerbaiyano'),
('Awadhi'),
('Gan Chino'),
('Cebuano'),
('Holandés'),
('Kurdo'),
('Serbo-Croata'),
('Malagasy'),
('Saraiki'),
('Nepalí'),
('Sinhala'),
('Chittagonian'),
('Zulú'),
('Khmer'),
('Turkmen'),
('Assamese'),
('Madurese'),
('Somali'),
('Marwari'),
('Magahi'),
('Haryanvi'),
('Húngaro'),
('Chhattisgarhi'),
('Griego'),
('Checo'),
('Bielorruso'),
('Catalán'),
('Hebreo'),
('Sueco'),
('Danés'),
('Finlandés'),
('Noruego'),
('Eslovaco'),
('Croata'),
('Búlgaro'),
('Lituano'),
('Esloveno'),
('Letón'),
('Estonio'),
('Islandés'),
('Albanés'),
('Macedonio'),
('Mongol'),
('Galés'),
('Irlandés'),
('Swahili'),
('Latín');

-- Tabla de libros
CREATE TABLE libros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    isbn VARCHAR(20) NOT NULL UNIQUE,
    autor_id INT NOT NULL,
    categoria_id INT NOT NULL,
    editorial_id INT NOT NULL,
    anio_publicacion INT,
    idioma_id INT NOT NULL,
    numero_paginas INT,
    stock INT NOT NULL DEFAULT 0,
    portada VARCHAR(255) DEFAULT 'default-book.png',
    ubicacion VARCHAR(100),
    sinopsis TEXT,
    estado BOOLEAN DEFAULT true,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (autor_id) REFERENCES autores(id) ON DELETE RESTRICT,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT,
    FOREIGN KEY (editorial_id) REFERENCES editoriales(id) ON DELETE RESTRICT,
    FOREIGN KEY (idioma_id) REFERENCES idiomas(id) ON DELETE RESTRICT
);

-- Primero eliminamos el trigger
DROP TRIGGER IF EXISTS after_devolucion_insert;

-- Luego eliminamos la tabla de devoluciones
DROP TABLE IF EXISTS devoluciones;

-- Ahora creamos la tabla de préstamos con todos los campos necesarios
CREATE TABLE prestamos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lector_id INT NOT NULL,
    libro_id INT NOT NULL,
    bibliotecario_id INT NOT NULL,
    fecha_prestamo TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_devolucion_esperada TIMESTAMP NOT NULL,
    fecha_devolucion_real TIMESTAMP NULL,
    estado ENUM('prestado', 'devuelto', 'atrasado') NOT NULL DEFAULT 'prestado',
    estado_libro ENUM('bueno', 'deteriorado', 'perdido') NULL,
    observaciones TEXT,
    monto_multa DECIMAL(10,2) DEFAULT 0.00,
    multa_pagada BOOLEAN DEFAULT FALSE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (lector_id) REFERENCES lectores(id) ON DELETE RESTRICT,
    FOREIGN KEY (libro_id) REFERENCES libros(id) ON DELETE RESTRICT,
    FOREIGN KEY (bibliotecario_id) REFERENCES bibliotecarios(id) ON DELETE RESTRICT
);

-- Eliminamos el trigger que ya no es necesario
DROP TRIGGER IF EXISTS after_devolucion_insert;

-- Trigger para actualizar el estado del préstamo a 'atrasado' cuando se pasa la fecha de devolución
DELIMITER //
CREATE TRIGGER check_prestamo_atrasado
BEFORE INSERT ON prestamos
FOR EACH ROW
BEGIN
    IF NEW.fecha_devolucion_esperada < CURRENT_TIMESTAMP THEN
        SET NEW.estado = 'atrasado';
    END IF;
END//
DELIMITER ;

-- Evento para verificar préstamos atrasados diariamente
DELIMITER //
CREATE EVENT check_prestamos_atrasados
ON SCHEDULE EVERY 1 DAY
DO
BEGIN
    UPDATE prestamos 
    SET estado = 'atrasado'
    WHERE estado = 'prestado' 
    AND fecha_devolucion_esperada < CURRENT_TIMESTAMP;
END//
DELIMITER ;

-- Insertar autores de ejemplo
INSERT INTO autores (nombre_completo, nacionalidad, fecha_nacimiento, fecha_fallecimiento, biografia, estado) VALUES
('Gabriel García Márquez', 'Colombiano', '1927-03-06', '2014-04-17', 'Premio Nobel de Literatura 1982. Autor de Cien años de soledad.', true),
('Mario Vargas Llosa', 'Peruano', '1936-03-28', NULL, 'Premio Nobel de Literatura 2010. Autor de La ciudad y los perros.', true),
('Isabel Allende', 'Chilena', '1942-08-02', NULL, 'Autora de La casa de los espíritus y Eva Luna.', true),
('Jorge Luis Borges', 'Argentino', '1899-08-24', '1986-06-14', 'Autor de Ficciones y El Aleph.', true),
('Pablo Neruda', 'Chileno', '1904-07-12', '1973-09-23', 'Premio Nobel de Literatura 1971. Poeta y diplomático.', true),
('Julio Cortázar', 'Argentino', '1914-08-26', '1984-02-12', 'Autor de Rayuela y Bestiario.', true),
('Carlos Fuentes', 'Mexicano', '1928-11-11', '2012-05-15', 'Autor de La región más transparente.', true),
('Octavio Paz', 'Mexicano', '1914-03-31', '1998-04-19', 'Premio Nobel de Literatura 1990.', true),
('Miguel de Cervantes', 'Español', '1547-09-29', '1616-04-22', 'Autor de Don Quijote de la Mancha.', true),
('Federico García Lorca', 'Español', '1898-06-05', '1936-08-19', 'Poeta y dramaturgo español.', true),
('Juan Rulfo', 'Mexicano', '1917-05-16', '1986-01-07', 'Autor de Pedro Páramo.', true),
('José Saramago', 'Portugués', '1922-11-16', '2010-06-18', 'Premio Nobel de Literatura 1998.', true),
('Elena Poniatowska', 'Mexicana', '1932-05-19', NULL, 'Periodista y escritora mexicana.', true),
('Roberto Bolaño', 'Chileno', '1953-04-28', '2003-07-15', 'Autor de Los detectives salvajes.', true),
('Clarice Lispector', 'Brasileña', '1920-12-10', '1977-12-09', 'Autora de La hora de la estrella.', true);

-- Insertar categorías de ejemplo
INSERT INTO categorias (nombre, codigo, descripcion, categoria_padre_id, estado) VALUES
('Novela Contemporánea', 'CAT-001', 'Novelas de la literatura contemporánea', 2, true),
('Poesía Latinoamericana', 'CAT-002', 'Poesía de autores latinoamericanos', 3, true),
('Realismo Mágico', 'CAT-003', 'Obras del género realismo mágico', 2, true),
('Novela Histórica', 'CAT-004', 'Novelas basadas en hechos históricos', 2, true),
('Cuento Latinoamericano', 'CAT-005', 'Cuentos de autores latinoamericanos', 1, true),
('Ensayo Literario', 'CAT-006', 'Ensayos sobre literatura', 5, true),
('Teatro Contemporáneo', 'CAT-007', 'Obras de teatro modernas', 4, true),
('Biografía Literaria', 'CAT-008', 'Biografías de escritores', 13, true),
('Crítica Literaria', 'CAT-009', 'Análisis y crítica de obras literarias', 5, true),
('Novela Policial', 'CAT-010', 'Novelas del género policial', 2, true),
('Poesía Española', 'CAT-011', 'Poesía de autores españoles', 3, true),
('Teatro Clásico', 'CAT-012', 'Obras de teatro clásicas', 4, true),
('Novela de Ciencia Ficción', 'CAT-013', 'Novelas de ciencia ficción', 6, true),
('Cuento Fantástico', 'CAT-014', 'Cuentos del género fantástico', 1, true),
('Ensayo Filosófico', 'CAT-015', 'Ensayos sobre filosofía', 5, true);

-- Insertar editoriales de ejemplo
INSERT INTO editoriales (nombre, codigo, pais, anio_fundacion, sitio_web, email_contacto, descripcion, estado) VALUES
('Alfaguara', 'ALF-001', 'España', 1964, 'www.alfaguara.com', 'contacto@alfaguara.com', 'Editorial de literatura en español', true),
('Planeta', 'PLA-001', 'España', 1949, 'www.planetadelibros.com', 'contacto@planeta.es', 'Una de las editoriales más grandes de habla hispana', true),
('Anagrama', 'ANA-001', 'España', 1969, 'www.anagrama-ed.es', 'info@anagrama-ed.es', 'Editorial especializada en literatura contemporánea', true),
('Tusquets', 'TUS-001', 'España', 1969, 'www.tusquetseditores.com', 'info@tusquetseditores.com', 'Editorial de literatura y ensayo', true),
('Seix Barral', 'SEI-001', 'España', 1911, 'www.seix-barral.es', 'info@seix-barral.es', 'Editorial histórica española', true),
('Siruela', 'SIR-001', 'España', 1982, 'www.siruela.com', 'info@siruela.com', 'Editorial especializada en literatura fantástica', true),
('Acantilado', 'ACA-001', 'España', 1999, 'www.acantilado.es', 'info@acantilado.es', 'Editorial de literatura y ensayo', true),
('Lumen', 'LUM-001', 'España', 1960, 'www.lumen.es', 'info@lumen.es', 'Editorial de literatura y poesía', true),
('Debolsillo', 'DEB-001', 'España', 2001, 'www.debolsillo.com', 'info@debolsillo.com', 'Editorial de bolsillo', true),
('Austral', 'AUS-001', 'España', 1937, 'www.editorialaustral.com', 'info@editorialaustral.com', 'Editorial clásica española', true),
('Cátedra', 'CAT-001', 'España', 1973, 'www.catedra.com', 'info@catedra.com', 'Editorial especializada en ediciones críticas', true),
('Alianza', 'ALI-001', 'España', 1966, 'www.alianzaeditorial.es', 'info@alianzaeditorial.es', 'Editorial generalista', true),
('Gredos', 'GRE-001', 'España', 1944, 'www.editorialgredos.com', 'info@editorialgredos.com', 'Editorial especializada en clásicos', true),
('Espasa', 'ESP-001', 'España', 1860, 'www.espasa.es', 'info@espasa.es', 'Editorial histórica española', true),
('Destino', 'DES-001', 'España', 1942, 'www.edestino.es', 'info@edestino.es', 'Editorial de literatura contemporánea', true);

-- Insertar libros de ejemplo
INSERT INTO libros (titulo, isbn, autor_id, categoria_id, editorial_id, anio_publicacion, idioma_id, numero_paginas, stock, portada, ubicacion, sinopsis, estado) VALUES
('Cien años de soledad', '9788497592208', 1, 3, 1, 1967, 1, 471, 5, 'cien-anos-soledad.jpg', 'A1-B2', 'Crónica de la familia Buendía a lo largo de siete generaciones.', true),
('La casa de los espíritus', '9788497592215', 3, 3, 2, 1982, 1, 499, 3, 'casa-espiritus.jpg', 'A1-B3', 'Historia de la familia Trueba a lo largo de cuatro generaciones.', true),
('Rayuela', '9788497592222', 6, 1, 3, 1963, 1, 635, 4, 'rayuela.jpg', 'A2-B1', 'Novela experimental que puede leerse en múltiples órdenes.', true),
('Pedro Páramo', '9788497592239', 11, 3, 4, 1955, 1, 124, 6, 'pedro-paramo.jpg', 'A2-B2', 'Historia de un hombre que busca a su padre en un pueblo fantasma.', true),
('Los detectives salvajes', '9788497592246', 14, 1, 5, 1998, 1, 609, 2, 'detectives-salvajes.jpg', 'A2-B3', 'Historia de dos poetas vanguardistas en la Ciudad de México.', true),
('Ficciones', '9788497592253', 4, 5, 6, 1944, 1, 223, 4, 'ficciones.jpg', 'A3-B1', 'Colección de cuentos que exploran temas filosóficos.', true),
('La región más transparente', '9788497592260', 7, 1, 7, 1958, 1, 601, 3, 'region-transparente.jpg', 'A3-B2', 'Retrato de la Ciudad de México en los años 50.', true),
('El Aleph', '9788497592277', 4, 5, 8, 1949, 1, 207, 5, 'aleph.jpg', 'A3-B3', 'Colección de cuentos que exploran el infinito.', true),
('Don Quijote de la Mancha', '9788497592284', 9, 4, 9, 1605, 1, 863, 2, 'quijote.jpg', 'A4-B1', 'Historia del ingenioso hidalgo Don Quijote.', true),
('Poeta en Nueva York', '9788497592291', 10, 2, 10, 1940, 1, 176, 4, 'poeta-ny.jpg', 'A4-B2', 'Colección de poemas escritos durante su estancia en Nueva York.', true),
('Ensayo sobre la ceguera', '9788497592307', 12, 1, 11, 1995, 1, 310, 3, 'ceguera.jpg', 'A4-B3', 'Novela sobre una epidemia de ceguera blanca.', true),
('La hora de la estrella', '9788497592314', 15, 1, 12, 1977, 1, 88, 5, 'hora-estrella.jpg', 'A5-B1', 'Historia de Macabéa, una joven del noreste de Brasil.', true),
('Los miserables', '9788497592321', 13, 4, 13, 1862, 1, 1462, 2, 'miserables.jpg', 'A5-B2', 'Historia de Jean Valjean y su redención.', true),
('El amor en los tiempos del cólera', '9788497592338', 1, 1, 14, 1985, 1, 368, 4, 'amor-colera.jpg', 'A5-B3', 'Historia de amor entre Florentino Ariza y Fermina Daza.', true),
('La ciudad y los perros', '9788497592345', 2, 1, 15, 1963, 1, 408, 3, 'ciudad-perros.jpg', 'A6-B1', 'Historia de los cadetes del Colegio Militar Leoncio Prado.', true);

-- Insertar lectores de ejemplo
INSERT INTO lectores (nombre, apellidos, tipo_documento, numero_documento, email, password, telefono, direccion, fecha_nacimiento, estado) VALUES
('María', 'González Pérez', 'CC', '1234567890', 'maria@email.com', 'lector123', '3001234567', 'Calle 123 #45-67', '1990-05-15', true),
('Juan', 'Rodríguez López', 'CC', '2345678901', 'juan@email.com', 'lector123', '3002345678', 'Carrera 78 #90-12', '1985-08-20', true),
('Ana', 'Martínez Silva', 'CC', '3456789012', 'ana@email.com', 'lector123', '3003456789', 'Avenida 5 #23-45', '1995-03-10', true),
('Carlos', 'Sánchez Díaz', 'CC', '4567890123', 'carlos@email.com', 'lector123', '3004567890', 'Calle 90 #12-34', '1988-11-25', true),
('Laura', 'Torres Vega', 'CC', '5678901234', 'laura@email.com', 'lector123', '3005678901', 'Carrera 45 #67-89', '1992-07-30', true),
('Pedro', 'Ramírez Gómez', 'CC', '6789012345', 'pedro@email.com', 'lector123', '3006789012', 'Avenida 7 #89-01', '1987-04-05', true),
('Sofía', 'Hernández Ruiz', 'CC', '7890123456', 'sofia@email.com', 'lector123', '3007890123', 'Calle 34 #56-78', '1993-09-15', true),
('Diego', 'López Mendoza', 'CC', '8901234567', 'diego@email.com', 'lector123', '3008901234', 'Carrera 12 #34-56', '1991-12-20', true),
('Isabella', 'Gómez Torres', 'CC', '9012345678', 'isabella@email.com', 'lector123', '3009012345', 'Avenida 3 #45-67', '1994-06-25', true),
('Andrés', 'Díaz Sánchez', 'CC', '0123456789', 'andres@email.com', 'lector123', '3000123456', 'Calle 67 #89-01', '1989-02-10', true),
('Valentina', 'Ruiz Hernández', 'CC', '1122334455', 'valentina@email.com', 'lector123', '3001122334', 'Carrera 89 #01-23', '1996-08-15', true),
('Santiago', 'Mendoza López', 'CC', '2233445566', 'santiago@email.com', 'lector123', '3002233445', 'Avenida 9 #12-34', '1990-10-30', true),
('Camila', 'Torres Gómez', 'CC', '3344556677', 'camila@email.com', 'lector123', '3003344556', 'Calle 45 #67-89', '1993-01-05', true),
('Daniel', 'Sánchez Díaz', 'CC', '4455667788', 'daniel@email.com', 'lector123', '3004455667', 'Carrera 23 #45-67', '1988-07-20', true),
('Mariana', 'Hernández Ruiz', 'CC', '5566778899', 'mariana@email.com', 'lector123', '3005566778', 'Avenida 1 #23-45', '1995-04-15', true);

-- Insertar bibliotecarios de ejemplo
INSERT INTO bibliotecarios (nombre, apellidos, tipo_documento, numero_documento, email, password, telefono, direccion, fecha_nacimiento, turno, fecha_contratacion, estado) VALUES
('Roberto', 'García Martínez', 'CC', '9988776655', 'roberto@biblioteca.com', 'biblio123', '3009988776', 'Calle 1 #2-3', '1980-05-20', 'mañana', '2020-01-15', true),
('Carmen', 'López Rodríguez', 'CC', '8877665544', 'carmen@biblioteca.com', 'biblio123', '3008877665', 'Carrera 4 #5-6', '1982-08-15', 'tarde', '2020-02-01', true),
('Fernando', 'Martínez Sánchez', 'CC', '7766554433', 'fernando@biblioteca.com', 'biblio123', '3007766554', 'Avenida 7 #8-9', '1985-03-10', 'noche', '2020-03-15', true),
('Patricia', 'Sánchez Torres', 'CC', '6655443322', 'patricia@biblioteca.com', 'biblio123', '3006655443', 'Calle 10 #11-12', '1983-11-25', 'mañana', '2020-04-01', true),
('Ricardo', 'Torres Gómez', 'CC', '5544332211', 'ricardo@biblioteca.com', 'biblio123', '3005544332', 'Carrera 13 #14-15', '1981-07-30', 'tarde', '2020-05-15', true),
('Lucía', 'Gómez Hernández', 'CC', '4433221100', 'lucia@biblioteca.com', 'biblio123', '3004433221', 'Avenida 16 #17-18', '1984-04-05', 'noche', '2020-06-01', true),
('Alberto', 'Hernández Ruiz', 'CC', '3322110099', 'alberto@biblioteca.com', 'biblio123', '3003322110', 'Calle 19 #20-21', '1986-09-15', 'mañana', '2020-07-15', true),
('Elena', 'Ruiz Díaz', 'CC', '2211009988', 'elena@biblioteca.com', 'biblio123', '3002211009', 'Carrera 22 #23-24', '1982-12-20', 'tarde', '2020-08-01', true),
('Miguel', 'Díaz López', 'CC', '1100998877', 'miguel@biblioteca.com', 'biblio123', '3001100998', 'Avenida 25 #26-27', '1983-06-25', 'noche', '2020-09-15', true),
('Isabel', 'López Martínez', 'CC', '0099887766', 'isabel@biblioteca.com', 'biblio123', '3000099887', 'Calle 28 #29-30', '1985-02-10', 'mañana', '2020-10-01', true),
('Javier', 'Martínez Torres', 'CC', '1199887766', 'javier@biblioteca.com', 'biblio123', '3001199887', 'Carrera 31 #32-33', '1981-08-15', 'tarde', '2020-11-15', true),
('Natalia', 'Torres Sánchez', 'CC', '2299887766', 'natalia@biblioteca.com', 'biblio123', '3002299887', 'Avenida 34 #35-36', '1984-10-30', 'noche', '2020-12-01', true),
('Oscar', 'Sánchez Gómez', 'CC', '3399887766', 'oscar@biblioteca.com', 'biblio123', '3003399887', 'Calle 37 #38-39', '1982-01-05', 'mañana', '2021-01-15', true),
('Diana', 'Gómez Ruiz', 'CC', '4499887766', 'diana@biblioteca.com', 'biblio123', '3004499887', 'Carrera 40 #41-42', '1983-07-20', 'tarde', '2021-02-01', true),
('Pablo', 'Ruiz Hernández', 'CC', '5599887766', 'pablo@biblioteca.com', 'biblio123', '3005599887', 'Avenida 43 #44-45', '1985-04-15', 'noche', '2021-03-15', true);

-- Insertar préstamos de ejemplo
INSERT INTO prestamos (lector_id, libro_id, bibliotecario_id, fecha_prestamo, fecha_devolucion_esperada, estado, observaciones) VALUES
(1, 1, 1, '2024-01-01 10:00:00', '2024-01-15 10:00:00', 'devuelto', 'Prestamo normal'),
(2, 2, 2, '2024-01-02 11:00:00', '2024-01-16 11:00:00', 'prestado', 'Prestamo normal'),
(3, 3, 3, '2024-01-03 12:00:00', '2024-01-17 12:00:00', 'atrasado', 'Prestamo normal'),
(4, 4, 4, '2024-01-04 13:00:00', '2024-01-18 13:00:00', 'prestado', 'Prestamo normal'),
(5, 5, 5, '2024-01-05 14:00:00', '2024-01-19 14:00:00', 'devuelto', 'Prestamo normal'),
(6, 6, 6, '2024-01-06 15:00:00', '2024-01-20 15:00:00', 'prestado', 'Prestamo normal'),
(7, 7, 7, '2024-01-07 16:00:00', '2024-01-21 16:00:00', 'atrasado', 'Prestamo normal'),
(8, 8, 8, '2024-01-08 17:00:00', '2024-01-22 17:00:00', 'prestado', 'Prestamo normal'),
(9, 9, 9, '2024-01-09 18:00:00', '2024-01-23 18:00:00', 'devuelto', 'Prestamo normal'),
(10, 10, 10, '2024-01-10 19:00:00', '2024-01-24 19:00:00', 'prestado', 'Prestamo normal'),
(11, 11, 11, '2024-01-11 20:00:00', '2024-01-25 20:00:00', 'atrasado', 'Prestamo normal'),
(12, 12, 12, '2024-01-12 21:00:00', '2024-01-26 21:00:00', 'prestado', 'Prestamo normal'),
(13, 13, 13, '2024-01-13 22:00:00', '2024-01-27 22:00:00', 'devuelto', 'Prestamo normal'),
(14, 14, 14, '2024-01-14 23:00:00', '2024-01-28 23:00:00', 'prestado', 'Prestamo normal'),
(15, 15, 15, '2024-01-15 00:00:00', '2024-01-29 00:00:00', 'atrasado', 'Prestamo normal');