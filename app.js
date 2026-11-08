// Obtener datos del usuario desde el navegador (simulando base de datos local)
function obtenerDatosUsuario() {
    let usuario = JSON.parse(localStorage.getItem('celula_usuario'));
    if (!usuario) {
        usuario = {
            nombre: "Joven de Célula",
            rachaActual: 0,
            rachaMaxima: 0,
            ultimaAsistencia: null,
            escudos: 1
        };
        guardarDatosUsuario(usuario);
    }
    return usuario;
}

function guardarDatosUsuario(usuario) {
    localStorage.setItem('celula_usuario', JSON.stringify(usuario));
}

// Función que se ejecuta al escanear con éxito el QR del jueves
function registrarAsistenciaQR() {
    let usuario = obtenerDatosUsuario();
    let hoy = new Date();
    let fechaHoyStr = hoy.toISOString().split('T')[0]; // YYYY-MM-DD

    if (usuario.ultimaAsistencia === fechaHoyStr) {
        alert("¡Ey! Ya registraste tu asistencia el día de hoy. ¡Nos vemos en la próxima célula!");
        return;
    }

    if (usuario.ultimaAsistencia) {
        let ultima = new Date(usuario.ultimaAsistencia);
        let diferenciaDias = Math.floor((hoy - ultima) / (1000 * 60 * 60 * 24));

        if (diferenciaDias <= 8) {
            // Vino en la semana consecutiva (aprox 7 días)
            usuario.rachaActual += 1;
        } else if (diferenciaDias <= 15) {
            // Faltó a una célula (tolerancia de 1 semana, la racha se congela o mantiene)
            alert("⚠️ ¡Cuidado! Faltaste a la célula pasada. Tu racha se mantuvo, ¡pero no faltes a la próxima o la perderás!");
        } else {
            // Faltó a 2 o más células seguidas (más de 14-15 días)
            if (usuario.escudos > 0) {
                usuario.escudos -= 1;
                alert("🛡️ ¡Tu escudo de racha te salvó! Aunque tenías más de dos semanas ausente, conservas tu racha.");
            } else {
                alert("❌ Han pasado más de 2 semanas sin registrarte. Tu racha se ha reiniciado a 1.");
                usuario.rachaActual = 1;
            }
        }
    } else {
        // Primera vez absoluta
        usuario.rachaActual = 1;
    }

    // Actualizar última fecha y racha máxima
    usuario.ultimaAsistencia = fechaHoyStr;
    if (usuario.rachaActual > usuario.rachaMaxima) {
        usuario.rachaMaxima = usuario.rachaActual;
    }

    guardarDatosUsuario(usuario);
    window.location.href = "index.html"; // Redirigir al inicio
}