from flask import render_template, request, redirect, url_for, flash, session, make_response, jsonify
from model import db, usuario, medico as Medico, paciente as Paciente, cita
from datetime import datetime

def init_auth_routes(app, db):
    @app.route('/login', methods=['GET', 'POST'])
    def login():
        # Check for logout message in cookie
        logout_message = request.cookies.get('logout_message')
        if logout_message:
            flash(logout_message, 'success')
            # Create a response that will delete the cookie
            response = make_response(render_template('pagina_principal/login.html'))
            response.delete_cookie('logout_message')
            
            # Only return the response if we're not processing a POST request
            if request.method != 'POST':
                return response
        
        # Check for logout message in session
        logout_message = session.pop('logout_message', None)
        if logout_message:
            flash(logout_message, 'success')
        
        # Check for logout message in URL (keep this as a fallback)
        url_logout_message = request.args.get('logout_message')
        if url_logout_message:
            flash(url_logout_message, 'success')
            
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

    @app.route('/logout', methods=['GET', 'POST'])
    def logout():
        try:
            # For both GET and POST requests, perform logout directly
            user_name = session.get('user_name', 'Usuario')
            # Store the message in a cookie instead of session
            response = redirect(url_for('login'))
            
            # Clear the session
            session.clear()
            
            return response
        except Exception as e:
            print(f'Error en logout: {str(e)}')
            flash('Error al cerrar sesión', 'error')
            return redirect(url_for('login'))

    @app.route('/medico/agregar', methods=['POST'])
    def agregar_medico():
        if 'user_id' not in session:
            return redirect(url_for('login'))
        
        try:
            nuevo_medico = Medico(
                nombre=request.form.get('nombresMedico'),
                apellido=request.form.get('apellidosMedico'),
                tipo_documento=request.form.get('tipoDocumento'),
                numero_documento=request.form.get('numeroDocumento'),
                numero_registro=request.form.get('registroMedico'),
                especialidad=request.form.get('especialidadMedico'),
                telefono=request.form.get('telefonoMedico'),
                correo=request.form.get('emailMedico'),
                direccion=request.form.get('direccionMedico')
            )
            
            db.session.add(nuevo_medico)
            db.session.commit()
            flash('Médico agregado exitosamente', 'success')
        except Exception as e:
            db.session.rollback()
            flash(f'Error al agregar médico: {str(e)}', 'error')
        
        return redirect(url_for('medico'))

    @app.route('/medico/editar/<int:id>', methods=['POST'])
    def editar_medico(id):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        
        try:
            medico_actual = Medico.query.get_or_404(id)
            medico_actual.nombre = request.form.get('editNombresMedico')
            medico_actual.apellido = request.form.get('editApellidosMedico')
            medico_actual.tipo_documento = request.form.get('editTipoDocumento')
            medico_actual.numero_documento = request.form.get('editNumeroDocumento')
            medico_actual.numero_registro = request.form.get('editRegistroMedico')
            medico_actual.especialidad = request.form.get('editEspecialidadMedico')
            medico_actual.telefono = request.form.get('editTelefonoMedico')
            medico_actual.correo = request.form.get('editEmailMedico')
            medico_actual.direccion = request.form.get('editDireccionMedico')
            
            db.session.commit()
            flash('Médico actualizado exitosamente', 'success')
        except Exception as e:
            db.session.rollback()
            flash(f'Error al actualizar médico: {str(e)}', 'error')
        
        return redirect(url_for('medico'))

    @app.route('/medico/eliminar/<int:id>', methods=['POST'])
    def eliminar_medico(id):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        
        try:
            medico_actual = Medico.query.get_or_404(id)
            db.session.delete(medico_actual)
            db.session.commit()
            flash('Médico eliminado exitosamente', 'success')
        except Exception as e:
            db.session.rollback()
            flash(f'Error al eliminar médico: {str(e)}', 'error')
        
        return redirect(url_for('medico'))

    @app.route('/paciente/agregar', methods=['POST'])
    def agregar_paciente():
        if 'user_id' not in session:
            return redirect(url_for('login'))
        
        try:
            nuevo_paciente = Paciente(
                nombre=request.form.get('nombrePaciente'),
                apellido=request.form.get('apellidosPaciente'),
                tipo_documento=request.form.get('tipoDocumento'),
                numero_documento=request.form.get('numeroDocumento'),
                fecha_nacimiento=request.form.get('fechaNacimiento'),
                telefono=request.form.get('telefonoPaciente'),
                correo=request.form.get('emailPaciente'),
                direccion=request.form.get('direccionPaciente'),
                ciudad=request.form.get('ciudadPaciente'),
                estado_civil=request.form.get('estadoCivil'),
                ocupacion=request.form.get('ocupacion'),
                eps=request.form.get('eps'),
                contactos_emergencia=request.form.get('contactoEmergencia'),
                telefono_emergencia=request.form.get('telefonoEmergencia')
            )
            
            db.session.add(nuevo_paciente)
            db.session.commit()
            flash('Paciente agregado exitosamente', 'success')
        except Exception as e:
            db.session.rollback()
            flash(f'Error al agregar paciente: {str(e)}', 'error')
        
        return redirect(url_for('pacientes'))

    @app.route('/paciente/editar/<int:id>', methods=['POST'])
    def editar_paciente(id):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        
        try:
            paciente_actual = Paciente.query.get_or_404(id)
            paciente_actual.nombre = request.form.get('editNombrePaciente')
            paciente_actual.apellido = request.form.get('editApellidosPaciente')
            paciente_actual.tipo_documento = request.form.get('editTipoDocumento')
            paciente_actual.numero_documento = request.form.get('editNumeroDocumento')
            paciente_actual.fecha_nacimiento = request.form.get('editFechaNacimiento')
            paciente_actual.telefono = request.form.get('editTelefonoPaciente')
            paciente_actual.correo = request.form.get('editEmailPaciente')
            paciente_actual.direccion = request.form.get('editDireccionPaciente')
            paciente_actual.ciudad = request.form.get('editCiudadPaciente')
            paciente_actual.estado_civil = request.form.get('editEstadoCivil')
            paciente_actual.ocupacion = request.form.get('editOcupacion')
            paciente_actual.eps = request.form.get('editEps')
            paciente_actual.contactos_emergencia = request.form.get('editContactoEmergencia')
            paciente_actual.telefono_emergencia = request.form.get('editTelefonoEmergencia')
            
            db.session.commit()
            flash('Paciente actualizado exitosamente', 'success')
        except Exception as e:
            db.session.rollback()
            flash(f'Error al actualizar paciente: {str(e)}', 'error')
        
        return redirect(url_for('pacientes'))

    @app.route('/paciente/eliminar/<int:id>', methods=['POST'])
    def eliminar_paciente(id):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        
        try:
            paciente_actual = Paciente.query.get_or_404(id)
            db.session.delete(paciente_actual)
            db.session.commit()
            flash('Paciente eliminado exitosamente', 'success')
        except Exception as e:
            db.session.rollback()
            flash(f'Error al eliminar paciente: {str(e)}', 'error')
        
        return redirect(url_for('pacientes'))

    @app.route('/cita/agregar', methods=['POST'])
    def agregar_cita():
        if 'user_id' not in session:
            return redirect(url_for('login'))
        
        try:
            nueva_cita = cita(
                paciente_id=request.form.get('pacienteCita'),
                medico_id=request.form.get('medicoCita'),
                fecha=datetime.strptime(request.form.get('fechaCita'), '%Y-%m-%d'),
                hora=datetime.strptime(request.form.get('horaCita'), '%H:%M').time(),
                duracion=request.form.get('duracionCita'),
                tipo_cita=request.form.get('tipoCita'),
                motivo=request.form.get('motivoCita'),
                estado=request.form.get('estadoCita'),
                observaciones=request.form.get('observacionesCita')
            )
            
            db.session.add(nueva_cita)
            db.session.commit()
            flash('Cita agregada exitosamente', 'success')
        except Exception as e:
            db.session.rollback()
            flash(f'Error al agregar cita: {str(e)}', 'error')
        
        return redirect(url_for('cita'))

    @app.route('/cita/editar/<int:id>', methods=['POST'])
    def editar_cita(id):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        
        try:
            cita_actual = cita.query.get_or_404(id)
            cita_actual.paciente_id = request.form.get('editPacienteCita')
            cita_actual.medico_id = request.form.get('editMedicoCita')
            cita_actual.fecha = datetime.strptime(request.form.get('editFechaCita'), '%Y-%m-%d')
            cita_actual.hora = datetime.strptime(request.form.get('editHoraCita'), '%H:%M').time()
            cita_actual.duracion = request.form.get('editDuracionCita')
            cita_actual.tipo_cita = request.form.get('editTipoCita')
            cita_actual.motivo = request.form.get('editMotivoCita')
            cita_actual.estado = request.form.get('editEstadoCita')
            cita_actual.observaciones = request.form.get('editObservacionesCita')
            
            db.session.commit()
            flash('Cita actualizada exitosamente', 'success')
        except Exception as e:
            db.session.rollback()
            flash(f'Error al actualizar cita: {str(e)}', 'error')
        
        return redirect(url_for('cita'))

    @app.route('/cita/eliminar/<int:id>', methods=['POST'])
    def eliminar_cita(id):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        
        try:
            cita_actual = cita.query.get_or_404(id)
            db.session.delete(cita_actual)
            db.session.commit()
            flash('Cita eliminada exitosamente', 'success')
        except Exception as e:
            db.session.rollback()
            flash(f'Error al eliminar cita: {str(e)}', 'error')
        
        return redirect(url_for('cita'))
