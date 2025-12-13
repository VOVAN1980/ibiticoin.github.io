// js/shop.js
// Витрина магазина: продаём красиво, покупка фактически идёт через PancakeSwap

const PANCAKE_SWAP_URL =
  "https://pancakeswap.finance/swap?chain=bsc&" +
  "outputCurrency=0x47F2FFCb164b2EeCCfb7eC436Dfb3637a457B9bb&" +
  "inputCurrency=0x55d398326f99059fF775485246999027B3197955";

let currentProductId = null;

// --- Открытие/закрытие модалки покупки ---

function openPurchaseModal(productId) {
  // 🔁 Для NFT просто переходим на страницу с галереей
  if (productId === "NFT") {
    // в этой же вкладке
    window.location.href = "nft.html";
    // если хочешь в новой вкладке:
    // window.open("nft.html", "_blank");
    return;
  }

  // ниже — логика только для IBITIcoin
  currentProductId = productId;

  const modal       = document.getElementById("purchaseModal");
  const titleEl     = document.getElementById("purchaseTitle");
  const amountInput = document.getElementById("nftAmount");
  const tokenSelect = document.getElementById("paymentToken");
  const confirmBtn  = document.getElementById("confirmBtn");

  if (!modal || !titleEl || !amountInput || !tokenSelect || !confirmBtn) {
    console.warn("purchase modal elements missing");
    return;
  }

  if (productId === "IBITIcoin") {
    titleEl.textContent = "Покупка IBITIcoin через PancakeSwap";
  } else {
    titleEl.textContent = "Покупка";
  }

  amountInput.value = "";
  tokenSelect.value = "";
  confirmBtn.disabled = true;

  modal.style.display = "block";
}

function closePurchaseModal() {
  const modal = document.getElementById("purchaseModal");
  if (modal) modal.style.display = "none";
}

function updateConfirmButton() {
  const amount = document.getElementById("nftAmount")?.value || "";
  const token  = document.getElementById("paymentToken")?.value || "";
  const btn    = document.getElementById("confirmBtn");
  if (!btn) return;

  const validAmount =
    amount !== "" && !Number.isNaN(Number(amount)) && Number(amount) > 0;

  btn.disabled = !(validAmount && token);
}

function handleModalBackgroundClick(e) {
  const modal = document.getElementById("purchaseModal");
  if (e.target === modal) {
    closePurchaseModal();
  }
}

// --- Основная логика формы покупки ---

document.addEventListener("DOMContentLoaded", () => {
  const modal       = document.getElementById("purchaseModal");
  const form        = document.getElementById("purchaseForm");
  const amountInput = document.getElementById("nftAmount");
  const tokenSelect = document.getElementById("paymentToken");

  if (!modal || !form || !amountInput || !tokenSelect) {
    console.warn("shop.js: purchase form not found on this page");
    return;
  }

  amountInput.addEventListener("input", updateConfirmButton);
  tokenSelect.addEventListener("change", updateConfirmButton);

  modal.addEventListener("click", handleModalBackgroundClick);

  form.addEventListener("submit", (evt) => {
    evt.preventDefault();

    const amount = document.getElementById("nftAmount").value;
    const token  = document.getElementById("paymentToken").value;

    if (!amount || Number(amount) <= 0) {
      if (window.Swal) {
        Swal.fire("Ошибка", "Введите количество больше нуля.", "error");
      } else {
        alert("Введите количество больше нуля.");
      }
      return;
    }

    if (!token) {
      if (window.Swal) {
        Swal.fire("Ошибка", "Выберите способ оплаты.", "error");
      } else {
        alert("Выберите способ оплаты.");
      }
      return;
    }

    if (token !== "USDT") {
      if (window.Swal) {
        Swal.fire(
          "Недоступно",
          "Сейчас доступна только оплата через USDT на PancakeSwap.",
          "info"
        );
      } else {
        alert("Сейчас доступна только оплата через USDT на PancakeSwap.");
      }
      return;
    }

    const msgHtml = `
      <p>Мы не берём средства на сайт. Покупка происходит напрямую в <b>PancakeSwap</b>.</p>
      <p><b>Что делать дальше:</b></p>
      <p>1. В открывшейся вкладке подключите свой кошелёк в сети <b>BNB Smart Chain</b>.</p>
      <p>2. Выберите пару <b>USDT → IBITI</b> (она уже будет подставлена).</p>
      <p>3. Введите сумму в USDT (например, <b>${amount}</b>) и нажмите <b>Swap</b>.</p>
      <p>4. Подтвердите транзакцию в кошельке — IBITI появятся у вас на балансе.</p>
    `;

    if (window.Swal) {
      Swal.fire({
        icon: "info",
        title: "Покупка через PancakeSwap",
        html: msgHtml,
        confirmButtonText: "Открыть PancakeSwap",
        showCancelButton: true,
        cancelButtonText: "Отмена"
      }).then((res) => {
        if (res.isConfirmed) {
          window.open(PANCAKE_SWAP_URL, "_blank");
        }
      });
    } else {
      const ok = confirm(
        "Покупка IBITI выполняется через PancakeSwap.\n\nОткрыть официальный пул IBITI/USDT?"
      );
      if (ok) window.open(PANCAKE_SWAP_URL, "_blank");
    }

    closePurchaseModal();
  });
});

// Делаем функции глобальными для inline-обработчиков в HTML
window.openPurchaseModal = openPurchaseModal;
window.closePurchaseModal = closePurchaseModal;

