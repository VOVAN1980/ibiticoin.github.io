// js/nft.js
import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js";
import config from "./config.js";
import { ibitiNftAbi } from "./abis/ibitiNftAbi.js";

// Определяем активную сеть (используем тестовую сеть, если она указана, иначе основную)
const netConfig = config.testnet ?? config;

let provider, signer, nftContract;

// Функция инициализации NFT-модуля
async function initNFT() {
  // Проверяем наличие MetaMask
  if (!window.ethereum) {
    alert("MetaMask не установлен. Установите расширение для работы с NFT.");
    console.warn("MetaMask не обнаружен. NFT-модуль не активен.");
    return;
  }

  // Инициализируем провайдер и запрашиваем доступ к аккаунтам
  provider = new ethers.providers.Web3Provider(window.ethereum, "any");
  await provider.send("eth_requestAccounts", []); // запрос разрешения
  signer = provider.getSigner();

  // Создаём экземпляр контракта NFT
  nftContract = new ethers.Contract(
    netConfig.contracts.IBITI_NFT_ADDRESS,
    ibitiNftAbi,
    signer
  );

  // Делаем контракт и функции доступными глобально для отладки
  window.nftContract = nftContract;
  window.getNFTBalance = getNFTBalance;
  window.handleNFTPurchase = handleNFTPurchase;

  // Получаем начальный баланс NFT
  await getNFTBalance();
}

// Функция получения баланса NFT для подключённого аккаунта
async function getNFTBalance() {
  try {
    const address = await signer.getAddress();
    const balance = await nftContract.balanceOf(address);
    console.log(`NFT-баланс (${address}): ${balance.toString()}`);
  } catch (error) {
    console.error("Ошибка получения баланса NFT:", error);
  }
}

// Функция обработки покупки NFT через контракт saleManager
async function handleNFTPurchase(discount, uri) {
  // Проверяем наличие MetaMask
  if (!window.ethereum) {
    Swal.fire({
      icon: 'warning',
      title: 'MetaMask не найден',
      text: 'Установите MetaMask для выполнения покупки.',
    });
    return;
  }

  // Показываем уведомление о ожидании подтверждения
  Swal.fire({
    title: 'Ожидание подтверждения...',
    html: 'Подтвердите транзакцию в кошельке',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  try {
    const saleManager = window.saleManager;
    if (!saleManager) throw new Error("Контракт saleManager не инициализирован");

    // Отправляем транзакцию на покупку NFT
    const tx = await saleManager.buyNFTWithIBITI(discount, uri);
    await tx.wait();

    Swal.fire({
      icon: 'success',
      title: 'Покупка успешна!',
      text: 'Вы приобрели NFT.',
      timer: 5000,
      showConfirmButton: false
    });
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Ошибка',
      text: error.message || 'Что-то пошло не так.',
      confirmButtonText: 'Ок'
    });
  }
}

// Инициализация NFT-модуля после загрузки DOM
document.addEventListener("DOMContentLoaded", initNFT);
