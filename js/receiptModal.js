// js/receiptModal.js (FINAL for app.js)
// - NO window.open()
// - NO header/top bar
// - shows receipt.html inside iframe as a clean "paper" card (no huge background)
// - "Close" button inside receipt closes the modal
// - clicking outside closes too
(function () {
  let overlayEl = null;
  let panelEl = null;
  let iframeEl = null;

  function closeReceiptModal() {
    if (!overlayEl) return;
    overlayEl.style.display = "none";
    if (iframeEl) iframeEl.src = "about:blank";
  }

  function ensureModal() {
    if (overlayEl) return;

    overlayEl = document.createElement("div");
    overlayEl.id = "ibiti-receipt-overlay";
    overlayEl.style.cssText =
      "position:fixed;inset:0;z-index:999999;" +
      "background:rgba(0,0,0,.55);" +
      "display:none;align-items:center;justify-content:center;" +
      "padding:18px;";

    // панель без шапки — только чек
    panelEl = document.createElement("div");
    panelEl.id = "ibiti-receipt-panel";
    panelEl.style.cssText =
      "width:min(640px, 96vw);" +
      "height:min(92vh, 980px);" +
      "background:transparent;" +
      "border-radius:16px;" +
      "box-shadow:0 25px 80px rgba(0,0,0,.35);" +
      "overflow:hidden;";

    iframeEl = document.createElement("iframe");
    iframeEl.id = "ibiti-receipt-iframe";
    iframeEl.style.cssText =
      "border:0;width:100%;height:100%;background:transparent;";
    iframeEl.allow = "clipboard-read; clipboard-write";

    // клик по затемнению — закрыть
    overlayEl.addEventListener("click", (e) => {
      if (e.target === overlayEl) closeReceiptModal();
    });

    // ESC — закрыть
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlayEl.style.display !== "none") closeReceiptModal();
    });

    // после загрузки receipt.html — убираем фон/паддинги и цепляем кнопку Close внутри чека
    iframeEl.addEventListener("load", () => {
      try {
        const doc = iframeEl.contentDocument;
        if (!doc) return;

        // убираем серый фон страницы, чтобы не было "огромного окна" позади
        doc.documentElement.style.background = "transparent";
        doc.body.style.background = "transparent";
        doc.body.style.padding = "0";
        doc.body.style.margin = "0";
        doc.body.style.minHeight = "100%";
        doc.body.style.display = "flex";
        doc.body.style.alignItems = "center";
        doc.body.style.justifyContent = "center";

        // сам чек по центру
        const card = doc.getElementById("card");
        if (card) {
          card.style.boxShadow = "none"; // модалка уже даёт тень
          card.style.borderRadius = "16px";
        }

        // перехватываем кнопку Close внутри receipt.html
        const btnClose = doc.getElementById("close");
        if (btnClose) {
          btnClose.onclick = (ev) => {
            try { ev.preventDefault(); } catch (_) {}
            closeReceiptModal();
          };
        }
      } catch (_) {
        // если вдруг браузер ограничит доступ — просто игнор
      }
    });

    panelEl.appendChild(iframeEl);
    overlayEl.appendChild(panelEl);
    document.body.appendChild(overlayEl);
  }

  function openReceiptModal(url) {
    ensureModal();
    iframeEl.src = url;
    overlayEl.style.display = "flex";
  }

  // глобально для app.js
  window.openReceiptModal = openReceiptModal;
  window.closeReceiptModal = closeReceiptModal;
})();
