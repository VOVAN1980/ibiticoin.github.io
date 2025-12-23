(() => {
  // Только декабрь (0=янв ... 11=дек). Хочешь всегда — закомментируй 2 строки ниже
  const m = new Date().getMonth();
  if (m !== 11) return;

  // Если уже добавлено — не добавляем второй раз
  if (document.getElementById("xmasOverlay")) return;

  // --- Inject HTML overlay ---
  const overlay = document.createElement("div");
  overlay.id = "xmasOverlay";
  overlay.className = "xmas-overlay";
  overlay.setAttribute("aria-hidden", "true");

  overlay.innerHTML = `
    <canvas id="snowCanvas"></canvas>
  `;
  document.body.appendChild(overlay);

  // --- Inject minimal CSS (если у тебя уже есть в style.css — можно убрать этот блок) ---
  const css = document.createElement("style");
  css.textContent = `
    .xmas-overlay{
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 999; /* если надо выше/ниже — меняй */
    }
    #snowCanvas{
      width: 100%;
      height: 100%;
      display:block;
    }
  `;
  document.head.appendChild(css);

  // --- Snow ---
  const canvas = document.getElementById("snowCanvas");
  const ctx = canvas.getContext("2d", { alpha: true });

  let w = 0, h = 0, dpr = 1;
  const flakes = [];
  const FLAKE_COUNT = 120;

  function resizeSnow() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.floor(window.innerWidth);
    h = Math.floor(window.innerHeight);

    canvas.width  = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawnFlake(resetY = false) {
    return {
      x: Math.random() * w,
      y: resetY ? -20 - Math.random() * h : Math.random() * h,
      r: 1 + Math.random() * 2.6,
      vy: 0.8 + Math.random() * 1.6,
      vx: -0.5 + Math.random() * 1.0,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.01 + Math.random() * 0.02,
      opacity: 0.30 + Math.random() * 0.55
    };
  }

  function initSnow() {
    flakes.length = 0;
    for (let i = 0; i < FLAKE_COUNT; i++) flakes.push(spawnFlake(false));
  }

  let last = performance.now();
  function tick(now) {
    const dt = Math.min(33, now - last);
    last = now;

    ctx.clearRect(0, 0, w, h);

    for (const f of flakes) {
      f.wobble += f.wobbleSpeed * dt;
      f.x += (f.vx + Math.sin(f.wobble) * 0.25) * (dt / 16);
      f.y += f.vy * (dt / 16);

      if (f.y > h + 10 || f.x < -30 || f.x > w + 30) {
        Object.assign(f, spawnFlake(true));
      }

      ctx.globalAlpha = f.opacity;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    requestAnimationFrame(tick);
  }

  resizeSnow();
  initSnow();
  requestAnimationFrame(tick);
  window.addEventListener("resize", () => { resizeSnow(); initSnow(); }, { passive: true });
})();
