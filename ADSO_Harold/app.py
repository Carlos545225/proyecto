from flask import Flask, render_template, request, session, redirect, url_for, flash, jsonify, make_response
from flask_sqlalchemy import SQLAlchemy
from model import db, usuario, paciente as Paciente, medico as Medico, cita as Cita, historia_clinica, factura
from datetime import datetime
from auth import init_auth_routes
import os
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from io import BytesIO

app = Flask(__name__)
app.config['SECRET_KEY'] = 'MediSoft2025'
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:@localhost/medisoft'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
with app.app_context():
    db.create_all()

# Inicializar rutas de autenticación
init_auth_routes(app, db)

# Lista de EPS de Colombia
LISTA_EPS = [
    {'codigo': 'NUEVA EPS', 'nombre': 'Nueva EPS'},
    {'codigo': 'SURA EPS', 'nombre': 'EPS Sura'},
    {'codigo': 'SANITAS EPS', 'nombre': 'EPS Sanitas'},
    {'codigo': 'COMPENSAR EPS', 'nombre': 'Compensar EPS'},
    {'codigo': 'FAMISANAR EPS', 'nombre': 'Famisanar EPS'},
    {'codigo': 'SALUD TOTAL EPS', 'nombre': 'Salud Total EPS'},
    {'codigo': 'COOSALUD EPS', 'nombre': 'Coosalud EPS'},
    {'codigo': 'MUTUAL SER EPS', 'nombre': 'Mutual Ser EPS'},
    {'codigo': 'ALIANSALUD EPS', 'nombre': 'Aliansalud EPS'},
    {'codigo': 'COMFENALCO VALLE EPS', 'nombre': 'Comfenalco Valle EPS'},
    {'codigo': 'EMSSANAR EPS', 'nombre': 'Emssanar EPS'},
    {'codigo': 'ASMET SALUD EPS', 'nombre': 'Asmet Salud EPS'},
    {'codigo': 'MALLAMAS EPS', 'nombre': 'Mallamas EPS'},
    {'codigo': 'PIJAOS SALUD EPS', 'nombre': 'Pijaos Salud EPS'},
    {'codigo': 'CAPITAL SALUD EPS', 'nombre': 'Capital Salud EPS'},
    {'codigo': 'SAVIA SALUD EPS', 'nombre': 'Savia Salud EPS'},
    {'codigo': 'MEDIMAS EPS', 'nombre': 'Medimás EPS'}
]

# Rutas de la aplicación#
@app.route('/')
def index():
    return render_template('pagina_principal/index.html')

@app.route('/nosotros')
def nosotros():
    return render_template('pagina_principal/nosotros.html')

@app.route('/panel')
def panel():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('panel/panel.html')

@app.route('/medico')
def medico():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    # Obtener parámetros de búsqueda y paginación
    busqueda = request.args.get('busqueda', '')
    especialidad = request.args.get('especialidad', '')
    page = request.args.get('page', 1, type=int)
    per_page = 10  # Número de registros por página
    
    # Consulta base
    query = Medico.query
    
    # Aplicar filtros si existen
    if busqueda:
        query = query.filter(
            db.or_(
                Medico.nombre.ilike(f'%{busqueda}%'),
                Medico.apellido.ilike(f'%{busqueda}%'),
                Medico.numero_documento.ilike(f'%{busqueda}%'),
                Medico.correo.ilike(f'%{busqueda}%'),
                Medico.telefono.ilike(f'%{busqueda}%')
            )
        )
    
    if especialidad:
        query = query.filter(Medico.especialidad == especialidad)
    
    # Lista de especialidades disponibles con códigos de servicio
    especialidades = {
        '890201': 'Medicina General',
        '890283': 'Pediatría',
        '890208': 'Cardiología',
        '890216': 'Dermatología',
        '890263': 'Ginecología y Obstetricia',
        '890266': 'Neurología',
        '890271': 'Oftalmología',
        '890287': 'Ortopedia y Traumatología',
        '890220': 'Endocrinología',
        '890253': 'Cirugía General',
        '890205': 'Anestesiología',
        '890207': 'Cirugía Plástica',
        '890209': 'Cirugía Vascular',
        '890210': 'Cirugía de Tórax',
        '890211': 'Cirugía de Cabeza y Cuello',
        '890212': 'Cirugía de Mano',
        '890213': 'Cirugía Pediátrica',
        '890214': 'Cirugía Oncológica',
        '890215': 'Cirugía Maxilofacial',
        '890217': 'Gastroenterología',
        '890218': 'Hematología',
        '890219': 'Infectología',
        '890221': 'Medicina Interna',
        '890222': 'Nefrología',
        '890223': 'Neumología',
        '890224': 'Oncología',
        '890225': 'Otorrinolaringología',
        '890226': 'Psiquiatría',
        '890227': 'Reumatología',
        '890228': 'Urología',
        '890229': 'Medicina Familiar',
        '890230': 'Medicina del Deporte',
        '890231': 'Medicina del Trabajo',
        '890232': 'Medicina Física y Rehabilitación',
        '890233': 'Medicina Nuclear',
        '890234': 'Medicina Preventiva y Social',
        '890235': 'Medicina Crítica y Cuidado Intensivo',
        '890236': 'Medicina de Urgencias',
        '890237': 'Medicina Legal y Forense',
        '890238': 'Medicina del Dolor',
        '890239': 'Medicina Paliativa',
        '890240': 'Medicina del Sueño',
        '890241': 'Medicina del Viajero',
        '890242': 'Medicina Hiperbárica',
        '890243': 'Medicina Estética',
        '890244': 'Medicina Antienvejecimiento',
        '890245': 'Medicina Regenerativa',
        '890246': 'Medicina Funcional',
        '890247': 'Medicina Integrativa',
        '890248': 'Medicina Biológica',
        '890249': 'Medicina Homeopática',
        '890250': 'Medicina Tradicional China',
        '890251': 'Medicina Ayurvédica',
        '890252': 'Medicina Naturopática'
    }
    
    # Ordenar por ID y paginar resultados
    pagination = query.order_by(Medico.id.asc()).paginate(
        page=page,
        per_page=per_page,
        error_out=False
    )
    
    medicos = pagination.items
    
    # Agregar el nombre de la especialidad a cada médico
    for m in medicos:
        m.nombre_especialidad = especialidades.get(m.especialidad, 'Especialidad no encontrada')
    
    return render_template(
        'panel/medicos.html',
        medicos=medicos,
        especialidades=especialidades,
        pagination=pagination,
        busqueda=busqueda,
        especialidad_seleccionada=especialidad
    )

@app.route('/paciente')
def pacientes():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    # Obtener parámetros de búsqueda y paginación
    busqueda = request.args.get('busqueda', '')
    page = request.args.get('page', 1, type=int)
    per_page = 10  # Número de registros por página
    
    # Consulta base
    query = Paciente.query
    
    # Aplicar filtros si existen
    if busqueda:
        query = query.filter(
            db.or_(
                Paciente.nombre.ilike(f'%{busqueda}%'),
                Paciente.apellido.ilike(f'%{busqueda}%'),
                Paciente.numero_documento.ilike(f'%{busqueda}%'),
                Paciente.correo.ilike(f'%{busqueda}%'),
                Paciente.telefono.ilike(f'%{busqueda}%')
            )
        )
    
    # Ordenar por ID y paginar resultados
    pagination = query.order_by(Paciente.id.asc()).paginate(
        page=page,
        per_page=per_page,
        error_out=False
    )
    
    pacientes = pagination.items
    
    return render_template(
        'panel/pacientes.html',
        pacientes=pacientes,
        pagination=pagination,
        busqueda=busqueda,
        lista_eps=LISTA_EPS
    )

@app.route('/cita')
def cita():
    if 'user_id' not in session:
        return redirect(url_for('login'))   
    
    # Obtener parámetros de búsqueda
    busqueda = request.args.get('busqueda', '')
    fecha = request.args.get('fecha', '')
    estado = request.args.get('estado', '')
    page = request.args.get('page', 1, type=int)
    per_page = 10  # Número de elementos por página

    # Construir la consulta base
    query = Cita.query.join(Paciente).join(Medico)

    # Aplicar filtros
    if busqueda:
        query = query.filter(
            db.or_(
                Paciente.nombre.ilike(f'%{busqueda}%'),
                Paciente.apellido.ilike(f'%{busqueda}%'),
                Paciente.documento.ilike(f'%{busqueda}%'),
                Medico.nombre.ilike(f'%{busqueda}%'),
                Medico.apellido.ilike(f'%{busqueda}%')
            )
        )
    if fecha:
        query = query.filter(db.func.date(Cita.fecha) == fecha)
    if estado:
        query = query.filter(Cita.estado == estado)    

    # Ordenar por fecha y hora
    query = query.order_by(Cita.fecha.desc(), Cita.hora.desc())

    # Aplicar paginación
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    citas = pagination.items

    # Obtener todos los pacientes y médicos para los selectores
    pacientes = Paciente.query.all()
    medicos = Medico.query.all()
    especialidades = {
         '890201': 'Medicina General',
        '890283': 'Pediatría',
        '890208': 'Cardiología',
        '890216': 'Dermatología',
        '890263': 'Ginecología y Obstetricia',
        '890266': 'Neurología',
        '890271': 'Oftalmología',
        '890287': 'Ortopedia y Traumatología',
        '890220': 'Endocrinología',
        '890253': 'Cirugía General',
        '890205': 'Anestesiología',
        '890207': 'Cirugía Plástica',
        '890209': 'Cirugía Vascular',
        '890210': 'Cirugía de Tórax',
        '890211': 'Cirugía de Cabeza y Cuello',
        '890212': 'Cirugía de Mano',
        '890213': 'Cirugía Pediátrica',
        '890214': 'Cirugía Oncológica',
        '890215': 'Cirugía Maxilofacial',
        '890217': 'Gastroenterología',
        '890218': 'Hematología',
        '890219': 'Infectología',
        '890221': 'Medicina Interna',
        '890222': 'Nefrología',
        '890223': 'Neumología',
        '890224': 'Oncología',
        '890225': 'Otorrinolaringología',
        '890226': 'Psiquiatría',
        '890227': 'Reumatología',
        '890228': 'Urología',
        '890229': 'Medicina Familiar',
        '890230': 'Medicina del Deporte',
        '890231': 'Medicina del Trabajo',
        '890232': 'Medicina Física y Rehabilitación',
        '890233': 'Medicina Nuclear',
        '890234': 'Medicina Preventiva y Social',
        '890235': 'Medicina Crítica y Cuidado Intensivo',
        '890236': 'Medicina de Urgencias',
        '890237': 'Medicina Legal y Forense',
        '890238': 'Medicina del Dolor',
        '890239': 'Medicina Paliativa',
        '890240': 'Medicina del Sueño',
        '890241': 'Medicina del Viajero',
        '890242': 'Medicina Hiperbárica',
        '890243': 'Medicina Estética',
        '890244': 'Medicina Antienvejecimiento',
        '890245': 'Medicina Regenerativa',
        '890246': 'Medicina Funcional',
        '890247': 'Medicina Integrativa',
        '890248': 'Medicina Biológica',
        '890249': 'Medicina Homeopática',
        '890250': 'Medicina Tradicional China',
        '890251': 'Medicina Ayurvédica',
        '890252': 'Medicina Naturopática'
    }
    
    return render_template('panel/citas.html',
                         citas=citas,
                         pacientes=pacientes,
                         medicos=medicos,
                         especialidades=especialidades,
                         pagination=pagination,
                         busqueda=busqueda,
                         fecha=fecha,
                         estado=estado)

@app.route('/historia')
def historia():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('panel/historias.html')

@app.route('/factura')
def factura():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('panel/facturas.html')

@app.route('/perfil')
def perfil():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('panel/perfil.html')

@app.route('/medico/<int:id>')
def get_medico_data(id):
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'No autorizado'}), 401

        medico_actual = Medico.query.get_or_404(id)
        return jsonify({
            'id': medico_actual.id,
            'nombre': medico_actual.nombre,
            'apellido': medico_actual.apellido,
            'tipo_documento': medico_actual.tipo_documento,
            'numero_documento': medico_actual.numero_documento,
            'numero_registro': medico_actual.numero_registro,
            'especialidad': medico_actual.especialidad,
            'telefono': medico_actual.telefono,
            'correo': medico_actual.correo,
            'direccion': medico_actual.direccion
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/medico/<int:id>/editar')
def editar_medico_form(id):
    if 'user_id' not in session:
        return redirect(url_for('login'))
    medico_actual = Medico.query.get_or_404(id)
    return render_template('panel/editar_medico.html', medico_editar=medico_actual)

@app.route('/medicos/data')
def get_medicos_data():
    if 'user_id' not in session:
        return jsonify({'error': 'No autorizado'}), 401
    try:
        medicos = Medico.query.all()
        medicos_data = []
        for m in medicos:
            medicos_data.append({
                'id': m.id,
                'nombre': m.nombre,
                'apellido': m.apellido,
                'tipo_documento': m.tipo_documento,
                'numero_documento': m.numero_documento,
                'numero_registro': m.numero_registro,
                'especialidad': m.especialidad,
                'telefono': m.telefono,
                'correo': m.correo,
                'direccion': m.direccion
            })
        return jsonify(medicos_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/medico/exportar-pdf')
def exportar_medicos_pdf():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    # Obtener todos los médicos
    medicos = Medico.query.all()
    
    # Crear un buffer para el PDF
    buffer = BytesIO()
    
    # Crear el documento PDF con tamaño de página más grande (A4 landscape)
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(letter),
        rightMargin=30,
        leftMargin=30,
        topMargin=30,
        bottomMargin=30
    )
    
    # Contenedor para los elementos del PDF
    elements = []
    
    # Estilos
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=16,
        spaceAfter=30,
        alignment=1  # Centrado
    )
    
    # Título
    title = Paragraph("Reporte de Médicos - MediSoft", title_style)
    elements.append(title)
    
    # Lista de especialidades
    especialidades = {
        '890201': 'Medicina General',
        '890283': 'Pediatría',
        '890208': 'Cardiología',
        '890216': 'Dermatología',
        '890263': 'Ginecología y Obstetricia',
        '890266': 'Neurología',
        '890271': 'Oftalmología',
        '890287': 'Ortopedia y Traumatología',
        '890220': 'Endocrinología',
        '890253': 'Cirugía General',
        '890205': 'Anestesiología',
        '890207': 'Cirugía Plástica',
        '890209': 'Cirugía Vascular',
        '890210': 'Cirugía de Tórax',
        '890211': 'Cirugía de Cabeza y Cuello',
        '890212': 'Cirugía de Mano',
        '890213': 'Cirugía Pediátrica',
        '890214': 'Cirugía Oncológica',
        '890215': 'Cirugía Maxilofacial',
        '890217': 'Gastroenterología',
        '890218': 'Hematología',
        '890219': 'Infectología',
        '890221': 'Medicina Interna',
        '890222': 'Nefrología',
        '890223': 'Neumología',
        '890224': 'Oncología',
        '890225': 'Otorrinolaringología',
        '890226': 'Psiquiatría',
        '890227': 'Reumatología',
        '890228': 'Urología',
        '890229': 'Medicina Familiar',
        '890230': 'Medicina del Deporte',
        '890231': 'Medicina del Trabajo',
        '890232': 'Medicina Física y Rehabilitación',
        '890233': 'Medicina Nuclear',
        '890234': 'Medicina Preventiva y Social',
        '890235': 'Medicina Crítica y Cuidado Intensivo',
        '890236': 'Medicina de Urgencias',
        '890237': 'Medicina Legal y Forense',
        '890238': 'Medicina del Dolor',
        '890239': 'Medicina Paliativa',
        '890240': 'Medicina del Sueño',
        '890241': 'Medicina del Viajero',
        '890242': 'Medicina Hiperbárica',
        '890243': 'Medicina Estética',
        '890244': 'Medicina Antienvejecimiento',
        '890245': 'Medicina Regenerativa',
        '890246': 'Medicina Funcional',
        '890247': 'Medicina Integrativa',
        '890248': 'Medicina Biológica',
        '890249': 'Medicina Homeopática',
        '890250': 'Medicina Tradicional China',
        '890251': 'Medicina Ayurvédica',
        '890252': 'Medicina Naturopática'

    }
    
    # Preparar datos para la tabla
    data = [['ID', 'Nombre', 'Apellido', 'Especialidad', 'Documento', 'Teléfono', 'Correo']]
    
    for m in medicos:
        data.append([
            f'M{str(m.id).zfill(3)}',
            m.nombre,
            m.apellido,
            especialidades.get(m.especialidad, 'No especificada'),
            f'{m.tipo_documento} {m.numero_documento}',
            m.telefono,
            m.correo
        ])
    
    # Calcular anchos de columna
    table_style = TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2C3E50')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ROWHEIGHT', (0, 0), (-1, -1), 25),
        # Alternar colores de fila
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8F9FA')]),
        # Ajustar el espacio entre columnas
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ])
    
    # Crear tabla con anchos específicos
    col_widths = [40, 70, 70, 100, 80, 70, 150]  # Ajustados para 7 columnas, más ancho para correo
    table = Table(data, colWidths=col_widths, repeatRows=1)
    table.setStyle(table_style)
    
    elements.append(table)
    
    # Agregar fecha de generación
    fecha_style = ParagraphStyle(
        'FechaStyle',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.grey,
        alignment=2,  # Derecha
        spaceAfter=0,
        spaceBefore=20
    )
    fecha = Paragraph(f"Reporte generado el {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}", fecha_style)
    elements.append(fecha)
    
    # Generar PDF
    doc.build(elements)
    
    # Preparar la respuesta
    buffer.seek(0)
    response = make_response(buffer.getvalue())
    response.mimetype = 'application/pdf'
    response.headers['Content-Disposition'] = 'attachment; filename=medicos_report.pdf'
    
    return response

@app.route('/paciente/exportar-pdf')
def exportar_pacientes_pdf():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    # Obtener todos los pacientes
    pacientes = Paciente.query.all()
    
    # Crear un buffer para el PDF
    buffer = BytesIO()
    
    # Crear el documento PDF con tamaño de página más grande (A4 landscape)
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(letter),
        rightMargin=30,
        leftMargin=30,
        topMargin=30,
        bottomMargin=30
    )
    
    # Contenedor para los elementos del PDF
    elements = []
    
    # Estilos
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=16,
        spaceAfter=30,
        alignment=1  # Centrado
    )
    
    # Título
    title = Paragraph("Reporte de Pacientes - MediSoft", title_style)
    elements.append(title)
    
    # Preparar datos para la tabla
    data = [['ID', 'Nombre', 'Apellido', 'Documento', 'Teléfono', 'Correo', 'EPS', 'Ciudad']]
    
    for p in pacientes:
        data.append([
            f'P{str(p.id).zfill(3)}',
            p.nombre,
            p.apellido,
            f'{p.tipo_documento} {p.numero_documento}',
            p.telefono,
            p.correo,
            p.eps,
            p.ciudad
        ])
    
    # Calcular anchos de columna
    table_style = TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2C3E50')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ROWHEIGHT', (0, 0), (-1, -1), 25),
        # Alternar colores de fila
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8F9FA')]),
        # Ajustar el espacio entre columnas
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ])
    
    # Crear tabla con anchos específicos
    col_widths = [40, 80, 80, 90, 70, 120, 80, 80]  # Ajustados para 8 columnas
    table = Table(data, colWidths=col_widths, repeatRows=1)
    table.setStyle(table_style)
    
    elements.append(table)
    
    # Agregar fecha de generación
    fecha_style = ParagraphStyle(
        'FechaStyle',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.grey,
        alignment=2,  # Derecha
        spaceAfter=0,
        spaceBefore=20
    )
    fecha = Paragraph(f"Reporte generado el {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}", fecha_style)
    elements.append(fecha)
    
    # Generar PDF
    doc.build(elements)
    
    # Preparar la respuesta
    buffer.seek(0)
    response = make_response(buffer.getvalue())
    response.mimetype = 'application/pdf'
    response.headers['Content-Disposition'] = 'attachment; filename=pacientes_report.pdf'
    
    return response

@app.route('/cita/exportar-pdf')
def exportar_citas_pdf():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    # Obtener todas las citas con información relacionada
    citas = Cita.query.join(Paciente).join(Medico).all()
    
    # Crear un buffer para el PDF
    buffer = BytesIO()
    
    # Crear el documento PDF con tamaño de página más grande (A4 landscape)
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(letter),
        rightMargin=30,
        leftMargin=30,
        topMargin=30,
        bottomMargin=30
    )
    
    # Contenedor para los elementos del PDF
    elements = []
    
    # Estilos
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=16,
        spaceAfter=30,
        alignment=1  # Centrado
    )
    
    # Título
    title = Paragraph("Reporte de Citas - MediSoft", title_style)
    elements.append(title)

    # Lista de especialidades
    especialidades = {
        '890201': 'Medicina General',
        '890283': 'Pediatría',
        '890208': 'Cardiología',
        '890216': 'Dermatología',
        '890263': 'Ginecología y Obstetricia',
        '890266': 'Neurología',
        '890271': 'Oftalmología',
        '890287': 'Ortopedia y Traumatología',
        '890220': 'Endocrinología',
        '890253': 'Cirugía General',
        '890205': 'Anestesiología',
        '890207': 'Cirugía Plástica',
        '890209': 'Cirugía Vascular',
        '890210': 'Cirugía de Tórax',
        '890211': 'Cirugía de Cabeza y Cuello',
        '890212': 'Cirugía de Mano',
        '890213': 'Cirugía Pediátrica',
        '890214': 'Cirugía Oncológica',
        '890215': 'Cirugía Maxilofacial',
        '890217': 'Gastroenterología',
        '890218': 'Hematología',
        '890219': 'Infectología',
        '890221': 'Medicina Interna',
        '890222': 'Nefrología',
        '890223': 'Neumología',
        '890224': 'Oncología',
        '890225': 'Otorrinolaringología',
        '890226': 'Psiquiatría',
        '890227': 'Reumatología',
        '890228': 'Urología',
        '890229': 'Medicina Familiar',
        '890230': 'Medicina del Deporte',
        '890231': 'Medicina del Trabajo',
        '890232': 'Medicina Física y Rehabilitación',
        '890233': 'Medicina Nuclear',
        '890234': 'Medicina Preventiva y Social',
        '890235': 'Medicina Crítica y Cuidado Intensivo',
        '890236': 'Medicina de Urgencias',
        '890237': 'Medicina Legal y Forense',
        '890238': 'Medicina del Dolor',
        '890239': 'Medicina Paliativa',
        '890240': 'Medicina del Sueño',
        '890241': 'Medicina del Viajero',
        '890242': 'Medicina Hiperbárica',
        '890243': 'Medicina Estética',
        '890244': 'Medicina Antienvejecimiento',
        '890245': 'Medicina Regenerativa',
        '890246': 'Medicina Funcional',
        '890247': 'Medicina Integrativa',
        '890248': 'Medicina Biológica',
        '890249': 'Medicina Homeopática',
        '890250': 'Medicina Tradicional China',
        '890251': 'Medicina Ayurvédica',
        '890252': 'Medicina Naturopática'

    }
    # Preparar datos para la tabla
    data = [['ID', 'Fecha', 'Hora', 'Paciente', 'Médico', 'Especialidad', 'Tipo', 'Estado']]
    
    for c in citas:
        data.append([
            f'C{str(c.id).zfill(3)}',
            c.fecha.strftime('%d/%m/%Y'),
            c.hora.strftime('%H:%M'),
            f'{c.paciente.nombre}',
            f'Dr. {c.medico.nombre}',
            especialidades.get(c.medico.especialidad, 'No especificada'),
            c.tipo_cita,
            c.estado
        ])
    
    # Calcular anchos de columna
    table_style = TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2C3E50')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ROWHEIGHT', (0, 0), (-1, -1), 25),
        # Alternar colores de fila
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8F9FA')]),
        # Ajustar el espacio entre columnas
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ])
    
    # Crear tabla con anchos específicos
    col_widths = [40, 80, 80, 100, 100, 120, 80, 80]  # Ajustados para 8 columnas
    table = Table(data, colWidths=col_widths, repeatRows=1)
    table.setStyle(table_style)
    
    elements.append(table)
    
    # Agregar fecha de generación
    fecha_style = ParagraphStyle(
        'FechaStyle',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.grey,
        alignment=2,  # Derecha
        spaceAfter=0,
        spaceBefore=20
    )
    fecha = Paragraph(f"Reporte generado el {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}", fecha_style)
    elements.append(fecha)
    
    # Generar PDF
    doc.build(elements)
    
    # Preparar la respuesta
    buffer.seek(0)
    response = make_response(buffer.getvalue())
    response.mimetype = 'application/pdf'
    response.headers['Content-Disposition'] = 'attachment; filename=citas_report.pdf'
    
    return response

#fin de las rutas de la aplicación#

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8000, debug=True)
