import { db, auth } from './firebase-config.js';
import { collection, query, where, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

let currentUid = null;

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
    const now = new Date();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentYear = String(now.getFullYear());
    const currentMonthPrefix = `${currentYear}-${currentMonth}`;

    let ingresosTotales = 0;
    let gastosTotales = 0;
    let ingresosMes = 0;
    let gastosMes = 0;
    let ingresosMesAnterior = 0;
    let gastosMesAnterior = 0;

    const previousDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthPrefix = `${previousDate.getFullYear()}-${String(previousDate.getMonth() + 1).padStart(2, '0')}`;

    transacciones.forEach(t => {
        if (!t || !t.fecha) return;
        const monto = parseFloat(t.monto) || 0;
        const isCurrentMonth = String(t.fecha).startsWith(currentMonthPrefix);
        const isPrevMonth = String(t.fecha).startsWith(previousMonthPrefix);

        if (t.tipo === 'ingreso') {
            ingresosTotales += monto;
            if (isCurrentMonth) ingresosMes += monto;
            if (isPrevMonth) ingresosMesAnterior += monto;
        } else {
            gastosTotales += monto;
            if (isCurrentMonth) gastosMes += monto;
            if (isPrevMonth) gastosMesAnterior += monto;
        }
    });

    const balanceTotal = ingresosTotales - gastosTotales;
    document.getElementById('balance-total').innerText = '$' + new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(balanceTotal);
    document.getElementById('gasto-mensual').innerText = '$' + new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(gastosMes);

    // Calcular tendencias vs mes anterior
    const balanceMesAnterior = ingresosTotales - gastosTotales - (ingresosMes - gastosMes); // Rough estimation if we only look at global vs monthly. Better: compare current month balance vs previous month balance.
    const balanceMensualActual = ingresosMes - gastosMes;
    const balanceMensualPrev = ingresosMesAnterior - gastosMesAnterior;
    
    let balanceTrend = 0;
    if (balanceMensualPrev !== 0) {
        balanceTrend = ((balanceMensualActual - balanceMensualPrev) / Math.abs(balanceMensualPrev)) * 100;
    }

    let gastoTrend = 0;
    if (gastosMesAnterior !== 0) {
        gastoTrend = ((gastosMes - gastosMesAnterior) / gastosMesAnterior) * 100;
    }

    let tasaAhorroActual = ingresosMes > 0 ? ((ingresosMes - gastosMes) / ingresosMes) * 100 : 0;
    if (tasaAhorroActual < 0) tasaAhorroActual = 0;

    let tasaAhorroPrev = ingresosMesAnterior > 0 ? ((ingresosMesAnterior - gastosMesAnterior) / ingresosMesAnterior) * 100 : 0;
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
    // Generar labels de los últimos 6 meses
    const meses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    const now = new Date();
    const last6Months = [];
    const last6Prefixes = [];
    
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        last6Months.push(meses[d.getMonth()]);
        last6Prefixes.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

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

    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const now = new Date();
    const last6Prefixes = [];
    const last6Names = [];
    
    // Obtener los últimos 6 meses cronológicamente
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        last6Names.push(meses[d.getMonth()]);
        last6Prefixes.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    // Agrupar gastos por día
    const gastosDiarios = {};
    let maxGasto = 0;

    transacciones.forEach(t => {
        if (!t || !t.fecha || t.tipo !== 'gasto') return;
        gastosDiarios[t.fecha] = (gastosDiarios[t.fecha] || 0) + parseFloat(t.monto);
        if (gastosDiarios[t.fecha] > maxGasto) {
            maxGasto = gastosDiarios[t.fecha];
        }
    });

    if (maxGasto === 0) maxGasto = 1;

    last6Prefixes.forEach((monthPrefix, index) => {
        const monthDiv = document.createElement('div');
        monthDiv.className = 'heatmap-month';
        monthDiv.innerHTML = `<h4>${last6Names[index]}</h4>`;
        
        const gridDiv = document.createElement('div');
        gridDiv.className = 'heatmap-grid';
        
        // Obtener la cantidad real de días de este mes
        const year = parseInt(monthPrefix.split('-')[0]);
        const month = parseInt(monthPrefix.split('-')[1]);
        const daysInMonth = new Date(year, month, 0).getDate();
        
        // Renderizar un cuadrito por cada día del mes
        for (let i = 1; i <= daysInMonth; i++) {
            const dayStr = String(i).padStart(2, '0');
            const fecha = `${monthPrefix}-${dayStr}`;
            const gasto = gastosDiarios[fecha] || 0;
            
            let colorClass = 'color-1';
            if (gasto > 0) {
                const pct = gasto / maxGasto;
                if (pct <= 0.1) colorClass = 'color-2';
                else if (pct <= 0.3) colorClass = 'color-3';
                else if (pct <= 0.6) colorClass = 'color-4';
                else colorClass = 'color-5';
            }
            
            gridDiv.innerHTML += `<div class="heatmap-box ${colorClass}" title="${fecha}: $${gasto}"></div>`;
        }
        
        monthDiv.appendChild(gridDiv);
        container.appendChild(monthDiv);
    });
}
