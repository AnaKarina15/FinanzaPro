document.addEventListener("DOMContentLoaded", () => {
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

    let movimientosGlobales = [];
    let filtroTipoSeleccionado = 'todos';
    let filtroTiempoSeleccionado = 'esteMes';

    const obtenerRangoTiempo = (tipo) => {
        const hoy = new Date();
        const inicio = new Date(hoy);
        const fin = new Date(hoy);

        switch (tipo) {
            case 'hoy':
                return { desde: inicio, hasta: fin };
            case 'estaSemana':
                const diaSemana = hoy.getDay();
                const desde = new Date(hoy);
                const hasta = new Date(hoy);
                // Tomamos lunes como inicio de semana
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

    const aplicarFiltros = () => {
        const rango = obtenerRangoTiempo(filtroTiempoSeleccionado);
        const tabla = document.getElementById('tabla-movimientos-body');
        const movsFiltrados = movimientosGlobales.filter(mov => {
            const coincideTipo = filtroTipoSeleccionado === 'todos' || mov.tipo === filtroTipoSeleccionado;
            const coincideTiempo = estaDentroDelRango(mov.fecha, rango);
            return coincideTipo && coincideTiempo;
        });

        if (tabla) {
            if (movsFiltrados.length === 0) {
                tabla.innerHTML = '<tr><td colspan="5" class="empty-table-msg">No hay transacciones para este filtro.</td></tr>';
            } else {
                tabla.innerHTML = '';
                movsFiltrados.forEach(mov => {
                    const esG = mov.tipo === 'gasto';
                    const fecha = new Date(mov.fecha + 'T00:00:00').toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' });
                    const descripcionCompleta = String(mov.descripcion || '');
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
                                        <a href="#" class="action-edit" data-id="${mov.id_transaccion}" data-tipo="${mov.tipo}" data-monto="${mov.monto}" data-fecha="${mov.fecha}" data-cat="${escapeHtml(mov.categoria)}" data-desc="${escapeHtml(descripcionCompleta)}">
                                            <span class="material-symbols-outlined dropdown-icon">edit</span> Modificar
                                        </a>
                                        <a href="#" class="action-delete" data-id="${mov.id_transaccion}">
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
            el.classList.toggle('filter-active', el.dataset.filter === filtroTipoSeleccionado);
        });
        document.querySelectorAll('.filter-time-option').forEach(el => {
            el.classList.toggle('filter-time-active', el.dataset.time === filtroTiempoSeleccionado);
        });
        const label = document.getElementById('filter-time-label');
        if (label) {
            label.innerText = document.querySelector(`.filter-time-option[data-time="${filtroTiempoSeleccionado}"]`)?.innerText || 'Este Mes';
        }
    };

    // --- RENDERIZADO DE GRÁFICAS Y LEYENDAS ---
    function renderizarDonaYleyenda(canvasId, centerId, legendId, dataset, totalGlobal, colores, tipo) {
        const canvas = document.getElementById(canvasId);
        const centerLabel = document.getElementById(centerId);
        const legendContainer = document.getElementById(legendId);

        if (!canvas) return;

        const chartExistente = Chart.getChart(canvas);
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
            const claseColor = `dot-${tipo}-${index % 4}`;
            
            legendContainer.innerHTML += `
                <div class="legend-item">
                    <div class="legend-item-left">
                        <div class="legend-dot ${claseColor}"></div>
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
    }

    // --- FETCH DE DATOS ---
    console.log("Iniciando petición al servidor...");

    fetch('../index.php?action=obtenerEstadisticas') 
        .then(res => {
            if (!res.ok) throw new Error("Error de red o HTTP: " + res.status);
            return res.text();
        })
        .then(texto => {
            console.log("Respuesta cruda de PHP:", texto); 
            const data = JSON.parse(texto);
            
            if (data.error) {
                console.error("PHP detuvo el proceso por este error:", data.error);
                return;
            }

            console.log("Datos procesados correctamente:", data);

            const totalI = parseFloat(data.totales?.ingresos) || 0;
            const totalG = parseFloat(data.totales?.gastos) || 0;
            
            document.getElementById('total-ingresos-view').innerText = formatearMoneda(totalI);
            document.getElementById('total-gastos-view').innerText = formatearMoneda(totalG);

            renderizarDonaYleyenda('graficaIngresos', 'center-ingresos', 'legend-ingresos-list', data.categoriasIngresos, totalI, ['#059669', '#34d399', '#6ee7b7', '#a7f3d0'], 'ingreso');
            renderizarDonaYleyenda('graficaGastos', 'center-gastos', 'legend-gastos-list', data.categoriasGastos, totalG, ['#ef4444', '#f97316', '#eab308', '#cbd5e1'], 'gasto');

            movimientosGlobales = Array.isArray(data.movimientos) ? data.movimientos : [];
            aplicarFiltros();
        })
        .catch(err => console.error("Error catastrófico en Fetch:", err));
        
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
            filtroTipoSeleccionado = opcionTipo.dataset.filter;
            aplicarFiltros();
            return;
        }

        const opcionTiempo = e.target.closest('.filter-time-option');
        if (opcionTiempo) {
            e.preventDefault();
            filtroTiempoSeleccionado = opcionTiempo.dataset.time;
            if (dropdownTime) dropdownTime.classList.remove('open');
            aplicarFiltros();
            return;
        }
    });
    
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
            }).then((result) => {
                if (result.isConfirmed) {
                    fetch('../index.php?action=eliminarMovimiento', {
                        method: 'POST',
                        body: JSON.stringify({ id_transaccion: id })
                    }).then(res => res.json()).then(resData => {
                        if(resData.exito) {
                            Swal.fire({ title: '¡Eliminado!', icon: 'success', confirmButtonColor: '#059669' })
                            .then(() => window.location.reload());
                        }
                    });
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
            
            actualizarContadorDescripcion();
            document.getElementById('modalNuevoMovimiento').classList.add('active');
        });
    }

    const descripcionTextarea = document.getElementById('descripcion');
    if (descripcionTextarea) {
        descripcionTextarea.addEventListener('input', actualizarContadorDescripcion);
        actualizarContadorDescripcion();
    }

    // --- CERRAR MODAL ---
    const btnCerrarModal = document.getElementById('btn-cerrar-modal');
    if (btnCerrarModal) {
        btnCerrarModal.addEventListener('click', () => {
            document.getElementById('modalNuevoMovimiento').classList.remove('active');
        });
    }
});