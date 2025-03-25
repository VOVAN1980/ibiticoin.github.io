import { ethers } from "ethers";
import config from "../config.js"; // убедитесь, что путь корректный
import nftAbi from "./abis/IBITINFT.json"; // поместите ABI в папку js/abis

const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

const nftContract = new ethers.Contract(
  config.contracts.IBITI_NFT_ADDRESS, // или IBITI_NFT_IMPL_ADDRESS, если нужно
  nftAbi,
  signer
);

async function getNFTBalance() {
  const address = await signer.getAddress();
  const balance = await nftContract.balanceOf(address);
  console.log("NFT баланс:", balance.toString());
}
getNFTBalance();
