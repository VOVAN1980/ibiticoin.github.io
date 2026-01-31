/* share-modal.js — Compact & Premium Version (IBITIcoin) */
(function () {
  const style = document.createElement("style");
  style.textContent = `
  .share-overlay {
    position: fixed;
    inset: 0;
    backdrop-filter: blur(10px);
    background: rgba(0,0,0,0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  }
  .share-modal {
    width: min(540px, 92%);
    border: 1px solid rgba(247,208,0,0.35);
    border-radius: 14px;
    background: rgba(0,0,0,0.85);
    box-shadow: 0 0 30px rgba(255,215,0,0.12);
    color: #fff;
    font-family: Orbitron, system-ui, sans-serif;
    text-align: center;
    padding: 16px 20px 22px;
    position: relative;
  }
  .share-modal h3 {
    color: #f7d000;
    font-size: 18px;
    font-weight: 800;
    margin: 0 0 8px;
  }
  .share-modal p {
    font-size: 12px;
    color: rgba(255,255,255,0.65);
    margin: 0 0 16px;
  }
  .share-buttons {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
  }
  .share-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background: rgba(255,215,0,0.12);
    border: 1px solid rgba(255,215,0,0.2);
    color: #fff;
    border-radius: 8px;
    padding: 7px 10px;
    font-size: 13px;
    min-width: 108px;
    cursor: pointer;
    transition: 0.15s;
  }
  .share-btn:hover {
    background: rgba(255,215,0,0.25);
    transform: translateY(-1px);
  }
  .share-modal a {
    text-decoration: none;
  }
  .share-url {
    margin-top: 14px;
    border: 1px solid rgba(255,215,0,0.25);
    background: rgba(0,0,0,0.55);
    border-radius: 8px;
    padding: 6px 10px;
    font-size: 11px;
    color: #f7d000;
    word-break: break-all;
  }
  .share-close {
    position: absolute;
    top: 8px;
    right: 10px;
    background: none;
    border: none;
    color: #f7d000;
    font-size: 13px;
    cursor: pointer;
    padding: 4px 8px;
  }`;
  document.head.appendChild(style);

  const shareData = [
    { id: "copy", name: "Copy", icon: "📋", action: "copy" },
    { id: "telegram", name: "Telegram", icon: "📨", url: "https://t.me/share/url?url={url}" },

    // Discord = join link (no {url})
    { id: "discord", name: "Discord", icon: "💠", url: "https://discord.gg/cHbDXnUKMQ" },

    { id: "whatsapp", name: "WhatsApp", icon: "💬", url: "https://api.whatsapp.com/send?text={url}" },
    { id: "viber", name: "Viber", icon: "📱", url: "viber://forward?text={url}" },
    { id: "vk", name: "VK", icon: "🟦", url: "https://vk.com/share.php?url={url}" },
    { id: "ok", name: "OK", icon: "🟠", url: "https://connect.ok.ru/offer?url={url}" },
    { id: "x", name: "X", icon: "❌", url: "https://twitter.com/intent/tweet?url={url}" },
    { id: "facebook", name: "Facebook", icon: "📘", url: "https://www.facebook.com/sharer/sharer.php?u={url}" },
    { id: "linkedin", name: "LinkedIn", icon: "💼", url: "https://www.linkedin.com/shareArticle?url={url}" },
    { id: "reddit", name: "Reddit", icon: "👽", url: "https://reddit.com/submit?url={url}" },
    { id: "weibo", name: "Weibo", icon: "🈶", url: "http://service.weibo.com/share/share.php?url={url}" },
    { id: "email", name: "Email", icon: "✉️", url: "mailto:?body={url}" }
  ];

  function openShareModal() {
    const overlay = document.createElement("div");
    overlay.className = "share-overlay";

    const modal = document.createElement("div");
    modal.className = "share-modal";
    modal.innerHTML = `
      <button class="share-close">Close</button>
      <h3>Share IBITIcoin</h3>
      <p>Choose where to share the link.</p>
      <div class="share-buttons"></div>
      <div class="share-url">${location.href}</div>
    `;

    const btns = modal.querySelector(".share-buttons");
    shareData.forEach(s => {
      const b = document.createElement("button");
      b.className = "share-btn";
      b.innerHTML = `${s.icon} ${s.name}`;
      b.addEventListener("click", async () => {
        if (s.action === "copy") {
          await navigator.clipboard.writeText(location.href);
          b.textContent = "✅ Copied!";
          setTimeout(() => (b.innerHTML = `${s.icon} ${s.name}`), 1000);
          return;
        }

        const targetUrl = s.url.includes("{url}")
          ? s.url.replace("{url}", encodeURIComponent(location.href))
          : s.url;

        window.open(targetUrl, "_blank");
      });
      btns.appendChild(b);
    });

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    modal.querySelector(".share-close").onclick = () => overlay.remove();
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
  }

  const triggers = ["#openShareModal", ".share-btn", "a[href='#share']"];
  triggers.forEach(sel => {
    const el = document.querySelector(sel);
    if (el) {
      el.addEventListener("click", e => {
        e.preventDefault();
        openShareModal();
      }, true);
    }
  });
})();
