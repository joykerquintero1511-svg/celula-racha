// ==========================================
// CONEXIÓN OFICIAL CON SUPABASE (Nube)
// ==========================================
const SUPABASE_URL = "https://iluuavczdqcnpuhvsgpn.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_WwLl-Up4qwf2qBTktuog2A_G1j7ZJhe"; // Pega aquí la clave larga que dice "anon" o "public" en Supabase (Settings > API)

// Inicializar cliente de Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Obtener usuario guardado en este dispositivo (sesión local)
function obtenerUsuarioActual() {
    return JSON.parse(localStorage.getItem('celula_sesion_activa')) || null;
}

function cerrarSesion() {
    localStorage.removeItem('celula_sesion_activa');
    window.location.href = 'login.html';
}

// ==========================================
// FUNCIONES DE USUARIOS (Conectado a la Nube)
// ==========================================

async function registrarNuevoJoven(nombre, telefono) {
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .insert([{ nombre: nombre, telefono: telefono, aprobado: false }]);

        if (error) {
            if (error.code === '23505') {
                alert("⚠️ Este número de teléfono ya está registrado.");
            } else {
                alert("Error al registrarse: " + error.message);
            }
            return false;
        }

        alert("¡Registro exitoso! Tu cuenta está pendiente de aprobación por el líder.");
        window.location.href = 'login.html';
        return true;
    } catch (err) {
        console.error(err);
        alert("Ocurrió un error de conexión.");
        return false;
    }
}

async function iniciarSesion(telefono) {
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('telefono', telefono)
            .single();

        if (error || !data) {
            alert("❌ Usuario no encontrado. Por favor, regístrate primero.");
            return false;
        }

        if (!data.aprobado) {
            alert("⏳ Tu cuenta aún está pendiente de aprobación por el líder.");
            return false;
        }

        // Guardar sesión activa localmente en este teléfono
        localStorage.setItem('celula_sesion_activa', JSON.stringify(data));
        window.location.href = 'index.html';
        return true;
    } catch (err) {
        console.error(err);
        alert("Error al iniciar sesión.");
        return false;
    }
}

// ==========================================
// FUNCIONES DE TAREAS Y ANUNCIOS EN LA NUBE
// ==========================================

async function obtenerTareasGlobales() {
    const { data, error } = await supabase.from('tareas').select('*');
    if (error || !data || data.length === 0) {
        // Tarea por defecto si está vacío
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
    const { data, error } = await supabase.from('anuncios').select('*');
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