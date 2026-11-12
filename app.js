// ==========================================
// CONEXIÓN OFICIAL CON SUPABASE (Nube)
// ==========================================
const SUPABASE_URL = "https://iluuavczdqcnpuhvsgpn.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_WwLl-Up4qwf2qBTktuog2A_G1j7ZJhe";

// Inicializar cliente de Supabase de forma segura (sin conflicto de nombres)
let db = null;
if (window.supabase && typeof window.supabase.createClient === "function") {
    db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.error("❌ CRÍTICO: No se cargó la librería CDN de Supabase en el HTML.");
}

// ==========================================
// GESTIÓN DE SESIÓN LOCAL
// ==========================================
function obtenerUsuarioActual() {
    return JSON.parse(localStorage.getItem('celula_sesion_activa')) || null;
}

function cerrarSesion() {
    localStorage.removeItem('celula_sesion_activa');
    window.location.href = 'index.html';
}

// ==========================================
// FUNCIONES DE USUARIOS (Conectado a la Nube)
// ==========================================
async function registrarNuevoJoven(nombre, telefono) {
    if (!db) {
        alert("❌ Error técnico: La librería de Supabase no cargó en esta página. Revisa el <head> del HTML.");
        return false;
    }

    try {
        const { data, error } = await db
            .from('usuarios')
            .insert([{ 
                nombre: nombre.trim(), 
                telefono: telefono.trim(), 
                aprobado: false 
            }])
            .select();

        if (error) {
            if (error.code === '23505') {
                alert("⚠️ Este número de teléfono ya está registrado.");
            } else {
                alert("❌ Error de base de datos: " + error.message);
            }
            console.error("Detalle error insert:", error);
            return false;
        }

        alert("✅ ¡Registro exitoso! Tu cuenta está pendiente de aprobación por el líder.");
        window.location.href = 'index.html';
        return true;
    } catch (err) {
        console.error("Excepción al registrar:", err);
        alert("❌ Ocurrió un error de conexión: " + err.message);
        return false;
    }
}

async function iniciarSesion(telefono) {
    if (!db) {
        alert("❌ Error técnico: La librería de Supabase no cargó en esta página.");
        return false;
    }

    try {
        const { data, error } = await db
            .from('usuarios')
            .select('*')
            .eq('telefono', telefono.trim())
            .maybeSingle();

        if (error) {
            alert("❌ Error al consultar usuario: " + error.message);
            return false;
        }

        if (!data) {
            alert("❌ Usuario no encontrado. Por favor, regístrate primero.");
            return false;
        }

        if (!data.aprobado) {
            alert("⏳ Tu cuenta aún está pendiente de aprobación por el líder.");
            return false;
        }

        localStorage.setItem('celula_sesion_activa', JSON.stringify(data));
        window.location.href = 'panel.html';
        return true;
    } catch (err) {
        console.error("Excepción en login:", err);
        alert("❌ Error al iniciar sesión: " + err.message);
        return false;
    }
}

// ==========================================
// FUNCIONES DEL PANEL DE ADMINISTRADOR
// ==========================================
async function cargarSolicitudesNube() {
    const contenedor = document.getElementById('lista-solicitudes');
    if (!contenedor) return;

    if (!db) {
        contenedor.innerHTML = "<p style='text-align: center; color: #ff6b6b;'>❌ Error: Falta el script CDN de Supabase en admin.html.</p>";
        return;
    }

    contenedor.innerHTML = "<p style='text-align: center; color: var(--text-secondary);'>Consultando base de datos...</p>";

    try {
        const { data, error } = await db
            .from('usuarios')
            .select('*')
            .order('id', { ascending: false });

        if (error) {
            contenedor.innerHTML = `<p style='text-align: center; color: #ff6b6b;'>❌ Error Supabase: ${error.message}</p>`;
            console.error("Error consultando usuarios:", error);
            return;
        }

        if (!data || data.length === 0) {
            contenedor.innerHTML = "<p style='text-align: center; color: var(--text-secondary);'>No hay jóvenes registrados todavía.</p>";
            return;
        }

        contenedor.innerHTML = "";
        data.forEach((user) => {
            const card = document.createElement('div');
            card.className = "tarea-card";
            card.innerHTML = `
                <div class="tarea-header">
                    <h3>${user.nombre}</h3>
                    <span class="badge ${user.aprobado ? 'memorizar' : 'lectura'}">
                        ${user.aprobado ? '✅ Aprobado' : '⏳ Pendiente'}
                    </span>
                </div>
                <p>📱 Teléfono: ${user.telefono} | 🔥 Racha: ${user.racha_actual || 0} semanas</p>
                ${!user.aprobado 
                    ? `<button class="btn btn-primary" style="padding: 8px; font-size: 0.85rem; margin-top: 8px;" onclick="cambiarEstadoUsuario(${user.id}, true)">Aprobar Acceso</button>` 
                    : `<button class="btn btn-secondary" style="padding: 8px; font-size: 0.85rem; margin-top: 8px;" onclick="cambiarEstadoUsuario(${user.id}, false)">Desactivar</button>`}
            `;
            contenedor.appendChild(card);
        });
    } catch (err) {
        contenedor.innerHTML = `<p style='text-align: center; color: #ff6b6b;'>❌ Error de red: ${err.message}</p>`;
        console.error("Excepción en cargarSolicitudesNube:", err);
    }
}

async function cambiarEstadoUsuario(idUsuario, nuevoEstado) {
    if (!db) return;

    try {
        const { error } = await db
            .from('usuarios')
            .update({ aprobado: nuevoEstado })
            .eq('id', idUsuario);

        if (error) {
            alert("❌ Error al actualizar estado: " + error.message);
        } else {
            cargarSolicitudesNube();
        }
    } catch (err) {
        alert("❌ Error de conexión al actualizar: " + err.message);
    }
}

// ==========================================
// ELIMINAR JOVEN / USUARIO (Panel Admin)
// ==========================================
async function eliminarUsuarioNube(idUsuario, nombreUsuario) {
    if (!db) return;

    // Confirmación para evitar accidentes
    let confirmar = confirm(`⚠️ ¿Estás seguro de que deseas eliminar permanentemente a "${nombreUsuario}" de la base de datos?`);
    if (!confirmar) return;

    try {
        const { error } = await db
            .from('usuarios')
            .delete()
            .eq('id', idUsuario);

        if (error) {
            alert("❌ Error al eliminar usuario: " + error.message);
        } else {
            alert("🗑️ Usuario eliminado correctamente.");
            cargarSolicitudesNube(); // Recarga la lista al instante
        }
    } catch (err) {
        console.error("Excepción al eliminar:", err);
        alert("❌ Error de conexión al intentar eliminar.");
    }
}

// ==========================================
// FUNCIONES DE TAREAS Y ANUNCIOS EN LA NUBE
// ==========================================
async function obtenerTareasGlobales() {
    if (!db) return [];
    const { data, error } = await db.from('tareas').select('*');
    if (error || !data || data.length === 0) {
        return [
            {
                id: 1,
                titulo: "Lectura del Libro de Juan",
                descripcion: "Lee el capítulo 15 y responde la pregunta:",
                tipo: "seleccion",
                opciones: ["Versículo 5", "Versículo 10", "Versículo 16"],
                respuesta_correcta: "Versículo 5",
                puntos: 20
            }
        ];
    }
    return data;
}

async function obtenerAnunciosGlobales() {
    if (!db) return [];
    const { data, error } = await db.from('anuncios').select('*');
    if (error || !data || data.length === 0) {
        return [
            {
                id: 1,
                titulo: "🔥 ¡Megacélula este Domingo!",
                contenido: "Prepárense todos, tendremos un tiempo especial de convivencia.",
                fecha: "2026-11-15"
            }
        ];
    }
    return data;
}
// ==========================================
// REGISTRAR ASISTENCIA DESDE EL ESCÁNER QR
// ==========================================
async function registrarAsistenciaQR() {
    let usuario = obtenerUsuarioActual();
    if (!usuario) {
        alert("⚠️ Debes iniciar sesión antes de escanear tu asistencia.");
        window.location.href = 'index.html';
        return;
    }

    if (!db) {
        alert("❌ Error de conexión con la base de datos.");
        return;
    }

    try {
        // Incrementamos la racha y puntos del usuario
        let nuevaRacha = (usuario.racha_actual || 0) + 1;
        let nuevosPuntos = (usuario.puntos || 0) + 50; // 50 puntos por asistencia

        const { error } = await db
            .from('usuarios')
            .update({ 
                racha_actual: nuevaRacha,
                puntos: nuevosPuntos
            })
            .eq('id', usuario.id);

        if (error) {
            alert("❌ Error al registrar asistencia: " + error.message);
        } else {
            // Actualizamos la sesión local
            usuario.racha_actual = nuevaRacha;
            usuario.puntos = nuevosPuntos;
            localStorage.setItem('celula_sesion_activa', JSON.stringify(usuario));

            alert(`🔥 ¡Asistencia registrada con éxito! Racha actual: ${nuevaRacha} semanas. ¡Ganaste +50 puntos! ⭐`);
            window.location.href = 'panel.html';
        }
    } catch (err) {
        console.error("Excepción al registrar asistencia:", err);
        alert("❌ Ocurrió un error inesperado.");
    }
}