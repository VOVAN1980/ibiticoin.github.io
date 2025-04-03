// Импортируем ethers из CDN (ESM-версия)
import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js";

// Импорт конфигурации и ABI
import config from "../config.js";
import nftAbi from "./abis/IBITINFT.js";

// Проверка на наличие MetaMask
if (!window.ethereum) {
  console.warn("MetaMask не обнаружен. NFT-модуль не активен.");
} else {
  const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
  const signer = provider.getSigner();

  // NFT контракт
  const nftContract = new ethers.Contract(
    config.contracts.IBITI_NFT_ADDRESS,
    nftAbi,
    signer
  );

  // Получение баланса NFT
  async function getNFTBalance() {
    try {
      const address = await signer.getAddress();
      const balance = await nftContract.balanceOf(address);
      console.log(`NFT баланс для ${address}:`, balance.toString());
    } catch (error) {
      console.error("Ошибка получения NFT баланса:", error);
    }
  }

  // Запускаем проверку при загрузке
  getNFTBalance();

  // Экспорт
  window.nftContract = nftContract;
  window.getNFTBalance = getNFTBalance;
}
