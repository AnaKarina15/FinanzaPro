document.addEventListener("DOMContentLoaded", () => {
    const formatearMoneda = (valor) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(valor);

    // Intentamos traer los datos
    fetch('../index.php?action=obtenerEstadisticas')
        .then(response => response.json())
        .then(data => {
            console.log("Datos del Dashboard:", data); // Mira esto en F12 para ver si llegan los 920.000

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
            if (canvas) {
                // Si ya existe una gráfica en este canvas, la destruimos
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
                data.movimientos.forEach(mov => {
                    const esGasto = mov.tipo === 'gasto';
                    tablaCuerpo.innerHTML += `
                        <tr style="border-bottom: 1px solid #f3f4f6;">
                            <td style="padding: 15px;">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div style="background: #f3f4f6; padding: 8px; border-radius: 8px;">
                                        <span class="material-symbols-outlined" style="font-size: 20px;">
                                            ${esGasto ? 'shopping_bag' : 'payments'}
                                        </span>
                                    </div>
                                    <span style="font-weight: 500;">${mov.descripcion || 'Sin descripción'}</span>
                                </div>
                            </td>
                            <td>${mov.fecha}</td>
                            <td><span style="background: #e1fdec; color: #059669; padding: 4px 12px; border-radius: 20px; font-size: 12px;">${mov.categoria}</span></td>
                            <td style="font-weight: 600; color: ${esGasto ? '#ef4444' : '#10b981'}">
                                ${esGasto ? '-' : '+'}${formatearMoneda(mov.monto)}
                            </td>
                        </tr>
                    `;
                });
            }
        })
        .catch(err => console.error("Error en Fetch:", err));
});