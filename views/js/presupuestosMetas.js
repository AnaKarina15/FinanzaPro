import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { collection, addDoc, getDocs, doc, getDoc, deleteDoc, updateDoc, query, where } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

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
                    await addDoc(collection(db, "metas"), {
                        id_usuario: currentUid,
                        nombre,
                        monto_objetivo,
                        fecha_limite,
                        id_icono,
                        codigo_material,
                        monto_actual: 0
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

            try {
                if (id_presupuesto) {
                    const presRef = doc(db, "presupuestos", id_presupuesto);
                    await updateDoc(presRef, {
                        nombre, monto_limite, id_icono, codigo_material, alerta_80_porciento
                    });
                    Swal.fire('¡Éxito!', 'Presupuesto actualizado', 'success');
                } else {
                    await addDoc(collection(db, "presupuestos"), {
                        id_usuario: currentUid,
                        nombre,
                        monto_limite,
                        id_icono,
                        codigo_material,
                        alerta_80_porciento
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

async function cargarDatos() {
    if (!currentUid) return;
    try {
        const qTrans = query(collection(db, "transacciones"), where("usuario_id", "==", currentUid));
        const snapshotTrans = await getDocs(qTrans);
        const transacciones = snapshotTrans.docs.map(doc => doc.data());

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const qMetas = query(collection(db, "metas"), where("id_usuario", "==", currentUid));
        const snapshotMetas = await getDocs(qMetas);
        window.metasGlobales = snapshotMetas.docs.map(doc => ({ id_meta: doc.id, ...doc.data() }));

        const qPresupuestos = query(collection(db, "presupuestos"), where("id_usuario", "==", currentUid));
        const snapshotPresupuestos = await getDocs(qPresupuestos);
        window.presupuestosGlobales = snapshotPresupuestos.docs.map(doc => {
            const p = doc.data();
            p.id_presupuesto = doc.id;
            
            let consumido = 0;
            transacciones.forEach(t => {
                if (t.tipo === 'gasto' && t.categoria === p.nombre) {
                    const tDate = new Date(t.fecha + "T00:00:00");
                    if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
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
    
    metas.forEach(meta => {
        const obj = parseFloat(meta.monto_objetivo) || 0;
        const act = parseFloat(meta.monto_actual) || 0;
        const porcentaje = obj > 0 ? Math.min(100, Math.round((act / obj) * 100)) : 0;
        
        const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
        
        const card = document.createElement('article');
        card.className = 'card goal-card';
        card.innerHTML = `
            <div class="goal-header">
              <div class="icon-box icon-blue" style="background-color: #e0f2fe; color: #0284c7;">
                <span class="material-symbols-outlined">${meta.codigo_material || 'stars'}</span>
              </div>
              <div class="goal-percentage text-success">${porcentaje}%</div>
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
                <div class="progress-bar-fill" style="width: ${porcentaje}%;"></div>
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
}

function renderPresupuestos(presupuestos) {
    const grid = document.getElementById('grid-presupuestos');
    const btnNuevo = document.getElementById('btn-nuevo-presupuesto');
    grid.innerHTML = '';
    
    presupuestos.forEach(p => {
        const limite = parseFloat(p.monto_limite) || 0;
        const consumido = parseFloat(p.monto_consumido) || 0;
        const porcentaje = limite > 0 ? (consumido / limite) * 100 : 0;
        
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
            statusText = Math.round(porcentaje) + '% UTILIZADO';
        } else if (porcentaje > 0) {
            statusText = Math.round(porcentaje) + '% UTILIZADO';
        }
        
        const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
        
        const card = document.createElement('article');
        card.className = `card budget-card ${estadoClass}`;
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
    const p = window.presupuestosGlobales.find(p => p.id_presupuesto === id);
    if(!p) return;

    document.getElementById('modal-titulo-presupuesto').innerText = "Editar Presupuesto";
    document.getElementById('text-submit-presupuesto').innerText = "Guardar Presupuesto";
    
    const form = document.getElementById('form-presupuesto');
    form.querySelector('input[name="id_presupuesto"]').value = p.id_presupuesto;
    form.querySelector('input[name="nombre"]').value = p.nombre;
    form.querySelector('input[name="monto_limite"]').value = new Intl.NumberFormat('en-US').format(p.monto_limite);
    
    const checkbox = form.querySelector('input[name="alerta_80_porciento"]');
    if(checkbox) checkbox.checked = p.alerta_80_porciento == 1;

    const radio = form.querySelector(`input[name="id_icono"][value="${p.id_icono}"]`);
    if(radio) {
        radio.checked = true;
        form.querySelectorAll('.icon-option').forEach(l => l.classList.remove('active'));
        radio.closest('.icon-option').classList.add('active');
    }
    document.getElementById('modalNuevoPresupuesto').classList.add('active');
};
