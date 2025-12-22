/* IBITI Share Modal (main page) - classic script, no imports */
(function () {
  "use strict";

  const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function injectCssOnce() {
    if (document.getElementById("ibiti-share-css")) return;
    const style = document.createElement("style");
    style.id = "ibiti-share-css";
    style.textContent = `
      :root{
        --ib-gold:#f7d000;
        --ib-border:rgba(247,208,0,0.28);
        --ib-bg:rgba(0,0,0,0.72);
        --ib-shadow:0 0 28px rgba(247,208,0,0.18);
      }
      .ibiti-share-overlay{
        position:fixed; inset:0; z-index:9999;
        background: rgba(0,0,0,0.62);
        display:none;
        align-items:center;
        justify-content:center;
        padding:18px;
        backdrop-filter: blur(2px);
      }
      .ibiti-share-overlay.show{ display:flex; }
      .ibiti-share-modal{
        width:min(760px, 96vw);
        border-radius:16px;
        border:1px solid rgba(255, 35, 35, 0.55); /* красная рамка как в магазине */
        box-shadow: 0 0 0 1px rgba(247,208,0,0.18), var(--ib-shadow);
        background: var(--ib-bg);
        color: #eaeaea;
        font-family: Orbitron, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
        padding:14px 14px 12px;
      }
      .ibiti-share-head{
        display:flex; align-items:center; justify-content:space-between;
        gap:10px; margin-bottom:10px;
      }
      .ibiti-share-title{
        font-weight:800; color: var(--ib-gold);
        text-shadow: 0 0 14px rgba(247,208,0,0.25);
        font-size: 16px;
      }
      .ibiti-share-close{
        border:1px solid var(--ib-border);
        background: rgba(0,0,0,0.35);
        color:#fff;
        border-radius:10px;
        padding:8px 10px;
        cursor:pointer;
      }
      .ibiti-share-sub{
        color: rgba(255,255,255,0.78);
        font-size: 12px;
        margin: 0 0 12px;
      }
      .ibiti-share-grid{
        display:flex;
        flex-wrap:wrap;
        gap:10px;
        justify-content:center;
      }
      .ibiti-share-btn{
        display:inline-flex;
        align-items:center;
        justify-content:center;
        gap:8px;
        padding:10px 12px;
        border-radius:10px;
        border:1px solid rgba(247,208,0,0.22);
        background: rgba(247,208,0,0.10);
        color: var(--ib-gold);
        cursor:pointer;
        user-select:none;
        font-weight:800;
        font-size: 12px;
        min-width: 112px;
      }
      .ibiti-share-btn.secondary{
        background: rgba(0,0,0,0.40);
        color:#fff;
      }
      .ibiti-share-row{
        margin-top: 12px;
        display:flex;
        gap:10px;
        justify-content:center;
        flex-wrap:wrap;
      }
      .ibiti-share-mono{
        margin-top:10px;
        border:1px solid rgba(247,208,0,0.25);
        background: rgba(0,0,0,0.55);
        border-radius:12px;
        padding:10px 12px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 12px;
        word-break: break-all;
        color:#fff;
      }
      @media (max-width:520px){
        .ibiti-share-btn{ min-width: 46%; }
      }
    `;
    document.head.appendChild(style);
  }

  function buildModalOnce() {
    if (document.getElementById("ibitiShareOverlay")) return;

    injectCssOnce();

    const overlay = document.createElement("div");
    overlay.id = "ibitiShareOverlay";
    overlay.className = "ibiti-share-overlay";
    overlay.innerHTML = `
      <div class="ibiti-share-modal" role="dialog" aria-modal="true" aria-labelledby="ibitiShareTitle">
        <div class="ibiti-share-head">
          <div class="ibiti-share-title" id="ibitiShareTitle">Share IBITIcoin</div>
          <button class="ibiti-share-close" type="button" data-ibiti-share-close>Close</button>
        </div>
        <p class="ibiti-share-sub">Choose where to share. (Mobile: we will try the system share automatically.)</p>

        <div class="ibiti-share-grid" id="ibitiShareButtons"></div>

        <div class="ibiti-share-row">
          <button class="ibiti-share-btn secondary" type="button" data-ibiti-share-copy>Copy link</button>
          <button class="ibiti-share-btn secondary" type="button" data-ibiti-share-email>Email</button>
        </div>

        <div class="ibiti-share-mono" id="ibitiShareUrl">—</div>
      </div>
    `;
    document.body.appendChild(overlay);

    // close by overlay click
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });

    // close button
    overlay.querySelector("[data-ibiti-share-close]").addEventListener("click", close);

    // copy
    overlay.querySelector("[data-ibiti-share-copy]").addEventListener("click", async () => {
      const url = getShareUrl();
      try {
        await navigator.clipboard.writeText(url);
        toast("Copied!");
      } catch {
        const ta = document.createElement("textarea");
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        toast("Copied!");
      }
    });

    // email
    overlay.querySelector("[data-ibiti-share-email]").addEventListener("click", () => {
      const subj = encodeURIComponent("IBITIcoin");
      const body = encodeURIComponent("Check this out: " + getShareUrl());
      window.location.href = `mailto:?subject=${subj}&body=${body}`;
    });

    // ESC closes
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });

    // Build buttons list (NO "System" button per request)
    const buttons = [
      { key: "telegram", label: "Telegram" },
      { key: "whatsapp", label: "WhatsApp" },
      { key: "viber", label: "Viber" },
      { key: "vk", label: "VK" },
      { key: "ok", label: "OK" },
      { key: "x", label: "X" },
      { key: "facebook", label: "Facebook" },
      { key: "linkedin", label: "LinkedIn" },
      { key: "reddit", label: "Reddit" },
      { key: "weibo", label: "Weibo" },
    ];

    const grid = overlay.querySelector("#ibitiShareButtons");
    for (const b of buttons) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ibiti-share-btn";
      btn.dataset.shareKey = b.key;
      btn.textContent = b.label;
      btn.addEventListener("click", () => openShare(b.key));
      grid.appendChild(btn);
    }
  }

  function toast(msg) {
    const el = document.createElement("div");
    el.textContent = msg;
    el.style.position = "fixed";
    el.style.left = "50%";
    el.style.bottom = "22px";
    el.style.transform = "translateX(-50%)";
    el.style.zIndex = "10000";
    el.style.padding = "10px 12px";
    el.style.borderRadius = "12px";
    el.style.border = "1px solid rgba(247,208,0,0.28)";
    el.style.background = "rgba(0,0,0,0.75)";
    el.style.color = "#fff";
    el.style.fontFamily = "Orbitron, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
    el.style.fontSize = "12px";
    el.style.boxShadow = "0 0 18px rgba(247,208,0,0.18)";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1200);
  }

  function getShareUrl() {
    // Optional override
    if (window.IBITI_SHARE_URL && typeof window.IBITI_SHARE_URL === "string") return window.IBITI_SHARE_URL;
    return new URL(window.location.href).toString();
  }

  function getShareText() {
    if (window.IBITI_SHARE_TEXT && typeof window.IBITI_SHARE_TEXT === "string") return window.IBITI_SHARE_TEXT;
    return "IBITIcoin — official site";
  }

  function openPopup(url) {
    const w = window.open(url, "_blank", "noopener,noreferrer");
    if (!w) window.location.href = url; // popup blocked
  }

  function openShare(key) {
    const url = getShareUrl();
    const text = getShareText();

    const encUrl = encodeURIComponent(url);
    const encText = encodeURIComponent(text);

    const map = {
      telegram: `https://t.me/share/url?url=${encUrl}&text=${encText}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`,
      viber: `viber://forward?text=${encodeURIComponent(text + " " + url)}`,
      vk: `https://vk.com/share.php?url=${encUrl}`,
      ok: `https://connect.ok.ru/offer?url=${encUrl}`,
      x: `https://twitter.com/intent/tweet?text=${encText}&url=${encUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encUrl}`,
      reddit: `https://www.reddit.com/submit?url=${encUrl}&title=${encText}`,
      weibo: `https://service.weibo.com/share/share.php?url=${encUrl}&title=${encText}`,
    };

    if (map[key]) openPopup(map[key]);
  }

  async function trySystemShareFirst() {
    if (!navigator.share) return false;
    try {
      await navigator.share({ title: "IBITIcoin", text: getShareText(), url: getShareUrl() });
      return true;
    } catch {
      return false;
    }
  }

  function open() {
    buildModalOnce();
    const overlay = document.getElementById("ibitiShareOverlay");
    if (!overlay) return;

    const urlEl = overlay.querySelector("#ibitiShareUrl");
    if (urlEl) urlEl.textContent = getShareUrl();

    overlay.classList.add("show");
    const closeBtn = overlay.querySelector("[data-ibiti-share-close]");
    if (closeBtn) closeBtn.focus();
  }

  function close() {
    const overlay = document.getElementById("ibitiShareOverlay");
    if (!overlay) return;
    overlay.classList.remove("show");
  }

  function killOldShareModalIfExists() {
    // Если на главной осталась старая модалка — прячем её, чтобы не конфликтовала.
    const oldCandidates = [
      "#shareModal",
      "#shareOverlay",
      "#share-popup",
      ".share-modal",
      ".share-overlay",
    ];
    for (const sel of oldCandidates) {
      const el = $(sel);
      if (el) {
        el.style.display = "none";
        el.setAttribute("data-ibiti-share-disabled", "1");
      }
    }
  }

  function bindShareTriggers() {
    // 1) Идеальный вариант: явно помеченная кнопка
    const explicit = $$('[data-ibiti-share]');
    const triggers = new Set(explicit);

    // 2) Авто-подхват: любая кнопка/ссылка с текстом Share/Поделиться
    for (const el of $$("a,button")) {
      const t = (el.textContent || "").trim().toLowerCase();
      if (t === "поделиться" || t === "share" || t === "share link") triggers.add(el);
    }

    // 3) Авто-подхват: id/class содержит share
    for (const el of $$("a[id],button[id],a[class],button[class]")) {
      const id = (el.id || "").toLowerCase();
      const cls = (el.className || "").toLowerCase();
      if (id.includes("share") || cls.includes("share")) triggers.add(el);
    }

    if (triggers.size === 0) {
      console.warn("IBITI share-modal: share button not found. Add data-ibiti-share to your Share button.");
      return;
    }

    for (const el of triggers) {
      // capture: перебиваем старые обработчики
      el.addEventListener(
        "click",
        async (ev) => {
          ev.preventDefault();
          ev.stopPropagation();

          if (isMobile()) {
            const ok = await trySystemShareFirst();
            if (ok) return;
          }
          open();
        },
        true
      );
    }
  }

  function init() {
    killOldShareModalIfExists();
    bindShareTriggers();
    window.IBITI_SHARE = { open, close };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
