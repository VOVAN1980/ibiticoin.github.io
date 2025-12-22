/* IBITI Share Modal (same style as Shop) */
(function () {
  "use strict";

  const OPEN_BTN_ID = "openShareModal";   // <a id="openShareModal" ...>Share</a>
  const OVERLAY_ID  = "shareOverlay";
  const MODAL_ID    = "shareModal";

  // --- CSS (copied from shop, with a few safety helpers) ---
  const CSS = `
/* Share modal — IBITI style */
.hidden{ display:none !important; }

#${OVERLAY_ID}{
  position: fixed;
  inset: 0;
  z-index: 9998;
  background: rgba(0,0,0,.72);
  backdrop-filter: blur(6px);
}

#${MODAL_ID}{
  position: fixed;
  z-index: 9999;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  background: rgba(10,10,10,.92);
  border: 1px solid rgba(255,0,0,.35);
  box-shadow: 0 0 0 1px rgba(247,208,0,.18) inset, 0 20px 60px rgba(0,0,0,.65);
  border-radius: 18px;
  color: #fff;
  max-width: 860px;
  width: min(860px, 92vw);
  padding: 18px 18px 16px;
}

#${MODAL_ID} *{ box-sizing: border-box; }

#shareTitle{
  color: #f7d000;
  letter-spacing: .6px;
  margin: 0 0 6px;
  text-align: center;
}

#${MODAL_ID} p{
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
  border: 1px solid rgba(255,255,255,.12);
  background: rgba(255,255,255,.06);
  color: rgba(255,255,255,.92);
  cursor: pointer;
  transition: transform .12s ease, background .12s ease, border-color .12s ease;
  user-select: none;
}

.share-btn:hover{
  transform: translateY(-1px);
  background: rgba(247,208,0,.10);
  border-color: rgba(247,208,0,.45);
}

.share-btn:active{ transform: translateY(0px); }

.share-btn--danger{
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.10);
}

.share-btn:focus{
  outline: none;
  box-shadow: 0 0 0 3px rgba(247,208,0,.18);
  border-color: rgba(247,208,0,.45);
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

.share-link{
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(247,208,0,.30);
  background: rgba(0,0,0,.55);
  color: #fff;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  word-break: break-all;
  text-align: center;
}
  `.trim();

  // --- HTML (same as shop, but WITHOUT "System" button) ---
  const HTML = `
<div id="${OVERLAY_ID}" class="hidden" aria-hidden="true"></div>

<div id="${MODAL_ID}" class="hidden" role="dialog" aria-modal="true" aria-labelledby="shareTitle">
  <h3 id="shareTitle">Share IBITIcoin</h3>
  <p>Choose where to share.</p>

  <div class="share-grid">

    <button class="share-btn" id="shareCopyBtn" type="button">
      <span class="share-ico">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 7a3 3 0 0 1 3-3h8v12a3 3 0 0 1-3 3h-8V7Z"/>
          <path d="M5 8H4a3 3 0 0 0-3 3v9h12v-1H5a2 2 0 0 1-2-2V11a3 3 0 0 1 3-3Z"/>
        </svg>
      </span>
      <span>Copy</span>
    </button>

    <button class="share-btn" id="shareTgBtn" type="button">
      <span class="share-ico">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21 3 2 11l7 2 2 7 3-4 4 3 3-16ZM9 13l8-7-6 8-1 4-1-4Z"/>
        </svg>
      </span>
      <span>Telegram</span>
    </button>

    <button class="share-btn" id="shareWaBtn" type="button">
      <span class="share-ico">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20Z"/>
          <path d="M16.8 14.9c-.2-.1-1.3-.6-1.5-.7-.2-.1-.4-.1-.5.1l-.6.7c-.1.2-.3.2-.5.1-1-.5-1.8-1.1-2.5-2-.2-.2-.2-.4 0-.5l.5-.6c.1-.2.1-.4.1-.5l-.6-1.4c-.1-.3-.3-.3-.5-.3h-.5c-.2 0-.4.1-.5.3-.5.6-.7 1.3-.6 2.1.2 1.9 2.3 4 4.3 4.7.7.2 1.5.2 2.1-.2.2-.1.4-.3.4-.5v-.5c0-.2-.1-.4-.3-.5Z"/>
        </svg>
      </span>
      <span>WhatsApp</span>
    </button>

    <button class="share-btn" id="shareVbBtn" type="button">
      <span class="share-ico">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 3h8a6 6 0 0 1 6 6v6a6 6 0 0 1-6 6H9l-4 2v-4a6 6 0 0 1-2-4V9a6 6 0 0 1 4-6Zm2 5h2v2H9V8Zm4 0h2v2h-2V8Zm-4 4c.7 2 2.3 3 4 3s3.3-1 4-3h-2c-.5.9-1.3 1.4-2 1.4s-1.5-.5-2-1.4H9Z"/>
        </svg>
      </span>
      <span>Viber</span>
    </button>

    <button class="share-btn" id="shareVkBtn" type="button">
      <span class="share-ico">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 7c2 0 3 0 3 0s1 7 5 7c1 0 1-2 1-3s-1-1 0-2c1-1 4 0 5 3c0 0 2 0 2 0S19 5 12 5C5 5 4 7 4 7Z"/>
        </svg>
      </span>
      <span>VK</span>
    </button>

    <button class="share-btn" id="shareOkBtn" type="button">
      <span class="share-ico">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0-6a2 2 0 1 1-2 2 2 2 0 0 1 2-2Z"/>
          <path d="M17.5 14.2a1 1 0 0 0-1.4.1 5.7 5.7 0 0 1-8.2 0 1 1 0 1 0-1.3 1.5 7.8 7.8 0 0 0 3.6 2l-2 2a1 1 0 0 0 1.4 1.4l2.4-2.4 2.4 2.4a1 1 0 0 0 1.4-1.4l-2-2a7.8 7.8 0 0 0 3.6-2 1 1 0 0 0 .1-1.4Z"/>
        </svg>
      </span>
      <span>OK</span>
    </button>

    <button class="share-btn" id="shareXBtn" type="button">
      <span class="share-ico">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18.5 3H21l-6.8 7.8L21.6 21H15l-4.1-5.4L6 21H3.5l7.4-8.5L2.6 3H9l3.7 4.9L18.5 3Z"/>
        </svg>
      </span>
      <span>X</span>
    </button>

    <button class="share-btn" id="shareFbBtn" type="button">
      <span class="share-ico">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M14 9h2V6h-2c-2 0-4 2-4 4v2H8v3h2v7h3v-7h2l1-3h-3v-2c0-.6.4-1 1-1Z"/>
        </svg>
      </span>
      <span>Facebook</span>
    </button>

    <button class="share-btn" id="shareLiBtn" type="button">
      <span class="share-ico">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 9H3v12h3V9Zm-1.5-6A1.75 1.75 0 1 0 6.2 4.75 1.75 1.75 0 0 0 4.5 3ZM21 14c0-3-1.6-5-4.4-5a3.8 3.8 0 0 0-3.1 1.6V9H10v12h3v-6c0-1.6.3-3 2.2-3s1.9 1.7 1.9 3.1V21h3v-7Z"/>
        </svg>
      </span>
      <span>LinkedIn</span>
    </button>

    <button class="share-btn" id="shareRdBtn" type="button">
      <span class="share-ico">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm4.3 9.2a1 1 0 0 1 2 0c0 1.8-1.2 3.2-3.3 3.2-.8 0-1.5-.2-2.1-.6-.4 1.1-1.6 2-3.1 2-1.9 0-3.4-1.4-3.4-3.2 0-1.9 1.5-3.4 3.4-3.4.9 0 1.7.3 2.3.8.6-.5 1.4-.8 2.3-.8 1.5 0 2.7.9 3.1 2.1.6.4 1.3.6 2.1.6 1.1 0 1.7-.6 1.7-1.7Z"/>
        </svg>
      </span>
      <span>Reddit</span>
    </button>

    <button class="share-btn" id="shareWbBtn" type="button">
      <span class="share-ico">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M14.5 6.2c.9-.2 1.8-.2 2.6 0a2.3 2.3 0 1 1-.7 2.2c-.6-.1-1.2-.1-1.8 0l-.4 1.8c2.6.5 4.4 2 4.4 3.9 0 2.3-2.9 4.1-6.6 4.1S5.4 16.4 5.4 14c0-1.9 1.8-3.4 4.4-3.9l-.4-1.8c-.6-.1-1.2-.1-1.8 0A2.3 2.3 0 1 1 7 6.2c.8-.2 1.7-.2 2.6 0l.4 2c.6-.1 1.2-.1 1.9-.1s1.3 0 1.9.1l.4-2Z"/>
          <path d="M10 14.2a1 1 0 1 0 1 1 1 1 0 0 0-1-1Zm4 0a1 1 0 1 0 1 1 1 1 0 0 0-1-1Z"/>
        </svg>
      </span>
      <span>Weibo</span>
    </button>

    <button class="share-btn" id="shareMailBtn" type="button">
      <span class="share-ico">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 6h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm8 7L4 8v10h16V8l-8 5Z"/>
        </svg>
      </span>
      <span>Email</span>
    </button>

    <button class="share-btn share-btn--danger" id="shareCancelBtn" type="button">
      <span class="share-ico">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7 4.3 4.3l6.3 6.3 6.3-6.3 1.4 1.4Z"/>
        </svg>
      </span>
      <span>Close</span>
    </button>

  </div>

  <div class="share-link" id="shareLinkBox">—</div>
</div>
`.trim();

  function injectCSS() {
    if (document.getElementById("ibitiShareModalCss")) return;
    const st = document.createElement("style");
    st.id = "ibitiShareModalCss";
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function ensureModal() {
    injectCSS();
    if (document.getElementById(OVERLAY_ID) && document.getElementById(MODAL_ID)) return;

    const wrap = document.createElement("div");
    wrap.innerHTML = HTML;

    const target = document.body || document.documentElement;
    target.appendChild(wrap.firstElementChild); // overlay
    target.appendChild(wrap.lastElementChild);  // modal
  }

  function q(id) { return document.getElementById(id); }

  function getShareUrl() {
    // без #hash, чтобы люди не репостили случайный якорь
    const u = new URL(window.location.href);
    u.hash = "";
    return u.toString();
  }

  function openModal() {
    ensureModal();

    const url = getShareUrl();
    const linkBox = q("shareLinkBox");
    if (linkBox) linkBox.textContent = url;

    q(OVERLAY_ID)?.classList.remove("hidden");
    q(MODAL_ID)?.classList.remove("hidden");
  }

  function closeModal() {
    q(OVERLAY_ID)?.classList.add("hidden");
    q(MODAL_ID)?.classList.add("hidden");
  }

  function pop(url) {
    // Попап иногда блокируют — тогда просто переходим
    const w = window.open(url, "_blank", "noopener,noreferrer");
    if (!w) window.location.href = url;
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "readonly");
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

  function bindOnce() {
    // open button
    const openBtn = q(OPEN_BTN_ID);
    if (openBtn && !openBtn.__ibitiBound) {
      openBtn.__ibitiBound = true;
      openBtn.addEventListener("click", function (e) {
        e.preventDefault();
        openModal();
      });
    }

    ensureModal();

    // overlay close
    const ov = q(OVERLAY_ID);
    if (ov && !ov.__ibitiBound) {
      ov.__ibitiBound = true;
      ov.addEventListener("click", closeModal);
    }

    // ESC close
    if (!window.__ibitiShareEsc) {
      window.__ibitiShareEsc = true;
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeModal();
      });
    }

    // buttons
    const url = () => getShareUrl();
    const title = "IBITIcoin";
    const text = () => `IBITIcoin — official website: ${url()}`;

    const byId = (id, fn) => {
      const el = q(id);
      if (!el || el.__ibitiBound) return;
      el.__ibitiBound = true;
      el.addEventListener("click", fn);
    };

    byId("shareCancelBtn", closeModal);

    byId("shareCopyBtn", async () => {
      const ok = await copyText(url());
      if (ok) {
        // мини-обратная связь без алертов (не раздражаем людей)
        const box = q("shareLinkBox");
        if (box) {
          const old = box.textContent;
          box.textContent = "Copied ✅";
          setTimeout(() => { box.textContent = old; }, 900);
        }
      } else {
        alert(url());
      }
    });

    byId("shareTgBtn", () => {
      pop(`https://t.me/share/url?url=${encodeURIComponent(url())}&text=${encodeURIComponent(title)}`);
    });

    byId("shareWaBtn", () => {
      pop(`https://wa.me/?text=${encodeURIComponent(text())}`);
    });

    byId("shareVbBtn", () => {
      // viber:// может не работать на десктопе — но на мобиле откроет приложение
      pop(`viber://forward?text=${encodeURIComponent(text())}`);
    });

    byId("shareVkBtn", () => {
      pop(`https://vk.com/share.php?url=${encodeURIComponent(url())}`);
    });

    byId("shareOkBtn", () => {
      pop(`https://connect.ok.ru/offer?url=${encodeURIComponent(url())}&title=${encodeURIComponent(title)}`);
    });

    byId("shareXBtn", () => {
      pop(`https://x.com/intent/post?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url())}`);
    });

    byId("shareFbBtn", () => {
      pop(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url())}`);
    });

    byId("shareLiBtn", () => {
      pop(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url())}`);
    });

    byId("shareRdBtn", () => {
      pop(`https://www.reddit.com/submit?url=${encodeURIComponent(url())}&title=${encodeURIComponent(title)}`);
    });

    byId("shareWbBtn", () => {
      pop(`https://service.weibo.com/share/share.php?url=${encodeURIComponent(url())}&title=${encodeURIComponent(title)}`);
    });

    byId("shareMailBtn", () => {
      const subject = "IBITIcoin";
      const body = `Hi!\n\nCheck IBITIcoin:\n${url()}\n`;
      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }

  // init
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindOnce);
  } else {
    bindOnce();
  }
})();
