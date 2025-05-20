import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js";
import { stakingAbi } from "./abis/stakingAbi.js";

const STAKING_ADDRESS = "0xd5D138855C7D8F24CD9eE52B65864bC3929a0aA5"; // твой StakingModule
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
    `Разблокируется через ${Math.floor(secondsLeft / 60)}м ${secondsLeft % 60}с`;
}

async function stake(amount) {
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

    const tx = await stakingContract.stake(amountFormatted);
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
    if (!amt || isNaN(amt)) return;
    await stake(amt);
  });
  document.getElementById("unstakeBtn")?.addEventListener("click", unstake);
  setInterval(updateStakeInfo, 15000); // автообновление
});
