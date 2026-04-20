document.addEventListener("DOMContentLoaded", () => {
    // --- Lógica del Monto ---
    const inputVisual = document.getElementById('monto_visual');
    const inputOculto = document.getElementById('monto');

    if (inputVisual && inputOculto) {
        inputVisual.addEventListener('input', function(e) {
            let valorPuro = this.value.replace(/\D/g, '');
            if (valorPuro === '') {
                this.value = '';
                inputOculto.value = '';
                return;
            }
            let valorFormateado = new Intl.NumberFormat('es-CO').format(valorPuro);
            this.value = `$ ${valorFormateado}`;
            inputOculto.value = valorPuro;
        });
    }

    const formatearMoneda = (valor) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(valor);

    // --- Cargar Datos Reales ---
    fetch('../index.php?action=obtenerEstadisticas') 
        .then(response => response.json())
        .then(data => {
            if (data.error) return; 

            // A. Actualizar Tarjetas de Ingresos y Gastos
            const cardIngresos = document.querySelector('.incomesGreen-card .card-value');
            const cardGastos = document.querySelector('.outcomes-card .card-value');
            
            if (cardIngresos) cardIngresos.innerText = formatearMoneda(data.totales.ingresos);
            if (cardGastos) cardGastos.innerText = formatearMoneda(data.totales.gastos);

            // B. Preparar la Gráfica
            const canvasCategorias = document.getElementById('graficaCategorias');
            const labelTotalDiv = document.querySelector('.total-value');
            
            if (canvasCategorias) {
                const ctxCategorias = canvasCategorias.getContext('2d');
                
                // CONDICIÓN: ¿Hay gastos registrados?
                if (data.categorias && data.categorias.length > 0) {
                    
                    // --- TIENE GASTOS: Dibujamos la gráfica normal ---
                    const labelsOriginales = data.categorias.map(cat => cat.nombre);
                    const dataValores = data.categorias.map(cat => parseFloat(cat.total));
                    
                    const totalGastos = dataValores.reduce((acc, valor) => acc + valor, 0);
                    if(labelTotalDiv) labelTotalDiv.innerText = formatearMoneda(totalGastos);

                    const labelsConPorcentaje = labelsOriginales.map((label, index) => {
                        let porcentaje = ((dataValores[index] / totalGastos) * 100).toFixed(0);
                        return `${label}   ${porcentaje}%`;
                    });

                    const colores = ['#059669', '#10b981', '#047857', '#a7f3d0', '#34d399', '#6ee7b7'];

                    new Chart(ctxCategorias, {
                        type: 'doughnut',
                        data: {
                            labels: labelsConPorcentaje,
                            datasets: [{
                                data: dataValores,
                                backgroundColor: colores.slice(0, dataValores.length),
                                borderWidth: 0,
                                hoverOffset: 10
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            cutout: '80%',
                            plugins: {
                                legend: {
                                    position: 'right',
                                    labels: { usePointStyle: true, padding: 20, font: { size: 13, family: "'Inter', sans-serif" } }
                                },
                                tooltip: {
                                    callbacks: { label: function(context) { return ' Gastado: ' + formatearMoneda(context.raw); } }
                                }
                            }
                        }
                    });

                } else {
                    // --- NO HAY GASTOS: Dibujamos la dona gris vacía ---
                    if(labelTotalDiv) labelTotalDiv.innerText = "$ 0";

                    new Chart(ctxCategorias, {
                        type: 'doughnut',
                        data: {
                            labels: ['Sin gastos registrados'],
                            datasets: [{
                                data: [1], // Un valor de relleno para que dibuje el círculo
                                backgroundColor: ['#e2e8f0'], // Color gris claro de Tailwind
                                borderWidth: 0,
                                hoverOffset: 0 // Que no se mueva al pasar el mouse
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            cutout: '80%',
                            plugins: {
                                legend: {
                                    position: 'right',
                                    labels: { usePointStyle: true, padding: 20, font: { size: 13, family: "'Inter', sans-serif" } }
                                },
                                tooltip: { enabled: false } // Desactivamos el tooltip para que no salga
                            }
                        }
                    });
                }
            }
        })
        .catch(error => console.error("Error al cargar estadísticas:", error));
});