import { formatPrice } from "./utils.js";

const API_URL = "https://shoptest-chi.vercel.app/api/products";

const id = new URLSearchParams(location.search).get("id");
const el = document.getElementById("product");

async function init() {
  try {
    const res = await fetch(API_URL);
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
          <img id="mainImg" src="${mainImg}"
               class="w-full aspect-square object-cover rounded-xl sm:rounded-2xl">

          ${imagesArr.length > 0 ? `
          <div class="flex gap-2 mt-3 overflow-x-auto pb-1">
            ${imagesArr.map(img => `
              <img src="${img}"
                   class="w-16 h-16 sm:w-20 sm:h-20 shrink-0 object-cover rounded-lg cursor-pointer thumb
                          border-2 border-transparent hover:border-black transition">
            `).join("")}
          </div>` : ""}
        </div>

        <!-- 商品資訊 -->
        <div class="mt-5 lg:mt-0">

          <!-- 分類麵包屑 -->
          ${(p.mainCategory || p.category) ? `
          <div class="text-xs text-gray-400 mb-2 flex items-center gap-1">
            ${p.mainCategory ? `<span>${p.mainCategory}</span>` : ""}
            ${p.mainCategory && p.category ? `<span>›</span>` : ""}
            ${p.category ? `<span>${p.category}</span>` : ""}
          </div>` : ""}

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

    // 縮圖切換
    document.querySelectorAll(".thumb").forEach(img => {
      img.onclick = () => {
        document.getElementById("mainImg").src = img.src;
        document.querySelectorAll(".thumb").forEach(t => t.classList.remove("border-black"));
        img.classList.add("border-black");
      };
    });

    // 數量控制
    let qty = 1;
    const qtyEl = document.getElementById("qty");
    document.getElementById("plus").onclick  = () => { qty++; qtyEl.innerText = qty; };
    document.getElementById("minus").onclick = () => { if (qty > 1) qty--; qtyEl.innerText = qty; };

    // 加入購物車
    document.getElementById("addBtn").onclick = () => {
      const cart = JSON.parse(localStorage.getItem("cart") || "{}");
      cart[p.id] = (cart[p.id] || 0) + qty;
      localStorage.setItem("cart", JSON.stringify(cart));
      alert("已加入購物車");
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
