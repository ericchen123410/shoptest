import { formatPrice } from "./utils.js";

// 前往結帳（先詢問是否合併客製化訂單）
window.goToCheckout = function() {
  const email = localStorage.getItem("lastEmail") || "";
  location.href = "merge-checkout.html?from=cart" + (email ? "&email=" + encodeURIComponent(email) : "");
};

const API_URL     = "https://shop-project-azure.vercel.app/api/products";
const el          = document.getElementById("cart");


async function init() {
  const cart = JSON.parse(localStorage.getItem("cart") || "{}");
  const ids  = Object.keys(cart);

  if (!ids.length) {
    el.innerHTML = `
      <div class="flex flex-col items-center justify-center py-20 text-gray-400">
        <div class="text-5xl mb-4">🛒</div>
        <div class="text-base">購物車是空的</div>
        <a href="index.html" class="mt-4 text-sm text-black underline">繼續逛逛</a>
      </div>`;
    return;
  }

  const res      = await fetch(API_URL);
  const products = await res.json();

  let subtotal   = 0;
  let totalWeight = 0;

  const rows = ids.map(id => {
    const qty = cart[id];
    const p   = products.find(x => x.id === id);
    if (!p) return "";

    const sub    = p.price * qty;
    const weight = (p.weight || 0) * qty;
    subtotal    += sub;
    totalWeight += weight;

    // 沒有填重量的商品顯示提示
    const weightNote = !p.weight
      ? `<div class="text-xs text-orange-400 mt-0.5">⚠️ 未設定重量</div>`
      : `<div class="text-xs text-gray-400 mt-0.5">${p.weight} kg／件</div>`;

    const imagesArr = Array.isArray(p.images) ? p.images : (p.images||"").split(",").map(s=>s.trim()).filter(Boolean);
    const img = p.image || imagesArr[0] || "https://via.placeholder.com/80";

    return `
      <div class="flex items-center gap-3 py-4 border-b">
        <img src="${img}" class="w-20 h-20 sm:w-24 sm:h-24 shrink-0 object-cover rounded-xl">

        <div class="flex-1 min-w-0">
          <div class="text-sm sm:text-base font-semibold leading-snug line-clamp-2 text-gray-800">${p.name}</div>
          <div class="text-red-500 text-sm mt-1 font-medium">${formatPrice(p.price)}</div>
          ${weightNote}

          <div class="flex items-center mt-2 border rounded-lg overflow-hidden w-fit">
            <button onclick="updateQty('${id}', -1)"
              class="w-9 h-9 text-lg flex items-center justify-center active:bg-gray-100">−</button>
            <span class="w-8 text-center text-sm font-medium">${qty}</span>
            <button onclick="updateQty('${id}', 1)"
              class="w-9 h-9 text-lg flex items-center justify-center active:bg-gray-100">＋</button>
          </div>
        </div>

        <div class="flex flex-col items-end gap-3 shrink-0">
          <button onclick="removeItem('${id}')"
            class="text-gray-300 active:text-red-400 text-xl leading-none">✕</button>
          <div class="text-sm font-bold text-gray-800">${formatPrice(sub)}</div>
        </div>
      </div>`;
  }).join("");

  // ⭐ 運費計算邏輯
  const RATE      = 220;  // 每公斤運費（台幣）
  const SURCHARGE = 150;  // 未滿 10kg 附加費
  const FREE_KG   = 10;   // 免附加費門檻（kg）

  const baseShipping = Math.ceil(totalWeight * RATE);
  const needSurcharge = totalWeight < FREE_KG;  // 未滿 10kg → 要加附加費
  const shipping      = baseShipping + (needSurcharge ? SURCHARGE : 0);
  const grandTotal    = subtotal + shipping;

  const weightStr = totalWeight % 1 === 0
    ? `${totalWeight} kg`
    : `${totalWeight.toFixed(2)} kg`;


  const weightLeft   = FREE_KG - totalWeight;
  const shippingHint = !needSurcharge
    ? `<div class="flex items-center gap-1.5 text-xs text-green-600 font-medium">
         <span>✅</span><span>已達 ${FREE_KG}kg，免附加費！</span>
       </div>`
    : `<div class="flex items-center gap-1.5 text-xs text-gray-400">
         <span>📦</span>
         <span>未滿 ${FREE_KG}kg，再加 <span class="font-medium text-gray-600">${weightLeft.toFixed(2).replace(/\.?0+$/, "")} kg</span> 可省 NT$${SURCHARGE}</span>
       </div>`;

  el.innerHTML = `
    ${rows}

    <div class="sticky bottom-0 bg-white pt-3 pb-2 border-t mt-2 space-y-2">

      <!-- 總重 -->
      <div class="flex items-center justify-between text-sm px-0.5">
        <div class="flex items-center gap-1.5 text-gray-500">
          <span>⚖️</span>
          <span>商品總重</span>
        </div>
        <span class="font-medium text-gray-700">${weightStr}</span>
      </div>

      ${shippingHint}

      <!-- 小計 -->
      <div class="flex justify-between items-center text-sm text-gray-500 pt-1">
        <span>商品小計</span>
        <span>${formatPrice(subtotal)}</span>
      </div>

      <!-- 運費明細 -->
      <div class="flex justify-between items-center text-sm text-gray-500">
        <span>運費（${weightStr} × NT$${RATE}）</span>
        <span>${formatPrice(baseShipping)}</span>
      </div>

      ${needSurcharge ? `
      <div class="flex justify-between items-center text-sm text-orange-500">
        <span>未滿 ${FREE_KG}kg 附加費</span>
        <span>+ ${formatPrice(SURCHARGE)}</span>
      </div>` : ""}

      <!-- 總計 -->
      <div class="border-t pt-2 flex justify-between items-center">
        <span class="text-gray-700 font-medium">總計</span>
        <span class="text-xl sm:text-2xl font-bold">${formatPrice(grandTotal)}</span>
      </div>

      <button onclick="goToCheckout()"
        class="w-full py-3 bg-black text-white font-medium rounded-xl active:bg-gray-800 transition">
        前往結帳 →
      </button>
    </div>`;
}

window.updateQty = (id, change) => {
  const cart = JSON.parse(localStorage.getItem("cart") || "{}");
  cart[id] = (cart[id] || 0) + change;
  if (cart[id] <= 0) delete cart[id];
  localStorage.setItem("cart", JSON.stringify(cart));
  init();
};

window.removeItem = (id) => {
  const cart = JSON.parse(localStorage.getItem("cart") || "{}");
  delete cart[id];
  localStorage.setItem("cart", JSON.stringify(cart));
  init();
};

init();
