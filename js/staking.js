import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js";
import { stakingAbi } from "./abis/stakingAbi.js";

const STAKING_ADDRESS = "0xd5D138855C7D8F24CD9eE52B65864bC3929a0aA5";
const DECIMALS = 8;

let provider, signer, stakingContract, userAddress;

async function connect() {
  if (!window.ethereum) return Swal.fire("MetaMask не найден");

  provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = provider.getSigner();
  userAddress = await signer.getAddress();

  stakingContract = new ethers.Contract(STAKING_ADDRESS, stakingAbi, signer);

  document.getElementById("walletAddress").innerText = userAddress;
  await updateStakeInfo();
}

async function updateStakeInfo() {
  if (!stakingContract || !userAddress) return;

  try {
    const stake = await stakingContract.stakeOf(userAddress);
    const unlockTime = await stakingContract.unlockTimeOf(userAddress);
    const reward = await stakingContract.calculateReward(userAddress);

    const stakeFormatted = ethers.utils.formatUnits(stake, DECIMALS);
    const rewardFormatted = ethers.utils.formatUnits(reward, DECIMALS);

    document.getElementById("stakeInfo").innerText = `Ваш стейк: ${stakeFormatted} IBITI`;
    document.getElementById("rewardInfo").innerText = `Награды: ${rewardFormatted} IBITI`;

    const now = Math.floor(Date.now() / 1000);
    const unlockTs = unlockTime.toNumber ? unlockTime.toNumber() : 0;
    const secondsLeft = unlockTs - now;

    document.getElementById("unlockInfo").innerText =
      unlockTs === 0 ? "Без блокировки" :
      secondsLeft <= 0 ? "Можно вывести" :
      `Разблокируется через ${Math.floor(secondsLeft / 86400)}д ${Math.floor((secondsLeft % 86400) / 3600)}ч`;
  } catch (err) {
    console.warn("Ошибка при получении информации о стейке", err);
  }
}

async function stake(amount, duration) {
  if (!stakingContract || !userAddress) return;
  const amountFormatted = ethers.utils.parseUnits(amount.toString(), DECIMALS);

  try {
    const tokenAddress = await stakingContract.token();
    const token = new ethers.Contract(tokenAddress, [
      "function approve(address spender, uint256 amount) external returns (bool)",
      "function allowance(address owner, address spender) external view returns (uint256)"
    ], signer);

    const allowance = await token.allowance(userAddress, STAKING_ADDRESS);
    if (allowance.lt(amountFormatted)) {
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
  document.getElementById("connectWalletBtn")?.addEventListener("click", connect);
  document.getElementById("stakeForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const amt = document.getElementById("stakeAmount").value;
    const duration = parseInt(document.getElementById("stakeDuration").value);
    if (!amt || isNaN(amt) || isNaN(duration)) return;
    await stake(amt, duration);
  });
  document.getElementById("unstakeBtn")?.addEventListener("click", unstake);
  setInterval(updateStakeInfo, 15000);
});


// Chart.js реализация
let rewardHistory = [];
let rewardChart;

function initRewardChart() {
  const ctx = document.getElementById('rewardChart')?.getContext('2d');
  if (!ctx) return;
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

  if (rewardHistory.length > 20) rewardHistory.shift();
  rewardChart.data.labels = rewardHistory.map(p => p.x);
  rewardChart.data.datasets[0].data = rewardHistory.map(p => p.y);
  rewardChart.update();
}

// Модифицированный DOMContentLoaded для инициализации графика
document.addEventListener("DOMContentLoaded", () => {
  initRewardChart();

  document.getElementById("connectWalletBtn")?.addEventListener("click", connect);

  document.getElementById("stakeForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const amt = document.getElementById("stakeAmount").value;
    const duration = parseInt(document.getElementById("stakeDuration").value);
    if (!amt || isNaN(amt) || isNaN(duration)) return;
    await stake(amt, duration);
  });

  document.getElementById("unstakeBtn")?.addEventListener("click", unstake);
  setInterval(updateStakeInfo, 15000);
});

// Вставка обновления графика внутрь updateStakeInfo
const _originalUpdateStakeInfo = updateStakeInfo;
updateStakeInfo = async function() {
  if (!stakingContract || !userAddress) return;

  try {
    const stake = await stakingContract.stakeOf(userAddress);
    const unlockTime = await stakingContract.unlockTimeOf(userAddress);
    const reward = await stakingContract.calculateReward(userAddress);

    const stakeFormatted = ethers.utils.formatUnits(stake, DECIMALS);
    const rewardFormatted = ethers.utils.formatUnits(reward, DECIMALS);

    document.getElementById("stakeInfo").innerText = `Ваш стейк: ${stakeFormatted} IBITI`;
    document.getElementById("rewardInfo").innerText = `Награды: ${rewardFormatted} IBITI`;

    const now = Math.floor(Date.now() / 1000);
    const unlockTs = unlockTime.toNumber ? unlockTime.toNumber() : 0;
    const secondsLeft = unlockTs - now;

    document.getElementById("unlockInfo").innerText =
      unlockTs === 0 ? "Без блокировки" :
      secondsLeft <= 0 ? "Можно вывести" :
      `Разблокируется через ${Math.floor(secondsLeft / 86400)}д ${Math.floor((secondsLeft % 86400) / 3600)}ч`;

    if (typeof updateRewardChart === "function") {
      updateRewardChart(rewardFormatted);
    }
  } catch (err) {
    console.warn("Ошибка при получении информации о стейке", err);
  }
};
