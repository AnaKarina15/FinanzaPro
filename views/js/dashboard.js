document.addEventListener("DOMContentLoaded", () => {
    const formatearMoneda = (valor) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(valor);

    // --- MANEJO DE ALERTAS DE BIENVENIDA ---
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("registro") && urlParams.get("registro") === "exito") {
        Swal.fire({
            title: "¡Cuenta Creada!",
            text: "Tu registro fue exitoso. Bienvenido a FinanzaPro.",
            icon: "success",
            confirmButtonColor: "#059669",
            confirmButtonText: "Empezar"
        });

        // Limpiamos la URL para que no vuelva a salir la alerta si recargan la página
        window.history.replaceState(null, null, window.location.pathname);
    }

    // Intentamos traer los datos
    fetch('../index.php?action=obtenerEstadisticas')
        .then(response => response.json())
        .then(data => {
            console.log("Datos del Dashboard:", data);

            if (data.error) {
                console.error("Sesión no encontrada");
                return;
            }

            // --- ACTUALIZAR TARJETAS ---
            const ing = parseFloat(data.totales.ingresos) || 0;
            const gas = parseFloat(data.totales.gastos) || 0;
            
            if(document.getElementById('monto-disponible')) document.getElementById('monto-disponible').innerText = formatearMoneda(ing - gas);
            if(document.getElementById('monto-ingresos')) document.getElementById('monto-ingresos').innerText = formatearMoneda(ing);
            if(document.getElementById('monto-gastos')) document.getElementById('monto-gastos').innerText = formatearMoneda(gas);

            // --- ACTUALIZAR GRÁFICA DE BARRAS ---
            const canvas = document.querySelector(".incomes-outcomes-chart");
            if (canvas && data.mensual) {
                const chartExistente = Chart.getChart(canvas);
                if (chartExistente) { chartExistente.destroy(); }

                let dIngresos = new Array(12).fill(0);
                let dGastos = new Array(12).fill(0);

                if (data.mensual) {
                    data.mensual.forEach(m => {
                        dIngresos[parseInt(m.mes) - 1] = parseFloat(m.total_ingresos);
                        dGastos[parseInt(m.mes) - 1] = parseFloat(m.total_gastos);
                    });
                }

                new Chart(canvas, {
                    type: "bar",
                    data: {
                        labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
                        datasets: [
                            { label: "Ingresos", data: dIngresos, borderRadius: 32, backgroundColor: "#05966990" },
                            { label: "Gastos", data: dGastos, borderRadius: 32, backgroundColor: "#2563eb90" }
                        ]
                    },
                    options: { maintainAspectRatio: false }
                });
            }

            // --- ACTUALIZAR TABLA DE MOVIMIENTOS ---
            const tablaCuerpo = document.querySelector('.movimientos-tabla-cuerpo');
            if (tablaCuerpo && data.movimientos) {
                tablaCuerpo.innerHTML = '';

                if (data.movimientos.length === 0) {
                    tablaCuerpo.innerHTML = `<tr><td colspan="4" class="empty-table-msg">Sin actividad reciente.</td></tr>`;
                    return;
                }

                const ultimos2 = data.movimientos.slice(0, 2);

                ultimos2.forEach(mov => {
                    const esGasto = mov.tipo === 'gasto';
                    const colorMonto = esGasto ? 'text-danger' : 'text-success';
                    const signo = esGasto ? '-' : '+';
                    const iconType = esGasto ? 'shopping_bag' : 'business_center';
                    const iconBg = esGasto ? 'icon-blue' : 'icon-green';

                    const dateObj = new Date(mov.fecha + 'T00:00:00');
                    const fechaFormato = dateObj.toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' });

                    tablaCuerpo.innerHTML += `
                        <tr>
                            <td class="table-date">${fechaFormato}</td>
                            <td class="table-desc">
                                <div class="table-concept">
                                    <span class="material-symbols-outlined concept-icon ${iconBg}">${iconType}</span>
                                    <strong>${mov.descripcion}</strong>
                                </div>
                            </td>
                            <td>
                                <span class="badge badge-neutral">${mov.categoria}</span>
                            </td>
                            <td class="${colorMonto}">
                                ${signo}${formatearMoneda(mov.monto)}
                            </td>
                        </tr>
                    `;
                });
            }
        })
        .catch(err => console.error("Error en Fetch:", err));


    // --- LÓGICA DEL INPUT DE MONTO (Formateo automático) ---
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

    // --- ABRIR MODAL (Manejador basado en ID) ---
    const btnAbrirModal = document.getElementById('btn-abrir-modal');
    if (btnAbrirModal) {
        btnAbrirModal.addEventListener('click', () => {
            const form = document.getElementById('form-movimiento');
            if(form) form.reset();
            
            document.getElementById('modal-titulo').innerText = "Registro de Movimientos";
            document.getElementById('id_transaccion').value = "";
            
            if(inputVisual) inputVisual.value = '';
            
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
});