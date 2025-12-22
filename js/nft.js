// js/nft.js

import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.10.0/+esm";
// something import config from "./config.js";
import { ibitiNftAbi } from "./abis/ibitiNftAbi.js";
// something import { connectWallet, signer, selectedAccount, showIbitiBalance } from "./wallet.js";

// Выбираем конфигурацию (mainnet или testnet)
// something const netConfig = config.mainnet; // или config.testnet, если у вас есть testnet
const IBITI_NFT_ADDRESS = netConfig.contracts.IBITINFT_ADDRESS_MAINNET || netConfig.contracts.IBITI_NFT_ADDRESS;

// Хранить инстанс контракта
let nftContract = null;

/**
 * Инициализирует контракт NFT, но не подключает кошелёк заново.
 * Предполагается, что connectWallet() уже вызывался заранее (через кнопку «Подключить кошелек»).
 */
export async function initNFTModule() {
  if (!window.ethereum) {
    alert("MetaMask не установлен. Установите расширение, чтобы работать с NFT.");
    console.warn("MetaMask не обнаружен. NFT-модуль не активен.");
    return false;
  }

  // Если кошелёк не подключён, возвращаем false
  if (!selectedAccount || !signer) {
    console.warn("NFT: кошелёк не подключён. Вызовите connectWallet() сперва.");
    return false;
  }

  // Если контракт ещё не создан — создаём
  if (!nftContract) {
    nftContract = new ethers.Contract(IBITI_NFT_ADDRESS, ibitiNftAbi, signer);
    window.nftContract = nftContract;
    console.log("nft.js: ✓ NFT-контракт инициализирован по адресу", IBITI_NFT_ADDRESS);
  }

  // (опционально) Проверка баланса NFT
  try {
    const balance = await nftContract.balanceOf(selectedAccount);
    console.log(`nft.js: NFT-баланс (${selectedAccount}) =`, balance.toString());
  } catch (e) {
    console.warn("nft.js: Не удалось получить баланс NFT:", e);
  }

  return true;
}

/**
 * Вызывается при нажатии “Купить NFT” внутри модального окна (после запроса цен).
 * discount, uri должны передаваться из карточки NFT (например, data-атрибут).
 */
export async function handleNFTPurchase(discount, uri) {
  if (!window.ethereum) {
    Swal.fire({
      icon: 'warning',
      title: 'MetaMask не найден',
      text: 'Установите MetaMask для выполнения покупки NFT.',
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
    if (!saleManager) {
      throw new Error("Контракт saleManager не инициализирован");
    }

    // Пример: вызываем метод buyNFTWithIBITI у saleManager
    const tx = await saleManager.buyNFTWithIBITI(discount, uri);
    await tx.wait();

    Swal.fire({
      icon: 'success',
      title: 'Покупка успешна!',
      text: 'Вы приобрели NFT.',
      timer: 5000,
      showConfirmButton: false
    });

    // Обновляем баланс NFT и баланс токенов
    try {
      const newBalance = await nftContract.balanceOf(selectedAccount);
      console.log(`Новый NFT-баланс: ${newBalance.toString()}`);
    } catch {}

    await showIbitiBalance(true);
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Ошибка',
      text: error.message || 'Что-то пошло не так при покупке NFT.',
      confirmButtonText: 'Ок'
    });
  }
}



