const ctx = document.querySelector(".incomes-outcomes-chart");

new Chart(ctx, {
  type: "bar",
  data: {
    labels: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio"],
    datasets: [
      {
        label: "Ingresos",
        data: [60000, 50000, 40000, 60000, 50000, 40000],
        borderWidth: 1,
        borderRadius: 32,
        backgroundColor: "#05966990",
        
      },
      {
        label: "Gastos",
        data: [60000, 50000, 40000, 60000, 50000, 40000],
        borderWidth: 1,
        borderRadius: 32,
        backgroundColor: "#2563eb90",
      }
    ]
  },
  options: {
    maintainAspectRatio: false
  }
});
