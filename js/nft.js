// js/nft.js

import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.10.0/+esm";
import config from "./config.js";
import { ibitiNftAbi } from "./abis/ibitiNftAbi.js";
import { connectWallet, signer, selectedAccount, showIbitiBalance } from "./wallet.js";

const netConfig = config.mainnet; // Если есть testnet, используйте config.testnet
const IBITI_NFT_ADDRESS = netConfig.contracts.IBITINFT_ADDRESS_MAINNET; // или: contracts.IBITI_NFT_ADDRESS

let nftContract = null;

/**
 * Инициирует подключение кошелька и создание nftContract.
 * Возвращает true, если всё удачно, иначе false.
 */
export async function initNFTModule() {
  if (!window.ethereum) {
    alert("MetaMask не установлен. Установите расширение, чтобы работать с NFT.");
    console.warn("MetaMask не обнаружен. NFT-модуль не активен.");
    return false;
  }

  // 1) Подключаем кошелёк (если ещё не подключён)
  await connectWallet();
  if (!signer) {
    console.warn("NFT: signer не получен, выходим.");
    return false;
  }

  // 2) Инициализируем контракт NFT (если ещё не создан)
  if (!nftContract) {
    nftContract = new ethers.Contract(IBITI_NFT_ADDRESS, ibitiNftAbi, signer);
    window.nftContract = nftContract;
    console.log("nft.js: ✓ NFT-контракт инициализирован по адресу", IBITI_NFT_ADDRESS);
  }

  // 3) (опционально) Проверяем баланс NFT у пользователя
  try {
    const balance = await nftContract.balanceOf(selectedAccount);
    console.log(`nft.js: NFT-баланс (${selectedAccount}) =`, balance.toString());
  } catch (e) {
    console.warn("nft.js: не удалось получить баланс NFT:", e);
  }

  return true;
}

/**
 * / НЕ вызываем автоматически при загрузке страницы. 
 * A) Сперва мы вызываем initNFTModule(), 
 * B) Получаем цены от saleManager,
 * C) Отображаем модалку и сами методы buyWithIBITI / buyWithUSDT.
 */

export async function handleNFTPurchase(discount, uri) {
  if (!window.ethereum) {
    Swal.fire({
      icon: 'warning',
      title: 'MetaMask не найден',
      text: 'Установите MetaMask для покупки NFT.',
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

    // Пример метода покупки (вызывайте функцию контракта saleManager.buyNFTWithIBITI)
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
    try {
      const balance = await nftContract.balanceOf(selectedAccount);
      console.log(`Новый NFT-баланс:`, balance.toString());
    } catch {}

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
