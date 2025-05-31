let rewardHistory = [];
let rewardChart;

function initRewardChart() {
  const ctx = document.getElementById('rewardChart').getContext('2d');
  rewardChart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [{
        label: 'Награды IBITI',
        borderColor: 'gold',
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        data: [],
        fill: true,
        tension: 0.3,
        pointRadius: 2
      }]
    },
    options: {
      parsing: false, // работаем с объектами {x, y}
      plugins: {
        legend: { display: true, labels: { color: 'gold' } },
        tooltip: {
          callbacks: {
            label: (ctx) => `+${ctx.raw.y.toFixed(2)} IBITI`
          }
        }
      },
      scales: {
        x: { ticks: { color: 'gold' } },
        y: { ticks: { color: 'gold' } }
      }
    }
  });
}

function updateRewardChart(newReward) {
  if (!rewardChart) return;

  const timestamp = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  rewardHistory.push({ x: timestamp, y: parseFloat(newReward) });

  if (rewardHistory.length > 20) rewardHistory.shift();

  rewardChart.data.datasets[0].data = rewardHistory;
  rewardChart.update();
}
