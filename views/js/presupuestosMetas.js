import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { initPresencia } from "./presencia.js";
import { collection, addDoc, getDocs, doc, getDoc, deleteDoc, updateDoc, query, where } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { initNotificaciones, verificarProgresoMeta, verificarPresupuesto, verificarGastoInusual } from "./notificaciones.js";

// Normalizar texto (quitar tildes y pasar a minúsculas)
const normalizar = (texto) => {
    return String(texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};

let currentUid = null;

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUid = user.uid;
        initPresencia(user.uid);
        // Actualizar sidebar desde Firestore
        try {
            const userDoc = await getDoc(doc(db, "usuarios", user.uid));
            if (userDoc.exists()) {
                const d = userDoc.data();
                const nombre = `${d.nombre || ''} ${d.apellido || ''}`.trim();
                const sideName = document.querySelector(".nav-profile .username");
                if (sideName) { sideName.textContent = nombre; sideName.classList.remove('skeleton-text'); }
                const avatarImg = document.querySelector(".nav-profile img");
                if (avatarImg) avatarImg.src = d.fotoPerfil || `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=059669&color=fff`;

                // Aplicar tema
                if (d.tema_interfaz === 'oscuro') {
                    document.body.classList.add('dark-theme');
                } else {
                    document.body.classList.remove('dark-theme');
                }
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

    // Eliminada lógica genérica de toggle-btn para evitar conflictos entre filtros

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
                // Reset icon dropdown to default
                document.getElementById('selected-meta-icon').textContent = 'home';
                document.getElementById('meta_icono_hidden').value = 'home';
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
                // Reset icon dropdown to default
                document.getElementById('selected-presupuesto-icon').textContent = 'restaurant';
                document.getElementById('presupuesto_icono_hidden').value = 'restaurant';
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

    // --- ICON DROPDOWN SYSTEM ---
    const ALL_ICONS = [
        'home', 'directions_car', 'flight', 'laptop_mac', 'school', 'favorite',
        'restaurant', 'shopping_bag', 'local_hospital', 'bolt', 'sports_esports', 'checkroom',
        'directions_bus', 'savings', 'pets', 'fitness_center', 'water_drop',
        'credit_card', 'attach_money', 'work', 'movie', 'phone_iphone',
        'category', 'shopping_cart', 'local_gas_station'
    ];

    function buildIconGrid(gridId, previewId, hiddenId) {
        const grid = document.getElementById(gridId);
        if (!grid || grid.children.length > 0) return;
        ALL_ICONS.forEach(icon => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.innerHTML = `<span class="material-symbols-outlined">${icon}</span>`;
            btn.style.cssText = 'background: none; border: 1px solid transparent; border-radius: 8px; padding: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--text-primary); transition: all 0.2s;';
            btn.onmouseover = () => { btn.style.backgroundColor = 'var(--bg-hover)'; btn.style.borderColor = 'var(--border-color)'; };
            btn.onmouseout = () => { btn.style.backgroundColor = 'transparent'; btn.style.borderColor = 'transparent'; };
            btn.onclick = (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                document.getElementById(previewId).textContent = icon;
                document.getElementById(hiddenId).value = icon;
                grid.closest('.icon-dropdown-menu').style.display = 'none';
            };
            grid.appendChild(btn);
        });
    }

    function toggleDropdown(dropdownId, gridId, previewId, hiddenId, e) {
        if (e) e.preventDefault();
        const dd = document.getElementById(dropdownId);
        if (!dd) return;
        buildIconGrid(gridId, previewId, hiddenId);
        dd.style.display = dd.style.display === 'block' ? 'none' : 'block';
    }

    window.toggleIconDropdownMeta = (e) => toggleDropdown('icon-dropdown-menu-meta', 'icon-grid-meta', 'selected-meta-icon', 'meta_icono_hidden', e);
    window.toggleIconDropdownPresupuesto = (e) => toggleDropdown('icon-dropdown-menu-presupuesto', 'icon-grid-presupuesto', 'selected-presupuesto-icon', 'presupuesto_icono_hidden', e);

    // Close dropdowns on outside click
    document.addEventListener('click', (e) => {
        ['icon-dropdown-menu-meta', 'icon-dropdown-menu-presupuesto'].forEach(id => {
            const dd = document.getElementById(id);
            if (dd && dd.style.display === 'block') {
                const trigger = dd.closest('.icon-selector-trigger');
                if (trigger && !trigger.contains(e.target)) {
                    dd.style.display = 'none';
                }
            }
        });
    });

    // Backward-compatible iconMap for reading old data
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
            const monto_objetivo = parseFloat(inputObj.value.replace(/\D/g, '')) || 0;
            const hiddenIconVal = document.getElementById('meta_icono_hidden').value;
            const codigo_material = hiddenIconVal && hiddenIconVal.length > 2 ? hiddenIconVal : (iconMap[hiddenIconVal] || 'stars');
            const id_icono = hiddenIconVal;

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
            const monto_limite = parseFloat(inputLim.value.replace(/\D/g, '')) || 0;
            const hiddenIconVal = document.getElementById('presupuesto_icono_hidden').value;
            const codigo_material = hiddenIconVal && hiddenIconVal.length > 2 ? hiddenIconVal : (iconMap[hiddenIconVal] || 'category');
            const id_icono = hiddenIconVal;
            const alerta_80_porciento = formPresupuesto.querySelector('input[name="alerta_80_porciento"]').checked ? 1 : 0;
            const tipo_periodo = formPresupuesto.querySelector('input[name="tipo_periodo"]:checked').value;
            const periodo = formPresupuesto.querySelector('input[name="periodo"]').value;

            try {
                if (id_presupuesto) {
                    const presRef = doc(db, "presupuestos", id_presupuesto);
                    
                    const docSnap = await getDoc(presRef);
                    const oldNombre = docSnap.exists() ? docSnap.data().nombre : null;

                    await updateDoc(presRef, {
                        nombre, monto_limite, id_icono, codigo_material, alerta_80_porciento, tipo_periodo, periodo
                    });

                    if (oldNombre && oldNombre !== nombre) {
                        const qTrans = query(collection(db, "transacciones"), where("usuario_id", "==", currentUid), where("categoria", "==", oldNombre));
                        const snapshotTrans = await getDocs(qTrans);
                        const updatePromises = snapshotTrans.docs.map(tDoc => updateDoc(tDoc.ref, { categoria: nombre }));
                        await Promise.all(updatePromises);
                    }

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

    // Formatear inputs de dinero al escribir (todos los formularios de la vista)
    const allMoneyInputs = document.querySelectorAll(
        'input[name="monto_limite"], input[name="monto_objetivo"], input[name="monto_abono"], input[name="monto_retiro"], input[name="monto_gasto"]'
    );
    allMoneyInputs.forEach(input => {
        input.type = 'text';
        input.inputMode = 'numeric';
        input.addEventListener('input', function() {
            let valorPuro = this.value.replace(/\D/g, '');
            if (valorPuro === '') { this.value = ''; return; }
            this.value = `$ ${new Intl.NumberFormat('es-CO').format(parseInt(valorPuro, 10))}`;
        });
    });
    // --- CATEGORY SUGGESTIONS SYSTEM ---
    const SUGGESTED_CATEGORIES = ['Alimentación', 'Transporte', 'Ocio', 'Servicios Públicos', 'Salud', 'Educación', 'Hogar', 'Mascotas'];
    
    const renderCategorySuggestions = (filter = "") => {
        const dropdown = document.getElementById('lista-categorias-presupuesto-custom');
        if (!dropdown) return;

        const term = normalizar(filter);
        const allCats = new Set(SUGGESTED_CATEGORIES);
        // Add existing ones
        if (window.presupuestosGlobales) {
            window.presupuestosGlobales.forEach(p => allCats.add(p.nombre));
        }

        const seen = new Set();
        const filtered = Array.from(allCats).filter(cat => {
            const normCat = normalizar(cat);
            if (seen.has(normCat)) return false;
            seen.add(normCat);
            return normCat.includes(term);
        });

        dropdown.innerHTML = '';
        filtered.forEach(cat => {
            const div = document.createElement('div');
            div.className = 'dropdown-option';
            div.textContent = cat;
            div.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const input = document.getElementById('categoria-presupuesto');
                input.value = cat;
                dropdown.style.display = 'none';
            };
            dropdown.appendChild(div);
        });

        if (filtered.length > 0 && document.activeElement.id === 'categoria-presupuesto') {
            dropdown.style.display = 'block';
        } else {
            dropdown.style.display = 'none';
        }
    };

    const inputCatPres = document.getElementById('categoria-presupuesto');
    const dropdownCatPres = document.getElementById('lista-categorias-presupuesto-custom');
    if (inputCatPres) {
        inputCatPres.addEventListener('focus', () => renderCategorySuggestions(inputCatPres.value));
        inputCatPres.addEventListener('input', () => renderCategorySuggestions(inputCatPres.value));
        document.addEventListener('click', (e) => {
            if (!inputCatPres.contains(e.target) && !dropdownCatPres.contains(e.target)) {
                dropdownCatPres.style.display = 'none';
            }
        });
    }

});

// --- CARGA DE DATOS ---
window.metasGlobales = [];
window.presupuestosGlobales = [];
window.verTodasMetas = false;
window.verTodosPresupuestos = false;
window.filtroPresupuesto = 'mensual';
window.filtroMeta = 'todas';
window.textoBusqueda = '';

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
                if (t.tipo === 'gasto' && t.categoria && p.nombre && t.categoria.trim().toLowerCase() === p.nombre.trim().toLowerCase()) {
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
        // Filtrado por buscador
        if (window.textoBusqueda && window.textoBusqueda.trim() !== '') {
            const txt = window.textoBusqueda.toLowerCase();
            if (!m.nombre.toLowerCase().includes(txt)) return false;
        }

        if (window.filtroMeta === 'todas') return true;
        if (!m.fecha_limite) return true; // Retrocompatibilidad
        
        const [year, month] = m.fecha_limite.split('-');
        const dateLimit = new Date(year, month - 1);
        const now = new Date();
        
        if (window.filtroMeta === 'este_mes') {
            return dateLimit.getFullYear() === now.getFullYear() && dateLimit.getMonth() === now.getMonth();
        } else if (window.filtroMeta === 'este_anio') {
            return dateLimit.getFullYear() === now.getFullYear();
        }
        return true;
    });

    metasFiltradas.forEach(meta => {
        const obj = parseFloat(meta.monto_objetivo) || 0;
        const act = parseFloat(meta.monto_actual) || 0;
        let porcentajeNumerico = obj > 0 ? (act / obj) * 100 : 0;
        let porcentajeMostrar = porcentajeNumerico > 0 && porcentajeNumerico < 1 ? porcentajeNumerico.toFixed(1) : Math.round(porcentajeNumerico);
        if (porcentajeNumerico >= 100) porcentajeMostrar = 100;
        let widthBarra = porcentajeNumerico > 0 && porcentajeNumerico < 2 ? 2 : Math.min(100, porcentajeNumerico);
        
        const formatter = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
        
        let badgeText = 'EN PROGRESO';
        let goalStateClass = 'started';
        
        if (porcentajeNumerico >= 100) {
            badgeText = 'LOGRADO';
            goalStateClass = 'achieved';
        } else if (porcentajeNumerico >= 50) {
            goalStateClass = 'advanced';
        }

        const card = document.createElement('article');
        card.className = `card goal-card ${goalStateClass} cursor-pointer`;
        card.setAttribute('onclick', `abrirModalAbonoMeta('${meta.id_meta}', '${meta.nombre.replace(/'/g, "\\'")}', event)`);

        const mesesStrMeta = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        let metaPeriodoFormat = meta.fecha_limite;
        if (meta.fecha_limite) {
            const parts = meta.fecha_limite.split('-');
            if (parts.length >= 2) {
                metaPeriodoFormat = `(${mesesStrMeta[parseInt(parts[1])-1]} ${parts[0]})`;
            }
        }

        card.innerHTML = `
            <div class="budget-header">
              <div class="budget-icon">
                <span class="material-symbols-outlined">${meta.codigo_material || 'stars'}</span>
              </div>
              <div class="budget-info">
                <h4 class="budget-name" style="margin-bottom: 2px;">${meta.nombre}</h4>
                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">${metaPeriodoFormat}</div>
                <p class="budget-status-text">${porcentajeMostrar}% ALCANZADO</p>
              </div>
              <div class="budget-badge-container">
                <span class="budget-badge">${badgeText}</span>
              </div>
              <div class="kebab-menu">
                <button class="kebab-btn" onclick="toggleKebab(this, event)"><span class="material-symbols-outlined">more_vert</span></button>
                <div class="kebab-dropdown">
                  <button class="dropdown-item" onclick="editarMeta('${meta.id_meta}')">Editar</button>
                  <button class="dropdown-item dropdown-danger" onclick="eliminarMeta('${meta.id_meta}')">Eliminar</button>
                </div>
              </div>
            </div>
            <div style="margin-top: auto;">
              <div class="budget-progress-bar" style="margin-bottom: 8px;">
                <div class="progress-fill" style="width: ${widthBarra}%;"></div>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 500; color: var(--text-secondary);">
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
    
    const now = new Date();
    const currentMonthFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentYearString = String(now.getFullYear());
    
    let presupuestosFiltrados = presupuestos.filter(p => {
        // Filtrado por buscador
        if (window.textoBusqueda && window.textoBusqueda.trim() !== '') {
            const txt = window.textoBusqueda.toLowerCase();
            if (!p.nombre.toLowerCase().includes(txt)) return false;
        }

        if (window.filtroPresupuesto === 'todos') return true;
        
        if (window.filtroPresupuesto === 'mensual') {
            return p.tipo_periodo === 'mensual' && p.periodo === currentMonthFormatted;
        } else if (window.filtroPresupuesto === 'anual') {
            return p.tipo_periodo === 'anual' && p.periodo === currentYearString;
        }
        return true;
    });
    
    presupuestosFiltrados.forEach(p => {
        const limite = parseFloat(p.monto_limite) || 0;
        const consumido = parseFloat(p.monto_consumido) || 0;
        const porcentaje = limite > 0 ? (consumido / limite) * 100 : 0;
        
        let porcentajeMostrar = porcentaje > 0 && porcentaje < 1 ? porcentaje.toFixed(1) : Math.round(porcentaje);
        
        let estadoClass = 'stable';
        let badgeText = 'ESTABLE';
        let statusText = 'BAJO CONTROL';
        
        if (porcentaje >= 95) {
            estadoClass = 'critical';
            badgeText = 'CRÍTICO';
            statusText = porcentaje >= 100 ? 'LÍMITE EXCEDIDO' : Math.round(porcentaje) + '% UTILIZADO';
        } else if (porcentaje >= 85) {
            estadoClass = 'warning';
            badgeText = 'ADVERTENCIA';
            statusText = porcentajeMostrar + '% UTILIZADO';
        } else if (porcentaje >= 80 && p.alerta_80_porciento == 1) {
            estadoClass = 'alert';
            badgeText = 'ALERTA';
            statusText = porcentajeMostrar + '% UTILIZADO';
        } else if (porcentaje > 0) {
            statusText = porcentajeMostrar + '% UTILIZADO';
        }
        
        const formatter = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
        
        let etiquetaPeriodo = '';
        if (p.tipo_periodo === 'mensual' && p.periodo) {
            const mesesStr = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            const [y, m] = p.periodo.split('-');
            etiquetaPeriodo = `(${mesesStr[parseInt(m)-1]} ${y})`;
        } else if (p.tipo_periodo === 'anual' && p.periodo) {
            etiquetaPeriodo = `(${p.periodo})`;
        }

        const card = document.createElement('article');
        card.className = `card budget-card ${estadoClass} cursor-pointer`;
        card.setAttribute('onclick', `abrirModalGastoPresupuesto('${p.nombre.replace(/'/g, "\\'")}', event)`);
        card.innerHTML = `
            <div class="budget-header">
              <div class="budget-icon">
                <span class="material-symbols-outlined">${p.codigo_material || 'category'}</span>
              </div>
              <div class="budget-info">
                <h4 class="budget-name" style="margin-bottom: 2px;">${p.nombre}</h4>
                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">${etiquetaPeriodo}</div>
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
            <div style="margin-top: auto;">
              <div class="budget-progress-bar" style="margin-bottom: 8px;">
                <div class="progress-fill" style="width: ${Math.min(porcentaje, 100)}%;"></div>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 500; color: var(--text-secondary);">
                <span>${formatter.format(consumido)}</span>
                <span>${formatter.format(limite)}</span>
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
        text: "Al hacerlo, la plata que tengas ahorrada para esa meta, pasará a ser dinero disponible.",
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
    form.querySelector('input[name="monto_objetivo"]').value = `$ ${new Intl.NumberFormat('es-CO').format(meta.monto_objetivo)}`;
    form.querySelector('input[name="fecha_limite"]').value = meta.fecha_limite;
    
    // Set icon in dropdown
    const metaIcon = meta.codigo_material || iconMap[meta.id_icono] || 'home';
    document.getElementById('selected-meta-icon').textContent = metaIcon;
    document.getElementById('meta_icono_hidden').value = metaIcon;
    document.getElementById('modalNuevaMeta').classList.add('active');
};

window.editarPresupuesto = function(id) {
    const p = window.presupuestosGlobales.find(x => x.id_presupuesto === id);
    if (!p) return;
    document.getElementById('modal-titulo-presupuesto').innerText = "Editar Presupuesto";
    document.getElementById('text-submit-presupuesto').innerText = "Guardar Presupuesto";
    document.getElementById('id_presupuesto').value = p.id_presupuesto;
    document.querySelector('#form-presupuesto input[name="nombre"]').value = p.nombre;
    document.querySelector('#form-presupuesto input[name="monto_limite"]').value = `$ ${new Intl.NumberFormat('es-CO').format(p.monto_limite)}`;
    
    const radioPeriodo = document.querySelector(`#form-presupuesto input[name="tipo_periodo"][value="${p.tipo_periodo || 'mensual'}"]`);
    if (radioPeriodo) {
        radioPeriodo.checked = true;
        radioPeriodo.dispatchEvent(new Event('change'));
    }
    document.querySelector('#form-presupuesto input[name="periodo"]').value = p.periodo || '';

    // Set icon in dropdown
    const presIcon = p.codigo_material || iconMap[p.id_icono] || 'restaurant';
    document.getElementById('selected-presupuesto-icon').textContent = presIcon;
    document.getElementById('presupuesto_icono_hidden').value = presIcon;
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

    const meta = window.metasGlobales?.find(m => m.id_meta === id_meta);
    const montoActual = parseFloat(meta?.monto_actual) || 0;
    const formatter = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });

    // Datos comunes
    document.getElementById('form-abono-meta').reset();
    document.getElementById('form-retirar-meta').reset();
    document.getElementById('id_meta_abono').value = id_meta;
    document.getElementById('id_meta_retiro').value = id_meta;
    document.getElementById('nombre-meta-abono').innerText = nombre_meta;

    // Saldo disponible para depositar
    const disponible = await calcularDisponible();
    const infoDisponible = document.getElementById('info-disponible-abono');
    if (infoDisponible) {
        infoDisponible.innerText = `Saldo disponible: ${formatter.format(Math.max(0, disponible))}`;
        infoDisponible.dataset.disponible = disponible;
        infoDisponible.style.color = disponible <= 0 ? '#ef4444' : '#059669';
    }

    // Saldo ahorrado para retirar
    const infoAhorrado = document.getElementById('info-ahorrado-meta');
    if (infoAhorrado) {
        infoAhorrado.innerText = montoActual > 0
            ? `Ahorrado: ${formatter.format(montoActual)} — puedes retirar hasta ese monto.`
            : 'Esta meta no tiene dinero ahorrado aún.';
    }

    // Siempre abrir en pestaña Depositar
    cambiarTabMeta('depositar');
    document.getElementById('modalAbonoMeta').classList.add('active');
};

window.cambiarTabMeta = function(tab) {
    const tabDep = document.getElementById('tab-depositar');
    const tabRet = document.getElementById('tab-retirar');
    const panelDep = document.getElementById('panel-depositar');
    const panelRet = document.getElementById('panel-retirar');
    if (!tabDep || !tabRet) return;

    if (tab === 'depositar') {
        tabDep.style.background = '#059669';
        tabDep.style.color = '#fff';
        tabRet.style.background = 'transparent';
        tabRet.style.color = '#64748b';
        panelDep.style.display = '';
        panelRet.style.display = 'none';
    } else {
        tabRet.style.background = '#3b82f6';
        tabRet.style.color = '#fff';
        tabDep.style.background = 'transparent';
        tabDep.style.color = '#64748b';
        panelRet.style.display = '';
        panelDep.style.display = 'none';
    }
};

window.abrirModalGastoPresupuesto = async function(categoria, event) {
    if (event && event.target.closest('.kebab-menu')) return;
    document.getElementById('form-gasto-presupuesto').reset();
    document.getElementById('categoria_gasto').value = categoria;
    document.getElementById('nombre-categoria-presupuesto').innerText = categoria;

    // Calcular el saldo disponible general (ingresos - gastos - ahorros)
    const disponibleGeneral = await calcularDisponible();

    let hiddenDisp = document.getElementById('disponible_presupuesto');
    if (!hiddenDisp) {
        hiddenDisp = document.createElement('input');
        hiddenDisp.type = 'hidden';
        hiddenDisp.id = 'disponible_presupuesto';
        document.getElementById('form-gasto-presupuesto').appendChild(hiddenDisp);
    }
    hiddenDisp.value = disponibleGeneral;

    const formatter = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
    const infoEl = document.getElementById('info-disponible-presupuesto');
    const infoContainer = infoEl?.parentElement;
    if (infoEl) {
        if (disponibleGeneral <= 0) {
            infoEl.innerText = `Saldo insuficiente: ${formatter.format(disponibleGeneral)}`;
            infoEl.style.color = '#ef4444';
            if (infoContainer) {
                infoContainer.style.background = '#fef2f2';
                infoContainer.style.borderColor = '#fecaca';
                infoContainer.querySelector('.material-symbols-outlined').style.color = '#ef4444';
            }
        } else {
            infoEl.innerText = `Saldo disponible: ${formatter.format(disponibleGeneral)}`;
            infoEl.style.color = '#059669';
            if (infoContainer) {
                infoContainer.style.background = '#f0fdf4';
                infoContainer.style.borderColor = '#bbf7d0';
                infoContainer.querySelector('.material-symbols-outlined').style.color = '#059669';
            }
        }
    }

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

    // Buscador global
    const buscadorInput = document.getElementById('buscador-general');
    if (buscadorInput) {
        buscadorInput.addEventListener('input', (e) => {
            window.textoBusqueda = e.target.value;
            renderMetas(window.metasGlobales);
            renderPresupuestos(window.presupuestosGlobales);
        });
    }

    const toggleContainer = document.getElementById('toggle-presupuesto-filtro');
    if (toggleContainer) {
        toggleContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('toggle-btn')) {
                toggleContainer.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                window.filtroPresupuesto = e.target.dataset.filtro;
                renderPresupuestos(window.presupuestosGlobales);
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
                this.value = new Intl.NumberFormat('es-CO').format(value);
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
            const montoAbono = parseFloat(inputAbono.replace(/\D/g, '')) || 0;

            if (!montoAbono || montoAbono <= 0) {
                Swal.fire('Error', 'Ingresa un monto válido mayor a 0.', 'error');
                btnSubmit.disabled = false;
                btnSubmit.innerText = 'Transferir';
                return;
            }

            try {
                // Calcular el saldo disponible en tiempo real
                const disponible = await calcularDisponible();
                const formatter = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });

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
                    // Verificar si alcanzó el 50% o 100% de la meta
                    await verificarProgresoMeta(currentUid, {
                        nombre: metaData.nombre,
                        monto_actual: nuevoMonto,
                        monto_objetivo: metaData.monto_objetivo
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

            const categoria = document.getElementById('categoria_gasto').value.trim();
            const inputGasto = document.getElementById('monto_gasto').value;
            const montoGasto = parseFloat(inputGasto.replace(/\D/g, '')) || 0;
            const descripcion = document.getElementById('descripcion_gasto').value;
            const disponible = parseFloat(document.getElementById('disponible_presupuesto')?.value || 0);

            // Validar solo contra el saldo disponible general (puede exceder el límite del presupuesto)
            if (!montoGasto || montoGasto <= 0) {
                Swal.fire('Monto inválido', 'Ingresa un monto mayor a cero.', 'warning');
                btnSubmit.disabled = false;
                return;
            }
            if (disponible <= 0) {
                Swal.fire('Saldo insuficiente', 'Tu balance general está en negativo. No puedes registrar más gastos.', 'warning');
                btnSubmit.disabled = false;
                return;
            }
            if (montoGasto > disponible) {
                const fmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
                Swal.fire({
                    icon: 'warning',
                    title: 'Saldo insuficiente',
                    html: `Solo tienes <strong>${fmt.format(disponible)}</strong> disponibles. No puedes gastar <strong>${fmt.format(montoGasto)}</strong>.`,
                    confirmButtonColor: '#059669'
                });
                btnSubmit.disabled = false;
                return;
            }

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
                verificarPresupuesto(currentUid, categoria);
                verificarGastoInusual(currentUid, { monto: montoGasto, categoria: categoria });
            } catch (error) {
                console.error("Error al registrar gasto:", error);
                Swal.fire('Error', 'No se pudo registrar el gasto', 'error');
            } finally {
                btnSubmit.disabled = false;
            }
        });
    }
});


// ═══════════════════════════════════════════════════════════
// RETIRAR DINERO DE META — Submit handler
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    // Cerrar modal (pestaña retirar usa el mismo modal que abono)
    document.getElementById('btn-cerrar-retirar-meta')?.addEventListener('click', () => {
        document.getElementById('modalAbonoMeta').classList.remove('active');
    });

    // Submit retiro
    const formRetiro = document.getElementById('form-retirar-meta');
    if (formRetiro) {
        formRetiro.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentUid) return;

            const btnSubmit = document.getElementById('btn-submit-retiro-meta');
            btnSubmit.disabled = true;
            btnSubmit.innerText = 'Retirando...';

            const idMeta = document.getElementById('id_meta_retiro').value;
            const inputRetiro = document.getElementById('monto_retiro').value;
            const montoRetiro = parseFloat(inputRetiro.replace(/\D/g, '')) || 0;
            const formatter = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });

            if (!montoRetiro || montoRetiro <= 0) {
                Swal.fire('Monto inválido', 'Ingresa un monto mayor a cero.', 'warning');
                btnSubmit.disabled = false;
                btnSubmit.innerText = 'Retirar dinero';
                return;
            }

            try {
                const metaRef = doc(db, "metas", idMeta);
                const metaDoc = await getDoc(metaRef);
                if (!metaDoc.exists()) throw new Error('Meta no encontrada');

                const metaData = metaDoc.data();
                const actual = parseFloat(metaData.monto_actual) || 0;

                if (montoRetiro > actual) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Monto excede el ahorro',
                        html: `Solo tienes <strong>${formatter.format(actual)}</strong> ahorrados en esta meta.`,
                        confirmButtonColor: '#059669'
                    });
                    btnSubmit.disabled = false;
                    btnSubmit.innerText = 'Retirar dinero';
                    return;
                }

                const nuevoMonto = actual - montoRetiro;
                const mesActual = new Date().toISOString().substring(0, 7);
                let historial = metaData.historial || {};
                historial[mesActual] = nuevoMonto;

                await updateDoc(metaRef, { monto_actual: nuevoMonto, historial });

                Swal.fire('¡Listo!', `Retiraste ${formatter.format(montoRetiro)} de tu meta.`, 'success');
                document.getElementById('modalAbonoMeta').classList.remove('active');
                cargarDatos();

            } catch (error) {
                console.error('Error retirando de meta:', error);
                Swal.fire('Error', 'No se pudo procesar el retiro.', 'error');
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.innerText = 'Retirar dinero';
            }
        });
    }
});
