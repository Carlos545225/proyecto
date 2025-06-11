-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost:3306
-- Tiempo de generación: 11-06-2025 a las 20:41:37
-- Versión del servidor: 8.0.30
-- Versión de PHP: 8.1.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `medisoft`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cita`
--

CREATE TABLE `cita` (
  `id` int NOT NULL,
  `paciente_id` int NOT NULL,
  `medico_id` int NOT NULL,
  `fecha` datetime NOT NULL,
  `hora` time NOT NULL,
  `duracion` int NOT NULL,
  `tipo_cita` varchar(20) NOT NULL,
  `motivo` varchar(100) NOT NULL,
  `estado` varchar(20) NOT NULL,
  `observaciones` varchar(200) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `cita`
--

INSERT INTO `cita` (`id`, `paciente_id`, `medico_id`, `fecha`, `hora`, `duracion`, `tipo_cita`, `motivo`, `estado`, `observaciones`) VALUES
(15, 2, 2, '2025-06-11 00:00:00', '14:41:00', 45, 'primera', 'Consulta Medica', 'programada', 'Posible caso de viruela');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ciudad`
--

CREATE TABLE `ciudad` (
  `id` int NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `departamento_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `ciudad`
--

INSERT INTO `ciudad` (`id`, `nombre`, `departamento_id`) VALUES
(1, 'Leticia', 1),
(2, 'Puerto Nariño', 1),
(3, 'Medellín', 2),
(4, 'Bello', 2),
(5, 'Itagüí', 2),
(6, 'Envigado', 2),
(7, 'Apartadó', 2),
(8, 'Turbo', 2),
(9, 'Rionegro', 2),
(10, 'Arauca', 3),
(11, 'Arauquita', 3),
(12, 'Saravena', 3),
(13, 'Barranquilla', 4),
(14, 'Soledad', 4),
(15, 'Malambo', 4),
(16, 'Sabanalarga', 4),
(17, 'Cartagena', 5),
(18, 'Magangué', 5),
(19, 'Turbaco', 5),
(20, 'El Carmen de Bolívar', 5),
(21, 'Tunja', 6),
(22, 'Duitama', 6),
(23, 'Sogamoso', 6),
(24, 'Chiquinquirá', 6),
(25, 'Manizales', 7),
(26, 'Villamaría', 7),
(27, 'Chinchiná', 7),
(28, 'Florencia', 8),
(29, 'Morelia', 8),
(30, 'Yopal', 9),
(31, 'Aguazul', 9),
(32, 'Popayán', 10),
(33, 'Santander de Quilichao', 10),
(34, 'Valledupar', 11),
(35, 'Aguachica', 11),
(36, 'Quibdó', 12),
(37, 'Istmina', 12),
(38, 'Montería', 13),
(39, 'Lorica', 13),
(40, 'Bogotá', 14),
(41, 'Soacha', 14),
(42, 'Zipaquirá', 14),
(43, 'Facatativá', 14),
(44, 'Chía', 14),
(45, 'Girardot', 14),
(46, 'Fusagasugá', 14),
(47, 'Inírida', 15),
(48, 'San José del Guaviare', 16),
(49, 'Neiva', 17),
(50, 'Pitalito', 17),
(51, 'Riohacha', 18),
(52, 'Maicao', 18),
(53, 'Santa Marta', 19),
(54, 'Ciénaga', 19),
(55, 'Villavicencio', 20),
(56, 'Acacías', 20),
(57, 'Pasto', 21),
(58, 'Tumaco', 21),
(59, 'Cúcuta', 22),
(60, 'Ocaña', 22),
(61, 'Mocoa', 23),
(62, 'Armenia', 24),
(63, 'Calarcá', 24),
(64, 'Pereira', 25),
(65, 'Dosquebradas', 25),
(66, 'San Andrés', 26),
(67, 'Providencia', 26),
(68, 'Bucaramanga', 27),
(69, 'Floridablanca', 27),
(70, 'Girón', 27),
(71, 'Piedecuesta', 27),
(72, 'Sincelejo', 28),
(73, 'Corozal', 28),
(74, 'Ibagué', 29),
(75, 'Espinal', 29),
(76, 'Cali', 30),
(77, 'Palmira', 30),
(78, 'Buenaventura', 30),
(79, 'Tuluá', 30),
(80, 'Buga', 30),
(81, 'Cartago', 30),
(82, 'Mitú', 31),
(83, 'Puerto Carreño', 32);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `configuracion`
--

CREATE TABLE `configuracion` (
  `id` int NOT NULL,
  `usuario_id` int NOT NULL,
  `nombre_empresa` varchar(100) NOT NULL,
  `nit_empresa` varchar(20) NOT NULL,
  `registro_sanitario` varchar(50) NOT NULL,
  `slogan` varchar(200) DEFAULT NULL,
  `logo` varchar(255) DEFAULT NULL,
  `favicon` varchar(255) DEFAULT NULL,
  `fecha_actualizacion` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `configuracion`
--

INSERT INTO `configuracion` (`id`, `usuario_id`, `nombre_empresa`, `nit_empresa`, `registro_sanitario`, `slogan`, `logo`, `favicon`, `fecha_actualizacion`) VALUES
(1, 3, 'SaludTotal eps', '1666277373', 'RS-32423423', 'Buenos servicios para nuestros pacientes', 'uploads/logo_20250610_233946_logo-removebg-preview.png', 'uploads/favicon_20250610_233930_favicon-removebg-preview.ico', '2025-06-10 23:39:47');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `departamento`
--

CREATE TABLE `departamento` (
  `id` int NOT NULL,
  `nombre` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `departamento`
--

INSERT INTO `departamento` (`id`, `nombre`) VALUES
(1, 'Amazonas'),
(2, 'Antioquia'),
(3, 'Arauca'),
(4, 'Atlántico'),
(5, 'Bolívar'),
(6, 'Boyacá'),
(7, 'Caldas'),
(8, 'Caquetá'),
(9, 'Casanare'),
(10, 'Cauca'),
(11, 'Cesar'),
(12, 'Chocó'),
(13, 'Córdoba'),
(14, 'Cundinamarca'),
(15, 'Guainía'),
(16, 'Guaviare'),
(17, 'Huila'),
(18, 'La Guajira'),
(19, 'Magdalena'),
(20, 'Meta'),
(21, 'Nariño'),
(22, 'Norte de Santander'),
(23, 'Putumayo'),
(24, 'Quindío'),
(25, 'Risaralda'),
(26, 'San Andrés y Providencia'),
(27, 'Santander'),
(28, 'Sucre'),
(29, 'Tolima'),
(30, 'Valle del Cauca'),
(31, 'Vaupés'),
(32, 'Vichada');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `factura`
--

CREATE TABLE `factura` (
  `id` int NOT NULL,
  `id_cita` int NOT NULL,
  `servicio` varchar(100) NOT NULL,
  `valor` float NOT NULL,
  `estado` varchar(20) NOT NULL,
  `fecha_emision` datetime NOT NULL,
  `fecha_vencimiento` date NOT NULL,
  `metodo_pago` varchar(20) NOT NULL,
  `tipo_factura` varchar(20) NOT NULL,
  `observaciones` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `historia_clinica`
--

CREATE TABLE `historia_clinica` (
  `id` int NOT NULL,
  `id_cita` int NOT NULL,
  `fecha` datetime NOT NULL,
  `motivo_consulta` varchar(200) NOT NULL,
  `antesedentes` varchar(200) DEFAULT NULL,
  `diagnostico` varchar(200) DEFAULT NULL,
  `tratamiento` varchar(200) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `medico`
--

CREATE TABLE `medico` (
  `id` int NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `apellido` varchar(50) NOT NULL,
  `tipo_documento` varchar(20) NOT NULL,
  `numero_documento` varchar(20) NOT NULL,
  `fecha_nacimiento` date NOT NULL,
  `genero` varchar(10) NOT NULL,
  `telefono` varchar(15) NOT NULL,
  `correo` varchar(100) NOT NULL,
  `direccion` varchar(100) NOT NULL,
  `departamento_id` int NOT NULL,
  `ciudad_id` int NOT NULL,
  `universidad_id` int NOT NULL,
  `anios_experiencia` int NOT NULL,
  `especialidad` varchar(50) NOT NULL,
  `numero_registro` varchar(20) NOT NULL,
  `estado` varchar(20) DEFAULT NULL,
  `fecha_registro` datetime DEFAULT NULL,
  `ultima_actualizacion` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `medico`
--

INSERT INTO `medico` (`id`, `nombre`, `apellido`, `tipo_documento`, `numero_documento`, `fecha_nacimiento`, `genero`, `telefono`, `correo`, `direccion`, `departamento_id`, `ciudad_id`, `universidad_id`, `anios_experiencia`, `especialidad`, `numero_registro`, `estado`, `fecha_registro`, `ultima_actualizacion`) VALUES
(2, 'Andrea', 'Martínez', 'CC', '2002002001', '1980-05-12', 'M', '3124567890', 'andrea1@example.com', 'Calle 23 #45-67', 1, 1, 1, 10, '890283', 'MED001', 'Activo', '2025-06-11 14:30:19', '2025-06-11 19:30:50'),
(3, 'Julián', 'Herrera', 'CC', '2002002002', '1975-09-01', 'M', '3134567890', 'julian2@example.com', 'Cra 40 #30-25', 2, 2, 2, 15, '890201', 'MED002', 'Activo', '2025-06-11 14:30:19', '2025-06-11 19:31:06'),
(4, 'Sofía', 'Mejía', 'CC', '2002002003', '1988-11-23', 'M', '3144567890', 'sofia3@example.com', 'Av 33 #12-45', 3, 3, 3, 8, '890214', 'MED003', 'Activo', '2025-06-11 14:30:19', '2025-06-11 19:31:16'),
(5, 'Diego', 'Suárez', 'CC', '2002002004', '1979-07-17', 'M', '3154567890', 'diego4@example.com', 'Calle 11 #22-33', 1, 2, 1, 12, '890201', 'MED004', 'Activo', '2025-06-11 14:30:19', '2025-06-11 19:31:30'),
(6, 'Valentina', 'Rojas', 'TI', '2002002005', '1985-02-10', 'M', '3164567890', 'valentina5@example.com', 'Cra 55 #66-77', 2, 1, 2, 9, '890201', 'MED005', 'Activo', '2025-06-11 14:30:19', '2025-06-11 19:32:32'),
(7, 'Carlos', 'Gómez', 'CC', '2002002006', '1972-12-05', 'M', '3174567890', 'carlos6@example.com', 'Av 44 #55-66', 3, 2, 3, 20, '890213', 'MED006', 'Activo', '2025-06-11 14:30:19', '2025-06-11 19:32:42'),
(8, 'Ana', 'Torres', 'CC', '2002002007', '1990-08-12', 'M', '3184567890', 'ana7@example.com', 'Calle 77 #88-99', 1, 3, 1, 6, '890214', 'MED007', 'Activo', '2025-06-11 14:30:19', '2025-06-11 19:32:54'),
(9, 'Ricardo', 'García', 'TI', '2002002008', '1982-03-19', 'M', '3194567890', 'ricardo8@example.com', 'Cra 22 #33-44', 2, 3, 2, 14, '890217', 'MED008', 'Activo', '2025-06-11 14:30:19', '2025-06-11 19:33:09'),
(10, 'Laura', 'Ramírez', 'CC', '2002002009', '1987-11-29', 'M', '3104567890', 'laura9@example.com', 'Av 90 #12-13', 3, 1, 3, 11, '890266', 'MED009', 'Activo', '2025-06-11 14:30:19', '2025-06-11 19:33:22'),
(11, 'Miguel', 'Díaz', 'CC', '2002002010', '1978-06-04', 'M', '3114567890', 'miguel10@example.com', 'Calle 99 #44-55', 1, 2, 1, 16, '890233', 'MED010', 'Activo', '2025-06-11 14:30:19', '2025-06-11 19:33:35'),
(12, 'Isabella', 'Castillo', 'TI', '2002002011', '1984-01-23', 'M', '3124567891', 'isabella11@example.com', 'Cra 13 #14-15', 2, 2, 2, 7, '890214', 'MED011', 'Activo', '2025-06-11 14:30:19', '2025-06-11 19:35:11'),
(13, 'Andrés', 'Pineda', 'CC', '2002002012', '1991-10-05', 'M', '3134567891', 'andres12@example.com', 'Av 66 #77-88', 3, 3, 3, 5, '890231', 'MED012', 'Activo', '2025-06-11 14:30:19', '2025-06-11 19:35:25'),
(14, 'Natalia', 'Salazar', 'CC', '2002002013', '1976-04-16', 'M', '3144567891', 'natalia13@example.com', 'Calle 211 #09-10', 1, 3, 1, 18, '890201', 'MED013', 'Activo', '2025-06-11 14:30:19', '2025-06-11 19:35:42'),
(15, 'Diego', 'Rojas', 'TI', '2002002014', '1989-09-09', 'M', '3154567891', 'diego14@example.com', 'Cra 101 #12-13', 2, 1, 2, 10, '890205', 'MED014', 'Activo', '2025-06-11 14:30:19', '2025-06-11 19:36:20'),
(16, 'Carolina', 'Ortiz', 'CC', '2002002015', '1992-07-07', 'M', '3164567891', 'carolina15@example.com', 'Av 39 #23-34', 3, 2, 3, 6, '890201', 'MED015', 'Activo', '2025-06-11 14:30:19', '2025-06-11 19:37:35'),
(17, 'Javier', 'Vélez', 'CC', '2002002016', '1981-11-11', 'M', '3174567891', 'javier16@example.com', 'Calle 54 #65-76', 1, 1, 1, 13, '890201', 'MED016', 'Activo', '2025-06-11 14:30:19', '2025-06-11 19:37:45'),
(18, 'Paula', 'Campos', 'TI', '2002002017', '1986-03-03', 'M', '3184567891', 'paula17@example.com', 'Cra 88 #99-00', 2, 2, 2, 9, '890215', 'MED017', 'Activo', '2025-06-11 14:30:19', '2025-06-11 19:37:59'),
(19, 'Sebastián', 'Suárez', 'CC', '2002002018', '1979-08-08', 'M', '3194567891', 'sebastian18@example.com', 'Av 202 #01-02', 3, 3, 3, 17, '890215', 'MED018', 'Activo', '2025-06-11 14:30:19', '2025-06-11 19:38:12'),
(20, 'Camilo', 'Guzmán', 'CC', '2002002019', '1993-01-01', 'M', '3105567891', 'camilo19@example.com', 'Calle 321 #23-45', 1, 2, 1, 4, '890214', 'MED019', 'Activo', '2025-06-11 14:30:19', '2025-06-11 19:36:05'),
(21, 'Mariana', 'Restrepo', 'TI', '2002002020', '1988-05-05', 'M', '3115567891', 'mariana20@example.com', 'Cra 12 #01-02', 2, 3, 2, 12, '890201', 'MED020', 'Activo', '2025-06-11 14:30:19', '2025-06-11 19:35:52'),
(22, 'Fernando', 'Castro', 'CC', '2002002021', '1977-02-02', 'M', '3125567891', 'fernando21@example.com', 'Av 123 #45-67', 3, 1, 3, 19, '890201', 'MED021', 'Activo', '2025-06-11 14:30:19', '2025-06-11 19:33:47'),
(23, 'Paola', 'Ramírez', 'CC', '2002002022', '1994-12-12', 'M', '3135567891', 'paola22@example.com', 'Calle 76 #54-32', 1, 3, 1, 7, '890201', 'MED022', 'Activo', '2025-06-11 14:30:19', '2025-06-11 19:34:28'),
(24, 'Ricardo', 'Suárez', 'TI', '2002002023', '1983-06-18', 'M', '3145567891', 'ricardo23@example.com', 'Cra 88 #10-11', 2, 2, 2, 14, '890207', 'MED023', 'Activo', '2025-06-11 14:30:19', '2025-06-11 19:34:43'),
(25, 'Laura', 'Vargas', 'CC', '2002002024', '1989-09-29', 'M', '3155567891', 'laura24@example.com', 'Av 56 #78-90', 3, 3, 3, 8, '890201', 'MED024', 'Activo', '2025-06-11 14:30:19', '2025-06-11 19:34:12'),
(26, 'Pedro', 'Romero', 'CC', '2002002025', '1983-06-18', 'M', '3165567891', 'pedro25@example.com', 'Calle 88 #9-10', 2, 1, 2, 12, '890201', 'MED025', 'Activo', '2025-06-11 14:30:19', '2025-06-11 19:34:00');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `paciente`
--

CREATE TABLE `paciente` (
  `id` int NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `apellido` varchar(50) NOT NULL,
  `tipo_documento` varchar(20) NOT NULL,
  `numero_documento` varchar(20) NOT NULL,
  `fecha_nacimiento` date NOT NULL,
  `sexo` varchar(1) NOT NULL,
  `grupo_sanguineo` varchar(3) DEFAULT NULL,
  `tipo_regimen` varchar(20) DEFAULT NULL,
  `departamento_id` int NOT NULL,
  `ciudad_id` int NOT NULL,
  `telefono` varchar(15) NOT NULL,
  `correo` varchar(100) NOT NULL,
  `direccion` varchar(100) NOT NULL,
  `estado_civil` varchar(20) NOT NULL,
  `ocupacion` varchar(50) NOT NULL,
  `eps` varchar(50) NOT NULL,
  `contactos_emergencia` varchar(100) NOT NULL,
  `telefono_emergencia` varchar(15) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `paciente`
--

INSERT INTO `paciente` (`id`, `nombre`, `apellido`, `tipo_documento`, `numero_documento`, `fecha_nacimiento`, `sexo`, `grupo_sanguineo`, `tipo_regimen`, `departamento_id`, `ciudad_id`, `telefono`, `correo`, `direccion`, `estado_civil`, `ocupacion`, `eps`, `contactos_emergencia`, `telefono_emergencia`) VALUES
(2, 'Laura', 'González', 'CC', '1001001001', '1990-03-15', 'F', 'O+', 'Contributivo', 1, 1, '3101234567', 'laura1@example.com', 'Calle 10 #20-30', 'Soltera', 'Contadora', 'SURA', 'Mamá', '3110001111'),
(3, 'Carlos', 'Ramírez', 'CC', '1001001002', '1985-07-20', 'M', 'A+', 'Subsidiado', 2, 2, '3112233445', 'carlos2@example.com', 'Cra 45 #66-78', 'Casado', 'Ingeniero', 'Nueva EPS', 'Esposa', '3123456789'),
(4, 'María', 'López', 'TI', '1001001003', '2002-12-10', 'F', 'B-', 'Contributivo', 3, 3, '3009876543', 'maria3@example.com', 'Av 68 #14-56', 'Soltera', 'Estudiante', 'Sanitas', 'Hermano', '3139871234'),
(5, 'Juan', 'Pérez', 'CC', '1001001004', '1978-01-05', 'M', 'AB+', 'Subsidiado', 1, 2, '3123456780', 'juan4@example.com', 'Calle 123 #4-56', 'Casado', 'Doctor', 'Colsanitas', 'Esposa', '3145678901'),
(6, 'Ana', 'Martínez', 'CC', '1001001005', '1995-11-30', 'F', 'O-', 'Contributivo', 2, 1, '3134567890', 'ana5@example.com', 'Cra 12 #34-56', 'Soltera', 'Abogada', 'SURA', 'Amiga', '3156789012'),
(7, 'David', 'Rodríguez', 'TI', '1001001006', '1982-06-18', 'M', 'A-', 'Contributivo', 3, 2, '3145678901', 'david6@example.com', 'Av 5 #23-45', 'Divorciado', 'Arquitecto', 'Nueva EPS', 'Hijo', '3167890123'),
(8, 'Andrea', 'Hernández', 'CC', '1001001007', '1993-09-22', 'F', 'B+', 'Subsidiado', 1, 3, '3156789012', 'andrea7@example.com', 'Calle 57 #78-90', 'Casada', 'Ingeniera', 'Sanitas', 'Mamá', '3178901234'),
(9, 'José', 'Gómez', 'CC', '1001001008', '1970-04-11', 'M', 'AB-', 'Contributivo', 2, 3, '3167890123', 'jose8@example.com', 'Cra 34 #56-78', 'Viudo', 'Empresario', 'Colsanitas', 'Hermana', '3189012345'),
(10, 'Lucía', 'Díaz', 'TI', '1001001009', '2000-02-28', 'F', 'O+', 'Subsidiado', 3, 1, '3178901234', 'lucia9@example.com', 'Av 90 #12-34', 'Soltera', 'Estudiante', 'SURA', 'Papá', '3190123456'),
(11, 'Miguel', 'Torres', 'CC', '1001001010', '1987-08-16', 'M', 'A+', 'Contributivo', 1, 2, '3189012345', 'miguel10@example.com', 'Calle 22 #33-44', 'Casado', 'Profesor', 'Nueva EPS', 'Novia', '3101234567'),
(12, 'Sara', 'Vargas', 'CC', '1001001011', '1992-05-04', 'F', 'A-', 'Subsidiado', 2, 1, '3190123456', 'sara11@example.com', 'Cra 19 #11-22', 'Soltera', 'Psicóloga', 'Sanitas', 'Hermano', '3112345678'),
(13, 'Fernando', 'Castro', 'TI', '1001001012', '1979-12-01', 'M', 'B-', 'Contributivo', 3, 2, '3101234568', 'fernando12@example.com', 'Av 40 #55-66', 'Casado', 'Mecánico', 'Colsanitas', 'Esposa', '3122345678'),
(14, 'Valentina', 'Ríos', 'CC', '1001001013', '1998-07-09', 'F', 'B+', 'Subsidiado', 1, 3, '3112345679', 'valentina13@example.com', 'Calle 77 #88-99', 'Soltera', 'Estilista', 'SURA', 'Amiga', '3132345678'),
(15, 'Ricardo', 'Suárez', 'CC', '1001001014', '1984-03-27', 'M', 'AB+', 'Contributivo', 2, 3, '3122345670', 'ricardo14@example.com', 'Cra 200 #10-20', 'Casado', 'Chef', 'Nueva EPS', 'Hermana', '3142345678'),
(16, 'Camila', 'Moreno', 'TI', '1001001015', '2001-11-11', 'F', 'AB-', 'Subsidiado', 3, 1, '3132345671', 'camila15@example.com', 'Av 5 #5-55', 'Soltera', 'Estudiante', 'Sanitas', 'Papá', '3152345678'),
(17, 'Andrés', 'Pineda', 'CC', '1001001016', '1989-09-19', 'M', 'O-', 'Contributivo', 1, 2, '3142345672', 'andres16@example.com', 'Calle 99 #1-02', 'Casado', 'Analista', 'Colsanitas', 'Esposa', '3162345678'),
(18, 'Natalia', 'Salazar', 'CC', '1001001017', '1994-10-02', 'F', 'O+', 'Subsidiado', 2, 1, '3152345673', 'natalia17@example.com', 'Cra 32 #44-55', 'Soltera', 'Ingeniera', 'SURA', 'Mamá', '3172345678'),
(19, 'Diego', 'Rojas', 'TI', '1001001018', '1976-01-14', 'M', 'A+', 'Contributivo', 3, 2, '3162345674', 'diego18@example.com', 'Av 123 #67-89', 'Casado', 'Conductor', 'Nueva EPS', 'Hermana', '3182345678'),
(20, 'Isabella', 'Castillo', 'CC', '1001001019', '1997-12-21', 'F', 'A-', 'Subsidiado', 1, 3, '3172345675', 'isabella19@example.com', 'Calle 11 #22-33', 'Soltera', 'Diseñadora', 'Sanitas', 'Amiga', '3192345678'),
(21, 'Andres', 'Jiménez', 'CC', '1001001020', '1983-02-28', 'M', 'B+', 'Contributivo', 2, 2, '3182345676', 'andres20@example.com', 'Cra 67 #00-11', 'Casado', 'Financiero', 'Colsanitas', 'Esposa', '3102345678'),
(22, 'Carolina', 'Ortiz', 'TI', '1001001021', '1996-06-06', 'F', 'B-', 'Subsidiado', 3, 1, '3192345677', 'carolina21@example.com', 'Av 1 #23-45', 'Soltera', 'Periodista', 'SURA', 'Hermana', '3112345679'),
(23, 'Javier', 'Vélez', 'CC', '1001001022', '1981-11-15', 'M', 'AB+', 'Contributivo', 1, 2, '3102345679', 'javier22@example.com', 'Calle 66 #77-88', 'Casado', 'Técnico', 'Nueva EPS', 'Mamá', '3122345679'),
(24, 'Paula', 'Campos', 'CC', '1001001023', '1990-04-03', 'F', 'AB-', 'Subsidiado', 2, 3, '3112345680', 'paula23@example.com', 'Cra 90 #12-13', 'Soltera', 'Psicóloga', 'Sanitas', 'Amigo', '3132345680'),
(25, 'Sebastián', 'Suárez', 'TI', '1001001024', '1977-08-29', 'M', 'O+', 'Contributivo', 3, 2, '3122345681', 'sebastian24@example.com', 'Av 210 #45-67', 'Casado', 'Ingeniero', 'Colsanitas', 'Esposa', '3142345681'),
(26, 'Camilo', 'Guzmán', 'CC', '1001001025', '1991-04-07', 'M', 'O-', 'Contributivo', 2, 1, '3132345682', 'camilo25@example.com', 'Calle 33 #12-09', 'Soltero', 'Diseñador', 'SURA', 'Tía', '3152345682');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `universidad`
--

CREATE TABLE `universidad` (
  `id` int NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `siglas` varchar(20) DEFAULT NULL,
  `departamento` varchar(50) DEFAULT NULL,
  `ciudad` varchar(50) DEFAULT NULL,
  `tipo` varchar(20) DEFAULT NULL,
  `estado` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `universidad`
--

INSERT INTO `universidad` (`id`, `nombre`, `siglas`, `departamento`, `ciudad`, `tipo`, `estado`) VALUES
(1, 'Universidad Nacional de Colombia', 'UNAL', 'Bogotá D.C.', 'Bogotá', 'Pública', 'Activa'),
(2, 'Universidad de los Andes', 'UNIANDES', 'Bogotá D.C.', 'Bogotá', 'Privada', 'Activa'),
(3, 'Pontificia Universidad Javeriana', 'PUJ', 'Bogotá D.C.', 'Bogotá', 'Privada', 'Activa'),
(4, 'Universidad del Rosario', 'UROSARIO', 'Bogotá D.C.', 'Bogotá', 'Privada', 'Activa'),
(5, 'Universidad Externado de Colombia', 'EXTERNADO', 'Bogotá D.C.', 'Bogotá', 'Privada', 'Activa'),
(6, 'Universidad de La Sabana', 'UNISABANA', 'Cundinamarca', 'Chía', 'Privada', 'Activa'),
(7, 'Universidad Distrital Francisco José de Caldas', 'UDFJC', 'Bogotá D.C.', 'Bogotá', 'Pública', 'Activa'),
(8, 'Universidad Sergio Arboleda', 'SERGIO', 'Bogotá D.C.', 'Bogotá', 'Privada', 'Activa'),
(9, 'Universidad EAN', 'EAN', 'Bogotá D.C.', 'Bogotá', 'Privada', 'Activa'),
(10, 'Universidad Militar Nueva Granada', 'UMNG', 'Cundinamarca', 'Bogotá', 'Pública', 'Activa'),
(11, 'Universidad del Valle', 'UNIVALLE', 'Valle del Cauca', 'Cali', 'Pública', 'Activa'),
(12, 'Universidad de Antioquia', 'UDEA', 'Antioquia', 'Medellín', 'Pública', 'Activa'),
(13, 'Universidad EAFIT', 'EAFIT', 'Antioquia', 'Medellín', 'Privada', 'Activa'),
(14, 'Universidad Pontificia Bolivariana', 'UPB', 'Antioquia', 'Medellín', 'Privada', 'Activa'),
(15, 'Universidad de Medellín', 'UDEM', 'Antioquia', 'Medellín', 'Privada', 'Activa'),
(16, 'Universidad CES', 'CES', 'Antioquia', 'Medellín', 'Privada', 'Activa'),
(17, 'Universidad Autónoma de Bucaramanga', 'UNAB', 'Santander', 'Bucaramanga', 'Privada', 'Activa'),
(18, 'Universidad Industrial de Santander', 'UIS', 'Santander', 'Bucaramanga', 'Pública', 'Activa'),
(19, 'Universidad del Norte', 'UNINORTE', 'Atlántico', 'Barranquilla', 'Privada', 'Activa'),
(20, 'Universidad Simón Bolívar', 'USB', 'Atlántico', 'Barranquilla', 'Privada', 'Activa'),
(21, 'Universidad del Atlántico', 'UA', 'Atlántico', 'Barranquilla', 'Pública', 'Activa'),
(22, 'Universidad de Cartagena', 'UNICARTAGENA', 'Bolívar', 'Cartagena', 'Pública', 'Activa'),
(23, 'Universidad Tecnológica de Bolívar', 'UTB', 'Bolívar', 'Cartagena', 'Privada', 'Activa'),
(24, 'Universidad de Caldas', 'UCALDAS', 'Caldas', 'Manizales', 'Pública', 'Activa'),
(25, 'Universidad Autónoma de Manizales', 'UAM', 'Caldas', 'Manizales', 'Privada', 'Activa'),
(26, 'Universidad de Manizales', 'UMANIZALES', 'Caldas', 'Manizales', 'Privada', 'Activa'),
(27, 'Universidad del Cauca', 'UNICAUCA', 'Cauca', 'Popayán', 'Pública', 'Activa'),
(28, 'Universidad Surcolombiana', 'USCO', 'Huila', 'Neiva', 'Pública', 'Activa'),
(29, 'Universidad de Nariño', 'UDENAR', 'Nariño', 'Pasto', 'Pública', 'Activa'),
(30, 'Universidad del Magdalena', 'UNIMAGDALENA', 'Magdalena', 'Santa Marta', 'Pública', 'Activa'),
(31, 'Universidad de Córdoba', 'UNICORDOBA', 'Córdoba', 'Montería', 'Pública', 'Activa'),
(32, 'Universidad de Sucre', 'UNISUCRE', 'Sucre', 'Sincelejo', 'Pública', 'Activa'),
(33, 'Universidad Popular del Cesar', 'UPC', 'Cesar', 'Valledupar', 'Pública', 'Activa'),
(34, 'Universidad de la Amazonia', 'UNIAMAZONIA', 'Caquetá', 'Florencia', 'Pública', 'Activa'),
(35, 'Universidad de los Llanos', 'UNILLANOS', 'Meta', 'Villavicencio', 'Pública', 'Activa'),
(36, 'Universidad Francisco de Paula Santander', 'UFPS', 'Norte de Santander', 'Cúcuta', 'Pública', 'Activa'),
(37, 'Universidad de Pamplona', 'UPAM', 'Norte de Santander', 'Pamplona', 'Pública', 'Activa'),
(38, 'Universidad del Quindío', 'UNIQUINDIO', 'Quindío', 'Armenia', 'Pública', 'Activa'),
(39, 'Universidad Tecnológica de Pereira', 'UTP', 'Risaralda', 'Pereira', 'Pública', 'Activa'),
(40, 'Universidad Católica de Pereira', 'UCP', 'Risaralda', 'Pereira', 'Privada', 'Activa'),
(41, 'Universidad de San Buenaventura', 'USB', 'Antioquia', 'Medellín', 'Privada', 'Activa'),
(42, 'Universidad Santo Tomás', 'USTA', 'Bogotá D.C.', 'Bogotá', 'Privada', 'Activa'),
(43, 'Universidad Libre', 'UNILIBRE', 'Bogotá D.C.', 'Bogotá', 'Privada', 'Activa'),
(44, 'Universidad Central', 'UCENTRAL', 'Bogotá D.C.', 'Bogotá', 'Privada', 'Activa'),
(45, 'Universidad Cooperativa de Colombia', 'UCC', 'Antioquia', 'Medellín', 'Privada', 'Activa'),
(46, 'Universidad Nacional Abierta y a Distancia', 'UNAD', 'Cundinamarca', 'Bogotá', 'Pública', 'Activa'),
(47, 'Universidad Pedagógica Nacional', 'UPN', 'Bogotá D.C.', 'Bogotá', 'Pública', 'Activa'),
(48, 'Universidad de Cundinamarca', 'UCUNDINAMARCA', 'Cundinamarca', 'Fusagasugá', 'Pública', 'Activa'),
(49, 'Universidad Militar Nueva Granada', 'UMNG', 'Cundinamarca', 'Bogotá', 'Pública', 'Activa');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario`
--

CREATE TABLE `usuario` (
  `id` int NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `apellido` varchar(50) DEFAULT NULL,
  `correo` varchar(100) NOT NULL,
  `contrasena` varchar(255) NOT NULL,
  `telefono` varchar(15) DEFAULT NULL,
  `direccion` varchar(100) DEFAULT NULL,
  `ciudad` varchar(50) DEFAULT NULL,
  `tipo_documento` varchar(20) DEFAULT NULL,
  `numero_documento` varchar(20) DEFAULT NULL,
  `fecha_registro` datetime NOT NULL,
  `foto` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `usuario`
--

INSERT INTO `usuario` (`id`, `nombre`, `apellido`, `correo`, `contrasena`, `telefono`, `direccion`, `ciudad`, `tipo_documento`, `numero_documento`, `fecha_registro`, `foto`) VALUES
(1, 'Carlos Eduardo', 'Correa Baloco', 'carloscorreab52@gmail.comH', 'carlos123', '3244016591', 'CR 7A CL 23D-75', 'Sincelejo', 'CC', '1102148630', '2025-05-04 13:39:45', 'uploads/usuario_1_c15a078ea0a84e95a684037996047574.jpg'),
(2, 'Daniel', 'Correa Baloco', 'daniel@gmail.com', 'dani123', '3244016591', NULL, 'Sincelejo', NULL, NULL, '2025-05-04 13:54:21', 'uploads/usuario_2_aab12537361f4bfab2b64644f6d8f281.jpg'),
(3, 'Alejandra', 'Mercado', 'elias@gmail.com', 'elia123', '3244016591', 'CR 7A CL 23D-75', 'Sincelejo', 'CC', '1102148643', '2025-05-19 14:51:36', 'uploads/usuario_3_991f616f02dd4b93b98ff87f8c1b3235.jpg');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `cita`
--
ALTER TABLE `cita`
  ADD PRIMARY KEY (`id`),
  ADD KEY `paciente_id` (`paciente_id`),
  ADD KEY `medico_id` (`medico_id`);

--
-- Indices de la tabla `ciudad`
--
ALTER TABLE `ciudad`
  ADD PRIMARY KEY (`id`),
  ADD KEY `departamento_id` (`departamento_id`);

--
-- Indices de la tabla `configuracion`
--
ALTER TABLE `configuracion`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `departamento`
--
ALTER TABLE `departamento`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `factura`
--
ALTER TABLE `factura`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_cita` (`id_cita`);

--
-- Indices de la tabla `historia_clinica`
--
ALTER TABLE `historia_clinica`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_cita` (`id_cita`);

--
-- Indices de la tabla `medico`
--
ALTER TABLE `medico`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `numero_documento` (`numero_documento`),
  ADD UNIQUE KEY `correo` (`correo`),
  ADD UNIQUE KEY `numero_registro` (`numero_registro`),
  ADD KEY `departamento_id` (`departamento_id`),
  ADD KEY `ciudad_id` (`ciudad_id`),
  ADD KEY `universidad_id` (`universidad_id`);

--
-- Indices de la tabla `paciente`
--
ALTER TABLE `paciente`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `numero_documento` (`numero_documento`),
  ADD UNIQUE KEY `correo` (`correo`),
  ADD KEY `departamento_id` (`departamento_id`),
  ADD KEY `ciudad_id` (`ciudad_id`);

--
-- Indices de la tabla `universidad`
--
ALTER TABLE `universidad`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `usuario`
--
ALTER TABLE `usuario`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `correo` (`correo`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `cita`
--
ALTER TABLE `cita`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT de la tabla `ciudad`
--
ALTER TABLE `ciudad`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=84;

--
-- AUTO_INCREMENT de la tabla `configuracion`
--
ALTER TABLE `configuracion`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `departamento`
--
ALTER TABLE `departamento`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT de la tabla `factura`
--
ALTER TABLE `factura`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de la tabla `historia_clinica`
--
ALTER TABLE `historia_clinica`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `medico`
--
ALTER TABLE `medico`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT de la tabla `paciente`
--
ALTER TABLE `paciente`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT de la tabla `universidad`
--
ALTER TABLE `universidad`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=50;

--
-- AUTO_INCREMENT de la tabla `usuario`
--
ALTER TABLE `usuario`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `cita`
--
ALTER TABLE `cita`
  ADD CONSTRAINT `cita_ibfk_1` FOREIGN KEY (`paciente_id`) REFERENCES `paciente` (`id`),
  ADD CONSTRAINT `cita_ibfk_2` FOREIGN KEY (`medico_id`) REFERENCES `medico` (`id`);

--
-- Filtros para la tabla `ciudad`
--
ALTER TABLE `ciudad`
  ADD CONSTRAINT `ciudad_ibfk_1` FOREIGN KEY (`departamento_id`) REFERENCES `departamento` (`id`);

--
-- Filtros para la tabla `configuracion`
--
ALTER TABLE `configuracion`
  ADD CONSTRAINT `configuracion_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`);

--
-- Filtros para la tabla `factura`
--
ALTER TABLE `factura`
  ADD CONSTRAINT `factura_ibfk_1` FOREIGN KEY (`id_cita`) REFERENCES `cita` (`id`);

--
-- Filtros para la tabla `historia_clinica`
--
ALTER TABLE `historia_clinica`
  ADD CONSTRAINT `historia_clinica_ibfk_1` FOREIGN KEY (`id_cita`) REFERENCES `cita` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `medico`
--
ALTER TABLE `medico`
  ADD CONSTRAINT `medico_ibfk_1` FOREIGN KEY (`departamento_id`) REFERENCES `departamento` (`id`),
  ADD CONSTRAINT `medico_ibfk_2` FOREIGN KEY (`ciudad_id`) REFERENCES `ciudad` (`id`),
  ADD CONSTRAINT `medico_ibfk_3` FOREIGN KEY (`universidad_id`) REFERENCES `universidad` (`id`);

--
-- Filtros para la tabla `paciente`
--
ALTER TABLE `paciente`
  ADD CONSTRAINT `paciente_ibfk_1` FOREIGN KEY (`departamento_id`) REFERENCES `departamento` (`id`),
  ADD CONSTRAINT `paciente_ibfk_2` FOREIGN KEY (`ciudad_id`) REFERENCES `ciudad` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
