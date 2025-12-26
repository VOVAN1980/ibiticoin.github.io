// js/receiptModal.js
let overlayEl = null;
let iframeEl = null;

export function openReceiptModal(url) {
  // создаём 1 раз
  if (!overlayEl) {
    overlayEl = document.createElement("div");
    overlayEl.id = "ibiti-receipt-overlay";
    overlayEl.style.cssText = `
      position: fixed; inset: 0; z-index: 999999;
      background: rgba(0,0,0,0.55);
      display: flex; align-items: center; justify-content: center;
      padding: 16px;
    `;

    const panel = document.createElement("div");
    panel.style.cssText = `
      width: min(920px, 96vw);
      height: min(86vh, 900px);
      background: #fff;
      border-radius: 14px;
      box-shadow: 0 25px 80px rgba(0,0,0,0.35);
      overflow: hidden;
      display: flex; flex-direction: column;
    `;

    const top = document.createElement("div");
    top.style.cssText = `
      height: 52px;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 14px;
      border-bottom: 1px solid #eaeaea;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial;
    `;

    const title = document.createElement("div");
    title.textContent = "IBITI Receipt";
    title.style.cssText = `font-weight: 700;`;

    const actions = document.createElement("div");
    actions.style.cssText = `display:flex; gap:10px; align-items:center;`;

    const openTab = document.createElement("button");
    openTab.type = "button";
    openTab.textContent = "Open in new tab";
    openTab.style.cssText = `
      padding: 8px 10px;
      border: 1px solid #ddd;
      border-radius: 10px;
      background: #fff;
      cursor: pointer;
      font-weight: 600;
    `;
    openTab.onclick = () => window.open(iframeEl?.src || url, "_blank", "noopener,noreferrer");

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.textContent = "✕";
    closeBtn.style.cssText = `
      width: 36px; height: 36px;
      border-radius: 10px;
      border: 1px solid #ddd;
      background: #fff;
      cursor: pointer;
      font-size: 16px;
      font-weight: 800;
      line-height: 1;
    `;
    closeBtn.onclick = closeReceiptModal;

    actions.appendChild(openTab);
    actions.appendChild(closeBtn);

    top.appendChild(title);
    top.appendChild(actions);

    iframeEl = document.createElement("iframe");
    iframeEl.style.cssText = `
      border: 0;
      width: 100%;
      height: 100%;
      background: #fff;
    `;
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

  iframeEl.src = url;
  overlayEl.style.display = "flex";
}

export function closeReceiptModal() {
  if (!overlayEl) return;
  overlayEl.style.display = "none";
  // чтобы не жрало ресурсы
  if (iframeEl) iframeEl.src = "about:blank";
}
