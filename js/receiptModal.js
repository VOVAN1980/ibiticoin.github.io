// js/receiptModal.js (classic, for app.js)
// ✅ One modal only, no extra tabs, locks body scroll, returns focus back
(function () {
  let overlayEl = null;
  let iframeEl = null;
  let prevBodyOverflow = "";

  function closeReceiptModal() {
    if (!overlayEl) return;

    overlayEl.style.display = "none";
    if (iframeEl) iframeEl.src = "about:blank";

    // вернуть скролл страницы
    try { document.body.style.overflow = prevBodyOverflow || ""; } catch (_) {}

    // вернуть фокус на кнопку покупки (если есть)
    try { document.getElementById("promoBuyButton")?.focus(); } catch (_) {}
  }

  function openReceiptModal(url) {
    if (!overlayEl) {
      overlayEl = document.createElement("div");
      overlayEl.id = "ibiti-receipt-overlay";
      overlayEl.style.cssText =
        "position:fixed;inset:0;z-index:999999;" +
        "background:rgba(0,0,0,0.55);" +
        "display:none;align-items:center;justify-content:center;padding:16px;";

      const panel = document.createElement("div");
      panel.style.cssText =
        "width:min(760px,96vw);" +
        "height:min(92vh,980px);" +
        "background:#fff;border-radius:14px;" +
        "box-shadow:0 25px 80px rgba(0,0,0,0.35);" +
        "overflow:hidden;display:flex;flex-direction:column;";

      const top = document.createElement("div");
      top.style.cssText =
        "height:52px;display:flex;align-items:center;justify-content:space-between;" +
        "padding:0 14px;border-bottom:1px solid #eaeaea;" +
        "font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;";

      const title = document.createElement("div");
      title.textContent = "IBITI Receipt";
      title.style.cssText = "font-weight:700;";

      const closeBtn = document.createElement("button");
      closeBtn.type = "button";
      closeBtn.textContent = "✕";
      closeBtn.style.cssText =
        "width:36px;height:36px;border-radius:10px;border:1px solid #ddd;background:#fff;cursor:pointer;" +
        "font-size:16px;font-weight:800;line-height:1;";
      closeBtn.onclick = closeReceiptModal;

      top.appendChild(title);
      top.appendChild(closeBtn);

      iframeEl = document.createElement("iframe");
      iframeEl.style.cssText =
        "border:0;width:100%;height:100%;background:#fff;" +
        "border-radius:0 0 14px 14px;";
      iframeEl.allow = "clipboard-read; clipboard-write";

      // клик по затемнению — закрыть
      overlayEl.addEventListener("click", (e) => {
        if (e.target === overlayEl) closeReceiptModal();
      });

      // ESC — закрыть
      window.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && overlayEl?.style.display !== "none") closeReceiptModal();
      });

      panel.appendChild(top);
      panel.appendChild(iframeEl);
      overlayEl.appendChild(panel);
      document.body.appendChild(overlayEl);
    }

    // стоп скролл фона
    try {
      prevBodyOverflow = document.body.style.overflow || "";
      document.body.style.overflow = "hidden";
    } catch (_) {}

    iframeEl.src = url;
    overlayEl.style.display = "flex";
  }

  window.openReceiptModal = openReceiptModal;
  window.closeReceiptModal = closeReceiptModal;
})();
