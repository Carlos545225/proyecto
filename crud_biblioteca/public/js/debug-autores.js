// Script de depuración para la tabla de autores
document.addEventListener('DOMContentLoaded', function() {
    console.log('Script de depuración de autores cargado');
    
    // Verificar la pestaña activa
    const activeTab = document.querySelector('.nav-link.active');
    console.log('Pestaña activa:', activeTab ? activeTab.textContent.trim() : 'ninguna');
    
    // Verificar si la pestaña de autores está activa
    const autoresTab = document.getElementById('autores-tab');
    const autoresTabPane = document.getElementById('autores-tab-pane');
    
    console.log('Estado de pestaña autores:', {
        'existe': autoresTab ? 'sí' : 'no',
        'activa': autoresTab && autoresTab.classList.contains('active') ? 'sí' : 'no',
        'aria-selected': autoresTab ? autoresTab.getAttribute('aria-selected') : 'no disponible'
    });
    
    console.log('Estado del contenido de autores:', {
        'existe': autoresTabPane ? 'sí' : 'no',
        'visible': autoresTabPane && autoresTabPane.classList.contains('show') ? 'sí' : 'no',
        'activo': autoresTabPane && autoresTabPane.classList.contains('active') ? 'sí' : 'no'
    });
    
    // Verificar la tabla de autores
    const autoresTable = autoresTabPane ? autoresTabPane.querySelector('table') : null;
    const autoresTableBody = autoresTable ? autoresTable.querySelector('tbody') : null;
    const autoresRows = autoresTableBody ? autoresTableBody.querySelectorAll('tr') : [];
    
    console.log('Estado de la tabla de autores:', {
        'tabla existe': autoresTable ? 'sí' : 'no',
        'tbody existe': autoresTableBody ? 'sí' : 'no',
        'filas': autoresRows.length
    });
    
    // Si no hay filas, verificar si hay mensaje de "No se encontraron autores"
    if (autoresRows.length === 1) {
        const emptyMessage = autoresRows[0].textContent.trim();
        console.log('Mensaje en la única fila:', emptyMessage);
    }
    
    // Forzar la activación de la pestaña de autores si no está activa
    if (autoresTab && !autoresTab.classList.contains('active')) {
        console.log('Forzando activación de la pestaña autores');
        autoresTab.click();
    }
});
