// blockchain.js (js/utils/blockchain.js)

// Импортируем ethers из CDN (ES-модульная версия)
import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js";
import configData from "../config.js";
import IBITIcoinAbi from "../abis/IBITIcoin.js";

// Выбираем параметры сети: если NODE_ENV равен "production" и есть mainnet, используем его; иначе testnet.
const network =
  process.env.NODE_ENV === "production" && configData.mainnet
    ? configData.mainnet
    : configData;

// Проверяем наличие необходимых данных
if (!network.rpcUrl || !network.contracts.IBITI_TOKEN_ADDRESS) {
  throw new Error("Некорректная конфигурация сети в config.js");
}

// Создаем провайдер
let provider;
try {
  provider = new ethers.providers.JsonRpcProvider(network.rpcUrl);
} catch (err) {
  console.error("Ошибка при создании провайдера:", err);
  throw err;
}

// Функция для проверки, соответствует ли текущая сеть ожидаемой
async function checkNetwork() {
  try {
    const currentNetwork = await provider.getNetwork();
    if (currentNetwork.chainId !== network.chainId) {
      console.warn(
        `Текущая сеть (chainId=${currentNetwork.chainId}) не соответствует ожидаемой (${network.chainId}).`
      );
    } else {
      console.log(`Подключены к сети: ${network.networkName} (chainId=${network.chainId}).`);
    }
  } catch (err) {
    console.error("Ошибка при проверке сети:", err);
  }
}
checkNetwork();

// Инициализируем signer
let signer;
if (typeof window !== "undefined" && window.ethereum) {
  // Если в браузере – используем MetaMask
  const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
  signer = web3Provider.getSigner();
  // Запрашиваем доступ, если ещё не получен
  window.ethereum.request({ method: "eth_requestAccounts" }).catch((err) => {
    console.error("Ошибка при запросе доступа к MetaMask:", err);
  });
} else if (process.env.PRIVATE_KEY) {
  try {
    signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  } catch (err) {
    console.error("Ошибка при создании signer через PRIVATE_KEY:", err);
    throw err;
  }
} else {
  throw new Error("Signer не определен: нет MetaMask и PRIVATE_KEY не указан");
}

// Создаем экземпляр контракта IBITIcoin
const ibitiContract = new ethers.Contract(
  network.contracts.IBITI_TOKEN_ADDRESS,
  IBITIcoinAbi,
  signer
);

// Экспортируем провайдер, signer, контракт и настройки сети
export { provider, signer, ibitiContract, network };
