/* share-modal.js — IBITIcoin (classic script, no imports)
   - Creates a modern share modal (same vibe as shop modal)
   - No "System" button (auto-tries navigator.share on mobile, then falls back to modal)
   - Attaches to any element matching:
       [data-ibiti-share], #shareBtn, #shareButton, a[href="#share"], button[aria-label*="share" i]
*/

(function () {
  "use strict";

  // ---------- helpers ----------
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const esc = (s) => (s == null ? "" : String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])));

  function canonicalUrl() {
    try {
      const u = new URL(window.location.href);
      // clean tracking params you don't want to share
      ["utm_source","utm_medium","utm_campaign","utm_content","utm_term"].forEach(k => u.searchParams.delete(k));
      return u.toString();
    } catch {
      return String(window.location.href);
    }
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
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

  function toast(msg) {
    let el = $("#ibitiShareToast");
    if (!el) {
      el = document.createElement("div");
      el.id = "ibitiShareToast";
      el.className = "ibiti-share-toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(window.__ibitiShareToastT);
    window.__ibitiShareToastT = setTimeout(() => el.classList.remove("show"), 1500);
  }

  // ---------- style injection ----------
  function injectStyle() {
    if ($("#ibitiShareModalStyle")) return;

    const style = document.createElement("style");
    style.id = "ibitiShareModalStyle";
    style.textContent = `
:root{
  --ib-gold:#f7d000;
  --ib-red:#ff3b3b;             /* "богатая" красная нотка */
  --ib-border: rgba(247,208,0,0.22);
  --ib-shadow: 0 0 22px rgba(255,215,0,0.10);
  --ib-shadow2: 0 18px 60px rgba(0,0,0,0.55);
}

.ibiti-share-overlay{
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.62);
  backdrop-filter: blur(2px);
  z-index: 9998;
}

.ibiti-share-modal{
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  z-index: 9999;
  padding: 14px;
}

.ibiti-share-box{
  width: min(560px, 94vw);
  border: 1px solid rgba(247,208,0,0.22);
  border-radius: 16px;
  background: rgba(0,0,0,0.55);
  box-shadow: 0 18px 50px rgba(0,0,0,0.55);
  position: relative;
  overflow: hidden;
}

.ibiti-share-box:before{
  content:"";
  position:absolute;
  inset:-2px;
  border-radius: 20px;
  padding: 2px;
  background: linear-gradient(135deg, rgba(247,208,0,0.55), rgba(255,59,59,0.45), rgba(247,208,0,0.25));
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events:none;
}

.ibiti-share-head{
  padding: 12px 14px 6px;
  border-bottom: 1px solid rgba(247,208,0,0.15);
}

.ibiti-share-title{
  margin: 0;
  font-family: Orbitron, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  font-weight: 800;
  letter-spacing: .3px;
  color: var(--ib-gold);
  text-shadow: 0 0 16px rgba(247,208,0,0.25);
}

.ibiti-share-sub{
  margin: 8px 0 0;
  font-size: 11.5px;
  color: rgba(255,255,255,0.74);
  line-height: 1.45;
}

.ibiti-share-close{
  position: absolute;
  right: 12px;
  top: 12px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(0,0,0,0.35);
  color: rgba(255,255,255,0.88);
  border-radius: 10px;
  padding: 8px 10px;
  cursor: pointer;
}

.ibiti-share-body{ padding: 6px 14px 14px; }

.ibiti-share-grid{
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

@media (max-width: 620px){
  .ibiti-share-grid{ grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (max-width: 420px){
  .ibiti-share-grid{ grid-template-columns: repeat(2, minmax(0, 1fr)); }
}


.ibiti-share-btn{
  display:flex; align-items:center; justify-content:center; gap:8px;
  width:100%;
  min-height: 38px;
  padding: 9px 10px;
  border-radius: 10px;
  border:1px solid rgba(247,208,0,0.20);
  background: rgba(255,255,255,0.07);
  color:#eaeaea;
  cursor:pointer;
  font: 600 12px/1.1 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;
  letter-spacing: .2px;
  user-select:none;
}

.ibiti-share-btn:hover{
  border-color: rgba(247,208,0,0.42);
  background: rgba(255,255,255,0.10);
}

.ibiti-share-btn.primary{
  border-color: rgba(247,208,0,0.45);
  background: rgba(247,208,0,0.12);
  color: var(--ib-gold);
}

.ibiti-share-ico{
  width: 18px; height: 18px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
}

.ibiti-share-ico svg{ width: 16px; height: 16px; fill: currentColor; opacity: .95; }




.ibiti-share-bottom-close{ display:none; }

.ibiti-share-url{
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(247,208,0,0.22);
  background: rgba(0,0,0,0.40);
  color: rgba(255,255,255,0.90);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11.5px;
  word-break: break-all;
  text-align: center;
}

.ibiti-share-toast{
  position: fixed;
  bottom: 18px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.78);
  border: 1px solid rgba(247,208,0,0.25);
  color: #fff;
  padding: 10px 14px;
  border-radius: 10px;
  box-shadow: var(--ib-shadow);
  opacity: 0;
  pointer-events: none;
  transition: opacity .18s ease;
  z-index: 10000;
  font-size: 11.5px;
}
.ibiti-share-toast.show{ opacity: 1; }
    `.trim();

    document.head.appendChild(style);
  }

  // ---------- modal building ----------
  function icon(svgPath) {
    return `<span class="ibiti-share-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${svgPath}"></path></svg></span>`;
  }

  const ICONS = {
    copy: "M16 1H6a2 2 0 0 0-2 2v12h2V3h10V1zm3 4H10a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H10V7h9v14z",
    telegram: "M9.9 14.6 9.7 19c.4 0 .6-.2.8-.4l1.9-1.8 4 2.9c.7.4 1.2.2 1.4-.7l2.6-12c.3-1.1-.4-1.6-1.2-1.3L3.5 10c-1 .4-1 1 0 1.3l4.2 1.3 9.7-6.1c.5-.3.9-.1.6.2",
    whatsapp: "M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20z",
    viber: "M7 3h8a6 6 0 0 1 6 6v6a6 6 0 0 1-6 6H9l-4 2v-2.8A6 6 0 0 1 7 15V3z",
    vk: "M4 7h3c.2 4 2.1 6 3.6 6V7h3v3.4c1.5-.1 3.1-2 3.6-3.4h3c-.5 2-2.3 4.6-3.7 5.6 1.4.7 3.4 2.8 4.1 4.4h-3.3c-.7-1.6-2.4-3.1-3.7-3.2V17h-3c-4.5 0-7.1-3.1-7.6-10z",
    ok: "M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zm0 0c-3.9 0-6.5 2-6.5 4.1 0 1.7 1.2 3 3.1 3.9l-2.1 2.1 1.4 1.4 2.8-2.8c.4.1.9.1 1.3.1s.9 0 1.3-.1l2.8 2.8 1.4-1.4-2.1-2.1c1.9-.9 3.1-2.2 3.1-3.9C18.5 14 15.9 12 12 12z",
    x: "M18.9 3H15l-3.3 4.2L8.2 3H3.1l6.2 8.2L3 21h3.9l4.2-5.3L15.2 21H20l-6.6-8.7L18.9 3z",
    facebook: "M14 9h2V6h-2c-1.7 0-3 1.3-3 3v2H9v3h2v7h3v-7h2.2l.8-3H14V9c0-.6.4-1 1-1z",
    linkedin: "M6 9H3v12h3V9zm.2-4.2a1.7 1.7 0 1 1-3.4 0 1.7 1.7 0 0 1 3.4 0zM21 14.5V21h-3v-6c0-1.4-.5-2.4-1.8-2.4-1 0-1.6.7-1.9 1.3-.1.3-.1.7-.1 1.1V21h-3s.1-10 0-12h3v1.7c.4-.7 1.2-1.8 3-1.8 2.2 0 3.8 1.5 3.8 4.6z",
    reddit: "M20 12.3c.6.4 1 .9 1 1.6 0 1-.9 1.8-2 1.8-.2 0-.4 0-.6-.1-1 2.2-3.5 3.7-6.4 3.7s-5.4-1.5-6.4-3.7c-.2.1-.4.1-.6.1-1.1 0-2-.8-2-1.8 0-.7.4-1.2 1-1.6-.1-.4-.2-.8-.2-1.2 0-2.5 3-4.6 6.8-4.8l1.1-2.6 3.1.7c.3-.5.9-.8 1.5-.8 1 0 1.8.8 1.8 1.7 0 .9-.8 1.7-1.8 1.7-.7 0-1.3-.4-1.6-1l-2.2-.5-.8 1.9c3.8.2 6.8 2.3 6.8 4.8 0 .4-.1.8-.2 1.2z",
    weibo: "M9.2 19c-3 0-5.5-1.5-5.5-3.9 0-2.6 3.3-6.2 8.4-6.2 2.4 0 4.5.6 5.7 1.6.8.6 1 1.3.6 1.8-.3.4-.9.6-1.7.5.6.7.8 1.5.4 2.3-1 2.1-4.2 3.9-7.9 3.9z",
    email: "M4 6h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zm0 2v.2l8 5 8-5V8H4zm16 10V10.3l-8 5-8-5V18h16z",
    close: "M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7 4.3 4.3l6.3 6.3 6.3-6.3z"
  };

  function buildModal() {
    if ($("#ibitiShareOverlay") && $("#ibitiShareModal")) return;

    injectStyle();

    const overlay = document.createElement("div");
    overlay.id = "ibitiShareOverlay";
    overlay.className = "ibiti-share-overlay";
    overlay.style.display = "none";

    const modal = document.createElement("div");
    modal.id = "ibitiShareModal";
    modal.className = "ibiti-share-modal";
    modal.style.display = "none";

    modal.innerHTML = `
      <div class="ibiti-share-box" role="dialog" aria-modal="true" aria-labelledby="ibitiShareTitle">
        <div class="ibiti-share-head">
          <button class="ibiti-share-close" type="button" data-ibiti-close>${esc("Close")}</button>
          <h3 class="ibiti-share-title" id="ibitiShareTitle">Share IBITIcoin</h3>
          <p class="ibiti-share-sub">Choose where to share the link.</p>
        </div>

        <div class="ibiti-share-body">
          <div class="ibiti-share-grid">
            <button class="ibiti-share-btn primary" type="button" data-ibiti-action="copy">
              ${icon(ICONS.copy)}<span>Copy</span>
            </button>
            <button class="ibiti-share-btn" type="button" data-ibiti-action="telegram">
              ${icon(ICONS.telegram)}<span>Telegram</span>
            </button>
            <button class="ibiti-share-btn" type="button" data-ibiti-action="whatsapp">
              ${icon(ICONS.whatsapp)}<span>WhatsApp</span>
            </button>
            <button class="ibiti-share-btn" type="button" data-ibiti-action="viber">
              ${icon(ICONS.viber)}<span>Viber</span>
            </button>

            <button class="ibiti-share-btn" type="button" data-ibiti-action="vk">
              ${icon(ICONS.vk)}<span>VK</span>
            </button>
            <button class="ibiti-share-btn" type="button" data-ibiti-action="ok">
              ${icon(ICONS.ok)}<span>OK</span>
            </button>
            <button class="ibiti-share-btn" type="button" data-ibiti-action="x">
              ${icon(ICONS.x)}<span>X</span>
            </button>
            <button class="ibiti-share-btn" type="button" data-ibiti-action="facebook">
              ${icon(ICONS.facebook)}<span>Facebook</span>
            </button>

            <button class="ibiti-share-btn" type="button" data-ibiti-action="linkedin">
              ${icon(ICONS.linkedin)}<span>LinkedIn</span>
            </button>
            <button class="ibiti-share-btn" type="button" data-ibiti-action="reddit">
              ${icon(ICONS.reddit)}<span>Reddit</span>
            </button>
            <button class="ibiti-share-btn" type="button" data-ibiti-action="weibo">
              ${icon(ICONS.weibo)}<span>Weibo</span>
            </button>
            <button class="ibiti-share-btn" type="button" data-ibiti-action="email">
              ${icon(ICONS.email)}<span>Email</span>
            </button>
          </div>

          <div class="ibiti-share-url" id="ibitiShareUrl">—</div>

          <div class="ibiti-share-bottom-close" style="display:flex; justify-content:center; padding-top: 10px;">
            <button class="ibiti-share-btn" type="button" data-ibiti-close>
              ${icon(ICONS.close)}<span>Close</span>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(modal);

    // Close handlers
    overlay.addEventListener("click", closeModal);
    $$("#ibitiShareModal [data-ibiti-close]").forEach(b => b.addEventListener("click", closeModal));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });

    // Action handlers
    modal.addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-ibiti-action]");
      if (!btn) return;

      const action = btn.getAttribute("data-ibiti-action");
      const url = $("#ibitiShareUrl")?.textContent || canonicalUrl();
      const title = "IBITIcoin";
      const text = `IBITIcoin — official website`;

      const u = encodeURIComponent(url);
      const t = encodeURIComponent(title);
      const m = encodeURIComponent(text + "\n" + url);

      const MAP = {
        telegram: `https://t.me/share/url?url=${u}&text=${encodeURIComponent(text)}`,
        whatsapp: `https://wa.me/?text=${m}`,
        viber: `viber://forward?text=${m}`,
        vk: `https://vk.com/share.php?url=${u}`,
        ok: `https://connect.ok.ru/offer?url=${u}`,
        x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${u}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
        reddit: `https://www.reddit.com/submit?url=${u}&title=${t}`,
        weibo: `https://service.weibo.com/share/share.php?url=${u}&title=${encodeURIComponent(text)}`,
        email: `mailto:?subject=${t}&body=${m}`
      };

      if (action === "copy") {
        const ok = await copyToClipboard(url);
        toast(ok ? "Copied!" : "Copy failed");
        return;
      }

      const link = MAP[action];
      if (link) window.open(link, "_blank", "noopener,noreferrer");
    });
  }

  function openModal(urlOverride) {
    buildModal();
    const overlay = $("#ibitiShareOverlay");
    const modal = $("#ibitiShareModal");
    const urlEl = $("#ibitiShareUrl");

    const url = urlOverride || canonicalUrl();
    if (urlEl) urlEl.textContent = url;

    overlay.style.display = "block";
    modal.style.display = "grid";
  }

  function closeModal() {
    const overlay = $("#ibitiShareOverlay");
    const modal = $("#ibitiShareModal");
    if (overlay) overlay.style.display = "none";
    if (modal) modal.style.display = "none";
  }

  async function tryNativeShare(urlOverride) {
    const url = urlOverride || canonicalUrl();
    if (!navigator.share) return false;
    try {
      await navigator.share({ title: "IBITIcoin", text: "IBITIcoin — official website", url });
      return true;
    } catch {
      return false;
    }
  }

  // ---------- attach to existing buttons ----------
  function attach() {
    const candidates = [
      ...$$('[data-ibiti-share]'),
      ...$$('#shareBtn, #shareButton'),
      ...$$('a[href="#share"], button[aria-label*="share" i], button[title*="share" i]'),
      ...$$('button, a')
        .filter(el => (el.textContent || "").trim().toLowerCase() === "делиться" || (el.textContent || "").trim().toLowerCase() === "поделиться")
    ];

    const uniq = Array.from(new Set(candidates)).filter(Boolean);

    uniq.forEach(el => {
      if (el.__ibitiShareBound) return;
      el.__ibitiShareBound = true;

      el.addEventListener("click", async (e) => {
        // do not follow links like "#"
        if (el.tagName === "A") e.preventDefault();

        const urlOverride = el.getAttribute("data-share-url") || null;

        // no "System" button, but we can still try native share first (mobile-friendly)
        const usedNative = await tryNativeShare(urlOverride);
        if (!usedNative) openModal(urlOverride);
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", attach);
  } else {
    attach();
  }

  // expose minimal API (optional)
  window.IBITI_SHARE = {
    open: openModal,
    close: closeModal
  };
})();
