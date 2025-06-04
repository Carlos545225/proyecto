/**
 * Script para gestionar las pestañas y depurar problemas
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Tab Manager cargado');
    
    // Obtener la pestaña activa de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const activeTab = urlParams.get('tab') || 'libros';
    
    console.log('Pestaña activa según URL:', activeTab);
    
    // Verificar que los elementos de la pestaña existen
    const tabElement = document.getElementById(activeTab + '-tab');
    const tabPaneElement = document.getElementById(activeTab + '-tab-pane');
    
    console.log('Elemento de pestaña encontrado:', !!tabElement);
    console.log('Elemento de contenido encontrado:', !!tabPaneElement);
    
    // Verificar datos específicos para la pestaña de autores
    if (activeTab === 'autores') {
        const autoresTable = document.querySelector('#autores-tab-pane table');
        if (autoresTable) {
            console.log('Tabla de autores encontrada');
            const autoresRows = autoresTable.querySelectorAll('tbody tr');
            console.log('Filas en la tabla de autores:', autoresRows.length);
            
            // Mostrar información de depuración
            const debugInfo = document.querySelector('#autores-tab-pane .alert-info');
            if (debugInfo) {
                console.log('Información de depuración encontrada');
                console.log('Contenido:', debugInfo.textContent.trim());
            } else {
                console.log('No se encontró información de depuración');
            }
        } else {
            console.log('No se encontró la tabla de autores');
        }
    }
    
    // Verificar si hay mensajes de error o éxito
    const errorMessages = document.querySelectorAll('.alert-danger');
    const successMessages = document.querySelectorAll('.alert-success');
    
    if (errorMessages.length > 0) {
        console.log('Mensajes de error encontrados:', errorMessages.length);
    }
    
    if (successMessages.length > 0) {
        console.log('Mensajes de éxito encontrados:', successMessages.length);
    }
});
