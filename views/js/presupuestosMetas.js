document.addEventListener('DOMContentLoaded', () => {
    const kebabBtns = document.querySelectorAll('.kebab-btn');
    
    // Toggle dropdown
    kebabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Evita que el clic se propague al document y cierre inmediatamente
            const dropdown = btn.nextElementSibling;
            
            // Cierra todos los otros menús primero
            document.querySelectorAll('.kebab-dropdown.show').forEach(menu => {
                if(menu !== dropdown) {
                    menu.classList.remove('show');
                }
            });
            
            // Alternar el actual
            dropdown.classList.toggle('show');
        });
    });
    
    // Cierra el dropdown si se hace clic fuera del menú
    document.addEventListener('click', () => {
        document.querySelectorAll('.kebab-dropdown.show').forEach(menu => {
            menu.classList.remove('show');
        });
    });

    // Evita que los clics dentro del menú lo cierren
    document.querySelectorAll('.kebab-dropdown').forEach(menu => {
        menu.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });

    // Lógica para toggle de Mensual / Anual
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            toggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // Aquí iría la lógica para cargar datos mensuales o anuales si fuera dinámica
        });
    });

    // --- LÓGICA DE MODALES ---
    const modalNuevaMeta = document.getElementById('modalNuevaMeta');
    const modalNuevoPresupuesto = document.getElementById('modalNuevoPresupuesto');
    
    const btnNuevaMeta = document.getElementById('btn-nueva-meta');
    const btnNuevoPresupuesto = document.getElementById('btn-nuevo-presupuesto');

    const btnCerrarMeta = document.getElementById('btn-cerrar-meta');
    const btnCancelarMeta = document.getElementById('btn-cancelar-meta');

    const btnCerrarPresupuesto = document.getElementById('btn-cerrar-presupuesto');
    const btnCancelarPresupuesto = document.getElementById('btn-cancelar-presupuesto');

    // Abrir modales (Usando delegación de eventos para evitar problemas al recargar el DOM)
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
            const modalTitle = document.getElementById('modal-titulo-meta');
            if (modalTitle) modalTitle.innerText = "Nueva Meta de Ahorro";
            const btnSubmit = document.getElementById('btn-submit-meta');
            if (btnSubmit) btnSubmit.innerText = "Crear Meta";
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
            const modalTitle = document.getElementById('modal-titulo-presupuesto');
            if (modalTitle) modalTitle.innerText = "Nuevo Presupuesto";
            const textSubmit = document.getElementById('text-submit-presupuesto');
            if (textSubmit) textSubmit.innerText = "Asignar Presupuesto";
            modalNuevoPresupuesto.classList.add('active');
        }
    });

    // Cerrar modales
    const closeMetaModal = () => modalNuevaMeta.classList.remove('active');
    const closePresupuestoModal = () => modalNuevoPresupuesto.classList.remove('active');

    if(btnCerrarMeta) btnCerrarMeta.addEventListener('click', closeMetaModal);
    if(btnCancelarMeta) btnCancelarMeta.addEventListener('click', closeMetaModal);

    if(btnCerrarPresupuesto) btnCerrarPresupuesto.addEventListener('click', closePresupuestoModal);
    if(btnCancelarPresupuesto) btnCancelarPresupuesto.addEventListener('click', closePresupuestoModal);

    // Selección de Íconos en Meta
    const iconOptions = document.querySelectorAll('.icon-option');
    iconOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remover 'active' de todos
            iconOptions.forEach(opt => opt.classList.remove('active'));
            // Añadir 'active' al clickeado
            this.classList.add('active');
            
            // Marcar el radio input correspondiente
            const radio = this.querySelector('input[type="radio"]');
            if(radio) radio.checked = true;
        });
    });

    // --- MANEJO DE FORMULARIOS POR FETCH ---
    const formMeta = document.getElementById('form-meta');
    if(formMeta) {
        formMeta.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(formMeta);
            
            // Limpiar formato de moneda antes de enviar
            const inputObj = formMeta.querySelector('input[name="monto_objetivo"]');
            if(inputObj) formData.set('monto_objetivo', inputObj.value.replace(/,/g, ''));
            try {
                const response = await fetch('../index.php?action=guardarMeta', {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();
                if(data.exito) {
                    Swal.fire('¡Éxito!', data.mensaje, 'success');
                    closeMetaModal();
                    formMeta.reset();
                    cargarDatos();
                } else {
                    Swal.fire('Error', data.mensaje, 'error');
                }
            } catch (error) {
                Swal.fire('Error', 'Ocurrió un error de red.', 'error');
            }
        });
    }

    const formPresupuesto = document.getElementById('form-presupuesto');
    if(formPresupuesto) {
        formPresupuesto.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(formPresupuesto);
            
            // Limpiar formato de moneda antes de enviar
            const inputLim = formPresupuesto.querySelector('input[name="monto_limite"]');
            if(inputLim) formData.set('monto_limite', inputLim.value.replace(/,/g, ''));
            try {
                const response = await fetch('../index.php?action=guardarPresupuesto', {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();
                if(data.exito) {
                    Swal.fire('¡Éxito!', data.mensaje, 'success');
                    closePresupuestoModal();
                    formPresupuesto.reset();
                    cargarDatos();
                } else {
                    Swal.fire('Error', data.mensaje, 'error');
                }
            } catch (error) {
                Swal.fire('Error', 'Ocurrió un error de red.', 'error');
            }
        });
    }

    // --- CARGA DE DATOS ---
    window.metasGlobales = [];
    window.presupuestosGlobales = [];

    async function cargarDatos() {
        try {
            const [resMetas, resPresupuestos] = await Promise.all([
                fetch('../index.php?action=obtenerMetas'),
                fetch('../index.php?action=obtenerPresupuestos')
            ]);
            
            const dataMetas = await resMetas.json();
            const dataPresupuestos = await resPresupuestos.json();
            
            if(dataMetas.exito) {
                window.metasGlobales = dataMetas.datos;
                renderMetas(dataMetas.datos);
            }
            if(dataPresupuestos.exito) {
                window.presupuestosGlobales = dataPresupuestos.datos;
                renderPresupuestos(dataPresupuestos.datos);
            }
        } catch (error) {
            console.error("Error cargando datos:", error);
        }
    }

    function renderMetas(metas) {
        const grid = document.getElementById('grid-metas');
        const btnNuevo = document.getElementById('btn-nueva-meta');
        
        // Limpiamos todo menos el botón de nuevo
        grid.innerHTML = '';
        
        metas.forEach(meta => {
            const obj = parseFloat(meta.monto_objetivo) || 0;
            const act = parseFloat(meta.monto_actual) || 0;
            const porcentaje = obj > 0 ? Math.min(100, Math.round((act / obj) * 100)) : 0;
            
            const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
            const montoObjFormatted = formatter.format(obj);
            const montoActFormatted = formatter.format(act);

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
                      <button class="dropdown-item" onclick="editarMeta(${meta.id_meta})">Editar</button>
                      <button class="dropdown-item dropdown-danger" onclick="eliminarMeta(${meta.id_meta})">Eliminar</button>
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
                    <span>${montoActFormatted}</span>
                    <span>${montoObjFormatted}</span>
                  </div>
                </div>
            `;
            grid.appendChild(card);
        });
        
        // Al final agregamos de nuevo el botón
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
                      <button class="dropdown-item" onclick="editarPresupuesto(${p.id_presupuesto})">Editar</button>
                      <button class="dropdown-item dropdown-danger" onclick="eliminarPresupuesto(${p.id_presupuesto})">Eliminar</button>
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

    // Funciones globales para los kebab menus generados dinámicamente
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
                const formData = new FormData();
                formData.append('id_meta', id);
                const res = await fetch('../index.php?action=eliminarMeta', { method: 'POST', body: formData });
                const data = await res.json();
                if(data.exito) {
                    Swal.fire('¡Eliminada!', 'Meta eliminada con éxito.', 'success');
                    cargarDatos();
                } else {
                    Swal.fire('Error', data.mensaje, 'error');
                }
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
                const formData = new FormData();
                formData.append('id_presupuesto', id);
                const res = await fetch('../index.php?action=eliminarPresupuesto', { method: 'POST', body: formData });
                const data = await res.json();
                if(data.exito) {
                    Swal.fire('¡Eliminado!', 'Presupuesto eliminado con éxito.', 'success');
                    cargarDatos();
                } else {
                    Swal.fire('Error', data.mensaje, 'error');
                }
            }
        });
    };

    window.editarMeta = function(id) {
        const meta = window.metasGlobales.find(m => m.id_meta == id);
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
        const p = window.presupuestosGlobales.find(p => p.id_presupuesto == id);
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
            // Update active styling
            form.querySelectorAll('.icon-option').forEach(l => l.classList.remove('active'));
            radio.closest('.icon-option').classList.add('active');
        }

        document.getElementById('modalNuevoPresupuesto').classList.add('active');
    };

    // Formatear inputs de dinero al escribir
    const moneyInputs = document.querySelectorAll('input[name="monto_limite"], input[name="monto_objetivo"]');
    moneyInputs.forEach(input => {
        input.type = 'text'; // Cambiamos de number a text para permitir comas
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

    // Cargar datos iniciales
    cargarDatos();
});
