import { formatPrice } from "./utils.js";

const API_URL = "https://shop-project-azure.vercel.app/api/products";

const id = new URLSearchParams(location.search).get("id");
const el = document.getElementById("product");

async function init() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    // 與首頁相同排序
    data.sort((a, b) =>
      new Date(b.update || b.createdTime) -
      new Date(a.update || a.createdTime)
    );

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

    const mainImg =
      p.image ||
      (p.images && p.images[0]) ||
      "https://via.placeholder.com/400";

    el.innerHTML = `

      <!-- ⭐ 頂部導覽 -->
      <div class="border-b mb-4">${navBar}</div>

      <!-- 商品主體：手機單欄、桌機雙欄 -->
      <div class="md:grid md:grid-cols-2 md:gap-8">

        <!-- 圖片區 -->
        <div>
          <img id="mainImg" src="${mainImg}"
               class="w-full aspect-square object-cover rounded-xl">

          ${(p.images || []).length > 0 ? `
          <div class="flex gap-2 mt-3 overflow-x-auto pb-1">
            ${(p.images || []).map(img => `
              <img src="${img}"
                   class="w-16 h-16 shrink-0 object-cover rounded-lg cursor-pointer thumb
                          border-2 border-transparent hover:border-black transition">
            `).join("")}
          </div>` : ""}
        </div>

        <!-- 商品資訊 -->
        <div class="mt-5 md:mt-0">

          <!-- 標籤 -->
          <div class="flex gap-2 mb-2 flex-wrap">
            ${p.isNew  ? `<span class="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">NEW</span>` : ""}
            ${p.isHot  ? `<span class="text-xs bg-orange-100 text-orange-500 px-2 py-0.5 rounded-full font-medium">🔥 熱賣</span>` : ""}
            ${p.isSale ? `<span class="text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded-full font-medium">特價</span>` : ""}
          </div>

          <!-- 商品名稱 -->
          <h1 class="text-xl font-bold leading-snug text-gray-900">${p.name}</h1>

          <!-- 價格 -->
          ${p.isSale
            ? `<div class="mt-2 flex items-baseline gap-2">
                 <span class="text-2xl font-bold text-red-500">${formatPrice(p.price)}</span>
                 <span class="text-sm line-through text-gray-400">${formatPrice(p.originalPrice)}</span>
               </div>`
            : `<div class="mt-2">
                 <span class="text-2xl font-bold text-red-500">${formatPrice(p.price)}</span>
               </div>`
          }

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
    html += `<ul class="space-y-1 text-gray-700 mb-4">
      ${list.map(i => `<li class="flex gap-2"><span class="text-green-500 shrink-0">✔</span><span>${i}</span></li>`).join("")}
    </ul>`;
    list = [];
  };

  const flushTable = () => {
    if (!table.length) return;
    html += `<div class="overflow-x-auto mb-4 rounded-xl border">
      <table class="w-full text-sm">
        ${table.map(([k, v]) => `
          <tr class="border-b last:border-0">
            <td class="bg-gray-50 p-2.5 w-1/3 font-medium text-gray-600">${k}</td>
            <td class="p-2.5 text-gray-800">${v}</td>
          </tr>`).join("")}
      </table>
    </div>`;
    table = [];
  };

  lines.forEach(line => {
    if (line.startsWith("•") || line.startsWith("-")) {
      flushTable();
      list.push(line.replace(/^[-•]\s*/, ""));
      return;
    }
    if (line.includes("：") || line.includes(":")) {
      flushList();
      const sep = line.includes("：") ? "：" : ":";
      const i = line.indexOf(sep);
      table.push([line.slice(0, i).trim(), line.slice(i + 1).trim()]);
      return;
    }
    flushList();
    flushTable();
    if (line.length < 20) {
      html += `<h3 class="font-bold text-base mt-5 mb-2 text-gray-900">${line}</h3>`;
    } else {
      html += `<p class="text-gray-600 mb-2 leading-relaxed">${line}</p>`;
    }
  });

  flushList();
  flushTable();
  return html;
}

init();
