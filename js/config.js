/* IBITIcoin site config (classic script, no imports) */
(function () {
  "use strict";

  const PROD_HOSTS = new Set(["ibiticoin.com", "www.ibiticoin.com"]);
  const LS_KEY = "ibiti_net";

  const NETWORKS = {
    mainnet: {
      key: "mainnet",
      chainIdDec: 56,
      chainIdHex: "0x38",
      chainName: "BNB Smart Chain",
      rpcUrls: ["https://bsc-dataseed.binance.org/"],
      reownProjectId: "95f126f3a088cebcf781d2a1c10711fc",
      blockExplorerUrls: ["https://bscscan.com"],
      nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },

      ibiti: "0x71b552D3503fe20610aaA470A96E1838fae8381A",
      usdt:  "0x55d398326f99059fF775485246999027B3197955",
      pancakeRouter: "0x10ED43C718714eb63d5aA57B78B54704E256024E",
      promoRouter: "0x42924EE213eF1943BE655c2C535FB72F52C64781",
      staking: "0x82BA8720FBa8a6A939D078b9ed62afB9ABC3B426",
      nftSale: "0x44E65077168De8Ff5EC6545857DAd2cB02310fe2",
      slippageBps: 300
    },

    testnet: {
      key: "testnet",
      chainIdDec: 97,
      chainIdHex: "0x61",
      chainName: "BNB Smart Chain Testnet",
      rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545/"],
      reownProjectId: "95f126f3a088cebcf781d2a1c10711fc",
      blockExplorerUrls: ["https://testnet.bscscan.com"],
      nativeCurrency: { name: "tBNB", symbol: "tBNB", decimals: 18 },

      usdt:  "0xe4221B295012D583347d400BA28f5783d61c7E13",
      ibiti: "0x4D641C74529B39e3C4Cc996B5b5be47A0B61dD0C",
      pancakeRouter: "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3",
      promoRouter:   "0x5143E30336F5c04214BeFeFB44398839344b0B01",
      staking: "0x835aa5a8ddD01E619db2Bd2E751755867aeb87fE",
      nftSale: "0xD0d12Ef7CF15015322D2DEAf99114d3E0684dc4A",
      slippageBps: 300
    }
  };

  function getQueryParam(name) {
    return new URL(window.location.href).searchParams.get(name);
  }

  function normalizeMode(v) {
    const q = String(v || "").toLowerCase().trim();
    if (q === "testnet" || q === "t" || q === "97") return "testnet";
    if (q === "mainnet" || q === "m" || q === "56") return "mainnet";
    return null;
  }

  function isProdHost() {
    return PROD_HOSTS.has(String(location.hostname || "").toLowerCase());
  }

  // ✅ идеальная логика для прода:
  // - URL ?net=... всегда имеет приоритет
  // - на prod без ?net=... всегда mainnet (игнорируем localStorage, чтобы никто не “залипал” в testnet)
  // - на dev можно “запоминать” localStorage
  function detectMode() {
    const fromUrl = normalizeMode(getQueryParam("net"));
    if (fromUrl) return fromUrl;

    if (isProdHost()) return "mainnet";

    let saved = null;
    try { saved = normalizeMode(localStorage.getItem(LS_KEY)); } catch (_) {}
    if (saved) return saved;

    return "mainnet";
  }

  // setMode сохраняем для dev/ручного переключения,
  // на prod оно не влияет без ?net=... (и это хорошо)
  function setMode(mode) {
    const m = normalizeMode(mode);
    if (!m) return;
    try { localStorage.setItem(LS_KEY, m); } catch (_) {}
  }

  function getNet() {
    return NETWORKS[detectMode()] || NETWORKS.mainnet;
  }

  // опционально: удобный хелпер для тестов (не обязателен)
  function clearSavedMode() {
    try { localStorage.removeItem(LS_KEY); } catch (_) {}
  }

  window.IBITI_CONFIG = {
    NETWORKS,
    detectMode,
    setMode,
    getNet,
    clearSavedMode
  };
})();

/* Wallet choice, as on most dApps, with no third-party service.
   Computer: the wallets installed in this browser (each announces itself by EIP-6963); the choice is remembered.
   Phone without a wallet: links that open this page inside a wallet app. */
(function () {
  "use strict";

  const WALLET_KEY = "ibiti_wallet";
  const isMobile = /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent || "");
  const announced = [];
  let chosen = null;

  window.addEventListener("eip6963:announceProvider", (e) => {
    const d = e && e.detail;
    if (!d || !d.provider || !d.info) return;
    if (announced.some((x) => x.info.uuid === d.info.uuid)) return;
    announced.push(d);
  });
  window.dispatchEvent(new Event("eip6963:requestProvider"));

  const walletId = (d) => d.info.rdns || d.info.name;

  function savedWallet() {
    let id = null;
    try { id = localStorage.getItem(WALLET_KEY); } catch (_) {}
    return id ? announced.find((d) => walletId(d) === id) || null : null;
  }

  window.ibitiWallet = function () {
    if (chosen) return chosen.provider;
    const saved = savedWallet();
    if (saved) return saved.provider;
    if (announced.length === 1) return announced[0].provider;
    return window.ethereum || (announced[0] && announced[0].provider) || null;
  };

  function appLinks(url) {
    const bare = url.replace(/^https?:\/\//i, "");
    return [
      { name: "MetaMask", badge: "MM", color: "#f6851b", href: "https://link.metamask.io/dapp/" + encodeURIComponent(bare).replace(/%2F/gi, "/") },
      { name: "Trust Wallet", badge: "TW", color: "#3375bb", href: "https://link.trustwallet.com/open_url?coin_id=60&url=" + encodeURIComponent(url) },
      { name: "OKX Wallet", badge: "OKX", color: "#000000", href: "https://web3.okx.com/download?deeplink=" + encodeURIComponent("okx://wallet/dapp/url?dappUrl=" + encodeURIComponent(url)) },
      { name: "Bitget Wallet", badge: "BG", color: "#00a3b4", href: "https://bkcode.vip?action=dapp&url=" + encodeURIComponent(url) },
      { name: "Coinbase Wallet", badge: "CB", color: "#0052ff", href: "https://go.cb-w.com/dapp?cb_url=" + encodeURIComponent(url) },
      { name: "Binance Wallet", badge: "BN", color: "#f0b90b", copy: url, hint: "Link copied. In the Binance app open Web3 Wallet \u2192 DApps and paste it." },
      { name: "Other wallet", badge: "+", color: "#444444", copy: url, hint: "Link copied. Open the browser inside your wallet app and paste it." }
    ];
  }

  const INSTALL = [
    { name: "MetaMask", badge: "MM", color: "#f6851b", href: "https://metamask.io/download/" },
    { name: "Trust Wallet", badge: "TW", color: "#3375bb", href: "https://trustwallet.com/download" },
    { name: "OKX Wallet", badge: "OKX", color: "#000000", href: "https://web3.okx.com/download" },
    { name: "Bitget Wallet", badge: "BG", color: "#00a3b4", href: "https://web3.bitget.com/en/wallet-download" },
    { name: "Coinbase Wallet", badge: "CB", color: "#0052ff", href: "https://www.coinbase.com/wallet/downloads" },
    { name: "Binance Wallet", badge: "BN", color: "#f0b90b", href: "https://www.binance.com/en/web3wallet" }
  ];

  const CSS = [
    ".ibw-overlay{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.72);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);animation:ibw-fade .16s ease-out}",
    ".ibw-card{position:relative;width:100%;max-width:380px;max-height:88vh;overflow:auto;box-sizing:border-box;padding:22px 20px 18px;border-radius:20px;background:linear-gradient(180deg,#1a1608 0%,#0e0e0e 55%);border:1px solid rgba(247,208,0,.35);box-shadow:0 24px 70px rgba(0,0,0,.65),0 0 40px rgba(247,208,0,.12);color:#fff;font-family:inherit;text-align:left;animation:ibw-pop .18s ease-out}",
    ".ibw-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:16px}",
    ".ibw-title{margin:0;font-size:19px;font-weight:700;line-height:1.3;color:#f7d000}",
    ".ibw-sub{margin:4px 0 0;font-size:13px;line-height:1.45;color:#a8a8a8}",
    ".ibw-close{flex:none;width:32px;height:32px;padding:0;border-radius:50%;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:#ccc;font-size:18px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s,color .15s}",
    ".ibw-close:hover,.ibw-close:focus-visible{background:rgba(247,208,0,.12);color:#f7d000;outline:none}",
    ".ibw-list{display:flex;flex-direction:column;gap:8px}",
    ".ibw-item{display:flex;align-items:center;gap:12px;width:100%;box-sizing:border-box;min-height:56px;margin:0;padding:10px 14px;border-radius:14px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.035);color:#fff;font:inherit;font-size:15px;font-weight:600;text-align:left;text-decoration:none;cursor:pointer;transition:border-color .15s,background .15s,transform .15s}",
    ".ibw-item:hover,.ibw-item:focus-visible{border-color:rgba(247,208,0,.7);background:rgba(247,208,0,.07);outline:none;transform:translateY(-1px)}",
    ".ibw-icon{flex:none;width:34px;height:34px;border-radius:10px;object-fit:cover;background:#222}",
    ".ibw-badge{flex:none;width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#fff;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}",
    ".ibw-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    ".ibw-tag{flex:none;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:700;color:#111;background:#f7d000}",
    ".ibw-arrow{flex:none;color:#777;font-size:22px;line-height:1}",
    ".ibw-hint{margin:0 4px 4px;font-size:12.5px;line-height:1.45;color:#f7d000}",
    ".ibw-foot{margin:16px 4px 0;font-size:12px;line-height:1.5;color:#8a8a8a;text-align:center}",
    "@keyframes ibw-fade{from{opacity:0}to{opacity:1}}",
    "@keyframes ibw-pop{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}",
    "@keyframes ibw-up{from{transform:translateY(100%)}to{transform:none}}",
    "@media (max-width:520px){.ibw-overlay{align-items:flex-end;padding:0}.ibw-card{max-width:none;max-height:85vh;border-radius:20px 20px 0 0;padding-bottom:calc(18px + env(safe-area-inset-bottom));animation-name:ibw-up}}",
    "@media (prefers-reduced-motion:reduce){.ibw-overlay,.ibw-card{animation:none}.ibw-item{transition:none}}"
  ].join("\n");

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return; } catch (_) {}
    const ta = el("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (_) {}
    ta.remove();
  }

  // Resolves to the chosen wallet, or null when the window is closed.
  function openList(opts) {
    if (!document.getElementById("ibw-style")) {
      const st = el("style", null, CSS);
      st.id = "ibw-style";
      document.head.appendChild(st);
    }
    return new Promise((resolve) => {
      const back = document.activeElement;
      const overlay = el("div", "ibw-overlay");
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");
      overlay.setAttribute("aria-labelledby", "ibw-title");
      const card = el("div", "ibw-card");
      const head = el("div", "ibw-head");
      const text = el("div");
      const title = el("h2", "ibw-title", opts.title);
      title.id = "ibw-title";
      text.append(title);
      if (opts.sub) text.append(el("p", "ibw-sub", opts.sub));
      const close = el("button", "ibw-close", "\u00d7");
      close.type = "button";
      close.setAttribute("aria-label", "Close");
      head.append(text, close);
      const list = el("div", "ibw-list");

      const onKey = (e) => { if (e.key === "Escape") done(null); };
      function done(provider) {
        document.removeEventListener("keydown", onKey);
        overlay.remove();
        if (back && back.focus) try { back.focus(); } catch (_) {}
        resolve(provider);
      }

      opts.items.forEach((it) => {
        const row = el(it.href ? "a" : "button", "ibw-item");
        if (it.href) {
          row.href = it.href;
          row.rel = "noopener noreferrer";
          if (it.newTab) row.target = "_blank";
        } else {
          row.type = "button";
        }
        if (it.icon) {
          const img = el("img", "ibw-icon");
          img.src = it.icon;
          img.alt = "";
          row.append(img);
        } else {
          const b = el("span", "ibw-badge", it.badge || "");
          b.style.background = it.color || "#333";
          row.append(b);
        }
        row.append(el("span", "ibw-name", it.name));
        row.append(it.tag ? el("span", "ibw-tag", it.tag) : el("span", "ibw-arrow", "\u203a"));
        row.addEventListener("click", async () => {
          if (it.provider) return done(it.provider);
          if (it.copy) {
            await copyText(it.copy);
            if (!row.nextSibling || !row.nextSibling.classList || !row.nextSibling.classList.contains("ibw-hint")) {
              row.after(el("p", "ibw-hint", it.hint));
            }
            return;
          }
          setTimeout(() => done(null), 300);
        });
        list.append(row);
      });

      card.append(head, list);
      if (opts.foot) card.append(el("p", "ibw-foot", opts.foot));
      close.addEventListener("click", () => done(null));
      overlay.addEventListener("click", (e) => { if (e.target === overlay) done(null); });
      document.addEventListener("keydown", onKey);
      overlay.append(card);
      document.body.append(overlay);
      const first = list.querySelector(".ibw-item");
      if (first) first.focus();
    });
  }

  // Before connecting: lets the visitor pick a wallet. Resolves to its provider, or null if nothing was picked.
  window.ibitiChooseWallet = function () {
    if (!announced.length && window.ethereum) return Promise.resolve(window.ethereum);
    if (isMobile && announced.length === 1) return Promise.resolve(announced[0].provider);

    if (announced.length) {
      const last = chosen || savedWallet();
      return openList({
        title: "Connect a wallet",
        sub: "Choose a wallet installed in this browser.",
        items: announced.map((d) => ({
          name: String(d.info.name || d.info.rdns || "Wallet"),
          icon: /^data:image\//.test(String(d.info.icon || "")) ? d.info.icon : null,
          badge: String(d.info.name || "W").slice(0, 2).toUpperCase(),
          tag: d === last ? "Last used" : "",
          provider: d.provider
        })),
        foot: "Don't see your wallet? Turn on its browser extension and reload the page."
      }).then((provider) => {
        const d = provider && announced.find((x) => x.provider === provider);
        if (d) {
          chosen = d;
          try { localStorage.setItem(WALLET_KEY, walletId(d)); } catch (_) {}
        }
        return provider;
      });
    }

    if (isMobile) {
      return openList({
        title: "Open in a wallet app",
        sub: "This page opens inside the wallet app. Connect there.",
        items: appLinks(location.href)
      });
    }

    return openList({
      title: "No wallet found",
      sub: "Install a wallet extension for your browser, then reload this page.",
      items: INSTALL.map((it) => Object.assign({ newTab: true }, it))
    });
  };
})();
