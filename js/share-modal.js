/* IBITI Share Modal (MAIN PAGE) — standalone (no modules)
   Attach to: #openShareModal
   Creates its own DOM (no collisions with old modals)
*/
(function () {
  "use strict";

  const TRIGGER_ID = "openShareModal";

  // Build share payload
  function getShareUrl() {
    // clean hash noise; keep query
    const u = new URL(window.location.href);
    u.hash = "";
    return u.toString();
  }

  function getShareText() {
    return "IBITIcoin — Official website";
  }

  // Safe helpers
  function qs(id) { return document.getElementById(id); }
  function enc(s) { return encodeURIComponent(s); }

  function openPopup(url) {
    // popup-blockers are a thing; if blocked, fallback to full navigation
    const w = window.open(url, "_blank", "noopener,noreferrer");
    if (!w) window.location.href = url;
  }

  function ensureCss() {
    if (document.getElementById("ibitiShareCss")) return;

    const style = document.createElement("style");
    style.id = "ibitiShareCss";
    style.textContent = `
/* ===== IBITI Share Modal (Shop-like) ===== */
.ibiti-share-hidden{ display:none !important; }

#ibitiShareOverlay{
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.72);
  backdrop-filter: blur(6px);
  z-index: 9998;
}
#ibitiShareModal{
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 9999;

  background: rgba(10,10,10,.92);
  border: 1px solid rgba(247,208,0,.28);
  box-shadow: 0 20px 60px rgba(0,0,0,.65);
  border-radius: 18px;
  color: #fff;

  max-width: 860px;
  width: min(860px, 92vw);
  padding: 18px 18px 16px;
}
#ibitiShareTitle{
  color: #f7d000;
  letter-spacing: .6px;
  margin: 0 0 6px;
  text-align: center;
  text-shadow: 0 0 16px rgba(247,208,0,.20);
}
#ibitiShareModal p{
  color: rgba(255,255,255,.72);
  margin: 0 0 14px;
  text-align: center;
  font-size: 14px;
}
.ibiti-share-grid{
  display: grid;
  grid-template-columns: repeat(2, minmax(0,1fr));
  gap: 10px;
}
@media (min-width: 760px){
  .ibiti-share-grid{ grid-template-columns: repeat(4, minmax(0,1fr)); }
}
.ibiti-share-btn{
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(247,208,0,.22);
  background: rgba(255,255,255,.06);
  color: rgba(255,255,255,.92);
  cursor: pointer;
  transition: transform .12s ease, background .12s ease, border-color .12s ease;
  user-select: none;
  font: inherit;
}
.ibiti-share-btn:hover{
  transform: translateY(-1px);
  background: rgba(247,208,0,.10);
  border-color: rgba(247,208,0,.40);
}
.ibiti-share-btn:active{ transform: translateY(0px); }
.ibiti-share-btn:focus{
  outline: none;
  box-shadow: 0 0 0 3px rgba(247,208,0,.18);
  border-color: rgba(247,208,0,.45);
}
.ibiti-share-btn--primary{
  background: rgba(247,208,0,.16);
  border-color: rgba(247,208,0,.45);
  color: #ffd84a;
  font-weight: 600;
}
.ibiti-share-btn--danger{
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.10);
  height: 44px;
}
.ibiti-share-ico{
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.ibiti-share-ico svg{
  width: 18px;
  height: 18px;
  fill: currentColor;
  opacity: .95;
}
.ibiti-share-url{
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(247,208,0,.25);
  background: rgba(0,0,0,.45);
  color: rgba(255,255,255,.92);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  word-break: break-all;
  text-align: center;
}
.ibiti-share-top{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap: 10px;
  margin-bottom: 6px;
}
.ibiti-share-top .closeX{
  border: 1px solid rgba(255,255,255,.10);
  background: rgba(255,255,255,.06);
  color: rgba(255,255,255,.85);
  border-radius: 10px;
  padding: 6px 10px;
  cursor:pointer;
}
.ibiti-share-top .closeX:hover{
  background: rgba(255,255,255,.10);
}
/* Share modal — IBITI style */
#shareOverlay{
  background: rgba(0,0,0,.72);
  backdrop-filter: blur(6px);
}

#shareModal{
  background: rgba(10,10,10,.92);
  border: 1px solid rgba(247,208,0,.28);
  box-shadow: 0 20px 60px rgba(0,0,0,.65);
  border-radius: 18px;
  color: #fff;
  max-width: 860px;
  width: min(860px, 92vw);
  padding: 18px 18px 16px;
}

#shareTitle{
  color: #f7d000;
  letter-spacing: .6px;
  margin: 0 0 6px;
  text-align: center;
}

#shareModal p{
  color: rgba(255,255,255,.72);
  margin: 0 0 14px;
  text-align: center;
  font-size: 14px;
}

.share-grid{
  display: grid;
  grid-template-columns: repeat(2, minmax(0,1fr));
  gap: 10px;
}
@media (min-width: 760px){
  .share-grid{ grid-template-columns: repeat(4, minmax(0,1fr)); }
}

.share-btn{
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(247,208,0,.22);
  background: rgba(255,255,255,.06);
  color: rgba(255,255,255,.92);
  cursor: pointer;
  transition: transform .12s ease, background .12s ease, border-color .12s ease;
  user-select: none;
}

.share-btn:hover{
  transform: translateY(-1px);
  background: rgba(247,208,0,.10);
  border-color: rgba(247,208,0,.40);
}

.share-btn:active{
  transform: translateY(0px);
}

.share-btn--primary{
  background: rgba(247,208,0,.16);
  border-color: rgba(247,208,0,.45);
  color: #ffd84a;
  font-weight: 600;
}

.share-btn--danger{
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.10);
  height: 44px;
}

.share-ico{
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.share-ico svg{
  width: 18px;
  height: 18px;
  fill: currentColor;
  opacity: .95;
}

.ref-actions{
  display:flex;
  justify-content:center;
  margin-top: 12px;
}

.share-main{
  min-width: 160px;
  display:flex;
  align-items:center;
  justify-content:center;
  gap: 10px;
}
.share-main .ico{
  font-size: 18px;
  line-height: 1;
}
  .share-btn:focus{
  outline: none;
  box-shadow: 0 0 0 3px rgba(247,208,0,.18);
  border-color: rgba(247,208,0,.45);
}
`;
    (document.head || document.documentElement).appendChild(style);
  }

  function svg(pathD) {
    return `<span class="ibiti-share-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${pathD}"></path></svg></span>`;
  }

  function buildDom() {
    if (qs("ibitiShareOverlay") && qs("ibitiShareModal")) return;

    // Soft-disable old modal (if any) to avoid double popups.
    ["shareOverlay","shareModal","socialShareModal","shareModalOverlay"].forEach((id) => {
      const el = qs(id);
      if (el) el.classList.add("ibiti-share-hidden");
    });

    const overlay = document.createElement("div");
    overlay.id = "ibitiShareOverlay";
    overlay.className = "ibiti-share-hidden";

    const modal = document.createElement("div");
    modal.id = "ibitiShareModal";
    modal.className = "ibiti-share-hidden";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "ibitiShareTitle");

    const titleRow = document.createElement("div");
    titleRow.className = "ibiti-share-top";
    titleRow.innerHTML = `<div style="flex:1"></div><button type="button" class="closeX" id="ibitiShareCloseTop">Close</button>`;
    modal.appendChild(titleRow);

    const h = document.createElement("h3");
    h.id = "ibitiShareTitle";
    h.textContent = "Share IBITIcoin";
    modal.appendChild(h);

    const p = document.createElement("p");
    p.textContent = "Choose where to share the link.";
    modal.appendChild(p);

    const grid = document.createElement("div");
    grid.className = "ibiti-share-grid";
    grid.innerHTML = `
      <button class="ibiti-share-btn" id="ibitiShareCopy" type="button">
        ${svg("M8 7a3 3 0 0 1 3-3h8v12a3 3 0 0 1-3 3h-8V7Z M5 8H4a3 3 0 0 0-3 3v9h12v-1H5a2 2 0 0 1-2-2V11a3 3 0 0 1 3-3Z")}
        <span>Copy</span>
      </button>

      <button class="ibiti-share-btn" id="ibitiShareTelegram" type="button">
        ${svg("M21 3 2 11l7 2 2 7 3-4 4 3 3-16ZM9 13l8-7-6 8-1 4-1-4Z")}
        <span>Telegram</span>
      </button>

      <button class="ibiti-share-btn" id="ibitiShareWhatsApp" type="button">
        ${svg("M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20Z M16.8 14.9c-.2-.1-1.3-.6-1.5-.7-.2-.1-.4-.1-.5.1l-.6.7c-.1.2-.3.2-.5.1-1-.5-1.8-1.1-2.5-2-.2-.2-.2-.4 0-.5l.5-.6c.1-.2.1-.4.1-.5l-.6-1.4c-.1-.3-.3-.3-.5-.3h-.5c-.2 0-.4.1-.5.3-.5.6-.7 1.3-.6 2.1.2 1.9 2.3 4 4.3 4.7.7.2 1.5.2 2.1-.2.2-.1.4-.3.4-.5v-.5c0-.2-.1-.4-.3-.5Z")}
        <span>WhatsApp</span>
      </button>

      <button class="ibiti-share-btn" id="ibitiShareViber" type="button">
        ${svg("M7 3h8a6 6 0 0 1 6 6v6a6 6 0 0 1-6 6H9l-4 2v-4a6 6 0 0 1-2-4V9a6 6 0 0 1 4-6Zm2 5h2v2H9V8Zm4 0h2v2h-2V8Zm-4 4c.7 2 2.3 3 4 3s3.3-1 4-3h-2c-.5.9-1.3 1.4-2 1.4s-1.5-.5-2-1.4H9Z")}
        <span>Viber</span>
      </button>

      <button class="ibiti-share-btn" id="ibitiShareVK" type="button">
        ${svg("M4 7c2 0 3 0 3 0s1 7 5 7c1 0 1-2 1-3s-1-1 0-2c1-1 4 0 5 3c0 0 2 0 2 0S19 5 12 5C5 5 4 7 4 7Z")}
        <span>VK</span>
      </button>

      <button class="ibiti-share-btn" id="ibitiShareOK" type="button">
        ${svg("M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0-6a2 2 0 1 1-2 2 2 2 0 0 1 2-2Z M17.5 14.2a1 1 0 0 0-1.4.1 5.7 5.7 0 0 1-8.2 0 1 1 0 1 0-1.3 1.5 7.8 7.8 0 0 0 3.6 2l-2 2a1 1 0 0 0 1.4 1.4l2.4-2.4 2.4 2.4a1 1 0 0 0 1.4-1.4l-2-2a7.8 7.8 0 0 0 3.6-2 1 1 0 0 0 .1-1.4Z")}
        <span>OK</span>
      </button>

      <button class="ibiti-share-btn" id="ibitiShareX" type="button">
        ${svg("M18.5 3H21l-6.8 7.8L21.6 21H15l-4.1-5.4L6 21H3.5l7.4-8.5L2.6 3H9l3.7 4.9L18.5 3Z")}
        <span>X</span>
      </button>

      <button class="ibiti-share-btn" id="ibitiShareFacebook" type="button">
        ${svg("M14 9h2V6h-2c-2 0-4 2-4 4v2H8v3h2v7h3v-7h2l1-3h-3v-2c0-.6.4-1 1-1Z")}
        <span>Facebook</span>
      </button>

      <button class="ibiti-share-btn" id="ibitiShareLinkedIn" type="button">
        ${svg("M6 9H3v12h3V9Zm-1.5-6A1.75 1.75 0 1 0 6.2 4.75 1.75 1.75 0 0 0 4.5 3ZM21 14c0-3-1.6-5-4.4-5a3.8 3.8 0 0 0-3.1 1.6V9H10v12h3v-6c0-1.6.3-3 2.2-3s1.9 1.7 1.9 3.1V21h3v-7Z")}
        <span>LinkedIn</span>
      </button>

      <button class="ibiti-share-btn" id="ibitiShareReddit" type="button">
        ${svg("M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm4.3 9.2a1 1 0 0 1 2 0c0 1.8-1.2 3.2-3.3 3.2-.8 0-1.5-.2-2.1-.6-.4 1.1-1.6 2-3.1 2-1.9 0-3.4-1.4-3.4-3.2 0-1.9 1.5-3.4 3.4-3.4.9 0 1.7.3 2.3.8.6-.5 1.4-.8 2.3-.8 1.5 0 2.7.9 3.1 2.1.6.4 1.3.6 2.1.6 1.1 0 1.7-.6 1.7-1.7Z")}
        <span>Reddit</span>
      </button>

      <button class="ibiti-share-btn" id="ibitiShareWeibo" type="button">
        ${svg("M14.5 6.2c.9-.2 1.8-.2 2.6 0a2.3 2.3 0 1 1-.7 2.2c-.6-.1-1.2-.1-1.8 0l-.4 1.8c2.6.5 4.4 2 4.4 3.9 0 2.3-2.9 4.1-6.6 4.1S5.4 16.4 5.4 14c0-1.9 1.8-3.4 4.4-3.9l-.4-1.8c-.6-.1-1.2-.1-1.8 0A2.3 2.3 0 1 1 7 6.2c.8-.2 1.7-.2 2.6 0l.4 2c.6-.1 1.2-.1 1.9-.1s1.3 0 1.9.1l.4-2Z M10 14.2a1 1 0 1 0 1 1 1 1 0 0 0-1-1Zm4 0a1 1 0 1 0 1 1 1 1 0 0 0-1-1Z")}
        <span>Weibo</span>
      </button>

      <button class="ibiti-share-btn ibiti-share-btn--primary" id="ibitiShareEmail" type="button">
        ${svg("M4 6h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm8 7L4 8v10h16V8l-8 5Z")}
        <span>Email</span>
      </button>

      <button class="ibiti-share-btn ibiti-share-btn--danger" id="ibitiShareClose" type="button">
        ${svg("M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7 4.3 4.3l6.3 6.3 6.3-6.3 1.4 1.4Z")}
        <span>Close</span>
      </button>
    `;
    modal.appendChild(grid);

    const urlBox = document.createElement("div");
    urlBox.id = "ibitiShareUrlBox";
    urlBox.className = "ibiti-share-url";
    urlBox.textContent = getShareUrl();
    modal.appendChild(urlBox);

    // Append
    const parent = document.body || document.documentElement;
    parent.appendChild(overlay);
    parent.appendChild(modal);

    // Events
    function close() {
      overlay.classList.add("ibiti-share-hidden");
      modal.classList.add("ibiti-share-hidden");
    }

    function open() {
      urlBox.textContent = getShareUrl();
      overlay.classList.remove("ibiti-share-hidden");
      modal.classList.remove("ibiti-share-hidden");
    }

    overlay.addEventListener("click", close);
    qs("ibitiShareClose")?.addEventListener("click", close);
    qs("ibitiShareCloseTop")?.addEventListener("click", close);
    window.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });

    // Actions
    qs("ibitiShareCopy")?.addEventListener("click", async () => {
      const url = getShareUrl();
      try {
        await navigator.clipboard.writeText(url);
        // tiny feedback without alert spam
        urlBox.textContent = "Copied ✅  " + url;
        setTimeout(() => (urlBox.textContent = url), 1200);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = url;
        parent.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        parent.removeChild(ta);
        urlBox.textContent = "Copied ✅  " + url;
        setTimeout(() => (urlBox.textContent = url), 1200);
      }
    });

    // Share endpoints
    function shareTo(kind) {
      const url = getShareUrl();
      const text = getShareText();

      const map = {
        telegram: `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}`,
        whatsapp: `https://wa.me/?text=${enc(text + " " + url)}`,
        viber: `viber://forward?text=${enc(text + " " + url)}`,
        vk: `https://vk.com/share.php?url=${enc(url)}`,
        ok: `https://connect.ok.ru/offer?url=${enc(url)}`,
        x: `https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(text)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`,
        reddit: `https://www.reddit.com/submit?url=${enc(url)}&title=${enc(text)}`,
        weibo: `https://service.weibo.com/share/share.php?url=${enc(url)}&title=${enc(text)}`,
      };

      const target = map[kind];
      if (target) openPopup(target);
    }

    qs("ibitiShareTelegram")?.addEventListener("click", () => shareTo("telegram"));
    qs("ibitiShareWhatsApp")?.addEventListener("click", () => shareTo("whatsapp"));
    qs("ibitiShareViber")?.addEventListener("click", () => shareTo("viber"));
    qs("ibitiShareVK")?.addEventListener("click", () => shareTo("vk"));
    qs("ibitiShareOK")?.addEventListener("click", () => shareTo("ok"));
    qs("ibitiShareX")?.addEventListener("click", () => shareTo("x"));
    qs("ibitiShareFacebook")?.addEventListener("click", () => shareTo("facebook"));
    qs("ibitiShareLinkedIn")?.addEventListener("click", () => shareTo("linkedin"));
    qs("ibitiShareReddit")?.addEventListener("click", () => shareTo("reddit"));
    qs("ibitiShareWeibo")?.addEventListener("click", () => shareTo("weibo"));

    qs("ibitiShareEmail")?.addEventListener("click", () => {
      const url = getShareUrl();
      const subject = "IBITIcoin";
      const body = `${getShareText()}\n\n${url}`;
      window.location.href = `mailto:?subject=${enc(subject)}&body=${enc(body)}`;
    });

    // Expose for debug if needed
    window.IBITI_OPEN_SHARE = open;

    return { open, close };
  }

  function init() {
    ensureCss();
    const api = buildDom();

    const trigger = qs(TRIGGER_ID);
    if (!trigger) {
      console.warn(`[share-modal] trigger #${TRIGGER_ID} not found`);
      return;
    }

    // Capture phase + stopImmediatePropagation => kills old click handlers on that element.
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      api.open();
    }, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
