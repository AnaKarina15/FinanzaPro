import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import {
  initNotificaciones,
  enviarBienvenidaSiNecesario,
} from "./notificaciones.js";

document.addEventListener("DOMContentLoaded", () => {
  const formatearMoneda = (valor) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(valor);

  // --- MANEJO DE ALERTAS DE BIENVENIDA ---
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("registro") && urlParams.get("registro") === "exito") {
    Swal.fire({
      title: "¡Cuenta Creada!",
      text: "Tu registro fue exitoso. Bienvenido a FinanzaPro.",
      icon: "success",
      confirmButtonColor: "#059669",
      confirmButtonText: "Empezar",
    });

    // Limpiamos la URL para que no vuelva a salir la alerta si recargan la página
    window.history.replaceState(null, null, window.location.pathname);
  }

  // --- CONTROL DE SESIÓN CON FIREBASE ---
  let currentUid = null;
  let _nombreUsuario = "Usuario"; // Nombre para notificación de bienvenida
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUid = user.uid;
      try {
        const userDoc = await getDoc(doc(db, "usuarios", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const nombreCompleto =
            `${userData.nombre} ${userData.apellido}`.trim();
          _nombreUsuario = nombreCompleto; // guardarlo para usarlo fuera del try

          // Actualizar nombre en la barra lateral
          const sideName = document.querySelector(".nav-profile .username");
          if (sideName) sideName.textContent = nombreCompleto;

          const avatarImg = document.querySelector(".nav-profile img");
          if (avatarImg) {
            avatarImg.src =
              userData.fotoPerfil ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreCompleto)}&background=059669&color=fff`;
          }

          // Aplicar tema
          if (userData.tema_interfaz === "oscuro") {
            document.body.classList.add("dark-theme");
            Chart.defaults.color = "#94a3b8";
            Chart.defaults.borderColor = "#334155";
          } else {
            document.body.classList.remove("dark-theme");
            Chart.defaults.color = "#64748b";
            Chart.defaults.borderColor = "#e2e8f0";
          }

          // Actualizar texto de bienvenida
          const welcomeText = document.querySelector(".view-description");
          if (welcomeText) {
            welcomeText.textContent = `Bienvenid@ ${nombreCompleto}. Aquí tienes el resumen de hoy.`;
          }
        }
      } catch (error) {
        console.error("Error al obtener perfil:", error);
      }

      initNotificaciones(user.uid);
      // Nombre ya viene de Firestore, no del DOM
      enviarBienvenidaSiNecesario(user.uid, _nombreUsuario);
      cargarCategoriasDePresupuestos();
      cargarEstadisticasFirestore(user.uid);
    } else {
      // Si no hay sesión activa en Firebase, lo devolvemos al login
      window.location.href = "../index.php";
    }
  });

  const cargarCategoriasDePresupuestos = async () => {
    if (!currentUid) return;
    try {
      const presupuestosRef = collection(db, "presupuestos");
      const q = query(presupuestosRef, where("id_usuario", "==", currentUid));
      const querySnapshot = await getDocs(q);

      const datalist = document.getElementById("lista-categorias");
      if (datalist) {
        let categories = new Set([
          "Alimentación",
          "Transporte",
          "Ocio",
          "Servicios Públicos",
          "Salario",
        ]);
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.categoria) categories.add(data.categoria);
        });

        datalist.innerHTML = "";
        categories.forEach((cat) => {
          datalist.innerHTML += `<option value="${cat}"></option>`;
        });
      }
    } catch (error) {
      console.error("Error al cargar categorías:", error);
    }
  };

  const cargarEstadisticasFirestore = async (uid) => {
    try {
      const transRef = collection(db, "transacciones");
      // Obtenemos las transacciones del usuario
      const q = query(transRef, where("usuario_id", "==", uid));
      const querySnapshot = await getDocs(q);

      let ing = 0;
      let gas = 0;
      const movimientos = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        movimientos.push({ id: docSnap.id, ...data });
        if (data.tipo === "ingreso") ing += data.monto;
        if (data.tipo === "gasto") gas += data.monto;
      });

      // Ordenar por fecha descendente (más reciente primero)
      movimientos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

      // Obtenemos el dinero guardado en las metas (ahorros)
      const metasRef = collection(db, "metas");
      const qMetas = query(metasRef, where("id_usuario", "==", uid));
      const metasSnapshot = await getDocs(qMetas);

      let ahorroEnMetas = 0;
      metasSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        ahorroEnMetas += parseFloat(data.monto_actual) || 0;
      });

      // Actualizar tarjetas superiores
      const balanceTotal = ing - gas;
      const disponible = balanceTotal - ahorroEnMetas;

      if (document.getElementById("monto-disponible"))
        document.getElementById("monto-disponible").innerText =
          formatearMoneda(disponible);
      if (document.getElementById("monto-total-real"))
        document.getElementById("monto-total-real").innerText =
          formatearMoneda(balanceTotal);
      if (document.getElementById("monto-ingresos"))
        document.getElementById("monto-ingresos").innerText =
          formatearMoneda(ing);
      if (document.getElementById("monto-gastos"))
        document.getElementById("monto-gastos").innerText =
          formatearMoneda(gas);

      // Actualizar tabla de últimos movimientos
      const tablaCuerpo = document.querySelector(".movimientos-tabla-cuerpo");
      if (tablaCuerpo) {
        tablaCuerpo.innerHTML = "";
        if (movimientos.length === 0) {
          tablaCuerpo.innerHTML = `<tr><td colspan="4" class="empty-table-msg">Aún no tienes ningún movimiento.</td></tr>`;
        } else {
          const ultimos2 = movimientos.slice(0, 2);
          ultimos2.forEach((mov) => {
            const esGasto = mov.tipo === "gasto";
            const colorMonto = esGasto ? "text-danger" : "text-success";
            const signo = esGasto ? "-" : "+";
            const iconType = esGasto ? "shopping_bag" : "business_center";
            const iconBg = esGasto ? "icon-blue" : "icon-green";

            const dateObj = new Date(mov.fecha + "T00:00:00");
            const fechaFormato = dateObj.toLocaleDateString("es-ES", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            tablaCuerpo.innerHTML += `
                            <tr>
                                <td class="table-date">${fechaFormato}</td>
                                <td class="table-desc">
                                    <div class="table-concept">
                                        <span class="material-symbols-outlined concept-icon ${iconBg}">${iconType}</span>
                                        <strong>${mov.descripcion || "Sin descripción"}</strong>
                                    </div>
                                </td>
                                <td><span class="badge badge-neutral">${mov.categoria}</span></td>
                                <td class="${colorMonto}">${signo}${formatearMoneda(mov.monto)}</td>
                            </tr>
                        `;
          });
        }
      }

      // Actualizar gráfica
      const canvas = document.querySelector(".incomes-outcomes-chart");
      if (canvas) {
        const chartExistente = Chart.getChart(canvas);
        if (chartExistente) {
          chartExistente.destroy();
        }

        let dIngresos = new Array(12).fill(0);
        let dGastos = new Array(12).fill(0);

        movimientos.forEach((m) => {
          const partesFecha = m.fecha.split("-"); // [YYYY, MM, DD]
          if (partesFecha.length >= 2) {
            const mes = parseInt(partesFecha[1]) - 1; // 0-11
            if (m.tipo === "ingreso") dIngresos[mes] += m.monto;
            if (m.tipo === "gasto") dGastos[mes] += m.monto;
          }
        });

        new Chart(canvas, {
          type: "bar",
          data: {
            labels: [
              "Ene",
              "Feb",
              "Mar",
              "Abr",
              "May",
              "Jun",
              "Jul",
              "Ago",
              "Sep",
              "Oct",
              "Nov",
              "Dic",
            ],
            datasets: [
              {
                label: "Ingresos",
                data: dIngresos,
                borderRadius: 32,
                backgroundColor: "#05966990",
              },
              {
                label: "Gastos",
                data: dGastos,
                borderRadius: 32,
                backgroundColor: "#2563eb90",
              },
            ],
          },
          options: { maintainAspectRatio: false },
        });
      }
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
    }
  };

  // (Eliminamos el viejo fetch a PHP)
  /*

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
    */

  // --- LÓGICA DEL INPUT DE MONTO (Formateo automático) ---
  const inputVisual = document.getElementById("monto_visual");
  const inputOculto = document.getElementById("monto");

  if (inputVisual && inputOculto) {
    inputVisual.addEventListener("input", function () {
      let valorPuro = this.value.replace(/\D/g, "");
      if (valorPuro === "") {
        this.value = "";
        inputOculto.value = "";
        return;
      }
      this.value = `$ ${new Intl.NumberFormat("es-CO").format(valorPuro)}`;
      inputOculto.value = valorPuro;

      // Quitar error en tiempo real
      if (parseFloat(valorPuro) > 0) {
        inputVisual.classList.remove("input-error");
        const errorEl = document.getElementById("error-monto");
        if (errorEl) errorEl.style.display = "none";
      }
    });
  }

  // --- QUITAR ERRORES EN TIEMPO REAL PARA FECHA Y CATEGORÍA ---
  const inputFecha = document.getElementById("fecha");
  if (inputFecha) {
    inputFecha.addEventListener("input", () => {
      if (inputFecha.value) {
        inputFecha.classList.remove("input-error");
        const err = document.getElementById("error-fecha");
        if (err) err.style.display = "none";
      }
    });
  }

  const inputCategoria = document.getElementById("categoria");
  if (inputCategoria) {
    inputCategoria.addEventListener("input", () => {
      if (inputCategoria.value.trim()) {
        inputCategoria.classList.remove("input-error");
        const err = document.getElementById("error-categoria");
        if (err) err.style.display = "none";
      }
    });
  }

  // --- ABRIR MODAL (Manejador basado en ID) ---
  const btnAbrirModal = document.getElementById("btn-abrir-modal");
  if (btnAbrirModal) {
    btnAbrirModal.addEventListener("click", () => {
      const form = document.getElementById("form-movimiento");
      if (form) form.reset();

      document.getElementById("modal-titulo").innerText =
        "Registro de Movimientos";
      document.getElementById("id_transaccion").value = "";

      if (inputVisual) inputVisual.value = "";

      // Poner fecha de hoy por defecto
      const hoy = new Date();
      const fechaHoy =
        hoy.getFullYear() +
        "-" +
        String(hoy.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(hoy.getDate()).padStart(2, "0");
      const inputFechaModal = document.getElementById("fecha");
      if (inputFechaModal) inputFechaModal.value = fechaHoy;

      // Limpiar estilos de error residuales
      document
        .querySelectorAll(".input-error")
        .forEach((el) => el.classList.remove("input-error"));
      document
        .querySelectorAll(".error-text")
        .forEach((el) => (el.style.display = "none"));

      document.getElementById("modalNuevoMovimiento").classList.add("active");
    });
  }

  // --- CERRAR MODAL ---
  // --- CERRAR MODAL ---
  const btnCerrarModal = document.getElementById("btn-cerrar-modal");
  if (btnCerrarModal) {
    btnCerrarModal.addEventListener("click", () => {
      document
        .getElementById("modalNuevoMovimiento")
        .classList.remove("active");
    });
  }

  // --- GUARDAR MOVIMIENTO EN FIREBASE ---
  const formMovimiento = document.getElementById("form-movimiento");
  if (formMovimiento) {
    formMovimiento.addEventListener("submit", async (e) => {
      e.preventDefault(); // EVITAMOS QUE SE VAYA AL PHP

      // --- LÓGICA DE VALIDACIÓN ---
      const setValidacion = (inputId, errorId, esValido) => {
        const inputEl = document.getElementById(inputId);
        const errorEl = document.getElementById(errorId);
        if (esValido) {
          inputEl.classList.remove("input-error");
          if (errorEl) errorEl.style.display = "none";
        } else {
          inputEl.classList.add("input-error");
          if (errorEl) errorEl.style.display = "block";
        }
      };

      const montoVal = parseFloat(document.getElementById("monto").value);
      const fechaVal = document.getElementById("fecha").value;
      const categoriaVal = document.getElementById("categoria").value;

      let formValido = true;

      if (!montoVal || isNaN(montoVal) || montoVal <= 0) {
        setValidacion("monto_visual", "error-monto", false);
        formValido = false;
      } else {
        setValidacion("monto_visual", "error-monto", true);
      }

      if (!fechaVal) {
        setValidacion("fecha", "error-fecha", false);
        formValido = false;
      } else {
        setValidacion("fecha", "error-fecha", true);
      }

      if (!categoriaVal.trim()) {
        setValidacion("categoria", "error-categoria", false);
        formValido = false;
      } else {
        setValidacion("categoria", "error-categoria", true);
      }

      if (!formValido) return; // Detenemos el guardado si hay errores
      // ------------------------------

      const btnSubmit = formMovimiento.querySelector('button[type="submit"]');
      btnSubmit.disabled = true;
      btnSubmit.textContent = "Guardando...";

      try {
        const tipoInput = document.querySelector(
          'input[name="tipo_movimiento"]:checked',
        );
        const tipo = tipoInput ? tipoInput.value : "gasto";
        const descripcion = document.getElementById("descripcion").value;

        const user = auth.currentUser;
        if (!user) throw new Error("No hay usuario autenticado.");

        await addDoc(collection(db, "transacciones"), {
          usuario_id: user.uid,
          tipo: tipo,
          monto: montoVal,
          fecha: fechaVal,
          categoria: categoriaVal,
          descripcion: descripcion,
          fecha_creacion: new Date(),
        });

        Swal.fire({
          title: "Éxito",
          text: "Movimiento guardado",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });

        document
          .getElementById("modalNuevoMovimiento")
          .classList.remove("active");
        formMovimiento.reset();
        if (inputVisual) inputVisual.value = "";

        // Recargar estadísticas automáticamente
        cargarEstadisticasFirestore(user.uid);
      } catch (error) {
        console.error("Error al guardar:", error);
        Swal.fire("Error", "No se pudo guardar el movimiento", "error");
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = "Guardar Transacción";
      }
    });
  }
});
