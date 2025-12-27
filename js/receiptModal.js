// js/receiptModal.js (classic) — SINGLE CLEAN MODAL (no extra header/frame)
(function () {
  let overlayEl = null;
  let panelEl = null;
  let iframeEl = null;
  let lastFocusEl = null;

  function closeReceiptModal() {
    if (!overlayEl) return;

    overlayEl.style.display = "none";
    if (iframeEl) iframeEl.src = "about:blank";

    // вернуть скролл страницы
    try { document.body.style.overflow = ""; } catch (_) {}

    // вернуть фокус
    try { lastFocusEl?.focus?.(); } catch (_) {}
    lastFocusEl = null;
  }

  function openReceiptModal(url) {
    // запоминаем фокус до открытия
    try { lastFocusEl = document.activeElement; } catch (_) {}

    if (!overlayEl) {
      overlayEl = document.createElement("div");
      overlayEl.id = "ibiti-receipt-overlay";
      overlayEl.style.cssText =
        "position:fixed;inset:0;z-index:999999;" +
        "background:rgba(0,0,0,0.65);" +
        "display:none;align-items:center;justify-content:center;" +
        "padding:18px;";

      panelEl = document.createElement("div");
      panelEl.id = "ibiti-receipt-panel";
      panelEl.style.cssText =
        "position:relative;" +
        "width:min(980px,96vw);" +
        "height:min(92vh,980px);" +
        "border-radius:16px;" +
        "overflow:hidden;" +
        "box-shadow:0 30px 90px rgba(0,0,0,0.45);" +
        "background:transparent;"; // <-- важно: без белой “второй” рамки

      iframeEl = document.createElement("iframe");
      iframeEl.id = "ibiti-receipt-iframe";
      iframeEl.style.cssText =
        "border:0;width:100%;height:100%;" +
        "background:#fff;" +
        "border-radius:16px;"; // один “лист”, без двойных окон
      iframeEl.allow = "clipboard-read; clipboard-write";

      const closeBtn = document.createElement("button");
      closeBtn.type = "button";
      closeBtn.setAttribute("aria-label", "Close");
      closeBtn.textContent = "✕";
      closeBtn.style.cssText =
        "position:absolute;top:10px;right:10px;" +
        "width:40px;height:40px;" +
        "border-radius:12px;" +
        "border:1px solid rgba(0,0,0,0.15);" +
        "background:rgba(255,255,255,0.92);" +
        "cursor:pointer;" +
        "font-size:18px;font-weight:900;line-height:1;" +
        "z-index:2;";
      closeBtn.onclick = closeReceiptModal;

      overlayEl.addEventListener("click", (e) => {
        if (e.target === overlayEl) closeReceiptModal();
      });

      window.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && overlayEl?.style.display !== "none") closeReceiptModal();
      });

      panelEl.appendChild(iframeEl);
      panelEl.appendChild(closeBtn);
      overlayEl.appendChild(panelEl);
      document.body.appendChild(overlayEl);
    }

    // блокируем скролл заднего фона
    try { document.body.style.overflow = "hidden"; } catch (_) {}

    iframeEl.src = url;
    overlayEl.style.display = "flex";
  }

  window.openReceiptModal = openReceiptModal;
  window.closeReceiptModal = closeReceiptModal;
})();
