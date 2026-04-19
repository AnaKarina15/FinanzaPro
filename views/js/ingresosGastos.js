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

    // --- Lógica de la Gráfica de Gastos ---
    const canvasCategorias = document.getElementById('graficaCategorias');
    
    if (canvasCategorias) {
        const ctxCategorias = canvasCategorias.getContext('2d');
        
        // 1. Aquí pondremos los valores REALES que traeremos de PHP (dinero gastado)
        const dataValores = [828000, 460000, 276000, 276500]; // Suma total: 1,840,500
        const labelsOriginales = ['Alimentación', 'Transporte', 'Ocio', 'Otros'];

        // 2. Calculamos el Total sumando los valores
        const totalGastos = dataValores.reduce((acc, valor) => acc + valor, 0);

        // Formateador de moneda (Pesos Colombianos)
        const formatearMoneda = (valor) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(valor);

        // 3. Actualizamos el HTML del centro de la dona automáticamente
        const labelTotalDiv = document.querySelector('.total-value');
        if(labelTotalDiv) labelTotalDiv.innerText = formatearMoneda(totalGastos);

        // 4. Calculamos los porcentajes para la leyenda
        const labelsConPorcentaje = labelsOriginales.map((label, index) => {
            let porcentaje = ((dataValores[index] / totalGastos) * 100).toFixed(0);
            return `${label}   ${porcentaje}%`;
        });

        // 5. Dibujamos la gráfica
        new Chart(ctxCategorias, {
            type: 'doughnut',
            data: {
                labels: labelsConPorcentaje, // Usamos los textos con %
                datasets: [{
                    data: dataValores, // Usamos los valores en dinero real
                    backgroundColor: ['#059669', '#10b981', '#047857', '#a7f3d0'],
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
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: { size: 13, family: "'Inter', sans-serif" }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            // 6. Al pasar el mouse, mostramos el valor formateado en plata
                            label: function(context) {
                                return ' Gastado: ' + formatearMoneda(context.raw);
                            }
                        }
                    }
                }
            }
        });
    }
});