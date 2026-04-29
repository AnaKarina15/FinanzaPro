import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { collection, addDoc, getDocs, doc, getDoc, deleteDoc, updateDoc, query, where } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

let currentUid = null;
let domListo = false;

// Llamar carga cuando tanto Auth como DOM estén listos
function intentarCargar() {
    if (currentUid && domListo) {
        cargarCategoriasDePresupuestos();
        window.cargarDatosFirestore();
    }
}

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

        intentarCargar();
    } else {
        window.location.href = '../index.php';
    }
});

const cargarCategoriasDePresupuestos = async () => {
    if (!currentUid) return;
    try {
        const presupuestosRef = collection(db, "presupuestos");
        const q = query(presupuestosRef, where("id_usuario", "==", currentUid));
        const querySnapshot = await getDocs(q);
        
        const datalist = document.getElementById('lista-categorias');
        if (datalist) {
            let categories = new Set(['Alimentación', 'Transporte', 'Ocio', 'Servicios Públicos', 'Salario']);
            querySnapshot.forEach(docSnap => {
                const data = docSnap.data();
                if (data.categoria) categories.add(data.categoria);
            });
            
            datalist.innerHTML = '';
            categories.forEach(cat => {
                datalist.innerHTML += `<option value="${cat}"></option>`;
            });
        }
    } catch (error) {
        console.error("Error al cargar categorías:", error);
    }
};

document.addEventListener("DOMContentLoaded", () => {
    domListo = true;
    intentarCargar();
    // --- FORMATTING LOGIC ---
    const inputVisual = document.getElementById('monto_visual');
    const inputOculto = document.getElementById('monto');
    
    if (inputVisual && inputOculto) {
        inputVisual.addEventListener('input', function() {
            let valorPuro = this.value.replace(/\D/g, '');
            if (valorPuro === '') { this.value = ''; inputOculto.value = ''; return; }
            this.value = `$ ${new Intl.NumberFormat('es-CO').format(valorPuro)}`;
            inputOculto.value = valorPuro;
        });
    }

    const formatearMoneda = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v);

    const escapeHtml = (str) => String(str || '').replace(/[&<>"']/g, (match) => {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[match];
    });

    const formatearDescripcion = (desc, maxChars = 70) => {
        const texto = String(desc || '');
        return texto.length > maxChars ? texto.slice(0, maxChars) + '...' : texto;
    };

    const actualizarContadorDescripcion = () => {
        const textarea = document.getElementById('descripcion');
        const contador = document.getElementById('descripcion-counter');
        if (!textarea || !contador) return;
        const longitud = textarea.value.length;
        const maximo = textarea.getAttribute('maxlength') || 120;
        contador.innerText = `${longitud}/${maximo}`;
    };

    const descripcionTextarea = document.getElementById('descripcion');
    if (descripcionTextarea) {
        descripcionTextarea.addEventListener('input', actualizarContadorDescripcion);
        actualizarContadorDescripcion();
    }

    // --- FILTROS LOGIC ---
    window.movimientosGlobales = [];
    window.filtroTipoSeleccionado = 'todos';
    window.filtroTiempoSeleccionado = 'esteMes';
    window.terminoBusqueda = '';

    const obtenerRangoTiempo = (tipo) => {
        const hoy = new Date();
        const inicio = new Date(hoy);
        const fin = new Date(hoy);

        switch (tipo) {
            case 'hoy':
                inicio.setHours(0, 0, 0, 0);
                fin.setHours(23, 59, 59, 999);
                return { desde: inicio, hasta: fin };
            case 'estaSemana':
                const diaSemana = hoy.getDay();
                const desde = new Date(hoy);
                const hasta = new Date(hoy);
                desde.setDate(hoy.getDate() - ((diaSemana + 6) % 7));
                hasta.setDate(desde.getDate() + 6);
                desde.setHours(0, 0, 0, 0);
                hasta.setHours(23, 59, 59, 999);
                return { desde, hasta };
            case 'esteAño':
                inicio.setMonth(0, 1);
                inicio.setHours(0, 0, 0, 0);
                fin.setMonth(11, 31);
                fin.setHours(23, 59, 59, 999);
                return { desde: inicio, hasta: fin };
            case 'esteMes':
            default:
                inicio.setDate(1);
                inicio.setHours(0, 0, 0, 0);
                fin.setMonth(hoy.getMonth() + 1, 0);
                fin.setHours(23, 59, 59, 999);
                return { desde: inicio, hasta: fin };
        }
    };

    const estaDentroDelRango = (fecha, rango) => {
        const fechaObj = new Date(fecha + 'T00:00:00');
        return fechaObj >= rango.desde && fechaObj <= rango.hasta;
    };

    window.aplicarFiltros = () => {
        const rango = obtenerRangoTiempo(window.filtroTiempoSeleccionado);
        const tabla = document.getElementById('tabla-movimientos-body');
        const termino = window.terminoBusqueda.toLowerCase().trim();

        const movsFiltrados = window.movimientosGlobales.filter(mov => {
            const coincideTipo = window.filtroTipoSeleccionado === 'todos' || mov.tipo === window.filtroTipoSeleccionado;
            const coincideTiempo = estaDentroDelRango(mov.fecha, rango);

            // Filtro de búsqueda
            let coincideBusqueda = true;
            if (termino) {
                const desc = (mov.descripcion || '').toLowerCase();
                const cat = (mov.categoria || '').toLowerCase();
                const montoStr = String(mov.monto || '');
                const montoFormateado = formatearMoneda(mov.monto).toLowerCase();
                coincideBusqueda = desc.includes(termino) || cat.includes(termino) || montoStr.includes(termino) || montoFormateado.includes(termino);
            }

            return coincideTipo && coincideTiempo && coincideBusqueda;
        });

        if (tabla) {
            if (movsFiltrados.length === 0) {
                const mensajeVacio = termino
                    ? `No se encontraron transacciones para "<strong>${termino}</strong>".`
                    : 'No hay transacciones para este filtro.';
                tabla.innerHTML = `<tr><td colspan="5" class="empty-table-msg">${mensajeVacio}</td></tr>`;
            } else {
                tabla.innerHTML = '';
                movsFiltrados.forEach(mov => {
                    const esG = mov.tipo === 'gasto';
                    const fecha = new Date(mov.fecha + 'T00:00:00').toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' });
                    const descripcionString = (mov.descripcion || '').trim();
                    const descripcionCompleta = descripcionString !== '' ? descripcionString : 'Sin descripción';
                    const descripcionCortada = formatearDescripcion(descripcionCompleta, 70);
                    tabla.innerHTML += `
                        <tr>
                            <td class="table-date">${fecha}</td>
                            <td class="table-desc">
                                <div class="table-concept">
                                    <span class="material-symbols-outlined concept-icon ${esG ? 'icon-blue' : 'icon-green'}">${esG ? 'shopping_bag' : 'business_center'}</span>
                                    <span class="truncate-desc" title="${escapeHtml(descripcionCompleta)}">${escapeHtml(descripcionCortada)}</span>
                                </div>
                            </td>
                            <td><span class="badge badge-neutral">${escapeHtml(mov.categoria)}</span></td>
                            <td class="${esG ? 'text-danger' : 'text-success'}">${esG ? '-' : '+'}${formatearMoneda(mov.monto)}</td>
                            <td class="table-actions">
                                <div class="dropdown-menu">
                                    <button class="btn-icon-only"><span class="material-symbols-outlined">more_vert</span></button>
                                    <div class="dropdown-content">
                                        <a href="#" class="action-edit" data-id="${mov.id}" data-tipo="${mov.tipo}" data-monto="${mov.monto}" data-fecha="${mov.fecha}" data-cat="${escapeHtml(mov.categoria)}" data-desc="${escapeHtml(descripcionCompleta)}">
                                            <span class="material-symbols-outlined dropdown-icon">edit</span> Modificar
                                        </a>
                                        <a href="#" class="action-delete" data-id="${mov.id}">
                                            <span class="material-symbols-outlined dropdown-icon">delete</span> Eliminar
                                        </a>
                                    </div>
                                </div>
                            </td>
                        </tr>`;
                });
            }
        }
        actualizarFiltrosVisuales();
    };

    const actualizarFiltrosVisuales = () => {
        document.querySelectorAll('.filter-option').forEach(el => {
            el.classList.toggle('filter-active', el.dataset.filter === window.filtroTipoSeleccionado);
        });
        document.querySelectorAll('.filter-time-option').forEach(el => {
            el.classList.toggle('filter-time-active', el.dataset.time === window.filtroTiempoSeleccionado);
        });
        const label = document.getElementById('filter-time-label');
        if (label) {
            label.innerText = document.querySelector(`.filter-time-option[data-time="${window.filtroTiempoSeleccionado}"]`)?.innerText || 'Este Mes';
        }
    };

    const dropdownTime = document.getElementById('filter-time-dropdown');
    if (dropdownTime) {
        dropdownTime.addEventListener('click', (e) => {
            if (e.target.closest('.filter-time-option')) return;
            e.stopPropagation();
            dropdownTime.classList.toggle('open');
        });
    }

    document.addEventListener('click', (e) => {
        if (dropdownTime && !dropdownTime.contains(e.target)) {
            dropdownTime.classList.remove('open');
        }

        const opcionTipo = e.target.closest('.filter-option');
        if (opcionTipo) {
            e.preventDefault();
            window.filtroTipoSeleccionado = opcionTipo.dataset.filter;
            window.aplicarFiltros();
            return;
        }

        const opcionTiempo = e.target.closest('.filter-time-option');
        if (opcionTiempo) {
            e.preventDefault();
            window.filtroTiempoSeleccionado = opcionTiempo.dataset.time;
            if (dropdownTime) dropdownTime.classList.remove('open');
            window.aplicarFiltros();
            return;
        }
    });

    // --- BARRA DE BÚSQUEDA ---
    const inputBuscar = document.getElementById('buscar-transaccion');
    const btnLimpiarBusqueda = document.getElementById('search-clear-btn');

    if (inputBuscar) {
        inputBuscar.addEventListener('input', () => {
            window.terminoBusqueda = inputBuscar.value;
            if (btnLimpiarBusqueda) {
                btnLimpiarBusqueda.style.display = inputBuscar.value.length > 0 ? 'flex' : 'none';
            }
            window.aplicarFiltros();
        });
    }

    if (btnLimpiarBusqueda) {
        btnLimpiarBusqueda.addEventListener('click', () => {
            if (inputBuscar) inputBuscar.value = '';
            window.terminoBusqueda = '';
            btnLimpiarBusqueda.style.display = 'none';
            window.aplicarFiltros();
            if (inputBuscar) inputBuscar.focus();
        });
    }

    // --- RENDERIZADO DE GRÁFICAS Y LEYENDAS ---
    window.renderizarDonaYleyenda = function(canvasId, centerId, legendId, dataset, totalGlobal, colores, tipo) {
        const canvas = document.getElementById(canvasId);
        const centerLabel = document.getElementById(centerId);
        const legendContainer = document.getElementById(legendId);

        if (!canvas) return;

        let chartExistente = Chart.getChart(canvas);
        if (chartExistente) {
            chartExistente.destroy();
        }

        if (!dataset || dataset.length === 0) {
            centerLabel.innerText = "$ 0";
            legendContainer.innerHTML = '<p class="empty-table-msg">Sin movimientos</p>';
            new Chart(canvas.getContext('2d'), {
                type: 'doughnut',
                data: { labels: ['Vacio'], datasets: [{ data: [1], backgroundColor: ['#e2e8f0'], borderWidth: 0 }] },
                options: { responsive: true, maintainAspectRatio: false, cutout: '80%', plugins: { legend: { display: false } } }
            });
            return;
        }
        
        centerLabel.innerText = formatearMoneda(totalGlobal);
        legendContainer.innerHTML = '';

        dataset.forEach((cat, index) => {
            let porcentaje = ((parseFloat(cat.total) / totalGlobal) * 100).toFixed(0);
            const colorDot = colores[index % colores.length];
            
            legendContainer.innerHTML += `
                <div class="legend-item">
                    <div class="legend-item-left">
                        <div class="legend-dot" style="background-color: ${colorDot};"></div>
                        <span>${cat.nombre}</span>
                    </div>
                    <span class="legend-percent">${porcentaje}%</span>
                </div>`;
        });

        new Chart(canvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: dataset.map(c => c.nombre),
                datasets: [{ data: dataset.map(c => parseFloat(c.total)), backgroundColor: colores, borderWidth: 0 }]
            },
            options: { responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { legend: { display: false } } }
        });
    };

    // --- ABRIR MODAL (NUEVO MOVIMIENTO) ---
    const btnAbrirModal = document.getElementById('btn-abrir-modal');
    if (btnAbrirModal) {
        btnAbrirModal.addEventListener('click', () => {
            const form = document.getElementById('form-movimiento');
            if(form) form.reset();
            
            document.getElementById('modal-titulo').innerText = "Registro de Movimientos";
            document.getElementById('id_transaccion').value = ""; 
            
            const inputVisual = document.getElementById('monto_visual');
            if(inputVisual) inputVisual.value = '';

            // Poner fecha de hoy por defecto
            const hoy = new Date();
            const fechaHoy = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');
            const inputFechaModal = document.getElementById('fecha');
            if (inputFechaModal) inputFechaModal.value = fechaHoy;

            actualizarContadorDescripcion();
            document.getElementById('modalNuevoMovimiento').classList.add('active');
        });
    }

    // --- CERRAR MODAL ---
    const btnCerrarModal = document.getElementById('btn-cerrar-modal');
    if (btnCerrarModal) {
        btnCerrarModal.addEventListener('click', () => {
            document.getElementById('modalNuevoMovimiento').classList.remove('active');
        });
    }
    
    // --- DELEGACIÓN DE EVENTOS (EDITAR / ELIMINAR) ---
    document.addEventListener('click', (e) => {
        // ACCIÓN ELIMINAR
        const btnDelete = e.target.closest('.action-delete');
        if (btnDelete) {
            e.preventDefault();
            const id = btnDelete.dataset.id;
            Swal.fire({
                title: '¿Eliminar movimiento?',
                text: "Esta acción no se puede deshacer.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#059669',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        await deleteDoc(doc(db, "transacciones", id));
                        Swal.fire('¡Eliminado!', 'Movimiento eliminado', 'success');
                        window.cargarDatosFirestore();
                    } catch (error) {
                        Swal.fire('Error', 'No se pudo eliminar', 'error');
                    }
                }
            });
        }

        // ACCIÓN MODIFICAR
        const btnEdit = e.target.closest('.action-edit');
        if (btnEdit) {
            e.preventDefault();
            const d = btnEdit.dataset;
            document.getElementById('modal-titulo').innerText = "Editar Movimiento";
            document.getElementById('id_transaccion').value = d.id;
            document.querySelector(`input[name="tipo_movimiento"][value="${d.tipo}"]`).checked = true;
            document.getElementById('fecha').value = d.fecha;
            document.getElementById('categoria').value = d.cat;
            document.getElementById('descripcion').value = d.desc;
            document.getElementById('monto').value = d.monto;
            document.getElementById('monto_visual').value = `$ ${new Intl.NumberFormat('es-CO').format(d.monto)}`;
            actualizarContadorDescripcion();
            document.getElementById('modalNuevoMovimiento').classList.add('active');
        }
    });

    // --- ENVIAR FORMULARIO (NUEVO/EDITAR) A FIRESTORE ---
    const formMovimiento = document.getElementById("form-movimiento");
    if (formMovimiento) {
        formMovimiento.addEventListener("submit", async (e) => {
            e.preventDefault();
            if(!currentUid) return;

            const btn = formMovimiento.querySelector(".btn-modal-submit");
            btn.disabled = true;
            btn.textContent = "Guardando...";

            const idTransaccion = document.getElementById("id_transaccion").value;
            const tipo = formMovimiento.querySelector("input[name='tipo_movimiento']:checked").value;
            const monto = parseFloat(document.getElementById("monto").value);
            const fecha = document.getElementById("fecha").value;
            const categoria = document.getElementById("categoria").value;
            const descripcion = document.getElementById("descripcion").value;

            try {
                if (idTransaccion) {
                    await updateDoc(doc(db, "transacciones", idTransaccion), {
                        tipo, monto, fecha, categoria, descripcion
                    });
                    Swal.fire("Éxito", "Movimiento actualizado", "success");
                } else {
                    await addDoc(collection(db, "transacciones"), {
                        usuario_id: currentUid,
                        tipo, monto, fecha, categoria, descripcion
                    });
                    Swal.fire("Éxito", "Movimiento guardado", "success");
                }
                document.getElementById('modalNuevoMovimiento').classList.remove('active');
                formMovimiento.reset();
                window.cargarDatosFirestore();
            } catch (error) {
                console.error("Error guardando:", error);
                Swal.fire("Error", "Ocurrió un problema", "error");
            } finally {
                btn.disabled = false;
                btn.textContent = idTransaccion ? "Guardar Cambios" : "Guardar Transacción";
            }
        });
    }
});

// --- CARGAR DATOS DESDE FIRESTORE ---
window.cargarDatosFirestore = async () => {
    if(!currentUid) return;
    try {
        const q = query(collection(db, "transacciones"), where("usuario_id", "==", currentUid));
        const querySnapshot = await getDocs(q);
        
        let ing = 0;
        let gas = 0;
        const movimientos = [];
        const catIngresos = {};
        const catGastos = {};

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            movimientos.push({ id: docSnap.id, ...data });
            
            if (data.tipo === "ingreso") {
                ing += data.monto;
                if (!catIngresos[data.categoria]) catIngresos[data.categoria] = 0;
                catIngresos[data.categoria] += data.monto;
            }
            if (data.tipo === "gasto") {
                gas += data.monto;
                if (!catGastos[data.categoria]) catGastos[data.categoria] = 0;
                catGastos[data.categoria] += data.monto;
            }
        });

        movimientos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        document.getElementById('total-ingresos-view').innerText = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(ing);
        document.getElementById('total-gastos-view').innerText = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(gas);

        const mapCategorias = (obj) => Object.keys(obj).map(k => ({ nombre: k, total: obj[k] })).sort((a,b) => b.total - a.total);

        window.renderizarDonaYleyenda('graficaIngresos', 'center-ingresos', 'legend-ingresos-list', mapCategorias(catIngresos), ing, ['#059669', '#34d399', '#6ee7b7', '#a7f3d0'], 'ingreso');
        window.renderizarDonaYleyenda('graficaGastos', 'center-gastos', 'legend-gastos-list', mapCategorias(catGastos), gas, ['#ef4444', '#f97316', '#eab308', '#cbd5e1'], 'gasto');

        window.movimientosGlobales = movimientos;
        window.aplicarFiltros();

    } catch (error) {
        console.error("Error al cargar estadísticas:", error);
    }
};