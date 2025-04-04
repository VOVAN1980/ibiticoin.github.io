// js/nft.js
import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js";
import config from "../config.js";
import { ibitiNftAbi } from "./abis/IBITINFT.js";

// Проверка MetaMask
if (!window.ethereum) {
  console.warn("MetaMask не обнаружен. NFT-модуль не активен.");
} else {
  const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
  const signer = provider.getSigner();

  const nftContract = new ethers.Contract(
    config.testnet.contracts.IBITI_NFT_ADDRESS,
    ibitiNftAbi,
    signer
  );

  // Получение баланса NFT
  async function getNFTBalance() {
    try {
      const address = await signer.getAddress();
      const balance = await nftContract.balanceOf(address);
      console.log(`NFT-баланс (${address}): ${balance.toString()}`);
    } catch (error) {
      console.error("Ошибка получения баланса NFT:", error);
    }
  }

  // При загрузке
  getNFTBalance();

  // Глобальный экспорт (для кнопок, отладки и т.д.)
  window.nftContract = nftContract;
  window.getNFTBalance = getNFTBalance;
}
