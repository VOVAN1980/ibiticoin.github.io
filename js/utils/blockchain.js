import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js";
import { config } from "./config.js";
import { ibitiTokenAbi } from "../abis/ibitiTokenAbi.js";

// Используем testnet всегда, потому что это фронтенд
const network = config.testnet;

// Проверка конфигурации
if (!network.rpcUrl || !network.contracts.IBITI_TOKEN_ADDRESS) {
  throw new Error("config.js: нет rpcUrl или адреса токена");
}

// Создаем провайдер через MetaMask (если есть)
let provider, signer;
if (typeof window !== "undefined" && window.ethereum) {
  provider = new ethers.providers.Web3Provider(window.ethereum, "any");
  signer = provider.getSigner();

  // Проверка сети
  provider.getNetwork().then(n => {
    if (n.chainId !== network.chainId) {
      console.warn(`Подключены к неправильной сети. Ожидалась: ${network.chainId}, сейчас: ${n.chainId}`);
    } else {
      console.log(`✅ Подключены к ${network.networkName}`);
    }
  });

} else {
  throw new Error("MetaMask не найден. Установите MetaMask.");
}

// Контракт IBITIcoin
const ibitiContract = new ethers.Contract(
  network.contracts.IBITI_TOKEN_ADDRESS,
  ibitiTokenAbi,
  signer
);

export { provider, signer, ibitiContract, network };
