import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js";
import config from "./config.js";
import { ibitiNftAbi } from "./abis/ibitiNftAbi.js";

// Определяем активную сеть
const netConfig = config.testnet ?? config;

let provider, signer, nftContract;

async function initNFT() {
  if (!window.ethereum) {
    alert("MetaMask не установлен. Установите расширение для работы с NFT.");
    console.warn("MetaMask не обнаружен. NFT-модуль не активен.");
    return;
  }
  
  provider = new ethers.providers.Web3Provider(window.ethereum, "any");
  let accounts = await provider.listAccounts();
  if (accounts.length === 0) {
    alert("Кошелек не подключен. Пожалуйста, нажмите кнопку «Подключить кошелек» на главной странице.");
    console.warn("Кошелек не подключен.");
    return;
  }
  
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

async function getNFTBalance() {
  try {
    const address = await signer.getAddress();
    const balance = await nftContract.balanceOf(address);
    console.log(`NFT-баланс (${address}): ${balance.toString()}`);
  } catch (error) {
    console.error("Ошибка получения баланса NFT:", error);
  }
}

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

document.addEventListener("DOMContentLoaded", initNFT);
