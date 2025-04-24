from flask import Flask, render_template, request, session, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from model import db, usuario, paciente, medico, cita, historia_clinica, factura
from datetime import datetime
from auth import init_auth_routes
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'MediSoft2025'
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:@localhost/medisoft'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
with app.app_context():
    db.create_all()

# Inicializar rutas de autenticación
init_auth_routes(app, db)

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
    return render_template('panel/medicos.html')

@app.route('/paciente')
def paciente():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('panel/pacientes.html')

@app.route('/cita')
def cita():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('panel/citas.html')

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
#fin de las rutas de la aplicación#

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8000, debug=True)
