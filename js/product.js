import { formatPrice } from "./utils.js";

const API_URL = "https://shop-project-azure.vercel.app/api/products";

const id = new URLSearchParams(location.search).get("id");
const el = document.getElementById("product");

async function init() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    // ⭐ 依照首頁相同排序（update 或 createdTime 由新到舊）
    data.sort((a, b) =>
      new Date(b.update || b.createdTime) -
      new Date(a.update || a.createdTime)
    );

    const idx = data.findIndex(x => x.id === id);
    const p = data[idx];

    // ✅ 防呆：找不到商品
    if (!p) {
      el.innerHTML = "<p class='text-red-500'>找不到商品</p>";
      return;
    }

    // ⭐ 上一個 / 下一個
    const prevProduct = idx > 0 ? data[idx - 1] : null;
    const nextProduct = idx < data.length - 1 ? data[idx + 1] : null;

    const prevBtn = prevProduct
      ? `<a href="product.html?id=${prevProduct.id}"
            class="flex items-center gap-2 px-4 py-2 border rounded hover:bg-gray-100 transition">
           ← <span class="text-sm">${prevProduct.name}</span>
         </a>`
      : `<span class="px-4 py-2 text-gray-300 border rounded cursor-not-allowed">← 已是第一件</span>`;

    const nextBtn = nextProduct
      ? `<a href="product.html?id=${nextProduct.id}"
            class="flex items-center gap-2 px-4 py-2 border rounded hover:bg-gray-100 transition">
           <span class="text-sm">${nextProduct.name}</span> →
         </a>`
      : `<span class="px-4 py-2 text-gray-300 border rounded cursor-not-allowed">已是最後一件 →</span>`;

    // ✅ 防呆：圖片安全寫法
    const mainImg =
      p.image ||
      (p.images && p.images[0]) ||
      "https://via.placeholder.com/400";

    el.innerHTML = `
      <div class="grid md:grid-cols-2 gap-6">

        <!-- 圖片 -->
        <div>
          <img id="mainImg" src="${mainImg}" class="w-full aspect-square object-cover">

          <div class="flex gap-2 mt-2">
            ${(p.images || []).map(img => `
              <img src="${img}" class="w-16 aspect-square object-cover cursor-pointer thumb">
            `).join("")}
          </div>
        </div>

        <!-- 商品資訊 -->
        <div>
          <h1 class="text-2xl font-bold">${p.name}</h1>

          ${
            p.isSale
              ? `<p class="text-red-500 mt-2 text-xl">
                   ${formatPrice(p.price)}
                   <span class="line-through text-gray-400 text-sm">
                     ${formatPrice(p.originalPrice)}
                   </span>
                 </p>`
              : `<p class="text-red-500 mt-2 text-xl">
                   ${formatPrice(p.price)}
                 </p>`
          }

          <!-- 數量 -->
          <div class="flex items-center gap-3 mt-4">
            <button id="minus" class="px-3 border">-</button>
            <span id="qty">1</span>
            <button id="plus" class="px-3 border">+</button>
          </div>

          <button id="addBtn"
            class="mt-4 px-4 py-2 bg-black text-white">
            加入購物車
          </button>

          <!-- 描述 -->
          <div class="mt-6">
            ${renderDescriptionAdvanced(p.description)}
          </div>
        </div>

      </div>

      <!-- ⭐ 上一個 / 下一個 導覽列 -->
      <div class="flex justify-between items-center mt-10 pt-6 border-t">
        ${prevBtn}
        <span class="text-sm text-gray-400">${idx + 1} / ${data.length}</span>
        ${nextBtn}
      </div>
    `;

    // ✅ 切換圖片
    document.querySelectorAll(".thumb").forEach(img => {
      img.onclick = () =>
        document.getElementById("mainImg").src = img.src;
    });

    // ✅ 數量控制
    let qty = 1;
    const qtyEl = document.getElementById("qty");

    document.getElementById("plus").onclick = () => {
      qty++;
      qtyEl.innerText = qty;
    };

    document.getElementById("minus").onclick = () => {
      if (qty > 1) qty--;
      qtyEl.innerText = qty;
    };

    // ✅ 加入購物車
    document.getElementById("addBtn").onclick = () => {
      const cart = JSON.parse(localStorage.getItem("cart") || "{}");
      cart[p.id] = (cart[p.id] || 0) + qty;
      localStorage.setItem("cart", JSON.stringify(cart));

      alert("已加入購物車");
      location.reload();
    };

  } catch (err) {
    console.error(err);
    el.innerHTML = "<p class='text-red-500'>載入失敗</p>";
  }
}

//
// ⭐ 描述解析（保留你原功能）
//
function renderDescriptionAdvanced(text) {
  if (!text) return "";

  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  let html = "";
  let list = [];
  let table = [];

  const flushList = () => {
    if (list.length) {
      html += `
        <ul class="list-disc pl-5 space-y-1 text-gray-700 mb-4">
          ${list.map(i => `<li>✔ ${i}</li>`).join("")}
        </ul>
      `;
      list = [];
    }
  };

  const flushTable = () => {
    if (table.length) {
      html += `
        <div class="overflow-x-auto mb-4">
          <table class="w-full border text-sm">
            ${table.map(([k, v]) => `
              <tr class="border">
                <td class="bg-gray-100 p-2 w-1/3 font-medium">${k}</td>
                <td class="p-2">${v}</td>
              </tr>
            `).join("")}
          </table>
        </div>
      `;
      table = [];
    }
  };

  lines.forEach(line => {

    if (line.startsWith("•") || line.startsWith("-")) {
      flushTable();
      list.push(line.replace(/^[-•]\s*/, ""));
      return;
    }

    if (line.includes("：") || line.includes(":")) {
      flushList();
      const [k, v] = line.split(/[:：]/);
      table.push([k.trim(), v.trim()]);
      return;
    }

    flushList();
    flushTable();

    if (line.length < 20) {
      html += `<h3 class="font-bold text-lg mt-4 mb-2">${line}</h3>`;
    } else {
      html += `<p class="text-gray-700 mb-2 leading-relaxed">${line}</p>`;
    }

  });

  flushList();
  flushTable();

  return html;
}

init();
