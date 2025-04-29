// Funciones para manejar citas
document.addEventListener('DOMContentLoaded', function() {
    // Cargar datos iniciales
    cargarCitas();
    cargarPacientes();
    cargarMedicos();

    // Event listeners para los botones
    document.getElementById('btnFiltrar').addEventListener('click', filtrarCitas);
    document.getElementById('btnExportar').addEventListener('click', exportarPDF);
    document.getElementById('btnGuardarCita').addEventListener('click', guardarCita);
    document.getElementById('btnGuardarEdicion').addEventListener('click', guardarEdicion);
});

// Función para cargar las citas
async function cargarCitas() {
    try {
        const response = await fetch('/citas/data');
        const citas = await response.json();
        actualizarTablaCitas(citas);
    } catch (error) {
        console.error('Error al cargar citas:', error);
        mostrarMensaje('Error al cargar las citas', 'error');
    }
}

// Función para cargar pacientes en los selectores
async function cargarPacientes() {
    try {
        const response = await fetch('/pacientes/data');
        const pacientes = await response.json();
        const selectPacientes = document.getElementById('pacienteCita');
        const selectEditPacientes = document.getElementById('editPacienteCita');
        
        pacientes.forEach(paciente => {
            const option = new Option(`${paciente.nombre} ${paciente.apellido} - ${paciente.tipo_documento}: ${paciente.numero_documento}`, paciente.id);
            selectPacientes.add(option);
            selectEditPacientes.add(option.cloneNode(true));
        });
    } catch (error) {
        console.error('Error al cargar pacientes:', error);
    }
}

// Función para cargar médicos en los selectores
async function cargarMedicos() {
    try {
        const response = await fetch('/medicos/data');
        const medicos = await response.json();
        const selectMedicos = document.getElementById('medicoCita');
        const selectEditMedicos = document.getElementById('editMedicoCita');
        
        medicos.forEach(medico => {
            const option = new Option(`Dr. ${medico.nombre} ${medico.apellido} - ${medico.especialidad}`, medico.id);
            selectMedicos.add(option);
            selectEditMedicos.add(option.cloneNode(true));
        });
    } catch (error) {
        console.error('Error al cargar médicos:', error);
    }
}

// Función para actualizar la tabla de citas
function actualizarTablaCitas(citas) {
    const tbody = document.querySelector('#tablaCitas tbody');
    tbody.innerHTML = '';

    citas.forEach(cita => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>C${String(cita.id).padStart(3, '0')}</td>
            <td>${new Date(cita.fecha).toLocaleDateString()}</td>
            <td>${cita.hora}</td>
            <td>
                <div class="d-flex align-items-center">
                    <img src="/static/img/panel/perfil.png" class="rounded-circle me-2" width="40" height="40" alt="Foto">
                    <div>
                        <div class="fw-medium">${cita.paciente.nombre} ${cita.paciente.apellido}</div>
                        <div class="small text-muted">${cita.paciente.tipo_documento}: ${cita.paciente.numero_documento}</div>
                    </div>
                </div>
            </td>
            <td>Dr. ${cita.medico.nombre} ${cita.medico.apellido}</td>
            <td>${cita.medico.especialidad}</td>
            <td><span class="badge bg-${getEstadoColor(cita.estado)}">${cita.estado}</span></td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button type="button" class="btn btn-primary me-1" title="Ver detalles" onclick="verDetalles(${cita.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button type="button" class="btn btn-warning me-1" title="Editar" onclick="editarCita(${cita.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button type="button" class="btn btn-danger" title="Cancelar" onclick="cancelarCita(${cita.id})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Función para obtener el color del estado
function getEstadoColor(estado) {
    switch(estado.toLowerCase()) {
        case 'programada': return 'info';
        case 'confirmada': return 'success';
        case 'completada': return 'primary';
        case 'cancelada': return 'danger';
        default: return 'secondary';
    }
}

// Función para filtrar citas
async function filtrarCitas() {
    const busqueda = document.getElementById('busquedaCita').value;
    const fecha = document.getElementById('fechaCita').value;
    const estado = document.getElementById('estadoCita').value;

    try {
        const response = await fetch(`/citas/filtrar?busqueda=${busqueda}&fecha=${fecha}&estado=${estado}`);
        const citas = await response.json();
        actualizarTablaCitas(citas);
    } catch (error) {
        console.error('Error al filtrar citas:', error);
        mostrarMensaje('Error al filtrar las citas', 'error');
    }
}

// Función para guardar una nueva cita
async function guardarCita() {
    const formData = {
        paciente_id: document.getElementById('pacienteCita').value,
        medico_id: document.getElementById('medicoCita').value,
        fecha: document.getElementById('fechaCita').value,
        hora: document.getElementById('horaCita').value,
        duracion: document.getElementById('duracionCita').value,
        tipo_cita: document.getElementById('tipoCita').value,
        motivo: document.getElementById('motivoCita').value,
        estado: document.getElementById('estadoCita').value,
        observaciones: document.getElementById('observacionesCita').value
    };

    try {
        const response = await fetch('/cita/agregar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            mostrarMensaje('Cita agregada exitosamente', 'success');
            $('#nuevaCitaModal').modal('hide');
            cargarCitas();
        } else {
            throw new Error('Error al agregar la cita');
        }
    } catch (error) {
        console.error('Error al guardar cita:', error);
        mostrarMensaje('Error al agregar la cita', 'error');
    }
}

// Función para editar una cita
async function editarCita(id) {
    try {
        const response = await fetch(`/cita/${id}`);
        const cita = await response.json();
        
        // Llenar el formulario de edición
        document.getElementById('editPacienteCita').value = cita.paciente_id;
        document.getElementById('editMedicoCita').value = cita.medico_id;
        document.getElementById('editFechaCita').value = cita.fecha.split('T')[0];
        document.getElementById('editHoraCita').value = cita.hora;
        document.getElementById('editDuracionCita').value = cita.duracion;
        document.getElementById('editTipoCita').value = cita.tipo_cita;
        document.getElementById('editMotivoCita').value = cita.motivo;
        document.getElementById('editEstadoCita').value = cita.estado;
        document.getElementById('editObservacionesCita').value = cita.observaciones;
        document.getElementById('editCitaId').value = id;
        
        $('#editarCitaModal').modal('show');
    } catch (error) {
        console.error('Error al cargar cita para edición:', error);
        mostrarMensaje('Error al cargar la cita', 'error');
    }
}

// Función para guardar la edición de una cita
async function guardarEdicion() {
    const id = document.getElementById('editCitaId').value;
    const formData = {
        paciente_id: document.getElementById('editPacienteCita').value,
        medico_id: document.getElementById('editMedicoCita').value,
        fecha: document.getElementById('editFechaCita').value,
        hora: document.getElementById('editHoraCita').value,
        duracion: document.getElementById('editDuracionCita').value,
        tipo_cita: document.getElementById('editTipoCita').value,
        motivo: document.getElementById('editMotivoCita').value,
        estado: document.getElementById('editEstadoCita').value,
        observaciones: document.getElementById('editObservacionesCita').value
    };

    try {
        const response = await fetch(`/cita/editar/${id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            mostrarMensaje('Cita actualizada exitosamente', 'success');
            $('#editarCitaModal').modal('hide');
            cargarCitas();
        } else {
            throw new Error('Error al actualizar la cita');
        }
    } catch (error) {
        console.error('Error al actualizar cita:', error);
        mostrarMensaje('Error al actualizar la cita', 'error');
    }
}

// Función para cancelar una cita
async function cancelarCita(id) {
    if (confirm('¿Está seguro de que desea cancelar esta cita?')) {
        try {
            const response = await fetch(`/cita/eliminar/${id}`, {
                method: 'POST'
            });

            if (response.ok) {
                mostrarMensaje('Cita cancelada exitosamente', 'success');
                cargarCitas();
            } else {
                throw new Error('Error al cancelar la cita');
            }
        } catch (error) {
            console.error('Error al cancelar cita:', error);
            mostrarMensaje('Error al cancelar la cita', 'error');
        }
    }
}

// Función para exportar a PDF
function exportarPDF() {
    window.location.href = '/cita/exportar-pdf';
}

// Función para mostrar mensajes
function mostrarMensaje(mensaje, tipo) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${tipo} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    const container = document.querySelector('.container-fluid');
    container.insertBefore(alertDiv, container.firstChild);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
} 