const BANNER_API = "https://shop-project-azure.vercel.app/api/banner-manage";

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
      <div class="relative overflow-hidden bg-gray-100 select-none" id="bannerRoot">

        <!-- 圖片軌道 -->
        <div id="bannerTrack"
          class="flex transition-transform duration-500 ease-in-out"
          style="will-change: transform;">
          ${banners.map((b, i) => `
            <div class="w-full shrink-0" style="aspect-ratio: 16/7; overflow: hidden; background: #000;">
              <img src="${b.image}" alt="${b.title}"
                class="w-full h-full object-contain"
                style="display: block;"
                draggable="false">
            </div>`).join("")}
        </div>

        <!-- 左右箭頭（桌機顯示）-->
        ${banners.length > 1 ? `
        <button id="bannerPrev"
          class="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2
                 w-9 h-9 bg-black bg-opacity-30 hover:bg-opacity-60 text-white
                 rounded-full items-center justify-center transition z-10">‹</button>
        <button id="bannerNext"
          class="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2
                 w-9 h-9 bg-black bg-opacity-30 hover:bg-opacity-60 text-white
                 rounded-full items-center justify-center transition z-10">›</button>
        ` : ""}

        <!-- 圓點指示器 -->
        ${banners.length > 1 ? `
        <div id="bannerDots"
          class="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          ${banners.map((_, i) => `
            <button data-idx="${i}"
              class="dot w-1.5 h-1.5 rounded-full transition-all duration-300
                     ${i === 0 ? "bg-white w-4" : "bg-white bg-opacity-50"}">
            </button>`).join("")}
        </div>
        ` : ""}

      </div>`;

    const track = document.getElementById("bannerTrack");
    const dots  = document.querySelectorAll(".dot");

    // ── 切換 ─────────────────────────────────────────
    function goTo(idx) {
      current = (idx + banners.length) % banners.length;
      track.style.transform = `translateX(-${current * 100}%)`;
      dots.forEach((d, i) => {
        d.className = `dot rounded-full transition-all duration-300 h-1.5 ${
          i === current
            ? "bg-white w-4"
            : "bg-white bg-opacity-50 w-1.5"
        }`;
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
