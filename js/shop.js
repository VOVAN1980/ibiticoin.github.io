// js/shop.js
// Store showcase: visual selling, real purchase happens on PancakeSwap

const PANCAKE_SWAP_URL =
  "https://pancakeswap.finance/swap?chain=bsc&" +
  "outputCurrency=0x47F2FFCb164b2EeCCfb7eC436Dfb3637a457B9bb&" +
  "inputCurrency=0x55d398326f99059fF775485246999027B3197955";

let currentProductId = null;

// ---------- Open / close purchase modal ----------

function openPurchaseModal(productId) {
  // For NFT we simply redirect to NFT gallery
  if (productId === "NFT") {
    window.location.href = "nft.html";     // same tab
    // window.open("nft.html", "_blank");  // or new tab
    return;
  }

  // Below is logic only for IBITIcoin
  currentProductId = productId;

  const modal       = document.getElementById("purchaseModal");
  const titleEl     = document.getElementById("purchaseTitle");
  const amountInput = document.getElementById("nftAmount");
  const tokenSelect = document.getElementById("paymentToken");
  const confirmBtn  = document.getElementById("confirmBtn");

  if (!modal || !titleEl || !amountInput || !tokenSelect || !confirmBtn) {
    console.warn("shop.js: purchase modal elements are missing");
    return;
  }

  if (productId === "IBITIcoin") {
    titleEl.textContent = "Buy IBITIcoin via PancakeSwap";
  } else {
    titleEl.textContent = "Purchase";
  }

  amountInput.value     = "";
  tokenSelect.value     = "";
  confirmBtn.disabled   = true;
  modal.style.display   = "block";
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
  if (e.target === modal) closePurchaseModal();
}

// ---------- Main purchase form logic ----------

document.addEventListener("DOMContentLoaded", () => {
  const modal       = document.getElementById("purchaseModal");
  const form        = document.getElementById("purchaseForm");
  const amountInput = document.getElementById("nftAmount");
  const tokenSelect = document.getElementById("paymentToken");

  if (!modal || !form || !amountInput || !tokenSelect) {
    console.warn("shop.js: purchase form not found on this page");
    return;
  }

  amountInput.addEventListener("input",  updateConfirmButton);
  tokenSelect.addEventListener("change", updateConfirmButton);
  modal.addEventListener("click", handleModalBackgroundClick);

  form.addEventListener("submit", (evt) => {
    evt.preventDefault();

    const amount = amountInput.value;
    const token  = tokenSelect.value;

    if (!amount || Number(amount) <= 0) {
      if (window.Swal) {
        Swal.fire("Error", "Enter an amount greater than zero.", "error");
      } else {
        alert("Enter an amount greater than zero.");
      }
      return;
    }

    if (!token) {
      if (window.Swal) {
        Swal.fire("Error", "Select a payment method.", "error");
      } else {
        alert("Select a payment method.");
      }
      return;
    }

    if (token !== "USDT") {
      const msg = "Currently only payment in USDT on PancakeSwap is supported.";
      if (window.Swal) {
        Swal.fire("Not available", msg, "info");
      } else {
        alert(msg);
      }
      return;
    }

    const msgHtml = `
      <p>We never take your funds to this website. The purchase is executed directly on <b>PancakeSwap</b>.</p>
      <p><b>Next steps:</b></p>
      <p>1. In the new tab connect your wallet on <b>BNB Smart Chain</b>.</p>
      <p>2. Make sure the pair <b>USDT → IBITI</b> is selected (it will be pre-filled).</p>
      <p>3. Enter the amount in USDT (for example, <b>${amount}</b>) and click <b>Swap</b>.</p>
      <p>4. Confirm the transaction in your wallet — IBITI will appear on your balance.</p>
    `;

    if (window.Swal) {
      Swal.fire({
        icon: "info",
        title: "Purchase via PancakeSwap",
        html: msgHtml,
        confirmButtonText: "Open PancakeSwap",
        showCancelButton: true,
        cancelButtonText: "Cancel"
      }).then((res) => {
        if (res.isConfirmed) window.open(PANCAKE_SWAP_URL, "_blank");
      });
    } else {
      const ok = confirm(
        "IBITI purchase is done on PancakeSwap.\n\nOpen the official IBITI/USDT pool?"
      );
      if (ok) window.open(PANCAKE_SWAP_URL, "_blank");
    }

    closePurchaseModal();
  });
});

// Make functions global for inline HTML handlers
window.openPurchaseModal  = openPurchaseModal;
window.closePurchaseModal = closePurchaseModal;
