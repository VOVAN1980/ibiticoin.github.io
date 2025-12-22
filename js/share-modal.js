/* IBITI Share Modal (Shop-style) — drop-in for index.html
   Requirements:
   - A trigger element with id="openShareModal" (button/link)
   - Include this script after the trigger exists (defer is fine)
*/
(function () {
  "use strict";

  const TRIGGER_ID = "openShareModal";
  const OVERLAY_ID = "shareOverlay";
  const MODAL_ID   = "shareModal";
  const STYLE_ID   = "ibitiShareModalStyle";

  function ready(fn){
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  function el(tag, attrs, html){
    const n = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        if (k === "class") n.className = attrs[k];
        else if (k === "style") n.style.cssText = attrs[k];
        else n.setAttribute(k, attrs[k]);
      }
    }
    if (html != null) n.innerHTML = html;
    return n;
  }

  function injectStyle(){
    if (document.getElementById(STYLE_ID)) return;
    const css = `
/* ==== IBITI Share Modal (shop-like) ==== */
#${OVERLAY_ID}{
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.72);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: 9998;
}
#${MODAL_ID}{
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%,-50%);
  z-index: 9999;

  background: rgba(10,10,10,.92);
  border: 1px solid rgba(247,208,0,.28);
  box-shadow: 0 20px 60px rgba(0,0,0,.65);
  border-radius: 18px;
  color: #fff;

  width: min(720px, 94vw);
  max-height: min(78vh, 560px);
  overflow: auto;

  padding: 16px 16px 14px;
}

.ibiti-hidden{ display:none !important; }

#${MODAL_ID} .share-head{ display:flex; align-items:flex-start; justify-content:center; position: relative; }
#${MODAL_ID} h3{
  margin: 2px 0 2px;
  color: #f7d000;
  letter-spacing: .6px;
  text-align: center;
  font-family: Orbitron, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
}
#${MODAL_ID} p{
  color: rgba(255,255,255,.72);
  margin: 6px 0 12px;
  text-align: center;
  font-size: 13px;
  line-height: 1.45;
}

#${MODAL_ID} .share-x{
  position:absolute;
  right: 0;
  top: 0;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,.10);
  background: rgba(255,255,255,.06);
  color: rgba(255,255,255,.9);
  padding: 6px 10px;
  cursor: pointer;
}
#${MODAL_ID} .share-x:hover{ background: rgba(247,208,0,.10); border-color: rgba(247,208,0,.40); }

#${MODAL_ID} .share-grid{
  display: grid;
  grid-template-columns: repeat(2, minmax(0,1fr));
  gap: 10px;
}
@media (min-width: 760px){
  #${MODAL_ID} .share-grid{ grid-template-columns: repeat(4, minmax(0,1fr)); }
}

#${MODAL_ID} .share-btn{
  display:flex;
  align-items:center;
  justify-content:center;
  gap: 10px;

  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(247,208,0,.22);
  background: rgba(255,255,255,.10); /* чуть более «серое» */
  color: rgba(255,255,255,.92);

  cursor:pointer;
  user-select:none;
  transition: transform .12s ease, background .12s ease, border-color .12s ease, filter .12s ease;
}
#${MODAL_ID} .share-btn:hover{
  transform: translateY(-1px);
  background: rgba(0,0,0,.35); /* серый «уходит» при наведении */
  border-color: rgba(247,208,0,.45);
  filter: brightness(1.06);
}
#${MODAL_ID} .share-btn:active{ transform: translateY(0px); }
#${MODAL_ID} .share-btn:focus{
  outline: none;
  box-shadow: 0 0 0 3px rgba(247,208,0,.18);
  border-color: rgba(247,208,0,.45);
}

#${MODAL_ID} .share-btn--primary{
  background: rgba(247,208,0,.16);
  border-color: rgba(247,208,0,.45);
  color: #ffd84a;
  font-weight: 700;
}
#${MODAL_ID} .share-btn--danger{
  background: rgba(255,255,255,.08);
  border: 1px solid rgba(255,255,255,.12);
}

#${MODAL_ID} .share-ico{ width:18px; height:18px; display:inline-flex; align-items:center; justify-content:center; }
#${MODAL_ID} .share-ico svg{ width:18px; height:18px; fill: currentColor; opacity:.95; }

#${MODAL_ID} .share-link{
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(247,208,0,.30);
  background: rgba(0,0,0,.55);
  color: #fff;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  word-break: break-all;
}

/* компактнее на очень маленьких экранах */
@media (max-width: 420px){
  #${MODAL_ID}{ width: 96vw; padding: 14px 12px 12px; border-radius: 16px; }
  #${MODAL_ID} .share-grid{ gap: 8px; }
  #${MODAL_ID} .share-btn{ padding: 9px 10px; border-radius: 11px; font-size: 12px; }
}
`;
    const st = el("style", { id: STYLE_ID });
    st.textContent = css;
    document.head.appendChild(st);
  }

  function buildModalIfMissing(){
    injectStyle();

    let overlay = document.getElementById(OVERLAY_ID);
    if (!overlay) {
      overlay = el("div", { id: OVERLAY_ID, class: "ibiti-hidden" });
      document.body.appendChild(overlay);
    }

    let modal = document.getElementById(MODAL_ID);
    if (!modal) {
      modal = el("div", { id: MODAL_ID, class: "ibiti-hidden", role:"dialog", "aria-modal":"true", "aria-labelledby":"shareTitle" });
      modal.innerHTML = `
        <div class="share-head">
          <h3 id="shareTitle">Share IBITIcoin</h3>
          <button class="share-x" id="shareCloseTop" type="button">Close</button>
        </div>
        <p>Choose where to share the link.</p>

        <div class="share-grid">
          <button class="share-btn share-btn--primary" id="shareCopyBtn" type="button">
            <span class="share-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 7a3 3 0 0 1 3-3h8v12a3 3 0 0 1-3 3h-8V7Z"/><path d="M5 8H4a3 3 0 0 0-3 3v9h12v-1H5a2 2 0 0 1-2-2V11a3 3 0 0 1 3-3Z"/></svg></span>
            <span>Copy</span>
          </button>

          <button class="share-btn" id="shareTgBtn" type="button">
            <span class="share-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 3 2 11l7 2 2 7 3-4 4 3 3-16ZM9 13l8-7-6 8-1 4-1-4Z"/></svg></span>
            <span>Telegram</span>
          </button>

          <button class="share-btn" id="shareWaBtn" type="button">
            <span class="share-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20Z"/><path d="M16.8 14.9c-.2-.1-1.3-.6-1.5-.7-.2-.1-.4-.1-.5.1l-.6.7c-.1.2-.3.2-.5.1-1-.5-1.8-1.1-2.5-2-.2-.2-.2-.4 0-.5l.5-.6c.1-.2.1-.4.1-.5l-.6-1.4c-.1-.3-.3-.3-.5-.3h-.5c-.2 0-.4.1-.5.3-.5.6-.7 1.3-.6 2.1.2 1.9 2.3 4 4.3 4.7.7.2 1.5.2 2.1-.2.2-.1.4-.3.4-.5v-.5c0-.2-.1-.4-.3-.5Z"/></svg></span>
            <span>WhatsApp</span>
          </button>

          <button class="share-btn" id="shareVbBtn" type="button">
            <span class="share-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h8a6 6 0 0 1 6 6v6a6 6 0 0 1-6 6H9l-4 2v-4a6 6 0 0 1-2-4V9a6 6 0 0 1 4-6Zm2 5h2v2H9V8Zm4 0h2v2h-2V8Zm-4 4c.7 2 2.3 3 4 3s3.3-1 4-3h-2c-.5.9-1.3 1.4-2 1.4s-1.5-.5-2-1.4H9Z"/></svg></span>
            <span>Viber</span>
          </button>

          <button class="share-btn" id="shareVkBtn" type="button">
            <span class="share-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7c2 0 3 0 3 0s1 7 5 7c1 0 1-2 1-3s-1-1 0-2c1-1 4 0 5 3c0 0 2 0 2 0S19 5 12 5C5 5 4 7 4 7Z"/></svg></span>
            <span>VK</span>
          </button>

          <button class="share-btn" id="shareOkBtn" type="button">
            <span class="share-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0-6a2 2 0 1 1-2 2 2 2 0 0 1 2-2Z"/><path d="M17.5 14.2a1 1 0 0 0-1.4.1 5.7 5.7 0 0 1-8.2 0 1 1 0 1 0-1.3 1.5 7.8 7.8 0 0 0 3.6 2l-2 2a1 1 0 0 0 1.4 1.4l2.4-2.4 2.4 2.4a1 1 0 0 0 1.4-1.4l-2-2a7.8 7.8 0 0 0 3.6-2 1 1 0 0 0 .1-1.4Z"/></svg></span>
            <span>OK</span>
          </button>

          <button class="share-btn" id="shareXBtn" type="button">
            <span class="share-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.5 3H21l-6.8 7.8L21.6 21H15l-4.1-5.4L6 21H3.5l7.4-8.5L2.6 3H9l3.7 4.9L18.5 3Z"/></svg></span>
            <span>X</span>
          </button>

          <button class="share-btn" id="shareFbBtn" type="button">
            <span class="share-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 9h2V6h-2c-2 0-4 2-4 4v2H8v3h2v7h3v-7h2l1-3h-3v-2c0-.6.4-1 1-1Z"/></svg></span>
            <span>Facebook</span>
          </button>

          <button class="share-btn" id="shareLiBtn" type="button">
            <span class="share-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9H3v12h3V9Zm-1.5-6A1.75 1.75 0 1 0 6.2 4.75 1.75 1.75 0 0 0 4.5 3ZM21 14c0-3-1.6-5-4.4-5a3.8 3.8 0 0 0-3.1 1.6V9H10v12h3v-6c0-1.6.3-3 2.2-3s1.9 1.7 1.9 3.1V21h3v-7Z"/></svg></span>
            <span>LinkedIn</span>
          </button>

          <button class="share-btn" id="shareRdBtn" type="button">
            <span class="share-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm4.3 9.2a1 1 0 0 1 2 0c0 1.8-1.2 3.2-3.3 3.2-.8 0-1.5-.2-2.1-.6-.4 1.1-1.6 2-3.1 2-1.9 0-3.4-1.4-3.4-3.2 0-1.9 1.5-3.4 3.4-3.4.9 0 1.7.3 2.3.8.6-.5 1.4-.8 2.3-.8 1.5 0 2.7.9 3.1 2.1.6.4 1.3.6 2.1.6 1.1 0 1.7-.6 1.7-1.7Z"/></svg></span>
            <span>Reddit</span>
          </button>

          <button class="share-btn" id="shareWbBtn" type="button">
            <span class="share-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 6.2c.9-.2 1.8-.2 2.6 0a2.3 2.3 0 1 1-.7 2.2c-.6-.1-1.2-.1-1.8 0l-.4 1.8c2.6.5 4.4 2 4.4 3.9 0 2.3-2.9 4.1-6.6 4.1S5.4 16.4 5.4 14c0-1.9 1.8-3.4 4.4-3.9l-.4-1.8c-.6-.1-1.2-.1-1.8 0A2.3 2.3 0 1 1 7 6.2c.8-.2 1.7-.2 2.6 0l.4 2c.6-.1 1.2-.1 1.9-.1s1.3 0 1.9.1l.4-2Z"/><path d="M10 14.2a1 1 0 1 0 1 1 1 1 0 0 0-1-1Zm4 0a1 1 0 1 0 1 1 1 1 0 0 0-1-1Z"/></svg></span>
            <span>Weibo</span>
          </button>

          <button class="share-btn" id="shareMailBtn" type="button">
            <span class="share-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm8 7L4 8v10h16V8l-8 5Z"/></svg></span>
            <span>Email</span>
          </button>

          <button class="share-btn share-btn--danger" id="shareCloseBtn" type="button">
            <span class="share-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7 4.3 4.3l6.3 6.3 6.3-6.3 1.4 1.4Z"/></svg></span>
            <span>Close</span>
          </button>
        </div>

        <div class="share-link" id="shareLinkBox">—</div>
      `;
      document.body.appendChild(modal);
    }

    return { overlay, modal };
  }

  function shareUrls(url, title){
    const u = encodeURIComponent(url);
    const t = encodeURIComponent(title || "IBITIcoin");
    return {
      tg: `https://t.me/share/url?url=${u}&text=${t}`,
      wa: `https://wa.me/?text=${t}%20${u}`,
      vb: `viber://forward?text=${t}%20${u}`,
      vk: `https://vk.com/share.php?url=${u}`,
      ok: `https://connect.ok.ru/offer?url=${u}`,
      x:  `https://twitter.com/intent/tweet?text=${t}%20${u}`,
      fb: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
      li: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
      rd: `https://www.reddit.com/submit?url=${u}&title=${t}`,
      wb: `https://service.weibo.com/share/share.php?url=${u}&title=${t}`,
      mail: `mailto:?subject=${t}&body=${t}%0A${u}`
    };
  }

  async function copyToClipboard(text){
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        return true;
      } catch {
        return false;
      }
    }
  }

  function openPopup(url){
    try {
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      window.location.href = url;
    }
  }

  function show(){
    const { overlay, modal } = buildModalIfMissing();

    const url = window.location.href;
    const title = "IBITIcoin";
    const urls = shareUrls(url, title);

    const linkBox = modal.querySelector("#shareLinkBox");
    if (linkBox) linkBox.textContent = url;

    // wire buttons once
    if (!modal.__ibitiWired) {
      modal.__ibitiWired = true;

      const byId = (id) => modal.querySelector(`#${id}`);
      const closeAll = () => {
        overlay.classList.add("ibiti-hidden");
        modal.classList.add("ibiti-hidden");
      };

      overlay.addEventListener("click", closeAll);
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeAll();
      });

      (byId("shareCloseTop") || {}).onclick = closeAll;
      (byId("shareCloseBtn")  || {}).onclick = closeAll;

      const wire = (id, fn) => {
        const b = byId(id);
        if (!b) return;
        b.addEventListener("click", fn);
      };

      wire("shareCopyBtn", async () => {
        const ok = await copyToClipboard(window.location.href);
        // лёгкий фидбек без алертов
        const btn = byId("shareCopyBtn");
        if (btn) {
          const old = btn.querySelector("span:last-child")?.textContent || "Copy";
          btn.querySelector("span:last-child").textContent = ok ? "Copied" : "Copy";
          setTimeout(() => { btn.querySelector("span:last-child").textContent = old; }, 900);
        }
      });

      wire("shareTgBtn", () => openPopup(urls.tg));
      wire("shareWaBtn", () => openPopup(urls.wa));
      wire("shareVbBtn", () => openPopup(urls.vb));
      wire("shareVkBtn", () => openPopup(urls.vk));
      wire("shareOkBtn", () => openPopup(urls.ok));
      wire("shareXBtn",  () => openPopup(urls.x));
      wire("shareFbBtn", () => openPopup(urls.fb));
      wire("shareLiBtn", () => openPopup(urls.li));
      wire("shareRdBtn", () => openPopup(urls.rd));
      wire("shareWbBtn", () => openPopup(urls.wb));
      wire("shareMailBtn", () => openPopup(urls.mail));
    }

    // show
    overlay.classList.remove("ibiti-hidden");
    modal.classList.remove("ibiti-hidden");
  }

  ready(function(){
    const trigger = document.getElementById(TRIGGER_ID);
    if (!trigger) {
      console.warn(`[share-modal] trigger #${TRIGGER_ID} not found`);
      return;
    }
    trigger.addEventListener("click", function(e){
      e.preventDefault();
      show();
    });
  });
})();
