// js/share-modal.js — IBITI Shop-style Share Modal (NO "System")
(() => {
  "use strict";

  const OPEN_BTN_ID = "openShareModal"; // твоя кнопка на главной

  // --- SVG icons (как в магазине: простые, моно, серые) ---
  const ICO = {
    copy: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 7a3 3 0 0 1 3-3h8v12a3 3 0 0 1-3 3h-8V7Z"/><path d="M5 8H4a3 3 0 0 0-3 3v9h12v-1H5a2 2 0 0 1-2-2V11a3 3 0 0 1 3-3Z"/></svg>`,
    tg:   `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 3 2 11l7 2 2 7 3-4 4 3 3-16ZM9 13l8-7-6 8-1 4-1-4Z"/></svg>`,
    wa:   `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20Z"/><path d="M16.8 14.9c-.2-.1-1.3-.6-1.5-.7-.2-.1-.4-.1-.5.1l-.6.7c-.1.2-.3.2-.5.1-1-.5-1.8-1.1-2.5-2-.2-.2-.2-.4 0-.5l.5-.6c.1-.2.1-.4.1-.5l-.6-1.4c-.1-.3-.3-.3-.5-.3h-.5c-.2 0-.4.1-.5.3-.5.6-.7 1.3-.6 2.1.2 1.9 2.3 4 4.3 4.7.7.2 1.5.2 2.1-.2.2-.1.4-.3.4-.5v-.5c0-.2-.1-.4-.3-.5Z"/></svg>`,
    vb:   `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h8a6 6 0 0 1 6 6v6a6 6 0 0 1-6 6H9l-4 2v-4a6 6 0 0 1-2-4V9a6 6 0 0 1 4-6Zm2 5h2v2H9V8Zm4 0h2v2h-2V8Zm-4 4c.7 2 2.3 3 4 3s3.3-1 4-3h-2c-.5.9-1.3 1.4-2 1.4s-1.5-.5-2-1.4H9Z"/></svg>`,
    vk:   `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7c2 0 3 0 3 0s1 7 5 7c1 0 1-2 1-3s-1-1 0-2c1-1 4 0 5 3c0 0 2 0 2 0S19 5 12 5C5 5 4 7 4 7Z"/></svg>`,
    ok:   `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0-6a2 2 0 1 1-2 2 2 2 0 0 1 2-2Z"/><path d="M17.5 14.2a1 1 0 0 0-1.4.1 5.7 5.7 0 0 1-8.2 0 1 1 0 1 0-1.3 1.5 7.8 7.8 0 0 0 3.6 2l-2 2a1 1 0 0 0 1.4 1.4l2.4-2.4 2.4 2.4a1 1 0 0 0 1.4-1.4l-2-2a7.8 7.8 0 0 0 3.6-2 1 1 0 0 0 .1-1.4Z"/></svg>`,
    x:    `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.5 3H21l-6.8 7.8L21.6 21H15l-4.1-5.4L6 21H3.5l7.4-8.5L2.6 3H9l3.7 4.9L18.5 3Z"/></svg>`,
    fb:   `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 9h2V6h-2c-2 0-4 2-4 4v2H8v3h2v7h3v-7h2l1-3h-3v-2c0-.6.4-1 1-1Z"/></svg>`,
    li:   `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9H3v12h3V9Zm-1.5-6A1.75 1.75 0 1 0 6.2 4.75 1.75 1.75 0 0 0 4.5 3ZM21 14c0-3-1.6-5-4.4-5a3.8 3.8 0 0 0-3.1 1.6V9H10v12h3v-6c0-1.6.3-3 2.2-3s1.9 1.7 1.9 3.1V21h3v-7Z"/></svg>`,
    rd:   `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm4.3 9.2a1 1 0 0 1 2 0c0 1.8-1.2 3.2-3.3 3.2-.8 0-1.5-.2-2.1-.6-.4 1.1-1.6 2-3.1 2-1.9 0-3.4-1.4-3.4-3.2 0-1.9 1.5-3.4 3.4-3.4.9 0 1.7.3 2.3.8.6-.5 1.4-.8 2.3-.8 1.5 0 2.7.9 3.1 2.1.6.4 1.3.6 2.1.6 1.1 0 1.7-.6 1.7-1.7Z"/></svg>`,
    wb:   `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 6.2c.9-.2 1.8-.2 2.6 0a2.3 2.3 0 1 1-.7 2.2c-.6-.1-1.2-.1-1.8 0l-.4 1.8c2.6.5 4.4 2 4.4 3.9 0 2.3-2.9 4.1-6.6 4.1S5.4 16.4 5.4 14c0-1.9 1.8-3.4 4.4-3.9l-.4-1.8c-.6-.1-1.2-.1-1.8 0A2.3 2.3 0 1 1 7 6.2c.8-.2 1.7-.2 2.6 0l.4 2c.6-.1 1.2-.1 1.9-.1s1.3 0 1.9.1l.4-2Z"/><path d="M10 14.2a1 1 0 1 0 1 1 1 1 0 0 0-1-1Zm4 0a1 1 0 1 0 1 1 1 1 0 0 0-1-1Z"/></svg>`,
    mail: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm8 7L4 8v10h16V8l-8 5Z"/></svg>`,
    close:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7 4.3 4.3l6.3 6.3 6.3-6.3 1.4 1.4Z"/></svg>`
  };

  function injectStyleOnce() {
    if (document.getElementById("ibitiShareModalStyle")) return;

    const css = `
/* Share modal — IBITI shop style (compact) */
#shareOverlay{
  position: fixed; inset: 0;
  background: rgba(0,0,0,.72);
  backdrop-filter: blur(6px);
  z-index: 9998;
}
#shareModal{
  position: fixed;
  left: 50%; top: 50%;
  transform: translate(-50%, -50%);
  background: rgba(10,10,10,.92);
  border: 1px solid rgba(247,208,0,.28);
  box-shadow: 0 20px 60px rgba(0,0,0,.65);
  border-radius: 18px;
  color: #fff;
  max-width: 720px;
  width: min(720px, 92vw);
  padding: 16px 16px 14px;
  z-index: 9999;
}
#shareTitle{
  color: #f7d000;
  letter-spacing: .6px;
  margin: 0 0 6px;
  text-align: center;
  font-weight: 800;
}
#shareModal p{
  color: rgba(255,255,255,.72);
  margin: 0 0 12px;
  text-align: center;
  font-size: 13px;
  line-height: 1.45;
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
  border: 1px solid rgba(247,208,0,.18);
  background: rgba(255,255,255,.10); /* серые кнопки */
  color: rgba(255,255,255,.92);
  cursor: pointer;
  transition: transform .12s ease, background .12s ease, border-color .12s ease, filter .12s ease;
  user-select: none;
  font-weight: 700;
}
.share-btn:hover{
  transform: translateY(-1px);
  background: rgba(255,255,255,.04); /* “серый уходит” как в магазине */
  border-color: rgba(247,208,0,.38);
  filter: brightness(1.05);
}
.share-btn:active{ transform: translateY(0px); }

.share-btn--primary{
  background: rgba(247,208,0,.16);
  border-color: rgba(247,208,0,.45);
  color: #ffd84a;
  font-weight: 800;
}
.share-btn--danger{
  background: rgba(255,255,255,.10);
  border: 1px solid rgba(255,255,255,.14);
  height: 44px;
}
.share-ico{
  width: 18px; height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.share-ico svg{
  width: 18px; height: 18px;
  fill: currentColor;
  opacity: .95;
}
.share-btn:focus{
  outline: none;
  box-shadow: 0 0 0 3px rgba(247,208,0,.18);
  border-color: rgba(247,208,0,.45);
}
#shareTopClose{
  position:absolute;
  top: 10px; right: 10px;
  border: 1px solid rgba(255,255,255,.14);
  background: rgba(255,255,255,.08);
  color: rgba(255,255,255,.9);
  border-radius: 10px;
  padding: 6px 10px;
  cursor: pointer;
  font-weight: 700;
}
#shareTopClose:hover{
  background: rgba(255,255,255,.04);
  border-color: rgba(247,208,0,.35);
}
#shareUrlBox{
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(247,208,0,.22);
  background: rgba(0,0,0,.45);
  color: rgba(255,255,255,.88);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  word-break: break-all;
  text-align: center;
}
.hidden{ display:none !important; }
`;

    const style = document.createElement("style");
    style.id = "ibitiShareModalStyle";
    style.textContent = css;
    document.head.appendChild(style);
  }

  function injectModalOnce() {
    if (document.getElementById("shareModal") && document.getElementById("shareOverlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "shareOverlay";
    overlay.className = "hidden";

    const modal = document.createElement("div");
    modal.id = "shareModal";
    modal.className = "hidden";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "shareTitle");

    modal.innerHTML = `
      <button id="shareTopClose" type="button">Close</button>
      <h3 id="shareTitle">Share IBITIcoin</h3>
      <p>Choose where to share the link.</p>

      <div class="share-grid">
        <button class="share-btn share-btn--primary" id="shareCopyBtn" type="button">
          <span class="share-ico">${ICO.copy}</span><span>Copy</span>
        </button>

        <button class="share-btn" id="shareTgBtn" type="button">
          <span class="share-ico">${ICO.tg}</span><span>Telegram</span>
        </button>

        <button class="share-btn" id="shareWaBtn" type="button">
          <span class="share-ico">${ICO.wa}</span><span>WhatsApp</span>
        </button>

        <button class="share-btn" id="shareVbBtn" type="button">
          <span class="share-ico">${ICO.vb}</span><span>Viber</span>
        </button>

        <button class="share-btn" id="shareVkBtn" type="button">
          <span class="share-ico">${ICO.vk}</span><span>VK</span>
        </button>

        <button class="share-btn" id="shareOkBtn" type="button">
          <span class="share-ico">${ICO.ok}</span><span>OK</span>
        </button>

        <button class="share-btn" id="shareXBtn" type="button">
          <span class="share-ico">${ICO.x}</span><span>X</span>
        </button>

        <button class="share-btn" id="shareFbBtn" type="button">
          <span class="share-ico">${ICO.fb}</span><span>Facebook</span>
        </button>

        <button class="share-btn" id="shareLiBtn" type="button">
          <span class="share-ico">${ICO.li}</span><span>LinkedIn</span>
        </button>

        <button class="share-btn" id="shareRdBtn" type="button">
          <span class="share-ico">${ICO.rd}</span><span>Reddit</span>
        </button>

        <button class="share-btn" id="shareWbBtn" type="button">
          <span class="share-ico">${ICO.wb}</span><span>Weibo</span>
        </button>

        <button class="share-btn" id="shareMailBtn" type="button">
          <span class="share-ico">${ICO.mail}</span><span>Email</span>
        </button>

        <button class="share-btn share-btn--danger" id="shareCancelBtn" type="button">
          <span class="share-ico">${ICO.close}</span><span>Close</span>
        </button>
      </div>

      <div id="shareUrlBox">—</div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(modal);
  }

  function getShareData() {
    const url = window.location.href;
    const title = document.title || "IBITIcoin";
    const text = `IBITIcoin — ${title}`;
    return { url, title, text };
  }

  function openModal() {
    const overlay = document.getElementById("shareOverlay");
    const modal = document.getElementById("shareModal");
    const urlBox = document.getElementById("shareUrlBox");

    const { url } = getShareData();
    urlBox.textContent = url;

    overlay.classList.remove("hidden");
    modal.classList.remove("hidden");
  }

  function closeModal() {
    document.getElementById("shareOverlay")?.classList.add("hidden");
    document.getElementById("shareModal")?.classList.add("hidden");
  }

  function sharePopup(link) {
    window.open(link, "_blank", "noopener,noreferrer,width=900,height=650");
  }

  function initHandlers() {
    const openBtn = document.getElementById(OPEN_BTN_ID);
    if (!openBtn) return;

    openBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openModal();
    });

    // close handlers
    document.getElementById("shareOverlay").addEventListener("click", closeModal);
    document.getElementById("shareCancelBtn").addEventListener("click", closeModal);
    document.getElementById("shareTopClose").addEventListener("click", closeModal);
    window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

    // actions
    const { url, title, text } = getShareData();
    const u = encodeURIComponent(url);
    const t = encodeURIComponent(title);
    const tx = encodeURIComponent(text);

    document.getElementById("shareCopyBtn").addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
    });

    document.getElementById("shareTgBtn").addEventListener("click", () =>
      sharePopup(`https://t.me/share/url?url=${u}&text=${tx}`)
    );

    document.getElementById("shareWaBtn").addEventListener("click", () =>
      sharePopup(`https://api.whatsapp.com/send?text=${tx}%20${u}`)
    );

    document.getElementById("shareVbBtn").addEventListener("click", () =>
      sharePopup(`viber://forward?text=${tx}%20${url}`)
    );

    document.getElementById("shareVkBtn").addEventListener("click", () =>
      sharePopup(`https://vk.com/share.php?url=${u}&title=${t}`)
    );

    document.getElementById("shareOkBtn").addEventListener("click", () =>
      sharePopup(`https://connect.ok.ru/offer?url=${u}`)
    );

    document.getElementById("shareXBtn").addEventListener("click", () =>
      sharePopup(`https://twitter.com/intent/tweet?url=${u}&text=${tx}`)
    );

    document.getElementById("shareFbBtn").addEventListener("click", () =>
      sharePopup(`https://www.facebook.com/sharer/sharer.php?u=${u}`)
    );

    document.getElementById("shareLiBtn").addEventListener("click", () =>
      sharePopup(`https://www.linkedin.com/sharing/share-offsite/?url=${u}`)
    );

    document.getElementById("shareRdBtn").addEventListener("click", () =>
      sharePopup(`https://www.reddit.com/submit?url=${u}&title=${t}`)
    );

    document.getElementById("shareWbBtn").addEventListener("click", () =>
      sharePopup(`https://service.weibo.com/share/share.php?url=${u}&title=${t}`)
    );

    document.getElementById("shareMailBtn").addEventListener("click", () =>
      (window.location.href = `mailto:?subject=${t}&body=${tx}%0A%0A${u}`)
    );
  }

  // boot
  document.addEventListener("DOMContentLoaded", () => {
    injectStyleOnce();
    injectModalOnce();
    initHandlers();
  });
})();
