import { formatPrice } from "./utils.js";

const API_URL = "https://shoptest-chi.vercel.app/api/products";

const id = new URLSearchParams(location.search).get("id");
const el = document.getElementById("product");

async function init() {
  try {
    const res = await fetch(API_URL, { cache: "no-store" });
    const data = await res.json();

    // 與首頁相同排序：大分類 Tab 順序 → 各自 sort
    const mainOrder = [];
    data.forEach(p => {
      if (p.mainCategory && !mainOrder.includes(p.mainCategory))
        mainOrder.push(p.mainCategory);
    });
    data.sort((a, b) => {
      const mi = mainOrder.indexOf(a.mainCategory ?? "");
      const mj = mainOrder.indexOf(b.mainCategory ?? "");
      if (mi !== mj) return mi - mj;
      const sa = a.sort || 9999;
      const sb = b.sort || 9999;
      if (sa !== sb) return sa - sb;
      return new Date(b.update || b.createdTime) - new Date(a.update || a.createdTime);
    });

    const idx = data.findIndex(x => x.id === id);
    const p = data[idx];

    if (!p) {
      el.innerHTML = "<p class='text-red-500 p-4'>找不到商品</p>";
      return;
    }

    // ⭐ 上一個 / 下一個
    const prevProduct = idx > 0 ? data[idx - 1] : null;
    const nextProduct = idx < data.length - 1 ? data[idx + 1] : null;

    const truncate = (str, n) => str.length > n ? str.slice(0, n) + "…" : str;

    const prevBtn = prevProduct
      ? `<a href="product.html?id=${prevProduct.id}"
            class="flex items-center gap-1 px-3 py-2 border rounded-lg bg-white active:bg-gray-100 min-w-0 max-w-[42%]">
           <span class="text-base leading-none shrink-0">←</span>
           <span class="text-xs text-gray-600 truncate">${truncate(prevProduct.name, 10)}</span>
         </a>`
      : `<span class="px-3 py-2 text-xs text-gray-300 border rounded-lg">← 第一件</span>`;

    const nextBtn = nextProduct
      ? `<a href="product.html?id=${nextProduct.id}"
            class="flex items-center gap-1 px-3 py-2 border rounded-lg bg-white active:bg-gray-100 min-w-0 max-w-[42%]">
           <span class="text-xs text-gray-600 truncate">${truncate(nextProduct.name, 10)}</span>
           <span class="text-base leading-none shrink-0">→</span>
         </a>`
      : `<span class="px-3 py-2 text-xs text-gray-300 border rounded-lg">最後一件 →</span>`;

    const navBar = `
      <div class="flex justify-between items-center py-3">
        ${prevBtn}
        <span class="text-xs text-gray-400 shrink-0">${idx + 1} / ${data.length}</span>
        ${nextBtn}
      </div>`;

    // images 可能是字串（逗號分隔）或陣列
    const imagesArr = Array.isArray(p.images)
      ? p.images
      : (p.images || "").split(",").map(s => s.trim()).filter(Boolean);

    const mainImg =
      p.image ||
      imagesArr[0] ||
      "https://via.placeholder.com/400";

    el.innerHTML = `

      <!-- ⭐ 頂部導覽 -->
      <div class="border-b mb-4">${navBar}</div>

      <!-- 商品主體：手機單欄、桌機雙欄 -->
      <div class="lg:grid lg:grid-cols-2 lg:gap-12">

        <!-- 圖片區 -->
        <div>
          <div class="relative">
            <img id="mainImg" src="${mainImg}"
                 class="w-full aspect-square object-cover rounded-xl sm:rounded-2xl">
            ${imagesArr.length > 1 ? `
            <button id="prevBtn"
              class="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white bg-opacity-80 rounded-full shadow flex items-center justify-center text-lg hover:bg-opacity-100 transition active:scale-95">
              ‹
            </button>
            <button id="nextBtn"
              class="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white bg-opacity-80 rounded-full shadow flex items-center justify-center text-lg hover:bg-opacity-100 transition active:scale-95">
              ›
            </button>
            <div class="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5" id="dotNav">
              ${imagesArr.map((_, i) => `<div class="dot w-1.5 h-1.5 rounded-full transition ${i === 0 ? "bg-black" : "bg-white bg-opacity-60"}"></div>`).join("")}
            </div>` : ""}
          </div>

          ${imagesArr.length > 1 ? `
          <div class="flex gap-2 mt-3 overflow-x-auto pb-1">
            ${imagesArr.map((img, i) => `
              <img src="${img}" data-index="${i}"
                   class="w-16 h-16 sm:w-20 sm:h-20 shrink-0 object-cover rounded-lg cursor-pointer thumb
                          border-2 ${i === 0 ? "border-black" : "border-transparent"} hover:border-black transition">
            `).join("")}
          </div>` : ""}
        </div>

        <!-- 商品資訊 -->
        <div class="mt-5 lg:mt-0">

          <!-- 麵包屑導覽 -->
          <div class="flex items-center gap-1 flex-wrap mb-3">
            <a href="index.html"
              class="text-xs text-gray-400 hover:text-black transition px-2 py-1 rounded-lg hover:bg-gray-100">
              🏠 首頁
            </a>
            ${p.mainCategory ? `
            <span class="text-gray-300 text-xs">›</span>
            <a href="index.html?main=${encodeURIComponent(p.mainCategory)}"
              class="text-xs text-gray-400 hover:text-black transition px-2 py-1 rounded-lg hover:bg-gray-100">
              ${p.mainCategory}
            </a>` : ""}
            ${p.category ? `
            <span class="text-gray-300 text-xs">›</span>
            <span class="text-xs text-gray-600 px-2 py-1">
              ${p.category}
            </span>` : ""}
          </div>

          <!-- 標籤 -->
          <div class="flex gap-2 mb-2 flex-wrap">
            ${p.isNew  ? `<span class="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">NEW</span>` : ""}
            ${p.isHot  ? `<span class="text-xs bg-orange-100 text-orange-500 px-2 py-0.5 rounded-full font-medium">🔥 熱賣</span>` : ""}
            ${p.isSale ? `<span class="text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded-full font-medium">特價</span>` : ""}
          </div>

          <!-- 商品名稱 -->
          <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold leading-snug text-gray-900">${p.name}</h1>

          <!-- 價格 -->
          ${p.isSale
            ? `<div class="mt-2 flex items-baseline gap-2">
                 <span class="text-2xl sm:text-3xl font-bold text-red-500">${formatPrice(p.price)}</span>
                 <span class="text-sm sm:text-base line-through text-gray-400">${formatPrice(p.originalPrice)}</span>
               </div>`
            : `<div class="mt-2">
                 <span class="text-2xl sm:text-3xl font-bold text-red-500">${formatPrice(p.price)}</span>
               </div>`
          }

          <!-- 商品資訊列 -->
          ${(p.idnumber || p.weight) ? `
          <div class="flex gap-4 mt-4 pt-4 border-t border-gray-100">
            ${p.idnumber ? `
            <div class="flex flex-col gap-0.5">
              <span class="text-xs text-gray-400 uppercase tracking-wide">商品編號</span>
              <span class="text-sm font-medium text-gray-700">#${p.idnumber}</span>
            </div>` : ""}
            ${p.idnumber && p.weight ? `<div class="w-px bg-gray-200"></div>` : ""}
            ${p.weight ? `
            <div class="flex flex-col gap-0.5">
              <span class="text-xs text-gray-400 uppercase tracking-wide">重量</span>
              <span class="text-sm font-medium text-gray-700">${p.weight} kg</span>
            </div>` : ""}
          </div>` : ""}

          <!-- 規格選擇（有 variants 才顯示）-->
          ${p.variants && p.variants.length > 0 ? `
          <div class="mt-5">
            <div class="text-sm text-gray-500 mb-2">規格</div>
            <div class="flex flex-wrap gap-2" id="variantBtns">
              ${p.variants.map(v => `
                <button onclick="selectVariant(this, '${v}')"
                  class="variant-btn px-4 py-2 border rounded-lg text-sm font-medium transition hover:border-black active:bg-gray-100">
                  ${v}
                </button>`).join("")}
            </div>
            <p id="variantHint" class="text-xs text-red-400 mt-1.5 hidden">請先選擇規格</p>
          </div>` : ""}

          <!-- 數量 -->
          <div class="flex items-center gap-4 mt-5">
            <span class="text-sm text-gray-500">數量</span>
            <div class="flex items-center border rounded-lg overflow-hidden">
              <button id="minus"
                class="w-10 h-10 text-xl flex items-center justify-center active:bg-gray-100">−</button>
              <span id="qty" class="w-10 text-center font-medium">1</span>
              <button id="plus"
                class="w-10 h-10 text-xl flex items-center justify-center active:bg-gray-100">＋</button>
            </div>
          </div>

          <!-- 加入購物車 -->
          <button id="addBtn"
            class="mt-5 w-full py-3 bg-black text-white text-base font-medium rounded-xl active:bg-gray-800 transition">
            🛒 加入購物車
          </button>

          <!-- 商品描述 -->
          <div class="mt-6 text-sm leading-relaxed">
            ${renderDescription(p.description)}
          </div>

        </div>
      </div>

      <!-- ⭐ 底部導覽 -->
      <div class="border-t mt-10">${navBar}</div>
    `;

    // 圖片導覽
    let currentIdx = 0;
    const thumbs    = document.querySelectorAll(".thumb");
    const dots      = document.querySelectorAll(".dot");
    const mainImgEl = document.getElementById("mainImg");

    function goToImg(idx) {
      currentIdx = (idx + imagesArr.length) % imagesArr.length;
      if (mainImgEl) mainImgEl.src = imagesArr[currentIdx];
      thumbs.forEach((t, i) => {
        t.classList.toggle("border-black",       i === currentIdx);
        t.classList.toggle("border-transparent", i !== currentIdx);
      });
      dots.forEach((d, i) => {
        d.className = `dot w-1.5 h-1.5 rounded-full transition ${i === currentIdx ? "bg-black" : "bg-white bg-opacity-60"}`;
      });
      thumbs[currentIdx]?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    }

    thumbs.forEach((_, i) => {
      thumbs[i].onclick = () => goToImg(i);
    });

    document.getElementById("prevBtn")?.addEventListener("click", () => goToImg(currentIdx - 1));
    document.getElementById("nextBtn")?.addEventListener("click", () => goToImg(currentIdx + 1));

    // 規格選擇
    let selectedVariant = "";
    window.selectVariant = (btn, value) => {
      selectedVariant = value;
      document.querySelectorAll(".variant-btn").forEach(b => {
        b.className = "variant-btn px-4 py-2 border rounded-lg text-sm font-medium transition hover:border-black active:bg-gray-100";
      });
      btn.className = "variant-btn px-4 py-2 border-2 border-black rounded-lg text-sm font-medium transition bg-black text-white";
      document.getElementById("variantHint")?.classList.add("hidden");
    };

    // 數量控制
    let qty = 1;
    const qtyEl = document.getElementById("qty");
    document.getElementById("plus").onclick  = () => { qty++; qtyEl.innerText = qty; };
    document.getElementById("minus").onclick = () => { if (qty > 1) qty--; qtyEl.innerText = qty; };

    // 加入購物車
    document.getElementById("addBtn").onclick = () => {
      // 有規格但未選擇
      if (p.variants && p.variants.length > 0 && !selectedVariant) {
        document.getElementById("variantHint")?.classList.remove("hidden");
        return;
      }
      const cart = JSON.parse(localStorage.getItem("cart") || "{}");
      // 規格用 id:規格 作為 key
      const cartKey = selectedVariant ? `${p.id}:${selectedVariant}` : p.id;
      cart[cartKey] = (cart[cartKey] || 0) + qty;
      localStorage.setItem("cart", JSON.stringify(cart));
      alert(selectedVariant ? `已加入購物車（${selectedVariant}）` : "已加入購物車");
      location.reload();
    };

  } catch (err) {
    console.error(err);
    el.innerHTML = "<p class='text-red-500 p-4'>載入失敗</p>";
  }
}

// 描述解析：bullet / key:value / 段落
function renderDescription(text) {
  if (!text) return "";

  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  let html = "", list = [], table = [];

  const flushList = () => {
    if (!list.length) return;
    html += `
      <ul class="space-y-2 mb-4">
        ${list.map(i => `
          <li class="flex gap-2 text-sm text-gray-700 leading-relaxed">
            <span class="text-gray-400 shrink-0 mt-0.5">•</span>
            <span>${i}</span>
          </li>`).join("")}
      </ul>`;
    list = [];
  };

  const flushTable = () => {
    if (!table.length) return;
    html += `
      <div class="overflow-x-auto mb-4 rounded-xl border border-gray-100">
        <table class="w-full text-sm">
          ${table.map(([k, v]) => `
            <tr class="border-b border-gray-100 last:border-0">
              <td class="bg-gray-50 px-3 py-2.5 w-2/5 font-medium text-gray-500 whitespace-nowrap">${k}</td>
              <td class="px-3 py-2.5 text-gray-800">${v}</td>
            </tr>`).join("")}
        </table>
      </div>`;
    table = [];
  };

  // ⭐ 固定標題關鍵字 → 強制加粗顯示
  const FIXED_HEADERS = ["商品內容跟特點", "商品內容與特點", "商品特點", "商品內容"];

  lines.forEach(line => {

    // ⭐ 固定標題：完全符合就加粗
    if (FIXED_HEADERS.some(h => line.includes(h))) {
      flushList();
      flushTable();
      html += `
        <div class="flex items-center gap-2 mt-5 mb-3">
          <span class="w-1 h-4 bg-black rounded-full shrink-0"></span>
          <h3 class="font-bold text-base text-gray-900">${line}</h3>
        </div>`;
      return;
    }

    // • 或 - 開頭 → 清單
    if (line.startsWith("•") || line.startsWith("-") || line.startsWith("‧")) {
      flushTable();
      list.push(line.replace(/^[-•‧]\s*/, ""));
      return;
    }

    // key：value 或 key:value → 規格表
    if (line.includes("：") || /^[^:]+:[^/]{1,30}$/.test(line)) {
      flushList();
      const sep = line.includes("：") ? "：" : ":";
      const i = line.indexOf(sep);
      table.push([line.slice(0, i).trim(), line.slice(i + 1).trim()]);
      return;
    }

    // 其餘 → 一般段落
    flushList();
    flushTable();
    html += `<p class="text-sm text-gray-600 mb-2 leading-relaxed">${line}</p>`;
  });

  flushList();
  flushTable();
  return html;
}

init();
