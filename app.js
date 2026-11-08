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

// --- REGISTRO DE NUEVOS JÓVENES ---
function registrarNuevoJoven(nombre, telefono) {
    let db = obtenerBaseDatosLocal();
    
    // Validar si el teléfono ya está registrado
    let existe = db.find(u => u.telefono === telefono);
    if (existe) {
        alert("⚠️ Este número de teléfono ya está registrado.");
        return false;
    }

    let nuevoUsuario = {
        id: Date.now(),
        nombre: nombre,
        telefono: telefono,
        rachaActual: 0,
        rachaMaxima: 0,
        ultimaAsistencia: null,
        escudos: 1,
        puntos: 0,
        tareasCompletadas: [],
        aprobado: false // Pendiente de aprobación por el líder
    };

    db.push(nuevoUsuario);
    guardarBaseDatosLocal(db);
    alert("¡Registro exitoso! Tu cuenta está pendiente de aprobación por el líder de la célula.");
    window.location.href = 'login.html';
    return true;
}

// --- INICIO DE SESIÓN ---
function iniciarSesion(telefono) {
    let db = obtenerBaseDatosLocal();
    let usuario = db.find(u => u.telefono === telefono);

    if (!usuario) {
        alert("❌ Usuario no encontrado. Por favor, regístrate primero.");
        return false;
    }

    if (!usuario.aprobado) {
        alert("⏳ Tu cuenta aún está pendiente de aprobación por el líder.");
        return false;
    }

    localStorage.setItem('celula_sesion_activa', JSON.stringify(usuario));
    window.location.href = 'index.html';
    return true;
}

// --- GESTIÓN DE TAREAS DINÁMICAS ---
function obtenerTareasGlobales() {
    let tareas = JSON.parse(localStorage.getItem('celula_tareas_globales'));
    if (!tareas) {
        tareas = [
            {
                id: 1,
                titulo: "Lectura del Libro de Juan",
                descripcion: "Lee el capítulo 15 y responde la siguiente pregunta:",
                tipo: "seleccion",
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