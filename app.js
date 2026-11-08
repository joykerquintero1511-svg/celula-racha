// ==========================================
// GESTIÓN DE BASE DE DATOS LOCAL
// ==========================================

function obtenerBaseDatosLocal() {
    return JSON.parse(localStorage.getItem('celula_db_usuarios')) || [];
}

function guardarBaseDatosLocal(db) {
    localStorage.setItem('celula_db_usuarios', JSON.stringify(db));
}

function obtenerUsuarioActual() {
    return JSON.parse(localStorage.getItem('celula_sesion_activa')) || null;
}

function cerrarSesion() {
    localStorage.removeItem('celula_sesion_activa');
    window.location.href = 'login.html';
}

// --- GESTIÓN DE TAREAS DINÁMICAS ---
function obtenerTareasGlobales() {
    // Tareas por defecto si no hay ninguna creada
    let tareas = JSON.parse(localStorage.getItem('celula_tareas_globales'));
    if (!tareas) {
        tareas = [
            {
                id: 1,
                titulo: "Lectura del Libro de Juan",
                descripcion: "Lee el capítulo 15 y responde la siguiente pregunta:",
                tipo: "seleccion", // seleccion, abierta, si_no
                opciones: ["Versículo 5", "Versículo 10", "Versículo 16"],
                respuestaCorrecta: "Versículo 5",
                puntos: 20
            }
        ];
        localStorage.setItem('celula_tareas_globales', JSON.stringify(tareas));
    }
    return tareas;
}

function guardarTareasGlobales(tareas) {
    localStorage.setItem('celula_tareas_globales', JSON.stringify(tareas));
}

// --- GESTIÓN DE ANUNCIOS INFORMATIVOS ---
function obtenerAnunciosGlobales() {
    return JSON.parse(localStorage.getItem('celula_anuncios_globales')) || [
        {
            id: 1,
            titulo: "🔥 ¡Megacélula este Domingo!",
            contenido: "Prepárense todos, tendremos un tiempo especial de convivencia e invitados.",
            fecha: "2026-11-15"
        }
    ];
}

function guardarAnunciosGlobales(anuncios) {
    localStorage.setItem('celula_anuncios_globales', JSON.stringify(anuncios));
}