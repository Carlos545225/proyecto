from flask import render_template, request, redirect, url_for, flash, session
from model import db, usuario

def init_auth_routes(app, db):
    @app.route('/login', methods=['GET', 'POST'])
    def login():
        if request.method == 'POST':
            correo = request.form.get('email')
            password = request.form.get('password')
            
            print(f"Intentando login con correo: {correo}")
            
            # Validar que se proporcionaron los campos requeridos
            if not correo:
                flash('Error: Por favor ingrese su correo electrónico', 'warning')
                return redirect(url_for('login'))
            if not password:
                flash('Error: Por favor ingrese su contraseña', 'warning')
                return redirect(url_for('login'))
            
            user = usuario.query.filter_by(correo=correo).first()
            
            if not user:
                flash('Error: El correo electrónico no está registrado', 'error')
                return redirect(url_for('login'))
            
            if user.contrasena != password:
                flash('Error: La contraseña es incorrecta', 'error')
                return redirect(url_for('login'))
            
            # Login exitoso
            session['user_id'] = user.id
            session['user_name'] = user.nombre
            flash(f'¡Bienvenido {user.nombre}!', 'success')
            return redirect(url_for('panel'))
                
        return render_template('pagina_principal/login.html')

    @app.route('/register', methods=['POST'])
    def register():
        nombre = request.form.get('nombre')
        correo = request.form.get('email')
        password = request.form.get('password')
        
        try:
            # Validar campos requeridos
            if not nombre:
                flash('Error: Por favor ingrese su nombre completo', 'warning')
                return redirect(url_for('login'))
            if not correo:
                flash('Error: Por favor ingrese su correo electrónico', 'warning')
                return redirect(url_for('login'))
            if not password:
                flash('Error: Por favor ingrese una contraseña', 'warning')
                return redirect(url_for('login'))

            print(f"Intentando registrar usuario con correo: {correo}")
            
            # Verificar si el usuario ya existe
            user_exists = usuario.query.filter_by(correo=correo).first()
            if user_exists:
                print(f"Usuario ya existe con correo: {correo}")
                flash('Error: Este correo electrónico ya está registrado', 'error')
                return redirect(url_for('login'))
            
            # Validar contraseña
            if len(password) < 6:
                flash('Error: La contraseña debe tener al menos 6 caracteres', 'warning')
                return redirect(url_for('login'))
            
            # Validar formato de correo electrónico
            if '@' not in correo or '.' not in correo:
                flash('Error: Por favor ingrese un correo electrónico válido', 'warning')
                return redirect(url_for('login'))

            # Crear nuevo usuario
            new_user = usuario(
                nombre=nombre,
                correo=correo,
                contrasena=password
            )
            
            print("Intentando agregar usuario a la base de datos...")
            db.session.add(new_user)
            db.session.commit()
            print(f"Nuevo usuario registrado: {correo}")
            flash('¡Registro exitoso! Ahora puedes iniciar sesión', 'success')
            flash('Por favor inicia sesión con tus nuevas credenciales', 'info')
            return redirect(url_for('login'))
            
        except Exception as e:
            db.session.rollback()
            import traceback
            print(f"Error detallado al registrar usuario:")
            print(f"Tipo de error: {type(e).__name__}")
            print(f"Mensaje de error: {str(e)}")
            print("Traceback completo:")
            print(traceback.format_exc())
            
            if 'Duplicate entry' in str(e):
                flash('El correo electrónico ya está registrado', 'error')
            else:
                error_msg = f'Error: Hubo un problema al crear tu cuenta. {str(e)}'
                flash(error_msg, 'error')
                flash('Si el problema persiste, contacta al soporte técnico.', 'info')
            return redirect(url_for('login'))

    @app.route('/logout')
    def logout():
        try:
            # Obtener el nombre del usuario antes de limpiar la sesión
            user_name = session.get('user_name', 'Usuario')
            
            # Preparar el mensaje antes de limpiar la sesión
            mensaje = f'¡Hasta pronto {user_name}! Sesión cerrada exitosamente.'
            
            # Limpiar la sesión
            session.clear()  # Clear all session data
            
            # Enviar el mensaje flash y asegurar que se guarde
            flash(mensaje, 'success')
            print(f'Mensaje flash enviado en logout: {mensaje}')
            
            # Force session modification flag
            session.modified = True
            
            # Add small delay to ensure flash message is processed
            from time import sleep
            sleep(0.1)
            
            return redirect(url_for('login'))
        except Exception as e:
            print(f'Error en logout: {str(e)}')
            flash('Error al cerrar sesión', 'error')
            return redirect(url_for('login'))
