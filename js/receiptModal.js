// js/receiptModal.js (classic, for app.js) — CLEAN (no extra window/frame)
// Modal = only backdrop + iframe. Close by click outside / ESC / from receipt.html via parent.closeReceiptModal()

(function () {
  let overlayEl = null;
  let iframeEl = null;

  function closeReceiptModal() {
    if (!overlayEl) return;
    overlayEl.style.display = "none";
    if (iframeEl) iframeEl.src = "about:blank";

    // вернуть фокус на кнопку покупки
    try { document.getElementById("promoBuyButton")?.focus(); } catch (_) {}
  }

  function openReceiptModal(url) {
    if (!overlayEl) {
      overlayEl = document.createElement("div");
      overlayEl.id = "ibiti-receipt-overlay";
      overlayEl.style.cssText =
        "position:fixed;inset:0;z-index:999999;" +
        "background:rgba(0,0,0,0.65);" +
        "display:none;align-items:center;justify-content:center;" +
        "padding:14px;";

      iframeEl = document.createElement("iframe");
      iframeEl.id = "ibiti-receipt-iframe";
      iframeEl.style.cssText =
        "width:min(640px, 96vw);" +
        "height:min(92vh, 980px);" +
        "border:0;" +
        "border-radius:16px;" +
        "background:#fff;" +
        "box-shadow:0 30px 90px rgba(0,0,0,0.45);" +
        "overflow:hidden;";

      iframeEl.allow = "clipboard-read; clipboard-write";

      // клик по фону — закрыть
      overlayEl.addEventListener("click", (e) => {
        if (e.target === overlayEl) closeReceiptModal();
      });

      // ESC — закрыть
      window.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && overlayEl.style.display !== "none") closeReceiptModal();
      });

      overlayEl.appendChild(iframeEl);
      document.body.appendChild(overlayEl);
    }

    iframeEl.src = url;
    overlayEl.style.display = "flex";
  }

  // global
  window.openReceiptModal = openReceiptModal;
  window.closeReceiptModal = closeReceiptModal;
})();
