// nft.js (обновленный вариант)
import { ethers } from "https://esm.sh/ethers@5.7.2";
import config from "./config.js";
import { ibitiNftAbi } from "./abis/ibitiNftAbi.js";

// Определяем активную сеть
const netConfig = config.testnet ?? config;

let provider, signer, nftContract;

// Проверка MetaMask и инициализация
async function initNFT() {
  if (!window.ethereum) {
    alert("MetaMask не установлен. Установите расширение для работы с NFT.");
    console.warn("MetaMask не обнаружен. NFT-модуль не активен.");
    return;
  }

  provider = new ethers.providers.Web3Provider(window.ethereum, "any");
  signer = provider.getSigner();

  nftContract = new ethers.Contract(
    netConfig.contracts.IBITI_NFT_ADDRESS,
    ibitiNftAbi,
    signer
  );

  window.nftContract = nftContract;
  window.getNFTBalance = getNFTBalance;
  window.handleNFTPurchase = handleNFTPurchase;

  await getNFTBalance();
}

// Проверка баланса
async function getNFTBalance() {
  try {
    const address = await signer.getAddress();
    const balance = await nftContract.balanceOf(address);
    console.log(`NFT-баланс (${address}): ${balance.toString()}`);
  } catch (error) {
    console.error("Ошибка получения баланса NFT:", error);
  }
}

// Обработка покупки NFT
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
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Ошибка',
      text: error.message || 'Что-то пошло не так.',
      confirmButtonText: 'Ок'
    });
  }
}

// Инициализация при загрузке
document.addEventListener("DOMContentLoaded", initNFT);
