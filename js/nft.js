// js/nft.js

import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.10.0/+esm";
import config from "./config.js";
import { ibitiNftAbi } from "./abis/ibitiNftAbi.js";
import { connectWallet, signer, showIbitiBalance, selectedAccount } from "./wallet.js";

// Определяем конфигурацию сети (mainnet или testnet)
const netConfig = config.testnet ? config.testnet : config.mainnet;
const IBITI_NFT_ADDRESS = netConfig.contracts.IBITI_NFT_ADDRESS;

let nftContract;

// -----------------------------
// 1) Инициализация NFT-модуля
// -----------------------------
async function initNFT() {
  if (!window.ethereum) {
    alert("MetaMask не установлен. Установите расширение для работы с NFT.");
    console.warn("MetaMask не обнаружен. NFT-модуль не активен.");
    return;
  }

  // Подключаем кошелек и получаем signer из wallet.js
  await connectWallet();
  if (!signer) return;

  // Инициализируем контракт NFT
  nftContract = new ethers.Contract(IBITI_NFT_ADDRESS, ibitiNftAbi, signer);

  // Делаем его доступным в window (если нужно)
  window.nftContract = nftContract;

  // Сразу проверяем баланс NFT
  await getNFTBalance();
}

// -----------------------------
// 2) Проверка баланса NFT
// -----------------------------
async function getNFTBalance() {
  try {
    const address = selectedAccount;
    if (!address) return;

    const balance = await nftContract.balanceOf(address);
    console.log(`NFT-баланс (${address}): ${balance.toString()}`);
    // Здесь можно обновить любой DOM-элемент с балансом, если он есть:
    // document.getElementById("nftBalance").innerText = balance.toString();
  } catch (error) {
    console.error("Ошибка получения баланса NFT:", error);
  }
}

// -----------------------------
// 3) Обработка покупки NFT
// -----------------------------
async function handleNFTPurchase(discount, uri) {
  if (!window.ethereum) {
    Swal.fire({
      icon: 'warning',
      title: 'MetaMask не найден',
      text: 'Установите MetaMask для выполнения покупки.',
    });
    return;
  }

  Swal.fire({
    title: 'Ожидание подтверждения...',
    html: 'Подтвердите транзакцию в кошельке',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  try {
    // Убедимся, что saleManager инициализирован в window
    const saleManager = window.saleManager;
    if (!saleManager) throw new Error("Контракт saleManager не инициализирован");

    // Предполагаем, что метод называется buyNFTWithIBITI(discount, uri)
    const tx = await saleManager.buyNFTWithIBITI(discount, uri);
    await tx.wait();

    Swal.fire({
      icon: 'success',
      title: 'Покупка успешна!',
      text: 'Вы приобрели NFT.',
      timer: 5000,
      showConfirmButton: false
    });

    // Обновляем баланс NFT после покупки
    await getNFTBalance();
    // При желании можно обновить баланс токена:
    await showIbitiBalance(true);
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Ошибка',
      text: error.message || 'Что-то пошло не так.',
      confirmButtonText: 'Ок'
    });
  }
}

// -----------------------------
// 4) Обработчики при загрузке
// -----------------------------
document.addEventListener("DOMContentLoaded", initNFT);

// Экспорт, если нужно обращаться из других модулей
export {
  initNFT,
  getNFTBalance,
  handleNFTPurchase
};
