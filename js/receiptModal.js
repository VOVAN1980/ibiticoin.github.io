// js/receiptModal.js (classic, for app.js) — NO header, NO extra buttons.
// Close is controlled by receipt.html (postMessage) + ESC + click outside.
(function () {
  let overlayEl = null;
  let frameWrapEl = null;
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
        "background:rgba(0,0,0,0.55);" +
        "display:none;align-items:center;justify-content:center;" +
        "padding:16px;";

      frameWrapEl = document.createElement("div");
      frameWrapEl.style.cssText =
        "width:min(760px,96vw);" +
        "height:min(92vh,980px);" +
        "border-radius:14px;" +
        "overflow:hidden;" +
        "box-shadow:0 25px 80px rgba(0,0,0,0.35);" +
        "background:#fff;";

      iframeEl = document.createElement("iframe");
      iframeEl.style.cssText = "border:0;width:100%;height:100%;background:#fff;";
      iframeEl.allow = "clipboard-read; clipboard-write";

      frameWrapEl.appendChild(iframeEl);
      overlayEl.appendChild(frameWrapEl);
      document.body.appendChild(overlayEl);

      // клик по затемнению — закрыть
      overlayEl.addEventListener("click", (e) => {
        if (e.target === overlayEl) closeReceiptModal();
      });

      // ESC — закрыть
      window.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && overlayEl && overlayEl.style.display !== "none") {
          closeReceiptModal();
        }
      });

      // ✅ Close из receipt.html (через postMessage)
      window.addEventListener("message", (e) => {
        try {
          if (e.origin !== window.location.origin) return;
          const d = e.data || {};
          if (d && d.type === "IBITI_RECEIPT_CLOSE") closeReceiptModal();
        } catch (_) {}
      });
    }

    iframeEl.src = url;
    overlayEl.style.display = "flex";
  }

  window.openReceiptModal = openReceiptModal;
  window.closeReceiptModal = closeReceiptModal;
})();
