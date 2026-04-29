import { db, auth } from './firebase-config.js';
import { collection, query, where, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { initNotificaciones } from "./notificaciones.js";

let currentUid = null;

// --- SEMESTRE HELPERS ---
function getSemestreActual() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-11
    // Semestre 1: Ene(0)-Jun(5), Semestre 2: Jul(6)-Dic(11)
    const semestre = month <= 5 ? 1 : 2;
    const startMonth = semestre === 1 ? 0 : 6; // 0=Ene, 6=Jul
    const mesesNombresCortos = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
    const mesesNombresLargos = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const labels = [];
    const prefixes = [];
    const labelsLargos = [];
    for (let i = 0; i < 6; i++) {
        const m = startMonth + i;
        labels.push(mesesNombresCortos[m]);
        labelsLargos.push(mesesNombresLargos[m]);
        prefixes.push(`${year}-${String(m + 1).padStart(2, '0')}`);
    }
    return { semestre, year, labels, prefixes, labelsLargos, startMonth };
}

function getSemestreAnterior() {
    const actual = getSemestreActual();
    const mesesNombresCortos = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
    let year, startMonth;
    if (actual.semestre === 1) {
        year = actual.year - 1;
        startMonth = 6; // Jul del año anterior
    } else {
        year = actual.year;
        startMonth = 0; // Ene del mismo año
    }
    const prefixes = [];
    for (let i = 0; i < 6; i++) {
        prefixes.push(`${year}-${String(startMonth + i + 1).padStart(2, '0')}`);
    }
    return { year, startMonth, prefixes };
}

const catColors = {
    "Alimentación": { bg: "#fecaca", text: "#b91c1c", fill: "#ef4444" },
    "Transporte": { bg: "#bfdbfe", text: "#1d4ed8", fill: "#3b82f6" },
    "Renta": { bg: "#fed7aa", text: "#c2410c", fill: "#f97316" },
    "Ocio": { bg: "#e9d5ff", text: "#7e22ce", fill: "#a855f7" },
    "Servicios Públicos": { bg: "#fef08a", text: "#a16207", fill: "#eab308" }
};
const defaultCatColor = { bg: "#e2e8f0", text: "#475569", fill: "#94a3b8" };

const catIcons = {
    "Alimentación": "restaurant",
    "Transporte": "directions_car",
    "Ocio": "sports_esports",
    "Servicios Públicos": "bolt",
    "Renta": "home"
};

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUid = user.uid;
            initNotificaciones(user.uid);
            
            // Actualizar perfil en el sidebar
            try {
                const userDoc = await getDoc(doc(db, "usuarios", currentUid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    const nombreCompleto = `${userData.nombre} ${userData.apellido}`.trim();
                    
                    const sideName = document.querySelector(".nav-profile .username");
                    if (sideName) sideName.textContent = nombreCompleto;
                    
                    const avatarImg = document.querySelector(".nav-profile img");
                    if (avatarImg) {
                        avatarImg.src = userData.fotoPerfil || `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreCompleto)}&background=059669&color=fff`;
                    }
                }
            } catch (err) {
                console.error("Error obteniendo perfil:", err);
            }

            cargarReportes();
        } else {
            window.location.href = '../index.php';
        }
    });

    const btnExportar = document.getElementById('btn-exportar');
    if (btnExportar) {
        btnExportar.addEventListener('click', async () => {
            try {
                // Cambiar estado del botón para dar feedback al usuario
                const originalHtml = btnExportar.innerHTML;
                btnExportar.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span> Generando...';
                btnExportar.disabled = true;

                const contenedorReporte = document.querySelector('.reportes-grid');
                
                // Configurar html2canvas
                const canvas = await html2canvas(contenedorReporte, {
                    scale: 2, // Mejor calidad
                    useCORS: true,
                    backgroundColor: '#ffffff'
                });

                const imgData = canvas.toDataURL('image/jpeg', 1.0);
                
                // 1. Configurar dimensiones base en px basadas en el tamaño real de la vista
                const { jsPDF } = window.jspdf;
                const xOffset = 80; // Mayor margen lateral
                let yOffset = 80; // Mayor margen superior
                
                // 2. Capturar el logo de la navbar
                let logoPrintHeight = 0;
                let logoPrintWidth = 0;
                let logoImgData = null;
                const logoContainer = document.querySelector('.logo-container');
                if (logoContainer) {
                    const logoCanvas = await html2canvas(logoContainer, { scale: 2, backgroundColor: null });
                    logoImgData = logoCanvas.toDataURL('image/png');
                    // Ampliamos el tamaño del logo para que destaque como encabezado principal
                    logoPrintWidth = logoCanvas.width * 1.6;
                    logoPrintHeight = logoCanvas.height * 1.6;
                }

                const fontSizePx = 100; // Título mucho más grande y legible
                const gap = 50; // Mayor espaciado entre el encabezado y el contenido
                
                const logoSpace = logoPrintHeight > 0 ? (logoPrintHeight + gap) : 0;
                const titleSpace = fontSizePx + gap;
                
                // Calcular el ancho y alto exactos de la página PDF
                const pdfWidth = canvas.width + (xOffset * 2);
                const pdfHeight = yOffset + logoSpace + titleSpace + canvas.height + yOffset;
                
                // Inicializar jsPDF con dimensiones y orientación dinámicas para evitar recortes
                const orientation = pdfWidth > pdfHeight ? 'l' : 'p';
                const pdf = new jsPDF(orientation, 'px', [pdfWidth, pdfHeight]);
                const sem = getSemestreActual();

                // 3. Dibujar elementos en el PDF
                if (logoImgData) {
                    pdf.addImage(logoImgData, 'PNG', xOffset, yOffset, logoPrintWidth, logoPrintHeight);
                    yOffset += logoSpace;
                }

                pdf.setFontSize(fontSizePx);
                pdf.setFont(undefined, 'bold');
                pdf.setTextColor('#475569'); // Equivalente a var(--text-secondary)
                const tituloTexto = `Reporte Financiero - ${sem.semestre === 1 ? '1er' : '2do'} Semestre ${sem.year}`;
                // En jsPDF el eje Y del texto es la línea base (bottom), sumamos el font size
                pdf.text(tituloTexto, xOffset, yOffset + (fontSizePx * 0.8));
                yOffset += titleSpace;

                pdf.addImage(imgData, 'JPEG', xOffset, yOffset, canvas.width, canvas.height);
                
                // Descargar el archivo
                pdf.save(`Reporte_FinanzaPro_Semestre${sem.semestre}_${sem.year}.pdf`);

            } catch (error) {
                console.error('Error al exportar PDF:', error);
                alert('Hubo un error al generar el PDF. Por favor intenta de nuevo.');
            } finally {
                // Restaurar el botón original
                btnExportar.innerHTML = '<span class="material-symbols-outlined">download</span> Exportar';
                btnExportar.disabled = false;
            }
        });
    }
});

async function cargarReportes() {
    if (!currentUid) return;
    try {
        const qTrans = query(collection(db, "transacciones"), where("usuario_id", "==", currentUid));
        const snapshotTrans = await getDocs(qTrans);
        const transacciones = snapshotTrans.docs.map(doc => doc.data());

        const qMetas = query(collection(db, "metas"), where("id_usuario", "==", currentUid));
        const snapshotMetas = await getDocs(qMetas);
        const metas = snapshotMetas.docs.map(doc => doc.data());

        renderMetrics(transacciones, metas);
        renderTopCategorias(transacciones);
        renderProgresoMetas(metas);
        renderCharts(transacciones, metas);
        renderHeatmap(transacciones);
    } catch (error) {
        console.error("Error cargando reportes:", error);
    }
}

function renderMetrics(transacciones, metas) {
    const semActual = getSemestreActual();
    const semAnterior = getSemestreAnterior();

    let ingresosTotales = 0, gastosTotales = 0;
    let ingresosSem = 0, gastosSem = 0;
    let ingresosSemAnterior = 0, gastosSemAnterior = 0;
    let gastosMes = 0;

    const now = new Date();
    const currentMesPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    transacciones.forEach(t => {
        if (!t || !t.fecha) return;
        const monto = parseFloat(t.monto) || 0;
        const mesPrefix = String(t.fecha).substring(0, 7);
        const enSemActual = semActual.prefixes.includes(mesPrefix);
        const enSemAnterior = semAnterior.prefixes.includes(mesPrefix);
        const esMesActual = mesPrefix === currentMesPrefix;

        if (t.tipo === 'ingreso') {
            ingresosTotales += monto;
            if (enSemActual) ingresosSem += monto;
            if (enSemAnterior) ingresosSemAnterior += monto;
        } else {
            gastosTotales += monto;
            if (enSemActual) gastosSem += monto;
            if (enSemAnterior) gastosSemAnterior += monto;
            if (esMesActual) gastosMes += monto;
        }
    });

    const balanceTotal = ingresosTotales - gastosTotales;
    document.getElementById('balance-total').innerText = '$' + new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0 }).format(balanceTotal);
    
    // Mostrar gastos del mes actual; si es 0, mostrar total acumulado como fallback
    const gastoAMostrar = gastosMes > 0 ? gastosMes : gastosSem;
    document.getElementById('gasto-mensual').innerText = '$' + new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0 }).format(gastoAMostrar);

    // Calcular tendencias vs semestre anterior
    const balanceSemActual = ingresosSem - gastosSem;
    const balanceSemAnterior = ingresosSemAnterior - gastosSemAnterior;
    
    let balanceTrend = 0;
    if (balanceSemAnterior !== 0) {
        balanceTrend = ((balanceSemActual - balanceSemAnterior) / Math.abs(balanceSemAnterior)) * 100;
    }

    let gastoTrend = 0;
    if (gastosSemAnterior !== 0) {
        gastoTrend = ((gastosSem - gastosSemAnterior) / gastosSemAnterior) * 100;
    }

    let tasaAhorroActual = ingresosSem > 0 ? ((ingresosSem - gastosSem) / ingresosSem) * 100 : 0;
    if (tasaAhorroActual < 0) tasaAhorroActual = 0;

    let tasaAhorroPrev = ingresosSemAnterior > 0 ? ((ingresosSemAnterior - gastosSemAnterior) / ingresosSemAnterior) * 100 : 0;
    if (tasaAhorroPrev < 0) tasaAhorroPrev = 0;

    let tasaTrend = tasaAhorroActual - tasaAhorroPrev;

    const renderTrend = (elementId, value, reverseColors = false) => {
        const el = document.getElementById(elementId);
        if (!el) return;
        const formatted = Math.abs(value).toFixed(1) + '%';
        
        let isPositive = value >= 0;
        let isGood = reverseColors ? value <= 0 : value >= 0; // Para gastos, bajar es bueno (isGood = true)

        const icon = isPositive ? 'trending_up' : 'trending_down';
        const sign = isPositive ? '+' : '-';
        const badgeClass = isGood ? 'badge-green' : 'badge-red';

        el.className = `badge ${badgeClass}`;
        el.innerHTML = `<span class="material-symbols-outlined" style="font-size:14px;">${icon}</span> ${sign}${formatted}`;
    };

    renderTrend('balance-trend', balanceTrend);
    renderTrend('gasto-trend', gastoTrend, true); // True porque bajar gasto es bueno
    renderTrend('tasa-trend', tasaTrend);

    document.getElementById('tasa-ahorro').innerText = tasaAhorroActual.toFixed(1) + '%';
}

function renderTopCategorias(transacciones) {
    const gastosCat = {};
    transacciones.forEach(t => {
        if (t.tipo === 'gasto') {
            const cat = t.categoria || 'Otros';
            gastosCat[cat] = (gastosCat[cat] || 0) + parseFloat(t.monto);
        }
    });

    const sortedCats = Object.entries(gastosCat).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const container = document.getElementById('top-categorias-list');
    container.innerHTML = '';

    if (sortedCats.length === 0) {
        container.innerHTML = '<p class="empty-table-msg">No hay gastos registrados</p>';
        return;
    }

    const maxGasto = sortedCats[0][1];

    sortedCats.forEach(([cat, monto]) => {
        const c = catColors[cat] || defaultCatColor;
        const icon = catIcons[cat] || "category";
        const pct = (monto / maxGasto) * 100;
        const formatted = '$' + new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(monto);

        container.innerHTML += `
            <div class="cat-item">
                <div class="cat-icon" style="background-color: ${c.bg}; color: ${c.text}">
                    <span class="material-symbols-outlined">${icon}</span>
                </div>
                <div class="cat-info">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span class="cat-name">${cat}</span>
                        <span class="cat-amount">${formatted}</span>
                    </div>
                    <div class="cat-bar-bg">
                        <div class="cat-bar-fill" style="width: ${pct}%; background-color: ${c.fill};"></div>
                    </div>
                </div>
            </div>
        `;
    });
}

function renderProgresoMetas(metas) {
    const container = document.getElementById('progreso-metas-list');
    container.innerHTML = '';

    if (metas.length === 0) {
        container.innerHTML = '<p class="empty-table-msg">No hay metas activas</p>';
        return;
    }

    // Sort by progress desc
    const metasMapped = metas.map(m => {
        const obj = parseFloat(m.monto_objetivo) || 0;
        const act = parseFloat(m.monto_actual) || 0;
        const pct = obj > 0 ? Math.min((act / obj) * 100, 100) : 0;
        return { ...m, pct, obj, act };
    });
    metasMapped.sort((a, b) => b.pct - a.pct);

    const colors = ["#059669", "#3b82f6", "#ef4444", "#f59e0b"];

    metasMapped.slice(0, 3).forEach((m, index) => {
        const color = colors[index % colors.length];
        const pctShow = m.pct % 1 !== 0 ? m.pct.toFixed(1) : Math.round(m.pct);
        const actFmt = '$' + new Intl.NumberFormat('en-US').format(m.act);
        const objFmt = '$' + new Intl.NumberFormat('en-US').format(m.obj);

        container.innerHTML += `
            <div class="meta-progress-item">
                <div class="meta-progress-header">
                    <span class="meta-name">${m.nombre}</span>
                    <span class="meta-pct" style="color: ${color}">${pctShow}%</span>
                </div>
                <div class="meta-bar-bg">
                    <div class="meta-bar-fill" style="width: ${m.pct}%; background-color: ${color};"></div>
                </div>
                <span class="meta-amounts">${actFmt} / ${objFmt}</span>
            </div>
        `;
    });
}

function renderCharts(transacciones, metas) {
    // Usar los meses del semestre actual
    const sem = getSemestreActual();
    const last6Months = sem.labels;
    const last6Prefixes = sem.prefixes;

    // Datos Flujo
    const ingFijos = [0, 0, 0, 0, 0, 0];
    const ingVars = [0, 0, 0, 0, 0, 0];
    const gasFijos = [0, 0, 0, 0, 0, 0];
    const gasVars = [0, 0, 0, 0, 0, 0];
    
    const gastosFijosCat = ['Renta', 'Servicios Públicos', 'Educación', 'Salud'];

    transacciones.forEach(t => {
        if (!t || !t.fecha) return;
        const tMonthPrefix = t.fecha.substring(0, 7);
        const index = last6Prefixes.indexOf(tMonthPrefix);
        if (index !== -1) {
            const m = parseFloat(t.monto) || 0;
            if (t.tipo === 'ingreso') {
                if (t.categoria === 'Salario') ingFijos[index] += m;
                else ingVars[index] += m;
            } else {
                if (gastosFijosCat.includes(t.categoria)) gasFijos[index] += m;
                else gasVars[index] += m;
            }
        }
    });

    const ctxFlujo = document.getElementById('flujoChart');
    if (ctxFlujo) {
        new Chart(ctxFlujo, {
            type: 'bar',
            data: {
                labels: last6Months,
                datasets: [
                    {
                        label: 'Ingresos Fijos',
                        data: ingFijos,
                        backgroundColor: '#059669',
                        stack: 'Ingresos'
                    },
                    {
                        label: 'Ingresos Variables',
                        data: ingVars,
                        backgroundColor: '#6ee7b7',
                        stack: 'Ingresos'
                    },
                    {
                        label: 'Gastos Fijos',
                        data: gasFijos,
                        backgroundColor: '#dc2626',
                        stack: 'Gastos'
                    },
                    {
                        label: 'Gastos Variables',
                        data: gasVars,
                        backgroundColor: '#3b82f6',
                        stack: 'Gastos'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 10, usePointStyle: true } }
                },
                scales: {
                    x: { grid: { display: false } },
                    y: { display: false, grid: { display: false } }
                }
            }
        });
    }

    // Datos Ahorro (Simulación histórica para las top 2 metas)
    const ctxAhorro = document.getElementById('ahorroChart');
    if (ctxAhorro) {
        const topMetas = [...metas].sort((a, b) => (parseFloat(b.monto_actual)||0) - (parseFloat(a.monto_actual)||0)).slice(0, 2);
        
        const datasetsAhorro = [];
        const colors = ['#059669', '#3b82f6'];
        const fills = ['rgba(5, 150, 105, 0.1)', 'transparent'];
        const dash = [[], [5, 5]];

        const growthFactors = [0.1, 0.25, 0.45, 0.65, 0.85, 1.0]; // Simulated past growth
        
        topMetas.forEach((m, i) => {
            const actual = parseFloat(m.monto_actual) || 0;
            const dataPts = growthFactors.map(factor => parseFloat((actual * factor).toFixed(2)));
            datasetsAhorro.push({
                label: m.nombre || `Meta ${i+1}`,
                data: dataPts,
                borderColor: colors[i],
                backgroundColor: fills[i],
                fill: i === 0,
                borderDash: dash[i],
                tension: 0.4
            });
        });

        if (datasetsAhorro.length === 0) {
            // Placeholder si no hay metas
            datasetsAhorro.push({
                label: 'Ahorro',
                data: [0, 0, 0, 0, 0, 0],
                borderColor: '#059669',
                fill: false,
                tension: 0.4
            });
        }

        new Chart(ctxAhorro, {
            type: 'line',
            data: {
                labels: last6Months,
                datasets: datasetsAhorro
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top', align: 'end', labels: { boxWidth: 10, usePointStyle: true } }
                },
                scales: {
                    x: { grid: { display: false } },
                    y: { display: false, grid: { display: false } }
                }
            }
        });
    }
}

function renderHeatmap(transacciones) {
    const container = document.getElementById('heatmap-container');
    if (!container) return;
    container.innerHTML = '';

    // Usar los meses del semestre actual
    const sem = getSemestreActual();
    const last6Prefixes = sem.prefixes;
    const last6Names = sem.labelsLargos;

    // Agrupar gastos por día Y por categoría
    // gastosDiarios[fecha] = { categoria: monto, ... }
    const gastosDiarios = {};
    const categoriasUsadas = new Set();

    transacciones.forEach(t => {
        if (!t || !t.fecha || t.tipo !== 'gasto') return;
        const monto = parseFloat(t.monto) || 0;
        const cat = t.categoria || 'Otros';
        categoriasUsadas.add(cat);

        if (!gastosDiarios[t.fecha]) gastosDiarios[t.fecha] = {};
        gastosDiarios[t.fecha][cat] = (gastosDiarios[t.fecha][cat] || 0) + monto;
    });

    // Obtener la categoría con mayor gasto por día
    const topCategoriaDia = {};
    const totalDia = {};
    let maxGasto = 0;

    Object.entries(gastosDiarios).forEach(([fecha, cats]) => {
        let topCat = null;
        let topMonto = 0;
        let total = 0;
        Object.entries(cats).forEach(([cat, monto]) => {
            total += monto;
            if (monto > topMonto) {
                topMonto = monto;
                topCat = cat;
            }
        });
        topCategoriaDia[fecha] = topCat;
        totalDia[fecha] = total;
        if (total > maxGasto) maxGasto = total;
    });

    if (maxGasto === 0) maxGasto = 1;

    // Renderizar la leyenda dinámica de categorías
    const legendContainer = document.getElementById('heatmap-legend-container');
    if (legendContainer) {
        legendContainer.innerHTML = '';
        const catsArray = Array.from(categoriasUsadas);
        if (catsArray.length === 0) {
            legendContainer.innerHTML = '<span style="color: var(--text-secondary); font-size: 12px;">Sin gastos</span>';
        } else {
            catsArray.forEach(cat => {
                const c = catColors[cat] || defaultCatColor;
                legendContainer.innerHTML += `
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span class="heatmap-box" style="background-color: ${c.fill}; width: 14px; height: 14px; border-radius: 4px; flex-shrink: 0;"></span>
                        <span style="font-size: 12px; white-space: nowrap;">${cat}</span>
                    </div>`;
            });
            // Agregar indicador de "sin gasto"
            legendContainer.innerHTML += `
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span class="heatmap-box color-1" style="width: 14px; height: 14px; border-radius: 4px; flex-shrink: 0;"></span>
                    <span style="font-size: 12px; white-space: nowrap;">Sin gasto</span>
                </div>`;
        }
    }

    last6Prefixes.forEach((monthPrefix, index) => {
        const monthDiv = document.createElement('div');
        monthDiv.className = 'heatmap-month';
        monthDiv.innerHTML = `<h4>${last6Names[index]}</h4>`;
        
        const gridDiv = document.createElement('div');
        gridDiv.className = 'heatmap-grid';
        
        const year = parseInt(monthPrefix.split('-')[0]);
        const month = parseInt(monthPrefix.split('-')[1]);
        const daysInMonth = new Date(year, month, 0).getDate();
        
        // Agregar encabezados de días de la semana
        const diasSemana = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
        diasSemana.forEach(d => {
            const header = document.createElement('div');
            header.className = 'heatmap-day-header';
            header.innerText = d;
            gridDiv.appendChild(header);
        });

        // Offset para el primer día del mes
        let primerDia = new Date(year, month - 1, 1).getDay();
        primerDia = primerDia === 0 ? 6 : primerDia - 1;

        for (let i = 0; i < primerDia; i++) {
            const emptyBox = document.createElement('div');
            emptyBox.className = 'heatmap-box heatmap-empty';
            gridDiv.appendChild(emptyBox);
        }
        
        for (let i = 1; i <= daysInMonth; i++) {
            const dayStr = String(i).padStart(2, '0');
            const fecha = `${monthPrefix}-${dayStr}`;
            const total = totalDia[fecha] || 0;
            const topCat = topCategoriaDia[fecha] || null;

            const box = document.createElement('div');
            box.className = 'heatmap-box';

            if (total > 0 && topCat) {
                const c = catColors[topCat] || defaultCatColor;
                // Opacity basada en la intensidad del gasto relativa al máximo
                const intensity = Math.max(0.35, total / maxGasto);
                box.style.backgroundColor = c.fill;
                box.style.opacity = intensity;
                const fmt = '$' + new Intl.NumberFormat('en-US').format(total);
                box.title = `${fecha}: ${fmt} (${topCat})`;
            } else {
                box.classList.add('color-1');
                box.title = `${fecha}: Sin gastos`;
            }

            gridDiv.appendChild(box);
        }
        
        monthDiv.appendChild(gridDiv);
        container.appendChild(monthDiv);
    });
}

