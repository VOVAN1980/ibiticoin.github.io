import { ethers } from "ethers";
import config from "../config.js"; // Убедитесь, что путь корректный
import nftAbi from "./abis/IBITINFT.json"; // ABI контракта IBITINFT

const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

const nftContract = new ethers.Contract(
  config.contracts.IBITI_NFT_ADDRESS, // адрес подтягивается из конфигурации
  nftAbi,
  signer
);

async function getNFTBalance() {
  const address = await signer.getAddress();
  const balance = await nftContract.balanceOf(address);
  console.log("NFT баланс:", balance.toString());
}
getNFTBalance();
