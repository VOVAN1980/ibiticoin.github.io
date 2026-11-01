/* IBITI NFT gallery (classic script, uses ethers UMD and js/config.js) */
(function () {
  "use strict";

  const SALE_ABI = [
    "function paused() view returns (bool)",
    "function priceOf(uint256) view returns (uint256)",
    "function catalog() view returns (uint256[] prices, uint256[] minted, uint256[] maxSupply)",
    "function buy(uint256 cardId, uint256 expectedPrice) returns (uint256)",
    "error NotForSale(uint256 cardId)",
    "error PriceChanged(uint256 cardId, uint256 price)",
    "error SoldOut(uint256 cardId)",
  ];
  const ERC20_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address, address) view returns (uint256)",
    "function approve(address, uint256) returns (bool)",
  ];

  const ERROR_TEXT = {
    NotForSale: "This card is not on sale right now.",
    PriceChanged: "The price has just changed. Check the new price and try again.",
    SoldOut: "This card has just sold out.",
  };

  const $ = (id) => document.getElementById(id);
  const isAddr = (a) => typeof a === "string" && /^0x[a-fA-F0-9]{40}$/.test(a);
  const usd = (x) => `${Number(ethers.formatUnits(x, 18)).toLocaleString("en-US")} USDT`;
  const cardEl = (cardId) => document.querySelector(`.nft-item[data-card="${cardId}"]`);

  const net = window.IBITI_CONFIG.getNet();
  let read = null;
  let write = null;
  let usdt = null;
  let account = null;

  function notice(text) {
    $("nftNotice").textContent = text;
    $("nftNotice").hidden = !text;
  }

  function friendlyError(e) {
    if (e && (e.code === "ACTION_REJECTED" || e.code === 4001)) return "Cancelled in your wallet.";
    let name = e && e.revert && e.revert.name;
    if (!name && read) {
      try {
        const data = (e && e.data) || (e && e.info && e.info.error && e.info.error.data);
        const parsed = data && read.interface.parseError(typeof data === "string" ? data : data.data);
        name = parsed && parsed.name;
      } catch (_) {}
    }
    if (name && ERROR_TEXT[name]) return ERROR_TEXT[name];
    return (e && (e.shortMessage || e.message)) || "Transaction failed.";
  }

  const showError = (e) => {
    console.error(e);
    return Swal.fire({ icon: "error", title: "Not completed", text: friendlyError(e) });
  };

  const busy = (title) =>
    Swal.fire({ title, text: "Confirm in your wallet and wait for the network.", allowOutsideClick: false, showConfirmButton: false, didOpen: () => Swal.showLoading() });

  // ===== Wallet =====

  async function ensureChain() {
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    if (chainId && chainId.toLowerCase() === net.chainIdHex.toLowerCase()) return;
    try {
      await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: net.chainIdHex }] });
    } catch (e) {
      if (!(e && (e.code === 4902 || String(e.message || "").includes("4902")))) throw e;
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: net.chainIdHex,
          chainName: net.chainName,
          rpcUrls: net.rpcUrls,
          nativeCurrency: net.nativeCurrency,
          blockExplorerUrls: net.blockExplorerUrls,
        }],
      });
    }
  }

  async function connectWallet() {
    if (!window.ethereum) {
      if (/android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent || "")) {
        const u = new URL("/wallet.html", location.origin);
        u.searchParams.set("redirect", location.href);
        location.href = u.toString();
        return;
      }
      Swal.fire({ icon: "info", title: "No wallet found", text: "Install MetaMask or Trust Wallet, or open this page in the wallet's browser." });
      return;
    }
    await ensureChain();
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    if (!accounts || !accounts[0]) throw new Error("No account returned by the wallet.");
    const signer = await new ethers.BrowserProvider(window.ethereum).getSigner();
    account = await signer.getAddress();
    if (read) {
      write = new ethers.Contract(net.nftSale, SALE_ABI, signer);
      usdt = new ethers.Contract(net.usdt, ERC20_ABI, signer);
    }
    $("walletAddress").textContent = `Wallet: ${account}`;
    $("connectWalletBtn").textContent = "✅ Wallet connected";
  }

  // ===== Reading =====

  async function refresh() {
    const [[prices, minted, maxSupply], paused] = await Promise.all([read.catalog(), read.paused()]);
    prices.forEach((price, i) => {
      const box = cardEl(i + 1);
      if (!box) return;
      const soldOut = minted[i] >= maxSupply[i];
      const button = box.querySelector('[data-role="buy"]');
      box.querySelector('[data-role="edition"]').textContent = `${minted[i]} of ${maxSupply[i]} minted`;
      button.disabled = paused || soldOut || price === 0n;
      button.textContent = soldOut ? "Sold out" : price === 0n ? "Price coming soon" : paused ? "Sale paused" : `Buy for ${usd(price)}`;
    });
  }

  // ===== Buying =====

  async function onBuy(cardId) {
    if (!account) await connectWallet();
    if (!account) return;
    const name = cardEl(cardId).dataset.name;
    const price = await read.priceOf(cardId);
    if (price === 0n) return showError({ revert: { name: "NotForSale" } });
    if ((await usdt.balanceOf(account)) < price) {
      return Swal.fire({ icon: "warning", title: "Not enough USDT", text: `You need ${usd(price)} in this wallet on ${net.chainName}.` });
    }
    const { isConfirmed } = await Swal.fire({
      icon: "question",
      title: `Buy ${name}?`,
      html: `The price is <b>${usd(price)}</b>. The NFT stays yours for good.<br><br>Your wallet asks you to allow exactly this amount, then to confirm the purchase.`,
      showCancelButton: true,
      confirmButtonText: "Confirm",
      cancelButtonText: "Cancel",
    });
    if (!isConfirmed) return;
    try {
      busy("Buying…");
      // Разрешение только на точную сумму цены
      if ((await usdt.allowance(account, net.nftSale)) !== price) {
        await (await usdt.approve(net.nftSale, price)).wait();
      }
      const receipt = await (await write.buy(cardId, price)).wait();
      await refresh();
      const link = `${net.blockExplorerUrls[0]}/tx/${receipt.hash}`;
      Swal.fire({ icon: "success", title: `${name} is yours`, html: `<a href="${link}" target="_blank" rel="noopener">View the transaction</a>` });
    } catch (err) {
      await showError(err);
      await refresh();
    }
  }

  // ===== Start =====

  async function init() {
    $("connectWalletBtn").addEventListener("click", () => connectWallet().catch(showError));
    if (window.ethereum && window.ethereum.on) {
      window.ethereum.on("accountsChanged", () => location.reload());
      window.ethereum.on("chainChanged", () => location.reload());
    }
    if (!isAddr(net.nftSale)) return;

    const rp = new ethers.JsonRpcProvider(net.rpcUrls[0]);
    read = new ethers.Contract(net.nftSale, SALE_ABI, rp);
    await refresh();

    $("nftGallery").addEventListener("click", (e) => {
      const button = e.target.closest('[data-role="buy"]');
      if (!button || button.disabled) return;
      onBuy(Number(button.closest("[data-card]").dataset.card)).catch(showError);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    init().catch((e) => {
      console.error(e);
      notice("Could not load the prices. Check your connection and reload the page.");
    });
  });
})();
