// Импортируем ethers из CDN (ESM-версия)
import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js";

// Импорт конфигурации (config.js находится в корне, поэтому поднимаемся на один уровень)
import config from "../config.js";

// Импорт ABI для NFT-контракта (убедитесь, что файл ABI преобразован в модульный JS-файл)
import nftAbi from "./abis/IBITINFT.js";

// Создаем провайдер и signer через ethers.js
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

// Создаем экземпляр контракта NFT, используя адрес из config.js
const nftContract = new ethers.Contract(
  config.contracts.IBITI_NFT_ADDRESS, // Адрес NFT-контракта из config.js
  nftAbi,                             // ABI контракта (модуль .js)
  signer                              // Signer для отправки транзакций
);

// Функция для получения баланса NFT у подключенного адреса
async function getNFTBalance() {
  try {
    const address = await signer.getAddress();
    const balance = await nftContract.balanceOf(address);
    console.log("NFT баланс:", balance.toString());
  } catch (error) {
    console.error("Ошибка получения NFT баланса:", error);
  }
}

// Вызываем функцию для проверки баланса при загрузке модуля
getNFTBalance();

// Экспортируем контракт и функцию, если они потребуются в других модулях
export { nftContract, getNFTBalance };
