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

-- Insertar un administrador de ejemplo
INSERT INTO administradores (
    nombre, 
    apellidos, 
    tipo_documento, 
    numero_documento, 
    email, 
    password, 
    telefono, 
    direccion, 
    fecha_nacimiento
) VALUES (
    'Carlos',
    'Rodríguez Gómez',
    'CC',
    '1234567890',
    'admin@biblioteca.com',
    'admin123',  -- En producción usar hash
    '3001234567',
    'Calle Principal #123, Ciudad',
    '1990-05-15'
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

-- Insertar un bibliotecario de ejemplo
INSERT INTO bibliotecarios (
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
) VALUES (
    'Ana',
    'Martínez López',
    'CC',
    '9876543210',
    'bibliotecario@biblioteca.com',
    'biblio123',  -- En producción usar hash
    '3109876543',
    'Avenida Central #456, Ciudad',
    '1995-08-20',
    'mañana',
    '2023-01-15'
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

-- Insertar un lector de ejemplo
INSERT INTO lectores (
    nombre, 
    apellidos, 
    tipo_documento, 
    numero_documento, 
    email, 
    password, 
    telefono, 
    direccion, 
    fecha_nacimiento
) VALUES (
    'Laura',
    'Sánchez Pérez',
    'CC',
    '5432167890',
    'lector@email.com',
    'lector123',  -- En producción usar hash
    '3201234567',
    'Carrera 78 #90-12, Ciudad',
    '1998-03-25'
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

-- Insertar un autor de ejemplo
INSERT INTO autores (
    nombre_completo,
    nacionalidad,
    fecha_nacimiento,
    fecha_fallecimiento,
    biografia,
    estado
) VALUES (
    'Gabriel García Márquez',
    'Colombiano',
    '1927-03-06',
    '2014-04-17',
    'Gabriel García Márquez fue un escritor y periodista colombiano. Reconocido principalmente por sus novelas y cuentos, fue popularmente conocido como Gabo, y familiarmente y por sus amigos como Gabito. En 1982 recibió el Premio Nobel de Literatura.',
    true
);

-- Insertar un autor vivo de ejemplo
INSERT INTO autores (
    nombre_completo,
    nacionalidad,
    fecha_nacimiento,
    biografia,
    estado
) VALUES (
    'Isabel Allende',
    'Chilena',
    '1942-08-02',
    'Isabel Allende es una escritora chilena, miembro de la Academia Estadounidense de las Artes y las Letras desde 2004. Se ha convertido en una de las escritoras más leídas del mundo, con sus obras traducidas a más de 42 idiomas y 74 millones de ejemplares vendidos.',
    true
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

-- Insertar categorías de ejemplo
INSERT INTO categorias (nombre, codigo, descripcion, categoria_padre_id, estado) VALUES
('Literatura Latinoamericana', 'LIT-001', 'Libros de literatura latinoamericana', 1, true),
('Ciencia Ficción Espacial', 'CF-001', 'Libros de ciencia ficción espacial', 6, true),
('Historia Medieval', 'HIS-001', 'Libros de historia medieval', 12, true),
('Novela Histórica Medieval', 'NH-001', 'Novelas ambientadas en la época medieval', 12, true),
('Biografías de Científicos', 'BIO-001', 'Biografías de científicos famosos', 13, true);

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

-- Insertar editoriales de ejemplo
INSERT INTO editoriales (nombre, codigo, pais, anio_fundacion, sitio_web, email_contacto, descripcion, estado) VALUES
('Editorial Planeta', 'PLA-001', 'España', 1949, 'www.planetadelibros.com', 'contacto@planeta.es', 'Una de las editoriales más grandes de habla hispana', true),
('Penguin Random House', 'PRH-001', 'Estados Unidos', 1925, 'www.penguinrandomhouse.com', 'info@penguinrandomhouse.com', 'Editorial líder mundial en publicaciones', true),
('Anagrama', 'ANA-001', 'España', 1969, 'www.anagrama-ed.es', 'info@anagrama-ed.es', 'Editorial especializada en literatura contemporánea', true),
('Alfaguara', 'ALF-001', 'España', 1964, 'www.alfaguara.com', 'contacto@alfaguara.com', 'Editorial de literatura en español', true),
('Salamandra', 'SAL-001', 'España', 1989, 'www.salamandra.info', 'info@salamandra.com', 'Editorial especializada en literatura juvenil y fantasía', true);

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