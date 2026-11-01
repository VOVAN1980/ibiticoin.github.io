/* IBITI staking page (classic script, uses ethers UMD and js/config.js) */
(function () {
  "use strict";

  const DECIMALS = 8;
  const LADDER = [1, 3, 5, 7, 10, 12, 14, 18, 20, 22, 25, 30];
  const NFT_MONTHS = [3, 6, 9, 12];
  const Status = { Closed: 0, Locked: 1, Claimable: 2, Expired: 3 };

  const STAKING_ABI = [
    "function paused() view returns (bool)",
    "function token() view returns (address)",
    "function nft() view returns (address)",
    "function minStake() view returns (uint256)",
    "function freeRewards() view returns (uint256)",
    "function stakeOf(address) view returns (uint256)",
    "function stakeCount(address) view returns (uint256)",
    "function stakeInfo(address, uint256) view returns (tuple(uint256 amount, uint256 reward, uint64 start, uint8 months))",
    "function maturityOf(address, uint256) view returns (uint256)",
    "function quoteUnstake(address, uint256) view returns (uint256 payout, uint256 reward, uint256 penalty, uint8 status)",
    "function CLAIM_WINDOW() view returns (uint256)",
    "function stake(uint256 amount, uint256 months) returns (uint256)",
    "function unstake(uint256 id)",
    "function renew(uint256 id, uint256 newAmount, uint256 months) returns (uint256)",
    "error BelowMinStake(uint256 amount, uint256 minStake)",
    "error RewardPoolExhausted(uint256 needed, uint256 available)",
    "error BadMonths(uint256 months)",
    "error BadStakeId(uint256 id)",
    "error StakeClosed(uint256 id)",
    "error StakeStillLocked(uint256 id)",
  ];
  const ERC20_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address, address) view returns (uint256)",
    "function approve(address, uint256) returns (bool)",
  ];

  const ERROR_TEXT = {
    BelowMinStake: "The amount is below the minimum stake.",
    RewardPoolExhausted: "The reward pool cannot cover this stake right now. Try a smaller amount or a shorter term.",
    BadMonths: "Choose a term from 1 to 12 months.",
    StakeClosed: "This stake has already been withdrawn.",
    StakeStillLocked: "The term is not over yet, so this stake cannot be renewed.",
  };

  const $ = (id) => document.getElementById(id);
  const isAddr = (a) => typeof a === "string" && /^0x[a-fA-F0-9]{40}$/.test(a);
  const fmt = (x) => `${ethers.formatUnits(x, DECIMALS).replace(/\.0$/, "")} IBITI`;
  const date = (ts) => new Date(Number(ts) * 1000).toLocaleString();
  const percent = (months) => LADDER[months - 1];
  const nftText = (months) => (NFT_MONTHS.includes(months) ? "2 bonus NFTs" : "");

  const net = window.IBITI_CONFIG.getNet();
  const stakingAddress = net.staking;
  let read = null;
  let write = null;
  let token = null;
  let account = null;
  let minStake = 0n;
  let freeRewards = 0n;
  let paused = true;
  let windowSeconds = 0n;
  let nftBound = false;

  function notice(html) {
    const el = $("stakingNotice");
    el.innerHTML = html;
    el.hidden = !html;
  }

  function friendlyError(e) {
    if (e && (e.code === "ACTION_REJECTED" || e.code === 4001)) return "Cancelled in your wallet.";
    let name = e && e.revert && e.revert.name;
    if (!name && read) {
      try {
        const data = (e && e.data) || (e && e.info && e.info.error && e.info.error.data);
        const parsed = data && read.interface.parseError(typeof data === "string" ? data : data.data);
        name = parsed && parsed.name;
      } catch (_) {}
    }
    if (name && ERROR_TEXT[name]) return ERROR_TEXT[name];
    return (e && (e.shortMessage || e.message)) || "Transaction failed.";
  }

  const showError = (e) => {
    console.error(e);
    return Swal.fire({ icon: "error", title: "Not completed", text: friendlyError(e) });
  };

  const confirmAction = (title, html, icon = "question") =>
    Swal.fire({ icon, title, html, showCancelButton: true, confirmButtonText: "Confirm", cancelButtonText: "Cancel" })
      .then((r) => r.isConfirmed);

  const busy = (title) =>
    Swal.fire({ title, text: "Confirm in your wallet and wait for the network.", allowOutsideClick: false, showConfirmButton: false, didOpen: () => Swal.showLoading() });

  // ===== Wallet =====

  async function ensureChain() {
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    if (chainId && chainId.toLowerCase() === net.chainIdHex.toLowerCase()) return;
    try {
      await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: net.chainIdHex }] });
    } catch (e) {
      if (!(e && (e.code === 4902 || String(e.message || "").includes("4902")))) throw e;
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: net.chainIdHex,
          chainName: net.chainName,
          rpcUrls: net.rpcUrls,
          nativeCurrency: net.nativeCurrency,
          blockExplorerUrls: net.blockExplorerUrls,
        }],
      });
    }
  }

  async function connectWallet() {
    if (!window.ethereum) {
      if (/android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent || "")) {
        const u = new URL("/wallet.html", location.origin);
        u.searchParams.set("redirect", location.href);
        location.href = u.toString();
        return;
      }
      Swal.fire({ icon: "info", title: "No wallet found", text: "Install MetaMask or Trust Wallet, or open this page in the wallet's browser." });
      return;
    }
    await ensureChain();
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    if (!accounts || !accounts[0]) throw new Error("No account returned by the wallet.");
    const signer = await new ethers.BrowserProvider(window.ethereum).getSigner();
    account = await signer.getAddress();
    write = new ethers.Contract(stakingAddress, STAKING_ABI, signer);
    token = new ethers.Contract(net.ibiti, ERC20_ABI, signer);
    $("walletAddress").textContent = account;
    $("connectWalletBtn").textContent = "✅ Wallet connected";
    $("myStakes").hidden = false;
    await refresh();
  }

  // Разрешение только на точную сумму и только когда не хватает
  async function ensureAllowance(amount) {
    if ((await token.allowance(account, stakingAddress)) >= amount) return;
    await (await token.approve(stakingAddress, amount)).wait();
  }

  // ===== Reading =====

  async function refresh() {
    [paused, minStake, freeRewards] = await Promise.all([read.paused(), read.minStake(), read.freeRewards()]);
    $("poolFree").textContent = fmt(freeRewards);
    $("minStake").textContent = fmt(minStake);
    notice(paused ? "<b>New stakes and renewals are paused.</b> If you have a stake, you can still withdraw it." : "");
    if (account) {
      const [balance, staked] = await Promise.all([
        new ethers.Contract(net.ibiti, ERC20_ABI, read.runner).balanceOf(account),
        read.stakeOf(account),
      ]);
      $("ibitiBalance").textContent = fmt(balance);
      $("stakedTotal").textContent = fmt(staked);
      await renderStakes();
    }
    updateStakeForm();
  }

  function parseAmount(value) {
    try {
      return value ? ethers.parseUnits(String(value), DECIMALS) : 0n;
    } catch (_) {
      return 0n;
    }
  }

  function updateStakeForm() {
    const amount = parseAmount($("stakeAmount").value);
    const months = Number($("stakeDuration").value);
    const ready = amount > 0n && months >= 1;
    $("stakePreview").hidden = !ready;
    if (ready) {
      const delta = (amount * BigInt(percent(months))) / 100n;
      const nft = nftText(months);
      $("previewOnTime").textContent = fmt(amount + delta) + (nft ? ` + ${nft}` : "");
      $("previewEarly").textContent = fmt(amount - delta);
    }
    $("stakeBtn").disabled = !isAddr(stakingAddress) || paused || !account || !ready;
  }

  // ===== Your stakes =====

  function card(id, s, quote, maturity) {
    const status = Number(quote.status);
    const months = Number(s.months);
    const windowEnd = maturity + windowSeconds;
    const label = { [Status.Locked]: ["In progress", "locked"], [Status.Claimable]: ["Ready to claim", "claimable"], [Status.Expired]: ["Reward lost", "expired"] }[status];
    const nft = nftText(months);

    let note = "";
    let button = "Withdraw";
    if (status === Status.Locked) {
      const days = Math.ceil((Number(maturity) - Date.now() / 1000) / 86400);
      note = `${days > 0 ? days : 0} day(s) left. Withdrawing now costs ${fmt(quote.penalty)} and you get no reward.`;
      button = "Withdraw early";
    } else if (status === Status.Claimable) {
      note = `Take your reward${nft ? " and NFT" : ""} or renew before ${date(windowEnd)}.`;
      if (nft && !nftBound) note += " The NFT contract is not connected yet: if you withdraw or renew now, you get the tokens but not the NFT.";
    } else {
      note = "The 30 days have passed, so the reward and NFT are lost. Your stake stays yours with no time limit.";
    }

    const options = LADDER.map((_, i) => `<option value="${i + 1}"${i + 1 === months ? " selected" : ""}>${i + 1} month${i ? "s" : ""}</option>`).join("");
    const renewable = status !== Status.Locked;
    return `
      <div class="staking-box" data-id="${id}">
        <div class="line"><span>Stake #${id + 1}</span><span class="badge ${label[1]}">${label[0]}</span></div>
        <div class="line"><span>Amount</span><b>${fmt(s.amount)}</b></div>
        <div class="line"><span>Term</span><b>${months} month${months > 1 ? "s" : ""} (${percent(months)}%)</b></div>
        <div class="line"><span>Started</span><b>${date(s.start)}</b></div>
        <div class="line"><span>Term ends</span><b>${date(maturity)}</b></div>
        <div class="line"><span>Withdraw now</span><b>${fmt(quote.payout)}${status === Status.Claimable && nft ? ` + ${nft}` : ""}</b></div>
        <p class="card-note">${note}</p>
        <button class="${status === Status.Locked ? "btn-outline" : "btn-gold"}" data-action="unstake">${button}</button>
        ${renewable ? `
          <input type="number" min="0" step="any" data-role="renew-amount" value="${ethers.formatUnits(quote.payout, DECIMALS)}" placeholder="New amount of IBITI" />
          <select data-role="renew-months">${options}</select>
          <button class="btn-outline" data-action="renew"${paused ? " disabled" : ""}>🔁 Renew</button>` : ""}
      </div>`;
  }

  async function renderStakes() {
    const count = Number(await read.stakeCount(account));
    const items = [];
    for (let id = count - 1; id >= 0; id--) {
      const quote = await read.quoteUnstake(account, id);
      if (Number(quote.status) === Status.Closed) continue;
      const [s, maturity] = await Promise.all([read.stakeInfo(account, id), read.maturityOf(account, id)]);
      items.push(card(id, s, quote, maturity));
    }
    $("stakeList").innerHTML = items.join("") || '<p class="empty">You have no active stakes.</p>';
  }

  // ===== Actions =====

  async function onStake(e) {
    e.preventDefault();
    const amount = parseAmount($("stakeAmount").value);
    const months = Number($("stakeDuration").value);
    if (amount < minStake) return Swal.fire({ icon: "warning", title: "Amount too small", text: `The minimum stake is ${fmt(minStake)}.` });
    const reward = (amount * BigInt(percent(months))) / 100n;
    if (reward > freeRewards) return showError({ revert: { name: "RewardPoolExhausted" } });
    const nft = nftText(months);
    const ok = await confirmAction("Stake IBITI?", `
      Stake <b>${fmt(amount)}</b> for <b>${months} month${months > 1 ? "s" : ""}</b>.<br><br>
      On time you receive <b>${fmt(amount + reward)}</b>${nft ? ` + <b>${nft}</b>` : ""}.<br>
      Early exit: you receive <b>${fmt(amount - reward)}</b>, no reward and no NFT.<br><br>
      Claim within 30 days after the term, or the reward and NFT are lost.`);
    if (!ok) return;
    try {
      busy("Staking…");
      await ensureAllowance(amount);
      await (await write.stake(amount, months)).wait();
      $("stakeAmount").value = "";
      await refresh();
      Swal.fire({ icon: "success", title: "Staked" });
    } catch (err) {
      await showError(err);
      await refresh();
    }
  }

  async function onUnstake(id) {
    const q = await read.quoteUnstake(account, id);
    const status = Number(q.status);
    const text = status === Status.Locked
      ? `<b>This is an early exit.</b><br><br>You receive <b>${fmt(q.payout)}</b>. The penalty is <b>${fmt(q.penalty)}</b>, and you get no reward and no NFT.`
      : `You receive <b>${fmt(q.payout)}</b>.`;
    if (!(await confirmAction("Withdraw?", text, status === Status.Locked ? "warning" : "question"))) return;
    try {
      busy("Withdrawing…");
      await (await write.unstake(id)).wait();
      await refresh();
      Swal.fire({ icon: "success", title: "Withdrawn" });
    } catch (err) {
      await showError(err);
      await refresh();
    }
  }

  async function onRenew(id, box) {
    const amount = parseAmount(box.querySelector('[data-role="renew-amount"]').value);
    const months = Number(box.querySelector('[data-role="renew-months"]').value);
    if (amount < minStake) return Swal.fire({ icon: "warning", title: "Amount too small", text: `The minimum stake is ${fmt(minStake)}.` });
    const q = await read.quoteUnstake(account, id);
    const available = q.payout;
    const reward = (amount * BigInt(percent(months))) / 100n;
    const topUp = amount > available ? amount - available : 0n;
    const refund = available > amount ? available - amount : 0n;
    const change = topUp ? `You add <b>${fmt(topUp)}</b> from your wallet.<br>` : refund ? `<b>${fmt(refund)}</b> goes back to your wallet.<br>` : "";
    const nft = nftText(months);
    const ok = await confirmAction("Renew?", `
      New stake: <b>${fmt(amount)}</b> for <b>${months} month${months > 1 ? "s" : ""}</b>.<br>${change}<br>
      On time you receive <b>${fmt(amount + reward)}</b>${nft ? ` + <b>${nft}</b>` : ""}.`);
    if (!ok) return;
    try {
      busy("Renewing…");
      if (topUp) await ensureAllowance(topUp);
      await (await write.renew(id, amount, months)).wait();
      await refresh();
      Swal.fire({ icon: "success", title: "Renewed" });
    } catch (err) {
      await showError(err);
      await refresh();
    }
  }

  // ===== Start =====

  async function init() {
    $("connectWalletBtn").disabled = true;
    if (!isAddr(stakingAddress)) {
      notice("<b>Staking is not open yet.</b> It starts once the contract is deployed. Follow announcements on the official website and channels only.");
      return;
    }
    const rp = new ethers.JsonRpcProvider(net.rpcUrls[0]);
    read = new ethers.Contract(stakingAddress, STAKING_ABI, rp);
    [windowSeconds, nftBound] = await Promise.all([
      read.CLAIM_WINDOW(),
      read.nft().then((a) => a !== ethers.ZeroAddress),
    ]);
    await refresh();
    $("connectWalletBtn").disabled = false;

    $("connectWalletBtn").addEventListener("click", () => connectWallet().catch(showError));
    $("stakeForm").addEventListener("submit", onStake);
    $("stakeAmount").addEventListener("input", updateStakeForm);
    $("stakeDuration").addEventListener("change", updateStakeForm);
    $("stakeList").addEventListener("click", (e) => {
      const action = e.target && e.target.dataset && e.target.dataset.action;
      if (!action) return;
      const box = e.target.closest("[data-id]");
      const id = Number(box.dataset.id);
      (action === "unstake" ? onUnstake(id) : onRenew(id, box)).catch(showError);
    });
    if (window.ethereum && window.ethereum.on) {
      window.ethereum.on("accountsChanged", () => location.reload());
      window.ethereum.on("chainChanged", () => location.reload());
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    init().catch((e) => {
      console.error(e);
      notice("<b>Could not load staking data.</b> Check your connection and reload the page.");
    });
  });
})();
