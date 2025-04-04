// js/nft.js
import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js";
import config from "../config.js";
import { ibitiNftAbi } from "./abis/IBITINFT.js";

// Определяем активную сеть (по config)
const netConfig = config.testnet ?? config;

if (!window.ethereum) {
  alert("MetaMask не установлен. Установите расширение для работы с NFT.");
  console.warn("MetaMask не обнаружен. NFT-модуль не активен.");
} else {
  const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
  const signer = provider.getSigner();

  const nftContract = new ethers.Contract(
    netConfig.contracts.IBITI_NFT_ADDRESS,
    ibitiNftAbi,
    signer
  );

  async function getNFTBalance() {
    try {
      const address = await signer.getAddress();
      const balance = await nftContract.balanceOf(address);
      console.log(`NFT-баланс (${address}): ${balance.toString()}`);
    } catch (error) {
      console.error("Ошибка получения баланса NFT:", error);
    }
  }

  getNFTBalance();

  // Глобальный экспорт
  window.nftContract = nftContract;
  window.getNFTBalance = getNFTBalance;
}
