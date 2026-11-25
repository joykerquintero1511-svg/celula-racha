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
            .order('puntos', { ascending: false });

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
                <p style="margin: 4px 0;">📱 Teléfono: ${user.telefono} | 🔥 Racha: ${user.racha_actual || 0} semanas</p>
                <p style="margin: 6px 0; font-size: 0.75rem; font-weight: bold; color: #f8c008;">⭐ Puntos acumulados: ${user.puntos || 0} pts</p>
                
                <div style="display: flex; gap: 8px; margin-top: 10px;">
                    ${!user.aprobado 
                        ? `<button class="btn btn-primary" style="padding: 8px; font-size: 0.85rem; flex: 1;" onclick="cambiarEstadoUsuario(${user.id}, true)">Aprobar Acceso</button>` 
                        : `<button class="btn btn-secondary" style="padding: 8px; font-size: 0.85rem; flex: 1;" onclick="cambiarEstadoUsuario(${user.id}, false)">Desactivar</button>`}
                    
                    <button class="btn btn-secondary" style="padding: 8px; font-size: 0.85rem; background: #c0392b; color: white;" onclick="eliminarUsuarioNube(${user.id}, '${user.nombre}')">🗑️ Eliminar</button>
                </div>
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
            cargarSolicitudesNube();
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
    const { data, error } = await db.from('tareas').select('*').order('id', { ascending: false });
    if (error || !data) return [];
    return data;
}

async function obtenerAnunciosGlobales() {
    if (!db) return [];
    const { data, error } = await db.from('anuncios').select('*').order('id', { ascending: false });
    if (error || !data) return [];
    return data;
}

// ==========================================
// REGISTRAR ASISTENCIA DESDE EL ESCÁNER QR (Con Bloqueo Diario)
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
        const hoy = new Date().toISOString().split('T')[0];

        // Consultamos el estado actual del usuario directamente en Supabase para evitar desfases
        const { data: usuarioActualizado, error: errorConsulta } = await db
            .from('usuarios')
            .select('*')
            .eq('id', usuario.id)
            .single();

        if (errorConsulta || !usuarioActualizado) {
            alert("❌ No se pudo verificar tu usuario en la base de datos.");
            return;
        }

        // 2. VERIFICACIÓN: Evitar doble escaneo el mismo día
        if (usuarioActualizado.ultima_asistencia === hoy) {
            alert("⚠️ ¡Ya has escaneado tu asistencia el día de hoy! Vuelve en la próxima reunión.");
            window.location.href = 'panel.html';
            return;
        }

        // 3. Calculamos los nuevos valores sumando 1 sola vez
        let nuevaRacha = (usuarioActualizado.racha_actual || 0) + 1;
        let nuevosPuntos = (usuarioActualizado.puntos || 0) + 50; // 50 puntos por asistencia

        // 4. Actualizamos en Supabase guardando la fecha actual en 'ultima_asistencia'
        const { error: errorUpdate } = await db
            .from('usuarios')
            .update({ 
                racha_actual: nuevaRacha,
                puntos: nuevosPuntos,
                ultima_asistencia: hoy
            })
            .eq('id', usuario.id);

        if (errorUpdate) {
            alert("❌ Error al registrar asistencia: " + errorUpdate.message);
        } else {
            // 5. Creamos el objeto fresco con los datos ya sumados
            let usuarioFrescoalStorage = {
                ...usuarioActualizado,
                racha_actual: nuevaRacha,
                puntos: nuevosPuntos,
                ultima_asistencia: hoy
            };

            // 6. Guardamos en el localStorage para que el panel principal los lea al instante
            localStorage.setItem('celula_sesion_activa', JSON.stringify(usuarioFrescoalStorage));

            alert(`🔥 ¡Asistencia registrada con éxito! Racha actual: ${nuevaRacha} semanas. ¡Ganaste +50 puntos! ⭐`);
            window.location.href = 'panel.html';
        }
    } catch (err) {
        console.error("Excepción al registrar asistencia:", err);
        alert("❌ Ocurrió un error inesperado al procesar la asistencia.");
    }
}

// ==========================================
// GESTIÓN DE TIENDA Y CANJES (PANEL ADMIN)
// ==========================================
async function cargarGestionPremiosAdmin() {
    const contPremios = document.getElementById('admin-lista-premios');
    const contCanjes = document.getElementById('admin-lista-canjes');
    if (!contPremios || !db) return;

    const { data: premios, error } = await db
        .from('premios')
        .select('*')
        .order('costo_puntos', { ascending: true });

    if (error) {
        contPremios.innerHTML = `<p style="color: #ff6b6b;">❌ Error: ${error.message}</p>`;
    } else if (!premios || premios.length === 0) {
        contPremios.innerHTML = "<p style='color: var(--text-secondary); text-align: center;'>No hay premios creados todavía.</p>";
    } else {
        contPremios.innerHTML = "";
        premios.forEach(p => {
            const card = document.createElement('div');
            card.className = "tarea-card";
            card.innerHTML = `
                <div class="tarea-header">
                    <h4 style="margin: 0;">${p.icono || '🎁'} ${p.nombre}</h4>
                    <span class="badge memorizar" style="background: rgba(248, 201, 7, 0.2); color: #f8c907;">${p.costo_puntos} pts</span>
                </div>
                <p style="margin: 6px 0; font-size: 0.85rem; color: var(--text-secondary);">${p.descripcion || 'Sin descripción'}</p>
                <div style="display: flex; gap: 8px; margin-top: 10px;">
                    <button class="btn btn-secondary" style="padding: 6px 10px; font-size: 0.82rem; flex: 1;" 
                        onclick="prepararEdicionPremio(${p.id}, '${p.nombre.replace(/'/g, "\\'")}', '${(p.descripcion || '').replace(/'/g, "\\'")}', ${p.costo_puntos}, '${p.icono || '🎁'}')">
                        ✏️ Editar
                    </button>
                    <button class="btn btn-secondary" style="padding: 6px 10px; font-size: 0.82rem; background: #c0392b; color: white;" 
                        onclick="eliminarPremioAdmin(${p.id}, '${p.nombre.replace(/'/g, "\\'")}')">
                        🗑️ Eliminar
                    </button>
                </div>
            `;
            contPremios.appendChild(card);
        });
    }

    if (!contCanjes) return;
    const { data: canjes } = await db
        .from('canjes')
        .select('*')
        .order('id', { ascending: false });

    if (!canjes || canjes.length === 0) {
        contCanjes.innerHTML = "<p style='color: var(--text-secondary); text-align: center; font-size: 0.85rem;'>Nadie ha canjeado premios aún.</p>";
        return;
    }

    contCanjes.innerHTML = "";
    canjes.forEach(c => {
        const fechaFormat = new Date(c.fecha).toLocaleDateString('es-VE');
        const card = document.createElement('div');
        card.className = "tarea-card";
        card.style.borderLeft = c.entregado ? "4px solid #27ae60" : "4px solid #f39c12";
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                <div>
                    <strong style="font-size: 0.95rem;">👤 ${c.usuario_nombre}</strong>
                    <div style="font-size: 0.85rem; color: #f8c907; margin-top: 2px;">🎁 ${c.premio_nombre} (${c.puntos_gastados} pts)</div>
                    <small style="color: var(--text-secondary); font-size: 0.75rem;">📅 ${fechaFormat}</small>
                </div>
                ${!c.entregado 
                    ? `<button class="btn btn-primary" style="padding: 6px 12px; font-size: 0.8rem; width: auto;" onclick="marcarCanjeEntregado(${c.id})">✅ Entregar</button>`
                    : `<span class="badge memorizar" style="font-size: 0.75rem;">Entregado</span>`}
            </div>
        `;
        contCanjes.appendChild(card);
    });
}

async function guardarPremioAdmin() {
    if (!db) return;
    const idEditando = document.getElementById('premio-edit-id').value;
    const icono = document.getElementById('premio-icono').value.trim() || '🎁';
    const nombre = document.getElementById('premio-nombre').value.trim();
    const descripcion = document.getElementById('premio-desc').value.trim();
    const costo = parseInt(document.getElementById('premio-costo').value);

    if (!nombre || isNaN(costo) || costo <= 0) {
        alert("⚠️ Ingresa un nombre válido y un costo mayor a 0 puntos.");
        return;
    }

    if (idEditando) {
        const { error } = await db
            .from('premios')
            .update({ icono, nombre, descripcion, costo_puntos: costo })
            .eq('id', idEditando);

        if (error) {
            alert("❌ Error al actualizar premio: " + error.message);
            return;
        }
        alert("✅ Premio actualizado correctamente.");
    } else {
        const { error } = await db
            .from('premios')
            .insert([{ icono, nombre, descripcion, costo_puntos: costo, disponible: true }]);

        if (error) {
            alert("❌ Error al crear premio: " + error.message);
            return;
        }
        alert("✅ Nuevo premio agregado a la tienda.");
    }

    cancelarEdicionPremio();
    cargarGestionPremiosAdmin();
}

function prepararEdicionPremio(id, nombre, descripcion, costo, icono) {
    document.getElementById('premio-edit-id').value = id;
    document.getElementById('premio-icono').value = icono;
    document.getElementById('premio-nombre').value = nombre;
    document.getElementById('premio-desc').value = descripcion;
    document.getElementById('premio-costo').value = costo;

    document.getElementById('titulo-form-premio').innerText = "✏️ Editando Premio";
    document.getElementById('btn-guardar-premio').innerText = "💾 Guardar Cambios";
    document.getElementById('btn-cancelar-premio').style.display = "inline-block";
    document.getElementById('sec-premios').scrollIntoView({ behavior: 'smooth' });
}

function cancelarEdicionPremio() {
    document.getElementById('premio-edit-id').value = "";
    document.getElementById('premio-icono').value = "🎁";
    document.getElementById('premio-nombre').value = "";
    document.getElementById('premio-desc').value = "";
    document.getElementById('premio-costo').value = "";

    document.getElementById('titulo-form-premio').innerText = "➕ Agregar Nuevo Premio";
    document.getElementById('btn-guardar-premio').innerText = "Guardar Premio en Tienda";
    document.getElementById('btn-cancelar-premio').style.display = "none";
}

async function eliminarPremioAdmin(id, nombre) {
    if (!db) return;
    if (!confirm(`⚠️ ¿Seguro que deseas eliminar "${nombre}" de la tienda?`)) return;

    const { error } = await db.from('premios').delete().eq('id', id);
    if (error) {
        alert("❌ Error al eliminar: " + error.message);
    } else {
        alert("🗑️ Premio eliminado.");
        cargarGestionPremiosAdmin();
    }
}

async function marcarCanjeEntregado(canjeId) {
    if (!db) return;
    const { error } = await db
        .from('canjes')
        .update({ entregado: true })
        .eq('id', canjeId);

    if (!error) {
        cargarGestionPremiosAdmin();
    }
}