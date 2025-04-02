console.log("wallet.js загружен");

// Проверка наличия MetaMask
function isMetaMaskInstalled() {
  return typeof window.ethereum !== "undefined" && window.ethereum.isMetaMask;
}

// Подключение кошелька
async function connectWallet() {
  if (!isMetaMaskInstalled()) {
    alert("Пожалуйста, установите MetaMask для подключения кошелька.");
    window.open("https://metamask.io/download/", "_blank");
    return;
  }

  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const userAddress = accounts[0];
    console.log("Кошелек подключён:", userAddress);

    // Сохраняем адрес в localStorage, если нужно
    localStorage.setItem("walletAddress", userAddress);

    // Можно добавить логику отображения подключённого адреса на сайте
    const walletDisplay = document.getElementById("walletAddressDisplay");
    if (walletDisplay) {
      walletDisplay.textContent = userAddress;
    }

  } catch (err) {
    console.error("Ошибка подключения кошелька:", err);
  }
}

// Привязка к кнопкам
document.addEventListener("DOMContentLoaded", () => {
  const connectButtons = document.querySelectorAll(".connectWalletBtn");

  if (connectButtons.length === 0) {
    console.warn("Элементы с классом 'connectWalletBtn' не найдены.");
  }

  connectButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      connectWallet();
    });
  });
});
