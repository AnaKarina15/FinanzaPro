import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { collection, addDoc, getDocs, doc, getDoc, deleteDoc, updateDoc, query, where } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { initNotificaciones } from "./notificaciones.js";

let currentUid = null;

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUid = user.uid;
        // Actualizar sidebar desde Firestore
        try {
            const userDoc = await getDoc(doc(db, "usuarios", user.uid));
            if (userDoc.exists()) {
                const d = userDoc.data();
                const nombre = `${d.nombre || ''} ${d.apellido || ''}`.trim();
                const sideName = document.querySelector(".nav-profile .username");
                if (sideName) sideName.textContent = nombre;
                const avatarImg = document.querySelector(".nav-profile img");
                if (avatarImg) avatarImg.src = d.fotoPerfil || `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=059669&color=fff`;
            }
        } catch(e) { console.error(e); }
        initNotificaciones(user.uid);
        cargarDatos();
    } else {
        window.location.href = '../index.php';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const kebabBtns = document.querySelectorAll('.kebab-btn');
    
    // Toggle dropdown
    kebabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const dropdown = btn.nextElementSibling;
            document.querySelectorAll('.kebab-dropdown.show').forEach(menu => {
                if(menu !== dropdown) menu.classList.remove('show');
            });
            dropdown.classList.toggle('show');
        });
    });
    
    document.addEventListener('click', () => {
        document.querySelectorAll('.kebab-dropdown.show').forEach(menu => {
            menu.classList.remove('show');
        });
    });

    document.querySelectorAll('.kebab-dropdown').forEach(menu => {
        menu.addEventListener('click', (e) => e.stopPropagation());
    });

    // Lógica para toggle de Mensual / Anual
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            toggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // --- LÓGICA DE MODALES ---
    const modalNuevaMeta = document.getElementById('modalNuevaMeta');
    const modalNuevoPresupuesto = document.getElementById('modalNuevoPresupuesto');
    
    const btnCerrarMeta = document.getElementById('btn-cerrar-meta');
    const btnCerrarPresupuesto = document.getElementById('btn-cerrar-presupuesto');

    document.addEventListener('click', (e) => {
        const btnMeta = e.target.closest('#btn-nueva-meta');
        const btnPresupuesto = e.target.closest('#btn-nuevo-presupuesto');

        if (btnMeta) {
            const form = document.getElementById('form-meta');
            if (form) {
                form.reset();
                form.querySelector('input[name="id_meta"]').value = "";
                form.querySelectorAll('.icon-option').forEach(l => l.classList.remove('active'));
                const firstIcon = form.querySelector('.icon-option');
                if (firstIcon) {
                    firstIcon.classList.add('active');
                    firstIcon.querySelector('input').checked = true;
                }
            }
            document.getElementById('modal-titulo-meta').innerText = "Nueva Meta de Ahorro";
            document.getElementById('btn-submit-meta').innerText = "Crear Meta";
            modalNuevaMeta.classList.add('active');
        }
        if (btnPresupuesto) {
            const form = document.getElementById('form-presupuesto');
            if (form) {
                form.reset();
                form.querySelector('input[name="id_presupuesto"]').value = "";
                form.querySelectorAll('.icon-option').forEach(l => l.classList.remove('active'));
                const firstIcon = form.querySelector('.icon-option');
                if (firstIcon) {
                    firstIcon.classList.add('active');
                    firstIcon.querySelector('input').checked = true;
                }
            }
            document.getElementById('modal-titulo-presupuesto').innerText = "Nuevo Presupuesto";
            document.getElementById('text-submit-presupuesto').innerText = "Asignar Presupuesto";
            modalNuevoPresupuesto.classList.add('active');
        }
    });

    const closeMetaModal = () => modalNuevaMeta.classList.remove('active');
    const closePresupuestoModal = () => modalNuevoPresupuesto.classList.remove('active');

    if(btnCerrarMeta) btnCerrarMeta.addEventListener('click', closeMetaModal);
    if(btnCerrarPresupuesto) btnCerrarPresupuesto.addEventListener('click', closePresupuestoModal);

    // Selección de Íconos
    const iconOptions = document.querySelectorAll('.icon-option');
    iconOptions.forEach(option => {
        option.addEventListener('click', function() {
            iconOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            const radio = this.querySelector('input[type="radio"]');
            if(radio) radio.checked = true;
        });
    });

    // Mapeo de IDs de iconos a nombres de material symbols
    const iconMap = {
        '3': 'home', '2': 'directions_car', '11': 'flight', '12': 'laptop_mac', '5': 'school', '13': 'favorite',
        '1': 'restaurant', '4': 'shopping_bag', '6': 'local_hospital', '7': 'bolt', '8': 'sports_esports', '9': 'checkroom',
        '14': 'directions_bus'
    };

    // --- MANEJO DE FORMULARIOS POR FIREBASE ---
    const formMeta = document.getElementById('form-meta');
    if(formMeta) {
        formMeta.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentUid) return;

            const btnSubmit = document.getElementById('btn-submit-meta');
            btnSubmit.disabled = true;
            btnSubmit.innerText = "Guardando...";

            const id_meta = formMeta.querySelector('input[name="id_meta"]').value;
            const nombre = formMeta.querySelector('input[name="nombre"]').value;
            const fecha_limite = formMeta.querySelector('input[name="fecha_limite"]').value;
            const inputObj = formMeta.querySelector('input[name="monto_objetivo"]');
            const monto_objetivo = parseFloat(inputObj.value.replace(/,/g, ''));
            const id_icono = formMeta.querySelector('input[name="id_icono"]:checked')?.value || '3';
            const codigo_material = iconMap[id_icono] || 'stars';

            try {
                if (id_meta) {
                    const metaRef = doc(db, "metas", id_meta);
                    await updateDoc(metaRef, {
                        nombre, monto_objetivo, fecha_limite, id_icono, codigo_material
                    });
                    Swal.fire('¡Éxito!', 'Meta actualizada', 'success');
                } else {
                    const mesActual = new Date().toISOString().substring(0, 7);
                    await addDoc(collection(db, "metas"), {
                        id_usuario: currentUid,
                        nombre,
                        monto_objetivo,
                        fecha_limite,
                        id_icono,
                        codigo_material,
                        monto_actual: 0,
                        historial: { [mesActual]: 0 }
                    });
                    Swal.fire('¡Éxito!', 'Meta guardada', 'success');
                }
                closeMetaModal();
                formMeta.reset();
                cargarDatos();
            } catch (error) {
                console.error("Error guardando meta:", error);
                Swal.fire('Error', 'Ocurrió un error guardando', 'error');
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.innerText = "Crear Meta";
            }
        });
    }

    const radiosPeriodo = document.querySelectorAll('input[name="tipo_periodo"]');
    const inputPeriodo = document.getElementById('periodo_presupuesto');
    const labelPeriodo = document.getElementById('label_periodo_presupuesto');
    if (radiosPeriodo.length && inputPeriodo) {
        radiosPeriodo.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.value === 'mensual') {
                    labelPeriodo.innerText = 'Mes';
                    inputPeriodo.type = 'month';
                } else {
                    labelPeriodo.innerText = 'Año';
                    inputPeriodo.type = 'number';
                    inputPeriodo.min = "2020";
                    inputPeriodo.max = "2100";
                    inputPeriodo.value = new Date().getFullYear();
                }
            });
        });
    }

    const formPresupuesto = document.getElementById('form-presupuesto');
    if(formPresupuesto) {
        formPresupuesto.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentUid) return;

            const btnSubmit = document.getElementById('btn-submit-presupuesto');
            btnSubmit.disabled = true;

            const id_presupuesto = formPresupuesto.querySelector('input[name="id_presupuesto"]').value;
            const nombre = formPresupuesto.querySelector('input[name="nombre"]').value;
            const inputLim = formPresupuesto.querySelector('input[name="monto_limite"]');
            const monto_limite = parseFloat(inputLim.value.replace(/,/g, ''));
            const id_icono = formPresupuesto.querySelector('input[name="id_icono"]:checked')?.value || '1';
            const codigo_material = iconMap[id_icono] || 'category';
            const alerta_80_porciento = formPresupuesto.querySelector('input[name="alerta_80_porciento"]').checked ? 1 : 0;
            const tipo_periodo = formPresupuesto.querySelector('input[name="tipo_periodo"]:checked').value;
            const periodo = formPresupuesto.querySelector('input[name="periodo"]').value;

            try {
                if (id_presupuesto) {
                    const presRef = doc(db, "presupuestos", id_presupuesto);
                    await updateDoc(presRef, {
                        nombre, monto_limite, id_icono, codigo_material, alerta_80_porciento, tipo_periodo, periodo
                    });
                    Swal.fire('¡Éxito!', 'Presupuesto actualizado', 'success');
                } else {
                    await addDoc(collection(db, "presupuestos"), {
                        id_usuario: currentUid,
                        nombre,
                        monto_limite,
                        id_icono,
                        codigo_material,
                        alerta_80_porciento,
                        tipo_periodo,
                        periodo
                    });
                    Swal.fire('¡Éxito!', 'Presupuesto asignado', 'success');
                }
                closePresupuestoModal();
                formPresupuesto.reset();
                cargarDatos();
            } catch (error) {
                console.error("Error guardando presupuesto:", error);
                Swal.fire('Error', 'Ocurrió un error guardando', 'error');
            } finally {
                btnSubmit.disabled = false;
            }
        });
    }

    // Formatear inputs de dinero al escribir
    const moneyInputs = document.querySelectorAll('input[name="monto_limite"], input[name="monto_objetivo"]');
    moneyInputs.forEach(input => {
        input.type = 'text';
        input.inputMode = 'numeric';
        input.addEventListener('input', function(e) {
            let value = this.value.replace(/[^0-9]/g, '');
            if(value) {
                value = parseInt(value, 10);
                this.value = new Intl.NumberFormat('en-US').format(value);
            } else {
                this.value = '';
            }
        });
    });
});

// --- CARGA DE DATOS ---
window.metasGlobales = [];
window.presupuestosGlobales = [];
window.verTodasMetas = false;
window.verTodosPresupuestos = false;
window.filtroPresupuesto = 'mensual';
window.filtroMeta = 'todas';

async function cargarDatos() {
    if (!currentUid) return;
    try {
        const qTrans = query(collection(db, "transacciones"), where("usuario_id", "==", currentUid));
        const snapshotTrans = await getDocs(qTrans);
        const transacciones = snapshotTrans.docs.map(doc => doc.data());

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const currentMonthFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const currentYearString = String(now.getFullYear());

        const qMetas = query(collection(db, "metas"), where("id_usuario", "==", currentUid));
        const snapshotMetas = await getDocs(qMetas);
        window.metasGlobales = snapshotMetas.docs.map(doc => ({ id_meta: doc.id, ...doc.data() }));

        const qPresupuestos = query(collection(db, "presupuestos"), where("id_usuario", "==", currentUid));
        const snapshotPresupuestos = await getDocs(qPresupuestos);
        window.presupuestosGlobales = snapshotPresupuestos.docs.map(doc => {
            const p = doc.data();
            p.id_presupuesto = doc.id;
            
            // Retrocompatibilidad
            if (!p.tipo_periodo) {
                p.tipo_periodo = 'mensual';
                p.periodo = currentMonthFormatted;
            }
            
            let consumido = 0;
            transacciones.forEach(t => {
                if (t.tipo === 'gasto' && t.categoria === p.nombre) {
                    const tMonth = t.fecha.substring(0, 7); // YYYY-MM
                    const tYear = t.fecha.substring(0, 4);  // YYYY
                    
                    if (p.tipo_periodo === 'mensual' && tMonth === p.periodo) {
                        consumido += parseFloat(t.monto);
                    } else if (p.tipo_periodo === 'anual' && tYear === p.periodo) {
                        consumido += parseFloat(t.monto);
                    }
                }
            });
            p.monto_consumido = consumido;
            return p;
        });

        renderMetas(window.metasGlobales);
        renderPresupuestos(window.presupuestosGlobales);
    } catch (error) {
        console.error("Error cargando datos de Firestore:", error);
    }
}

function renderMetas(metas) {
    const grid = document.getElementById('grid-metas');
    const btnNuevo = document.getElementById('btn-nueva-meta');
    grid.innerHTML = '';
    
    const now = new Date();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentYear = String(now.getFullYear());

    let metasFiltradas = metas.filter(m => {
        if (window.filtroMeta === 'todas') return true;
        if (!m.fecha_limite) return true; // Retrocompatibilidad
        const mYear = m.fecha_limite.substring(0, 4);
        const mMonth = m.fecha_limite.substring(5, 7);
        
        if (window.filtroMeta === 'mensual') {
            return mYear === currentYear && mMonth === currentMonth;
        } else if (window.filtroMeta === 'anual') {
            return mYear === currentYear;
        }
        return true;
    });

    let metasAMostrar = metasFiltradas;
    if (!window.verTodasMetas && metasFiltradas.length > 3) {
        metasAMostrar = metasFiltradas.slice(0, 3);
    }
    
    metasAMostrar.forEach(meta => {
        const obj = parseFloat(meta.monto_objetivo) || 0;
        const act = parseFloat(meta.monto_actual) || 0;
        let porcentajeNumerico = obj > 0 ? (act / obj) * 100 : 0;
        let porcentajeMostrar = porcentajeNumerico > 0 && porcentajeNumerico < 1 ? porcentajeNumerico.toFixed(1) : Math.round(porcentajeNumerico);
        if (porcentajeNumerico >= 100) porcentajeMostrar = 100;
        let widthBarra = porcentajeNumerico > 0 && porcentajeNumerico < 2 ? 2 : Math.min(100, porcentajeNumerico);
        
        const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
        
        const card = document.createElement('article');
        card.className = 'card goal-card cursor-pointer';
        card.setAttribute('onclick', `abrirModalAbonoMeta('${meta.id_meta}', '${meta.nombre.replace(/'/g, "\\'")}', event)`);
        card.innerHTML = `
            <div class="goal-header">
              <div class="icon-box icon-blue" style="background-color: #e0f2fe; color: #0284c7;">
                <span class="material-symbols-outlined">${meta.codigo_material || 'stars'}</span>
              </div>
              <div class="goal-percentage text-success">${porcentajeMostrar}%</div>
              <div class="kebab-menu">
                <button class="kebab-btn" onclick="toggleKebab(this, event)"><span class="material-symbols-outlined">more_vert</span></button>
                <div class="kebab-dropdown">
                  <button class="dropdown-item" onclick="editarMeta('${meta.id_meta}')">Editar</button>
                  <button class="dropdown-item dropdown-danger" onclick="eliminarMeta('${meta.id_meta}')">Eliminar</button>
                </div>
              </div>
            </div>
            <div class="goal-body">
              <h4 class="goal-name">${meta.nombre}</h4>
              <p class="goal-desc">Meta para ${meta.fecha_limite}</p>
            </div>
            <div class="goal-footer">
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" style="width: ${widthBarra}%;"></div>
              </div>
              <div class="goal-amounts">
                <span>${formatter.format(act)}</span>
                <span>${formatter.format(obj)}</span>
              </div>
            </div>
        `;
        grid.appendChild(card);
    });
    grid.appendChild(btnNuevo);
    
    const btnVerTodas = document.getElementById('btn-ver-todas-metas');
    if (btnVerTodas) {
        if (metasFiltradas.length <= 3) {
            btnVerTodas.style.display = 'none';
        } else {
            btnVerTodas.style.display = 'inline-block';
            btnVerTodas.innerText = window.verTodasMetas ? 'Ver menos' : 'Ver todas';
        }
    }
}

function renderPresupuestos(presupuestos) {
    const grid = document.getElementById('grid-presupuestos');
    const btnNuevo = document.getElementById('btn-nuevo-presupuesto');
    grid.innerHTML = '';
    
    const now = new Date();
    const currentMonthFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentYearString = String(now.getFullYear());
    
    let presupuestosFiltrados = presupuestos.filter(p => {
        if (window.filtroPresupuesto === 'todos') return true;
        if (window.filtroPresupuesto === 'mensual') {
            return p.tipo_periodo === 'mensual' && p.periodo === currentMonthFormatted;
        } else {
            return p.tipo_periodo === 'anual' && p.periodo === currentYearString;
        }
    });
    
    let presupuestosAMostrar = presupuestosFiltrados;
    if (!window.verTodosPresupuestos && presupuestosFiltrados.length > 3) {
        presupuestosAMostrar = presupuestosFiltrados.slice(0, 3);
    }
    
    presupuestosAMostrar.forEach(p => {
        const limite = parseFloat(p.monto_limite) || 0;
        const consumido = parseFloat(p.monto_consumido) || 0;
        const porcentaje = limite > 0 ? (consumido / limite) * 100 : 0;
        
        let porcentajeMostrar = porcentaje > 0 && porcentaje < 1 ? porcentaje.toFixed(1) : Math.round(porcentaje);
        
        let estadoClass = 'stable';
        let badgeText = 'ESTABLE';
        let statusText = 'BAJO CONTROL';
        
        if (porcentaje >= 100) {
            estadoClass = 'critical';
            badgeText = 'CRÍTICO';
            statusText = 'LÍMITE EXCEDIDO';
        } else if (porcentaje >= 80 && p.alerta_80_porciento == 1) {
            estadoClass = 'alert';
            badgeText = 'ALERTA';
            statusText = porcentajeMostrar + '% UTILIZADO';
        } else if (porcentaje > 0) {
            statusText = porcentajeMostrar + '% UTILIZADO';
        }
        
        const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
        
        const card = document.createElement('article');
        card.className = `card budget-card ${estadoClass} cursor-pointer`;
        card.setAttribute('onclick', `abrirModalGastoPresupuesto('${p.nombre.replace(/'/g, "\\'")}', event)`);
        card.innerHTML = `
            <div class="budget-header">
              <div class="budget-icon">
                <span class="material-symbols-outlined">${p.codigo_material || 'category'}</span>
              </div>
              <div class="budget-info">
                <h4 class="budget-name">${p.nombre}</h4>
                <p class="budget-status-text">${statusText}</p>
              </div>
              <div class="budget-badge-container">
                <span class="budget-badge">${badgeText}</span>
              </div>
              <div class="kebab-menu">
                <button class="kebab-btn" onclick="toggleKebab(this, event)"><span class="material-symbols-outlined">more_vert</span></button>
                <div class="kebab-dropdown">
                  <button class="dropdown-item" onclick="editarPresupuesto('${p.id_presupuesto}')">Editar</button>
                  <button class="dropdown-item dropdown-danger" onclick="eliminarPresupuesto('${p.id_presupuesto}')">Eliminar</button>
                </div>
              </div>
            </div>
            <div class="budget-amounts">
              <div class="amount-group">
                <span class="amount-label">CONSUMIDO</span>
                <span class="amount-value">${formatter.format(consumido)}</span>
              </div>
              <div class="amount-group right">
                <span class="amount-label">LÍMITE</span>
                <span class="amount-limit">${formatter.format(limite)}</span>
              </div>
            </div>
        `;
        grid.appendChild(card);
    });
    grid.appendChild(btnNuevo);
    
    const btnVerTodos = document.getElementById('btn-ver-todos-presupuestos');
    if (btnVerTodos) {
        if (presupuestosFiltrados.length <= 3) {
            btnVerTodos.style.display = 'none';
        } else {
            btnVerTodos.style.display = 'inline-block';
            btnVerTodos.innerText = window.verTodosPresupuestos ? 'Ver menos' : 'Ver todos';
        }
    }
}

// Funciones globales
window.toggleKebab = function(btn, event) {
    event.stopPropagation();
    const dropdown = btn.nextElementSibling;
    document.querySelectorAll('.kebab-dropdown.show').forEach(menu => {
        if(menu !== dropdown) menu.classList.remove('show');
    });
    dropdown.classList.toggle('show');
};

window.eliminarMeta = async function(id) {
    Swal.fire({
        title: '¿Eliminar meta?',
        text: "Esta acción no se puede deshacer.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#059669',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then(async (result) => {
        if (result.isConfirmed) {
            await deleteDoc(doc(db, "metas", id));
            Swal.fire('¡Eliminada!', 'Meta eliminada', 'success');
            cargarDatos();
        }
    });
};

window.eliminarPresupuesto = async function(id) {
    Swal.fire({
        title: '¿Eliminar presupuesto?',
        text: "Esta acción no se puede deshacer.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#059669',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then(async (result) => {
        if (result.isConfirmed) {
            await deleteDoc(doc(db, "presupuestos", id));
            Swal.fire('¡Eliminado!', 'Presupuesto eliminado', 'success');
            cargarDatos();
        }
    });
};

window.editarMeta = function(id) {
    const meta = window.metasGlobales.find(m => m.id_meta === id);
    if(!meta) return;

    document.getElementById('modal-titulo-meta').innerText = "Editar Meta de Ahorro";
    document.getElementById('btn-submit-meta').innerText = "Guardar Meta";
    
    const form = document.getElementById('form-meta');
    form.querySelector('input[name="id_meta"]').value = meta.id_meta;
    form.querySelector('input[name="nombre"]').value = meta.nombre;
    form.querySelector('input[name="monto_objetivo"]').value = new Intl.NumberFormat('en-US').format(meta.monto_objetivo);
    form.querySelector('input[name="fecha_limite"]').value = meta.fecha_limite;
    
    const radio = form.querySelector(`input[name="id_icono"][value="${meta.id_icono}"]`);
    if(radio) {
        radio.checked = true;
        form.querySelectorAll('.icon-option').forEach(l => l.classList.remove('active'));
        radio.closest('.icon-option').classList.add('active');
    }
    document.getElementById('modalNuevaMeta').classList.add('active');
};

window.editarPresupuesto = function(id) {
    const p = window.presupuestosGlobales.find(x => x.id_presupuesto === id);
    if (!p) return;
    document.getElementById('modal-titulo-presupuesto').innerText = "Editar Presupuesto";
    document.getElementById('id_presupuesto').value = p.id_presupuesto;
    document.querySelector('#form-presupuesto input[name="nombre"]').value = p.nombre;
    document.querySelector('#form-presupuesto input[name="monto_limite"]').value = new Intl.NumberFormat('en-US').format(p.monto_limite);
    
    const radioPeriodo = document.querySelector(`#form-presupuesto input[name="tipo_periodo"][value="${p.tipo_periodo || 'mensual'}"]`);
    if (radioPeriodo) {
        radioPeriodo.checked = true;
        radioPeriodo.dispatchEvent(new Event('change'));
    }
    document.querySelector('#form-presupuesto input[name="periodo"]').value = p.periodo || '';

    const radio = document.querySelector(`#form-presupuesto input[name="id_icono"][value="${p.id_icono}"]`);
    if(radio) {
        document.querySelectorAll('#form-presupuesto .icon-option').forEach(el => el.classList.remove('active'));
        radio.checked = true;
        radio.closest('.icon-option').classList.add('active');
    }
    document.querySelector('#form-presupuesto input[name="alerta_80_porciento"]').checked = p.alerta_80_porciento == 1;
    document.getElementById('modalNuevoPresupuesto').classList.add('active');
};

// --- LOGICA DE NUEVOS MODALES ---

// Calcula el saldo disponible del usuario (ingresos - gastos - ahorro en metas)
async function calcularDisponible() {
    if (!currentUid) return 0;
    try {
        const qTrans = query(collection(db, "transacciones"), where("usuario_id", "==", currentUid));
        const snapshotTrans = await getDocs(qTrans);
        let ingresos = 0, gastos = 0;
        snapshotTrans.docs.forEach(d => {
            const t = d.data();
            if (t.tipo === 'ingreso') ingresos += parseFloat(t.monto) || 0;
            if (t.tipo === 'gasto') gastos += parseFloat(t.monto) || 0;
        });

        const qMetas = query(collection(db, "metas"), where("id_usuario", "==", currentUid));
        const snapshotMetas = await getDocs(qMetas);
        let ahorroEnMetas = 0;
        snapshotMetas.docs.forEach(d => {
            ahorroEnMetas += parseFloat(d.data().monto_actual) || 0;
        });

        return (ingresos - gastos) - ahorroEnMetas;
    } catch (e) {
        console.error('Error calculando disponible:', e);
        return 0;
    }
}

window.abrirModalAbonoMeta = async function(id_meta, nombre_meta, event) {
    if (event && event.target.closest('.kebab-menu')) return;
    document.getElementById('id_meta_abono').value = id_meta;
    document.getElementById('nombre-meta-abono').innerText = nombre_meta;
    document.getElementById('form-abono-meta').reset();

    // Mostrar saldo disponible en el modal
    const disponible = await calcularDisponible();
    const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
    const infoDisponible = document.getElementById('info-disponible-abono');
    if (infoDisponible) {
        infoDisponible.innerText = `Saldo disponible: ${formatter.format(Math.max(0, disponible))}`;
        infoDisponible.dataset.disponible = disponible;
        infoDisponible.style.color = disponible <= 0 ? '#ef4444' : '#059669';
    }

    document.getElementById('modalAbonoMeta').classList.add('active');
};

window.abrirModalGastoPresupuesto = function(categoria, event) {
    if (event && event.target.closest('.kebab-menu')) return;
    document.getElementById('categoria_gasto').value = categoria;
    document.getElementById('nombre-categoria-presupuesto').innerText = categoria;
    document.getElementById('form-gasto-presupuesto').reset();
    document.getElementById('modalGastoPresupuesto').classList.add('active');
};

document.addEventListener("DOMContentLoaded", () => {
    // Botones de "Ver todos"
    document.getElementById('btn-ver-todas-metas')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.verTodasMetas = !window.verTodasMetas;
        renderMetas(window.metasGlobales);
    });

    document.getElementById('btn-ver-todos-presupuestos')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.verTodosPresupuestos = !window.verTodosPresupuestos;
        renderPresupuestos(window.presupuestosGlobales);
    });

    const toggleMetaContainer = document.getElementById('toggle-meta-filtro');
    if (toggleMetaContainer) {
        toggleMetaContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('toggle-btn')) {
                toggleMetaContainer.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                window.filtroMeta = e.target.dataset.filtro;
                renderMetas(window.metasGlobales);
            }
        });
    }

    const toggleContainer = document.getElementById('toggle-presupuesto-filtro');
    if (toggleContainer) {
        toggleContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('toggle-btn')) {
                toggleContainer.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                window.filtroPresupuesto = e.target.dataset.filtro;
                cargarDatos();
            }
        });
    }

    // Cerrar modales nuevos
    document.getElementById('btn-cerrar-abono-meta')?.addEventListener('click', () => {
        document.getElementById('modalAbonoMeta').classList.remove('active');
    });
    document.getElementById('btn-cerrar-gasto-presupuesto')?.addEventListener('click', () => {
        document.getElementById('modalGastoPresupuesto').classList.remove('active');
    });

    // Formatear montos nuevos
    const inputsNuevos = document.querySelectorAll('#monto_gasto, #monto_abono');
    inputsNuevos.forEach(input => {
        input.type = 'text';
        input.inputMode = 'numeric';
        input.addEventListener('input', function(e) {
            let value = this.value.replace(/[^0-9]/g, '');
            if(value) {
                value = parseInt(value, 10);
                this.value = new Intl.NumberFormat('en-US').format(value);
            } else {
                this.value = '';
            }
        });
    });

    // Submit Abono a Meta
    const formAbono = document.getElementById('form-abono-meta');
    if (formAbono) {
        formAbono.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnSubmit = document.getElementById('btn-submit-abono-meta');
            btnSubmit.disabled = true;
            btnSubmit.innerText = 'Verificando...';

            const id_meta = document.getElementById('id_meta_abono').value;
            const inputAbono = document.getElementById('monto_abono').value;
            const montoAbono = parseFloat(inputAbono.replace(/,/g, ''));

            if (!montoAbono || montoAbono <= 0) {
                Swal.fire('Error', 'Ingresa un monto válido mayor a 0.', 'error');
                btnSubmit.disabled = false;
                btnSubmit.innerText = 'Transferir';
                return;
            }

            try {
                // Calcular el saldo disponible en tiempo real
                const disponible = await calcularDisponible();
                const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

                if (montoAbono > disponible) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Saldo insuficiente',
                        html: `No puedes transferir <strong>${formatter.format(montoAbono)}</strong> porque tu saldo disponible es de <strong>${formatter.format(Math.max(0, disponible))}</strong>.`,
                        confirmButtonColor: '#059669'
                    });
                    // Actualizar el indicador en el modal
                    const infoDisponible = document.getElementById('info-disponible-abono');
                    if (infoDisponible) {
                        infoDisponible.innerText = `Saldo disponible: ${formatter.format(Math.max(0, disponible))}`;
                        infoDisponible.style.color = '#ef4444';
                    }
                    return;
                }

                // Verificar que no exceda el objetivo de la meta
                const metaData = window.metasGlobales.find(m => m.id_meta === id_meta);
                if (metaData) {
                    const actual = parseFloat(metaData.monto_actual) || 0;
                    const objetivo = parseFloat(metaData.monto_objetivo) || 0;
                    const faltante = objetivo - actual;

                    if (faltante <= 0) {
                        Swal.fire('Meta completa', 'Esta meta ya alcanzó su objetivo.', 'info');
                        return;
                    }

                    if (montoAbono > faltante) {
                        Swal.fire({
                            icon: 'info',
                            title: 'Monto excede el objetivo',
                            html: `Solo necesitas <strong>${formatter.format(faltante)}</strong> para completar esta meta.`,
                            confirmButtonColor: '#059669'
                        });
                        return;
                    }

                    btnSubmit.innerText = 'Transfiriendo...';
                    const nuevoMonto = actual + montoAbono;
                    const mesActual = new Date().toISOString().substring(0, 7);
                    
                    const metaRef = doc(db, "metas", id_meta);
                    const metaDoc = await getDoc(metaRef);
                    let historial = {};
                    if (metaDoc.exists() && metaDoc.data().historial) {
                        historial = metaDoc.data().historial;
                    }
                    historial[mesActual] = nuevoMonto;

                    await updateDoc(metaRef, {
                        monto_actual: nuevoMonto,
                        historial: historial
                    });
                    Swal.fire('¡Éxito!', 'Dinero transferido a la meta', 'success');
                    document.getElementById('modalAbonoMeta').classList.remove('active');
                    cargarDatos();
                }
            } catch (error) {
                console.error("Error al abonar meta:", error);
                Swal.fire('Error', 'No se pudo abonar a la meta', 'error');
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.innerText = 'Transferir';
            }
        });
    }

    // Submit Gasto a Presupuesto
    const formGasto = document.getElementById('form-gasto-presupuesto');
    if (formGasto) {
        formGasto.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentUid) return;
            const btnSubmit = document.getElementById('btn-submit-gasto-presupuesto');
            btnSubmit.disabled = true;

            const categoria = document.getElementById('categoria_gasto').value;
            const inputGasto = document.getElementById('monto_gasto').value;
            const montoGasto = parseFloat(inputGasto.replace(/,/g, ''));
            const descripcion = document.getElementById('descripcion_gasto').value;

            // Obtener fecha local actual (formato YYYY-MM-DD)
            const hoy = new Date();
            const fechaHoy = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');

            try {
                // Registrar nueva transaccion (gasto) en esa categoria
                await addDoc(collection(db, "transacciones"), {
                    usuario_id: currentUid,
                    tipo: "gasto",
                    monto: montoGasto,
                    categoria: categoria,
                    descripcion: descripcion,
                    fecha: fechaHoy
                });
                Swal.fire('¡Éxito!', 'Gasto registrado correctamente', 'success');
                document.getElementById('modalGastoPresupuesto').classList.remove('active');
                cargarDatos();
            } catch (error) {
                console.error("Error al registrar gasto:", error);
                Swal.fire('Error', 'No se pudo registrar el gasto', 'error');
            } finally {
                btnSubmit.disabled = false;
            }
        });
    }
});
