const mysql = require('mysql');

const connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'mi_biblioteca',
	charset: 'utf8mb4',
	port: 3306,
	connectTimeout: 10000, // 10 segundos
	acquireTimeout: 10000,
	timeout: 10000,
	dateStrings: true
});

// Función para manejar la reconexión
function handleDisconnect() {
	connection.connect((err) => {
		if (err) {
			console.error('Error al conectar a la base de datos:', err);
			// Intentar reconectar después de 2 segundos
			setTimeout(handleDisconnect, 2000);
			return;
		}
		console.log('Conexión exitosa a la base de datos MySQL');
	});

	connection.on('error', (err) => {
		console.error('Error en la conexión a la base de datos:', err);
		if (err.code === 'PROTOCOL_CONNECTION_LOST' || 
			err.code === 'ECONNRESET' || 
			err.code === 'ETIMEDOUT') {
			handleDisconnect();
		} else {
			throw err;
		}
	});
}

// Iniciar la conexión
handleDisconnect();

module.exports = connection;