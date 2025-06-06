// js/wallet-connect-modal.js
import { Web3Modal } from "https://esm.jsdelivr.net/npm/@web3modal/html@2.4.6/+esm";
import {
  EthereumClient,
  w3mConnectors,
  w3mProvider
} from "https://esm.jsdelivr.net/npm/@web3modal/ethereum@2.4.2/+esm";
import { createClient } from "https://esm.jsdelivr.net/npm/ethers@6.13.5/+esm";
import * as ethers from "https://cdn.jsdelivr.net/npm/ethers@6.13.5/+esm";
import config from "./config.js";

// 1) Ваш Project ID с walletconnect.com
const projectId = "95f126f3a088cebcf781d2a1c10711fc";

// 2) Настраиваем цепочки
const chains = [{
  id: config.mainnet.chainId,
  name: config.mainnet.networkName,
  rpcUrls: [config.mainnet.rpcUrl]
}];

// 3) Инициализируем wagmi-клиент
const wagmiClient = createClient({
  autoConnect: false,
  connectors: w3mConnectors({ projectId, version: 2, chains }),
  provider:    w3mProvider(   { projectId, version: 2, chains })
});

// 4) Web3Modal + EthereumClient
const ethereumClient = new EthereumClient(wagmiClient, chains);
const web3Modal      = new Web3Modal({ projectId, ethereum: ethereumClient });

/**
 * Открывает модальное окно, ждёт выбора кошелька,
 * инициализирует ethers-провайдер, signer и глобальные переменные.
 */
export async function connectWalletModal() {
  // откроем нативную модалку Web3Modal v2
  await web3Modal.openModal();

  // после выбора провайдера в window.ethereum
  const provider  = new ethers.BrowserProvider(window.ethereum);
  const signer    = await provider.getSigner();
  const account   = await signer.getAddress();

  // сохраняем в глобал
  window.provider        = provider;
  window.signer          = signer;
  window.selectedAccount = account;

  // переключаем на BSC инициализируем контракты, баланс и т.п.
  await window.ethereum.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId: "0x38" }]
  }).catch(() => {/* если нет — добавит цепочку */});

  if (window.initContracts)      await window.initContracts();
  if (window.initSaleContract)   await window.initSaleContract();
  if (window.showIbitiBalance)   await window.showIbitiBalance(true);

  // закрываем модалку
  web3Modal.closeModal();
  return account;
}
