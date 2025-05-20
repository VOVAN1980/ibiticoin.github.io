// js/staking.js
import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js";
import { stakingAbi } from "./abis/stakingAbi.js";
import { ibitiTokenAbi } from "./abis/ibitiTokenAbi.js";

const STAKING_ADDRESS = "0xd5D138855C7D8F24CD9eE52B65864bC3929a0aA5";
const IBITI_TOKEN_ADDRESS = "0xa83825e09d3bf6ABf64efc70F08AdDF81A7Ba196";
const DECIMALS = 8;

let provider, signer, userAddress, stakingContract, ibitiToken;

async function connectWallet() {
  if (!window.ethereum) return alert("MetaMask не найден");

  provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = provider.getSigner();
  userAddress = await signer.getAddress();

  stakingContract = new ethers.Contract(STAKING_ADDRESS, stakingAbi, signer);
  ibitiToken = new ethers.Contract(IBITI_TOKEN_ADDRESS, ibitiTokenAbi, signer);

  document.getElementById("walletAddress").innerText = userAddress;
  await updateStakeInfo();
}

async function stake() {
  const amount = document.getElementById("stakeAmount").value;
  if (!amount || amount <= 0) return alert("Введите количество IBITI");

  const value = ethers.utils.parseUnits(amount.toString(), DECIMALS);
  const allowance = await ibitiToken.allowance(userAddress, STAKING_ADDRESS);

  if (allowance.lt(value)) {
    const txApprove = await ibitiToken.approve(STAKING_ADDRESS, value);
    await txApprove.wait();
  }

  const tx = await stakingContract.stake(value);
  await tx.wait();
  await updateStakeInfo();
  alert("Успешно застейкано!");
}

async function unstake() {
  const tx = await stakingContract.unstake();
  await tx.wait();
  await updateStakeInfo();
  alert("Вы вывели свои токены");
}

async function updateStakeInfo() {
  if (!stakingContract || !userAddress) return;
  const stake = await stakingContract.stakedBalance(userAddress);
  const formatted = ethers.utils.formatUnits(stake, DECIMALS);
  document.getElementById("stakeInfo").innerText = `Ваш стейк: ${formatted} IBITI`;
}

// Кнопки
document.getElementById("connectWalletBtn").onclick = connectWallet;
document.getElementById("stakeBtn").onclick = stake;
document.getElementById("unstakeBtn").onclick = unstake;

console.log("✅ staking.js загружен");
