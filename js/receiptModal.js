// js/receiptModal.js — ULTRA CLEAN (no “second window”)
// overlay (dark) + iframe (transparent, no shadow, no white background)

(function () {
  let overlayEl = null;
  let iframeEl = null;

  function closeReceiptModal() {
    if (!overlayEl) return;
    overlayEl.style.display = "none";
    if (iframeEl) iframeEl.src = "about:blank";
    try { document.getElementById("promoBuyButton")?.focus(); } catch (_) {}
  }

  function openReceiptModal(url) {
    if (!overlayEl) {
      overlayEl = document.createElement("div");
      overlayEl.id = "ibiti-receipt-overlay";
      overlayEl.style.cssText =
        "position:fixed;inset:0;z-index:999999;" +
        "background:rgba(0,0,0,0.70);" +
        "display:none;align-items:center;justify-content:center;" +
        "padding:12px;";

      iframeEl = document.createElement("iframe");
      iframeEl.id = "ibiti-receipt-iframe";

      // ✅ ВАЖНО: iframe БЕЗ фона/тени/рамки — чтобы не было “второго окна”
      iframeEl.style.cssText =
        "width:min(640px, 96vw);" +
        "height:min(92vh, 980px);" +
        "border:0;" +
        "background:transparent;" +
        "box-shadow:none;" +
        "border-radius:0;" +
        "display:block;";

      iframeEl.allow = "clipboard-read; clipboard-write";

      overlayEl.addEventListener("click", (e) => {
        if (e.target === overlayEl) closeReceiptModal();
      });

      window.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && overlayEl.style.display !== "none") closeReceiptModal();
      });

      overlayEl.appendChild(iframeEl);
      document.body.appendChild(overlayEl);
    }

    iframeEl.src = url;
    overlayEl.style.display = "flex";
  }

  window.openReceiptModal = openReceiptModal;
  window.closeReceiptModal = closeReceiptModal;
})();
