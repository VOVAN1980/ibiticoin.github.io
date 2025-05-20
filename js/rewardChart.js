
let rewardHistory = [];
let rewardChart;

function initRewardChart() {
  const ctx = document.getElementById('rewardChart').getContext('2d');
  rewardChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Награды IBITI',
        borderColor: 'gold',
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        data: [],
        fill: true,
        tension: 0.3,
        pointRadius: 3
      }]
    },
    options: {
      plugins: {
        legend: { display: true, labels: { color: 'gold' } }
      },
      scales: {
        x: { ticks: { color: 'gold' } },
        y: { ticks: { color: 'gold' } }
      }
    }
  });
}

function updateRewardChart(newReward) {
  const timestamp = new Date().toLocaleTimeString();
  rewardHistory.push({ x: timestamp, y: parseFloat(newReward) });

  if (rewardHistory.length > 20) rewardHistory.shift(); // ограничим до 20 точек
  rewardChart.data.labels = rewardHistory.map(p => p.x);
  rewardChart.data.datasets[0].data = rewardHistory.map(p => p.y);
  rewardChart.update();
}
