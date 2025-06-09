import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.10.0/+esm";
import { stakingAbi } from "./abis/stakingAbi.js";
import { provider, signer, showIbitiBalance, selectedAccount } from "./wallet.js";

const STAKING_ADDRESS = "0xd5D138855C7D8F24CD9eE52B65864bC3929a0aA5";
const DECIMALS = 8;

let stakingContract;
let userAddress;
let rewardHistory = [];
let rewardChart;

function initRewardChart() {
  const ctx = document.getElementById('rewardChart')?.getContext('2d');
  if (!ctx) return;

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
        pointRadius: 3
      }]
    },
    options: {
      parsing: false,
      plugins: {
        legend: { display: true, labels: { color: 'gold' } },
        tooltip: {
          callbacks: {
            label: ctx => `+${ctx.raw.y.toFixed(2)} IBITI`
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
  const timestamp = new Date().toLocaleTimeString('ru-RU', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
  rewardHistory.push({ x: timestamp, y: parseFloat(newReward) });
  if (rewardHistory.length > 20) rewardHistory.shift();
  rewardChart.data.datasets[0].data = rewardHistory;
  rewardChart.update();
}

async function initStaking() {
  if (!signer) return;
  userAddress = selectedAccount;
  stakingContract = new ethers.Contract(STAKING_ADDRESS, stakingAbi, signer);

  const walletDisplay = document.getElementById("walletAddress");
  if (walletDisplay) walletDisplay.innerText = userAddress || "";

  await updateStakeInfo();
}

async function updateStakeInfo() {
  if (!stakingContract || !userAddress) return;

  try {
    const [stake, unlockTime, reward] = await Promise.all([
      stakingContract.stakeOf(userAddress),
      stakingContract.unlockTimeOf(userAddress),
      stakingContract.calculateReward(userAddress)
    ]);

    const stakeFormatted  = ethers.formatUnits(stake, DECIMALS);
    const rewardFormatted = ethers.formatUnits(reward, DECIMALS);

    document.getElementById("stakeInfo").innerText  = `Ваш стейк: ${stakeFormatted} IBITI`;
    document.getElementById("rewardInfo").innerText = `Награды: ${rewardFormatted} IBITI`;

    const now         = Math.floor(Date.now() / 1000);
    const unlockTs    = Number(unlockTime.toString?.() || 0);
    const secondsLeft = unlockTs - now;

    const unlockInfoEl = document.getElementById("unlockInfo");
    unlockInfoEl.innerText =
      unlockTs === 0
        ? "Без блокировки"
        : secondsLeft <= 0
          ? "Можно вывести"
          : `Разблокируется через ${Math.floor(secondsLeft / 86400)}д ${Math.floor((secondsLeft % 86400) / 3600)}ч`;

    updateRewardChart(rewardFormatted);
  } catch (err) {
    console.warn("Ошибка при получении информации о стейке", err);
  }
}

async function stake(amount, duration) {
  if (!stakingContract || !userAddress) return;

  try {
    const amountFormatted = ethers.parseUnits(amount.toString(), DECIMALS);
    const tokenAddress = await stakingContract.token();
    const token = new ethers.Contract(
      tokenAddress,
      [
        "function approve(address spender, uint256 amount) external returns (bool)",
        "function allowance(address owner, address spender) external view returns (uint256)"
      ],
      signer
    );

    const allowance = await token.allowance(userAddress, STAKING_ADDRESS);
    if (allowance < amountFormatted) {
      const approveTx = await token.approve(STAKING_ADDRESS, amountFormatted);
      await approveTx.wait();
    }

    const tx = await stakingContract.stake(amountFormatted, duration);
    await tx.wait();
    Swal.fire("✅ Успешно застейкано!");
    await updateStakeInfo();
  } catch (err) {
    console.error(err);
    Swal.fire("❌ Ошибка при стейке", err.message);
  }
}

async function unstake() {
  if (!stakingContract) return;

  try {
    const tx = await stakingContract.unstake();
    await tx.wait();
    Swal.fire("✅ Анстейк выполнен");
    await updateStakeInfo();
  } catch (err) {
    console.error(err);
    Swal.fire("❌ Ошибка при анстейке", err.message);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initRewardChart();

  document.getElementById("stakeForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  Swal.fire({
    icon: "info",
    title: "⏳ Стейкинг скоро начнётся",
    html: `Функция будет доступна после запуска проекта.<br><br>
           Следите за новостями на сайте и в наших соцсетях.`,
    confirmButtonText: "Хорошо"
  });

  return;

  // Ниже — код для запуска в будущем
  /*
  const amt = document.getElementById("stakeAmount").value;
  const duration = parseInt(document.getElementById("stakeDuration").value);
  if (!amt || isNaN(amt) || isNaN(duration)) return;
  await stake(amt, duration);
  */
});

  document.getElementById("unstakeBtn")?.addEventListener("click", unstake);

  setInterval(updateStakeInfo, 15000);

  // если кошелёк уже подключён — инициализируем сразу
  if (selectedAccount && signer) {
    initStaking();
  }

  // если кошелёк подключится позже — вызываем initStaking
  window.afterWalletConnected = async () => {
    await initStaking();
  };
});

export {
  initStaking,
  updateStakeInfo,
  stake,
  unstake
};
