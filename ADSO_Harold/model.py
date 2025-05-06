from flask_sqlalchemy import SQLAlchemy
from flask import Flask
import os
from datetime import datetime

db = SQLAlchemy()

class usuario(db.Model):
    __tablename__ = 'usuario'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(50), nullable=False)
    apellido = db.Column(db.String(50), nullable=True)
    correo = db.Column(db.String(100), unique=True, nullable=False)
    contrasena = db.Column(db.String(255), nullable=False)
    telefono = db.Column(db.String(15), nullable=True)
    direccion = db.Column(db.String(100), nullable=True)
    ciudad = db.Column(db.String(50), nullable=True)
    tipo_documento = db.Column(db.String(20), nullable=True)
    numero_documento = db.Column(db.String(20), nullable=True)
    fecha_registro = db.Column(db.DateTime, nullable=False, default=datetime.now)
    foto = db.Column(db.String(100), nullable=True)
    
class paciente(db.Model):
    __tablename__ = 'paciente'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(50), nullable=False)
    apellido = db.Column(db.String(50), nullable=False)
    tipo_documento = db.Column(db.String(20), nullable=False)
    numero_documento = db.Column(db.String(20), unique=True, nullable=False)
    fecha_nacimiento = db.Column(db.Date, nullable=False)
    telefono = db.Column(db.String(15), nullable=False)
    correo = db.Column(db.String(100), unique=True, nullable=False)
    direccion = db.Column(db.String(100), nullable=False)
    ciudad = db.Column(db.String(50), nullable=False)
    estado_civil = db.Column(db.String(20), nullable=False)
    ocupacion = db.Column(db.String(50), nullable=False)
    eps = db.Column(db.String(50), nullable=False)
    contactos_emergencia = db.Column(db.String(100), nullable=False)
    telefono_emergencia = db.Column(db.String(15), nullable=False)
    
class medico(db.Model):
    __tablename__ = 'medico'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(50), nullable=False)
    apellido = db.Column(db.String(50), nullable=False)
    tipo_documento = db.Column(db.String(20), nullable=False)
    numero_documento = db.Column(db.String(20), unique=True, nullable=False)
    numero_registro = db.Column(db.String(20), unique=True, nullable=False)
    especialidad = db.Column(db.String(50), nullable=False)
    telefono = db.Column(db.String(15), nullable=False)
    correo = db.Column(db.String(100), unique=True, nullable=False)
    direccion = db.Column(db.String(100), nullable=False)

class cita(db.Model):
    __tablename__ = 'cita'
    id = db.Column(db.Integer, primary_key=True)
    paciente_id = db.Column(db.Integer, db.ForeignKey('paciente.id'), nullable=False)
    medico_id = db.Column(db.Integer, db.ForeignKey('medico.id'), nullable=False)
    fecha = db.Column(db.DateTime, nullable=False)
    hora = db.Column(db.Time, nullable=False)
    duracion = db.Column(db.Integer, nullable=False)
    tipo_cita = db.Column(db.String(20), nullable=False)
    motivo = db.Column(db.String(100), nullable=False)
    estado = db.Column(db.String(20), nullable=False)
    observaciones = db.Column(db.String(200), nullable=True)
    paciente = db.relationship('paciente', backref='citas')
    medico = db.relationship('medico', backref='citas')

class historia_clinica(db.Model):
    __tablename__ = 'historia_clinica'
    id = db.Column(db.Integer, primary_key=True)
    id_cita = db.Column(db.Integer, db.ForeignKey('cita.id', ondelete='CASCADE'), nullable=False)
    fecha = db.Column(db.DateTime, nullable=False)
    motivo_consulta = db.Column(db.String(200), nullable=False)
    antesedentes = db.Column(db.String(200), nullable=True)
    diagnostico = db.Column(db.String(200), nullable=True)
    tratamiento = db.Column(db.String(200), nullable=True)
    cita = db.relationship('cita', backref=db.backref('historia_clinica', uselist=False, cascade='all, delete'))
    
class factura(db.Model):
    __tablename__ = 'factura'
    id = db.Column(db.Integer, primary_key=True)
    id_cita = db.Column(db.Integer, db.ForeignKey('cita.id'), nullable=False)
    servicio = db.Column(db.String(100), nullable=False)
    valor = db.Column(db.Float, nullable=False)
    estado = db.Column(db.String(20), nullable=False, default='pendiente')
    fecha_emision = db.Column(db.DateTime, nullable=False, default=datetime.now)
    fecha_vencimiento = db.Column(db.Date, nullable=False)
    metodo_pago = db.Column(db.String(20), nullable=False)
    tipo_factura = db.Column(db.String(20), nullable=False)
    observaciones = db.Column(db.Text)
    cita = db.relationship('cita', backref=db.backref('factura', uselist=False))
        