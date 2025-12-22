/* share-modal.js — IBITIcoin (classic script, no modules)
   Purpose: show a modern custom Share modal (same vibe as Shop), NO "System" button.
   Hooks by default to: #openShareModal, #shareBtn, #shareButton, [data-ibiti-share]
*/
(function () {
  "use strict";

  const HOOK_SELECTORS = [
    "#openShareModal",
    "#shareBtn",
    "#shareButton",
    "[data-ibiti-share]"
  ];

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }

  function getShareUrl() {
    // prefer canonical if present
    const canonical = qs('link[rel="canonical"]')?.href;
    return canonical || String(window.location.href);
  }

  function getShareText() {
    const ogTitle = qs('meta[property="og:title"]')?.content;
    const title = ogTitle || document.title || "IBITIcoin";
    const ogDesc = qs('meta[property="og:description"]')?.content;
    const desc = ogDesc ? (" — " + ogDesc) : "";
    return (title + desc).trim();
  }

  function ensureStyle() {
    if (qs("#ibitiShareModalStyle")) return;
    const s = document.createElement("style");
    s.id = "ibitiShareModalStyle";
    s.textContent = `
      .ib-share-overlay{
        position:fixed; inset:0; z-index:99999;
        background:rgba(0,0,0,0.72);
        backdrop-filter: blur(6px);
        display:none;
        align-items:center; justify-content:center;
        padding:18px;
      }
      .ib-share-modal{
        width:min(720px, 96vw);
        border-radius:18px;
        background:rgba(10,10,10,0.92);
        border:1px solid rgba(247,208,0,0.30);
        box-shadow: 0 0 30px rgba(255,215,0,0.10), 0 0 0 1px rgba(255,0,0,0.22);
        position:relative;
        overflow:hidden;
      }
      .ib-share-modal::before{
        content:"";
        position:absolute; inset:0;
        pointer-events:none;
        border-radius:18px;
        box-shadow: inset 0 0 0 1px rgba(255,0,0,0.18);
      }
      .ib-share-head{
        padding:14px 16px 6px;
        text-align:center;
        font-family: Orbitron, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      }
      .ib-share-title{
        color:#f7d000;
        font-weight:800;
        letter-spacing:0.5px;
        margin:0;
        text-shadow: 0 0 16px rgba(247,208,0,0.22);
        font-size:16px;
      }
      .ib-share-sub{
        margin:6px 0 0;
        color:rgba(255,255,255,0.70);
        font-size:12px;
      }
      .ib-share-close{
        position:absolute; top:10px; right:10px;
        border:1px solid rgba(247,208,0,0.25);
        background:rgba(0,0,0,0.50);
        color:rgba(255,255,255,0.85);
        border-radius:10px;
        padding:6px 10px;
        cursor:pointer;
        font-weight:700;
      }
      .ib-share-body{ padding:10px 14px 14px; }
      .ib-share-grid{
        display:grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap:10px;
      }
      @media (max-width: 720px){
        .ib-share-grid{ grid-template-columns: repeat(2, minmax(0, 1fr)); }
      }
      .ib-share-btn{
        display:flex; align-items:center; justify-content:center; gap:10px;
        padding:10px 10px;
        border-radius:12px;
        border:1px solid rgba(247,208,0,0.22);
        background: rgba(0,0,0,0.35);
        box-shadow: 0 0 18px rgba(255,215,0,0.08);
        color:#eaeaea;
        cursor:pointer;
        text-decoration:none;
        user-select:none;
        font-weight:800;
        font-family: Orbitron, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
        font-size:12px;
        transition: transform .06s ease, background .12s ease, border-color .12s ease;
      }
      .ib-share-btn:hover{
        background: rgba(247,208,0,0.10);
        border-color: rgba(247,208,0,0.32);
      }
      .ib-share-btn:active{ transform: translateY(1px); }
      .ib-share-btn.primary{
        background: rgba(247,208,0,0.12);
        color:#f7d000;
      }
      .ib-share-icon{
        width:18px; height:18px; display:inline-flex; align-items:center; justify-content:center;
        border-radius:8px;
        background: rgba(255,255,255,0.08);
        border:1px solid rgba(255,255,255,0.10);
        font-size:12px;
        line-height:1;
      }
      .ib-share-linkwrap{
        margin-top:12px;
        border-radius:12px;
        border:1px solid rgba(247,208,0,0.22);
        background: rgba(0,0,0,0.45);
        padding:10px;
      }
      .ib-share-link{
        width:100%;
        background:transparent;
        border:none;
        outline:none;
        color:rgba(255,255,255,0.88);
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size:12px;
      }
      .ib-share-foot{
        margin-top:8px;
        display:flex;
        gap:10px;
        justify-content:flex-end;
      }
    `;
    document.head.appendChild(s);
  }

  function buildModal() {
    if (qs("#ibShareOverlay")) return;

    ensureStyle();

    const overlay = document.createElement("div");
    overlay.className = "ib-share-overlay";
    overlay.id = "ibShareOverlay";

    const modal = document.createElement("div");
    modal.className = "ib-share-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "Share IBITIcoin");

    modal.innerHTML = `
      <button class="ib-share-close" type="button" id="ibShareClose">Close</button>
      <div class="ib-share-head">
        <h3 class="ib-share-title">Share IBITIcoin</h3>
        <p class="ib-share-sub">Choose where to share the link</p>
      </div>
      <div class="ib-share-body">
        <div class="ib-share-grid" id="ibShareGrid"></div>

        <div class="ib-share-linkwrap">
          <input class="ib-share-link" id="ibShareUrl" type="text" readonly value=""/>
        </div>

        <div class="ib-share-foot">
          <button class="ib-share-btn" type="button" id="ibShareClose2"><span class="ib-share-icon">×</span> Close</button>
        </div>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // close handlers
    function close() { overlay.style.display = "none"; document.body.style.overflow = ""; }
    function open()  { overlay.style.display = "flex"; document.body.style.overflow = "hidden"; }

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });
    qs("#ibShareClose", modal).addEventListener("click", close);
    qs("#ibShareClose2", modal).addEventListener("click", close);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.style.display === "flex") close();
    });

    // share buttons
    const grid = qs("#ibShareGrid", modal);
    const btns = [
      { key:"copy",     label:"Copy",     icon:"⧉", cls:"primary" },
      { key:"telegram", label:"Telegram", icon:"✈" },
      { key:"whatsapp", label:"WhatsApp", icon:"🟢" },
      { key:"viber",    label:"Viber",    icon:"💬" },
      { key:"vk",       label:"VK",       icon:"VK" },
      { key:"ok",       label:"OK",       icon:"OK" },
      { key:"x",        label:"X",        icon:"X" },
      { key:"facebook", label:"Facebook", icon:"f" },
      { key:"linkedin", label:"LinkedIn", icon:"in" },
      { key:"reddit",   label:"Reddit",   icon:"👽" },
      { key:"weibo",    label:"Weibo",    icon:"微" },
      { key:"email",    label:"Email",    icon:"✉" }
    ];

    function mkBtn(b) {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "ib-share-btn" + (b.cls ? (" " + b.cls) : "");
      el.dataset.key = b.key;
      el.innerHTML = `<span class="ib-share-icon">${b.icon}</span> ${b.label}`;
      return el;
    }

    btns.forEach((b) => grid.appendChild(mkBtn(b)));

    async function copyToClipboard(text) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // fallback
        try {
          const ta = document.createElement("textarea");
          ta.value = text;
          ta.style.position = "fixed";
          ta.style.left = "-9999px";
          document.body.appendChild(ta);
          ta.focus();
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
          return true;
        } catch {
          return false;
        }
      }
    }

    function openPopup(url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }

    function buildShareLink(key, url, text) {
      const eurl = encodeURIComponent(url);
      const etxt = encodeURIComponent(text);
      switch (key) {
        case "telegram": return `https://t.me/share/url?url=${eurl}&text=${etxt}`;
        case "whatsapp": return `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`;
        case "viber":    return `viber://forward?text=${encodeURIComponent(text + " " + url)}`;
        case "vk":       return `https://vk.com/share.php?url=${eurl}`;
        case "ok":       return `https://connect.ok.ru/offer?url=${eurl}&title=${etxt}`;
        case "x":        return `https://twitter.com/intent/tweet?url=${eurl}&text=${etxt}`;
        case "facebook": return `https://www.facebook.com/sharer/sharer.php?u=${eurl}`;
        case "linkedin": return `https://www.linkedin.com/sharing/share-offsite/?url=${eurl}`;
        case "reddit":   return `https://www.reddit.com/submit?url=${eurl}&title=${etxt}`;
        case "weibo":    return `https://service.weibo.com/share/share.php?url=${eurl}&title=${etxt}`;
        case "email":    return `mailto:?subject=${etxt}&body=${encodeURIComponent(text + "\n\n" + url)}`;
        default: return "";
      }
    }

    function setUrl(url) {
      qs("#ibShareUrl", modal).value = url;
    }

    grid.addEventListener("click", async (e) => {
      const btn = e.target.closest(".ib-share-btn");
      if (!btn) return;

      const key = btn.dataset.key;
      const url = qs("#ibShareUrl", modal).value;
      const text = getShareText();

      if (key === "copy") {
        const ok = await copyToClipboard(url);
        btn.innerHTML = `<span class="ib-share-icon">✓</span> ${ok ? "Copied" : "Copy failed"}`;
        setTimeout(() => {
          btn.innerHTML = `<span class="ib-share-icon">⧉</span> Copy`;
        }, 900);
        return;
      }

      const link = buildShareLink(key, url, text);
      if (link) openPopup(link);
    });

    // expose API
    window.IBITIShareModal = {
      open: function (customUrl) {
        setUrl(customUrl || getShareUrl());
        open();
      },
      close: close
    };
  }

  function hookButtons() {
    const btn =
      HOOK_SELECTORS.map((s) => qs(s)).find(Boolean) ||
      // fallback: find anchors/buttons with text "Share"
      qsa("a,button").find((el) => (el.textContent || "").trim().toLowerCase() === "share");

    if (!btn) return;

    // capture to override any old handlers that try to use navigator.share / system dialogs
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      try { buildModal(); } catch {}
      if (window.IBITIShareModal) window.IBITIShareModal.open(getShareUrl());
    }, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", hookButtons);
  } else {
    hookButtons();
  }
})();
