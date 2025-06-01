// js/nft.js
import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.10.0/+esm";
import config from "./config.js";
import { ibitiNftAbi } from "./abis/ibitiNftAbi.js";
import { connectWallet, signer, showIbitiBalance, selectedAccount } from "./wallet.js";

// Выбираем конфигурацию (mainnet или testnet)
const netConfig = config.testnet ? config.testnet : config.mainnet;
const IBITI_NFT_ADDRESS = netConfig.contracts.IBITI_NFT_ADDRESS;

let nftContract = null;

/**
 * Инициализирует подключение кошелька и NFT-контракт.
 * Вызываем вручную при клике на NFT-карточку.
 */
export async function initNFTModule() {
  if (!window.ethereum) {
    alert("MetaMask не установлен. Установите расширение для работы с NFT.");
    console.warn("MetaMask не обнаружен. NFT-модуль не активен.");
    return false;
  }

  // Подключаем кошелек (Web3Modal появится только здесь)
  await connectWallet();
  if (!signer) return false;

  // Инициализируем контракт NFT
  nftContract = new ethers.Contract(IBITI_NFT_ADDRESS, ibitiNftAbi, signer);
  window.nftContract = nftContract;

  // Проверяем баланс NFT у пользователя (опционально)
  await getNFTBalance();
  return true;
}

/**
 * Получает баланс NFT у текущего пользователя и логирует в консоль.
 */
export async function getNFTBalance() {
  try {
    if (!nftContract || !selectedAccount) return;
    const balance = await nftContract.balanceOf(selectedAccount);
    console.log(`NFT-баланс (${selectedAccount}): ${balance.toString()}`);
    // По желанию можно обновить DOM-элемент, например:
    // document.getElementById("nftBalance").innerText = balance.toString();
  } catch (error) {
    console.error("Ошибка получения баланса NFT:", error);
  }
}

/**
 * Вызывается при подтверждении покупки NFT (после клика на “Купить NFT” внутри галереи).
 * discount и uri должны приходить из атрибутов карточки NFT.
 */
export async function handleNFTPurchase(discount, uri) {
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
    const saleManager = window.saleManager;
    if (!saleManager) throw new Error("Контракт saleManager не инициализирован");

    const tx = await saleManager.buyNFTWithIBITI(discount, uri);
    await tx.wait();

    Swal.fire({
      icon: 'success',
      title: 'Покупка успешна!',
      text: 'Вы приобрели NFT.',
      timer: 5000,
      showConfirmButton: false
    });

    // Обновляем баланс NFT и токенов
    await getNFTBalance();
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

// Больше НЕ вызываем initNFTModule автоматически.
// document.addEventListener("DOMContentLoaded", initNFTModule);
