import { formatPrice } from "./utils.js";

// ── 優惠碼設定 ────────────────────────────────────────
const COUPONS = {
  "hinamecute": { type: "jprice_rate", rate: 0.3, label: "特別優惠價" },
};
let appliedCoupon = null;


const API_URL     = "https://shoptest-chi.vercel.app/api/products";

function applyCoupon() {
  const code   = document.getElementById("couponInput")?.value.trim().toLowerCase();
  const status = document.getElementById("couponStatus");
  if (!code) return;
  const coupon = COUPONS[code];
  if (!coupon) {
    status.textContent = "❌ 優惠碼無效";
    status.className   = "text-xs mb-3 text-red-500";
    status.classList.remove("hidden");
    appliedCoupon = null;
    sessionStorage.removeItem("appliedCoupon");
  } else {
    appliedCoupon = coupon;
    sessionStorage.setItem("appliedCoupon", code);
    status.textContent = `✅ 已套用「${coupon.label}」`;
    status.className   = "text-xs mb-3 text-green-600";
    status.classList.remove("hidden");
  }
  init();
}

window.applyCoupon = applyCoupon;
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

  const rows = ids.map(cartKey => {
    const [id, variant] = cartKey.split(":");
    const qty = cart[cartKey];
    const p   = products.find(x => x.id === id);
    if (!p) return "";

    // 優惠碼：hinamecute → jprice * 0.3
    let unitPrice = p.price;
    if (appliedCoupon?.type === "jprice_rate" && p.jprice) {
      unitPrice = Math.round(p.jprice * appliedCoupon.rate);
    }
    const sub    = Math.round(unitPrice * qty);
    const weight = (p.weight || 0) * qty;
    subtotal    += sub;
    totalWeight += weight;

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
          ${variant ? `<div class="text-xs text-gray-500 mt-0.5">規格：${variant}</div>` : ""}
          <div class="text-red-500 text-sm mt-1 font-medium">${formatPrice(unitPrice)}${appliedCoupon && p.jprice ? `<span class="text-xs text-gray-400 line-through ml-1">${formatPrice(p.price)}</span>` : ""}</div>
          ${weightNote}

          <div class="flex items-center mt-2 border rounded-lg overflow-hidden w-fit">
            <button onclick="updateQty('${cartKey}', -1)"
              class="w-9 h-9 text-lg flex items-center justify-center active:bg-gray-100">−</button>
            <span class="w-8 text-center text-sm font-medium">${qty}</span>
            <button onclick="updateQty('${cartKey}', 1)"
              class="w-9 h-9 text-lg flex items-center justify-center active:bg-gray-100">＋</button>
          </div>
        </div>

        <div class="flex flex-col items-end gap-3 shrink-0">
          <button onclick="removeItem('${cartKey}')"
            class="text-gray-300 active:text-red-400 text-xl leading-none">✕</button>
          <div class="text-sm font-bold text-gray-800">${formatPrice(sub)}</div>
        </div>
      </div>`;
  }).join("");

  // ⭐ 運費計算邏輯
  const FLAT_SHIPPING = 200;   // 固定運費（台幣）
  const FREE_AMOUNT   = 5000;  // 免運門檻（台幣）

  const isFreeShipping = appliedCoupon ? true : subtotal >= FREE_AMOUNT;
  const shipping       = isFreeShipping ? 0 : FLAT_SHIPPING;
  const grandTotal     = subtotal + shipping;

  const amountLeft   = FREE_AMOUNT - subtotal;
  const shippingHint = isFreeShipping
    ? `<div class="flex items-center gap-1.5 text-xs text-green-600 font-medium">
         <span>✅</span><span>已達 NT$5,000，免運費！</span>
       </div>`
    : `<div class="flex items-center gap-1.5 text-xs text-gray-400">
         <span>🚚</span>
         <span>再買 <span class="font-medium text-gray-600">NT$${Math.ceil(amountLeft).toLocaleString()}</span> 即可免運費</span>
       </div>`;

  el.innerHTML = `
    ${rows}

    <div class="sticky bottom-0 bg-white pt-3 pb-2 border-t mt-2 space-y-2">

      ${shippingHint}

      <!-- 小計 -->
      <div class="flex justify-between items-center text-sm text-gray-500 pt-1">
        <span>商品小計</span>
        <span>${formatPrice(subtotal)}</span>
      </div>

      <!-- 運費明細 -->
      <div class="flex justify-between items-center text-sm ${isFreeShipping ? 'text-green-600' : 'text-gray-500'}">
        <span>運費</span>
        <span>${isFreeShipping ? '免運' : formatPrice(shipping)}</span>
      </div>

      <!-- 總計 -->
      <div class="border-t pt-2 flex justify-between items-center">
        <span class="text-gray-700 font-medium">總計</span>
        <span class="text-xl sm:text-2xl font-bold">${formatPrice(grandTotal)}</span>
      </div>

      <!-- 優惠碼 -->
      <div class="flex gap-2 mb-3">
        <input id="couponInput" type="text" placeholder="輸入優惠碼"
          class="flex-1 border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          onkeydown="if(event.key==='Enter') applyCoupon()">
        <button onclick="applyCoupon()"
          class="px-4 py-2.5 border rounded-xl text-sm hover:bg-gray-50 transition shrink-0">
          套用
        </button>
      </div>
      <div id="couponStatus" class="text-xs mb-3 hidden"></div>

      <a href="checkout.html"
         class="block w-full py-3 bg-black text-white font-medium rounded-xl active:bg-gray-800 transition text-center">
        前往結帳 →
      </a>
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
