const BANNER_API = "https://shoptest-chi.vercel.app/api/banner-manage";

export async function initBanner(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  try {
    const res     = await fetch(BANNER_API);
    const banners = await res.json();

    if (!banners.length) {
      container.classList.add("hidden");
      return;
    }

    let current   = 0;
    let autoTimer = null;
    let startX    = 0;
    let isDragging = false;

    // ── HTML ──────────────────────────────────────────
    container.innerHTML = `
      <div style="position:relative;overflow:hidden;background:#111;user-select:none" id="bannerRoot">
        <div id="bannerTrack" style="display:flex;transition:transform 0.5s ease;will-change:transform">
          ${banners.map(b => `
            <div style="width:100%;flex-shrink:0;aspect-ratio:16/7;overflow:hidden;background:#000">
              <img src="${b.image}" alt="${b.title}"
                style="width:100%;height:100%;object-fit:contain;display:block"
                draggable="false">
            </div>`).join("")}
        </div>
        ${banners.length > 1 ? `
        <button id="bannerPrev"
          style="position:absolute;left:12px;top:50%;transform:translateY(-50%);width:36px;height:36px;background:rgba(0,0,0,0.4);color:#fff;border:none;border-radius:50%;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:10">‹</button>
        <button id="bannerNext"
          style="position:absolute;right:12px;top:50%;transform:translateY(-50%);width:36px;height:36px;background:rgba(0,0,0,0.4);color:#fff;border:none;border-radius:50%;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:10">›</button>
        <div id="bannerDots" style="position:absolute;bottom:10px;left:50%;transform:translateX(-50%);display:flex;gap:6px;z-index:10">
          ${banners.map((_, i) => `
            <button data-idx="${i}" class="dot"
              style="height:6px;border-radius:3px;border:none;cursor:pointer;transition:all 0.3s;background:${i===0?"#fff":"rgba(255,255,255,0.5)"};width:${i===0?"20px":"6px"}">
            </button>`).join("")}
        </div>` : ""}
      </div>`;

    const track = document.getElementById("bannerTrack");
    const dots  = document.querySelectorAll(".dot");

    // ── 切換 ─────────────────────────────────────────
    function goTo(idx) {
      current = (idx + banners.length) % banners.length;
      track.style.transform = `translateX(-${current * 100}%)`;
      dots.forEach((d, i) => {
        d.style.background = i === current ? "#fff" : "rgba(255,255,255,0.5)";
        d.style.width = i === current ? "20px" : "6px";
      });
    }

    // 箭頭
    document.getElementById("bannerPrev")?.addEventListener("click", () => {
      goTo(current - 1);
      resetAuto();
    });
    document.getElementById("bannerNext")?.addEventListener("click", () => {
      goTo(current + 1);
      resetAuto();
    });

    // 圓點
    dots.forEach(d => {
      d.addEventListener("click", () => {
        goTo(Number(d.dataset.idx));
        resetAuto();
      });
    });

    // ── 自動輪播 ─────────────────────────────────────
    function startAuto() {
      autoTimer = setInterval(() => goTo(current + 1), 4000);
    }
    function resetAuto() {
      clearInterval(autoTimer);
      startAuto();
    }
    if (banners.length > 1) startAuto();

    // ── 手指 / 滑鼠滑動 ──────────────────────────────
    const root = document.getElementById("bannerRoot");

    root.addEventListener("touchstart",  e => { startX = e.touches[0].clientX; }, { passive: true });
    root.addEventListener("touchend",    e => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) { goTo(current + (diff > 0 ? 1 : -1)); resetAuto(); }
    });

    root.addEventListener("mousedown",  e => { startX = e.clientX; isDragging = true; });
    root.addEventListener("mouseup",    e => {
      if (!isDragging) return;
      isDragging = false;
      const diff = startX - e.clientX;
      if (Math.abs(diff) > 40) { goTo(current + (diff > 0 ? 1 : -1)); resetAuto(); }
    });
    root.addEventListener("mouseleave", () => { isDragging = false; });

    // 滑鼠懸停暫停自動輪播
    root.addEventListener("mouseenter", () => clearInterval(autoTimer));
    root.addEventListener("mouseleave", () => { if (banners.length > 1) startAuto(); });

  } catch (err) {
    console.warn("Banner 載入失敗", err);
    container.classList.add("hidden");
  }
}
