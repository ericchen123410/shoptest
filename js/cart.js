import { formatPrice } from "./utils.js";

// ── 優惠碼設定 ────────────────────────────────────────
const COUPONS = {
  "hinamecute": { type: "jprice_rate", rate: 0.3, label: "特別優惠價" },
};
let appliedCoupon = null;


const API_URL     = "https://shoptest-chi.vercel.app/api/products";

// ── 集運功能 ─────────────────────────────────────────
const ORDERS_API_CART = "https://shoptest-chi.vercel.app/api/orders-manage";
const CUSTOMER_API_CART = "https://shoptest-chi.vercel.app/api/customer";
let bundleOrders = []; // 選取的集運訂單
let selectedBundleIds = new Set();

window.toggleBundle = (checked) => {
  if (checked && appliedCoupon) {
    // hinamecute 不能使用集運
    document.getElementById("bundleCheck").checked = false;
    document.getElementById("bundleSection").classList.add("hidden");
    const hint = document.getElementById("bundleHint");
    if (hint) {
      hint.textContent = "⚠️ 使用優惠碼時不可使用集運功能";
      hint.classList.remove("hidden");
    }
    return;
  }
  const hint = document.getElementById("bundleHint");
  if (hint) hint.classList.add("hidden");
  document.getElementById("bundleSection").classList.toggle("hidden", !checked);
  if (!checked) {
    selectedBundleIds.clear();
    bundleOrders = [];
    document.getElementById("bundleOrderList").innerHTML = "";
    document.getElementById("bundleTotal").classList.add("hidden");
    sessionStorage.removeItem("bundleOrders");
  }
};

window.searchBundleOrders = async () => {
  const email = document.getElementById("bundleEmail").value.trim();
  const listEl = document.getElementById("bundleOrderList");
  if (!email) { listEl.innerHTML = '<div class="text-xs text-red-400">請輸入 Email</div>'; return; }

  listEl.innerHTML = '<div class="text-xs text-gray-400">查詢中...</div>';
  try {
    // 查客戶
    const custRes  = await fetch(CUSTOMER_API_CART + "?email=" + encodeURIComponent(email));
    const custData = await custRes.json();
    if (!custData.found) { listEl.innerHTML = '<div class="text-xs text-red-400">找不到此 Email 的客戶</div>'; return; }

    // 查訂單
    const ordRes  = await fetch(ORDERS_API_CART + "?type=customer&customerId=" + encodeURIComponent(custData.customerId) + "&email=" + encodeURIComponent(email));
    const ordData = await ordRes.json();
    const orders  = (ordData.orders || []).filter(o => o.status === "待處理" && !o.bundleId);

    if (!orders.length) { listEl.innerHTML = '<div class="text-xs text-gray-400">沒有可合併的待處理訂單</div>'; return; }

    bundleOrders = orders;
    renderBundleList();
  } catch (err) {
    listEl.innerHTML = `<div class="text-xs text-red-400">查詢失敗：${err.message}</div>`;
  }
};

function renderBundleList() {
  const listEl = document.getElementById("bundleOrderList");
  listEl.innerHTML = bundleOrders.map(o => `
    <label class="flex items-center gap-2 border rounded-lg p-2 cursor-pointer hover:bg-gray-50">
      <input type="checkbox" value="${o.pageId}" onchange="toggleBundleOrder('${o.pageId}', this.checked)"
        class="w-4 h-4 accent-black shrink-0">
      <div class="flex-1 min-w-0">
        <div class="text-xs font-medium">${o.orderId}</div>
        <div class="text-xs text-gray-400">NT$ ${Math.floor(Number(o.total)||0).toLocaleString()}</div>
      </div>
    </label>`).join("");
  updateBundleTotal();
}

window.toggleBundleOrder = (pageId, checked) => {
  if (checked) selectedBundleIds.add(pageId);
  else selectedBundleIds.delete(pageId);
  updateBundleTotal();
  // 存到 sessionStorage
  const selected = bundleOrders.filter(o => selectedBundleIds.has(o.pageId));
  sessionStorage.setItem("bundleOrders", JSON.stringify(selected));
};

function updateBundleTotal() {
  const totalEl = document.getElementById("bundleTotal");
  if (!selectedBundleIds.size) { totalEl.classList.add("hidden"); return; }

  const selected = bundleOrders.filter(o => selectedBundleIds.has(o.pageId));
  const cartSubtotal   = window._cartSubtotal || 0;
  const bundleSubtotal = selected.reduce((s, o) => s + (Number(o.total) || 0), 0);

  // 集運折扣：購物車未折扣（cartSubtotal < 3000），集運後若超過 3000 則折一次
  // 已折扣過的集運訂單（discount > 0）不再折扣
  const cartAlreadyDiscounted = cartSubtotal >= 3000; // 購物車本身已有折扣
  const undiscountedBundle    = selected.filter(o => !(o.discount > 0)).reduce((s, o) => s + (Number(o.total) || 0), 0);

  // 計算集運後新增的折扣
  let bundleDiscount = 0;
  if (!appliedCoupon) {
    if (!cartAlreadyDiscounted && (cartSubtotal + undiscountedBundle) >= 3000) {
      bundleDiscount = 200; // 合併後首次達到 3000
    }
  }

  const combinedSubtotal = cartSubtotal + bundleSubtotal;
  const combinedAfterDiscount = combinedSubtotal - (cartAlreadyDiscounted ? 0 : bundleDiscount);
  const shipping = combinedAfterDiscount >= 5000 ? 0 : 200;
  const combinedTotal = combinedAfterDiscount + shipping;

  totalEl.textContent = `合併後小計 NT$${Math.floor(combinedSubtotal).toLocaleString()}${bundleDiscount > 0 ? " 折NT$200" : ""} → 運費 ${shipping === 0 ? "免手續費 🎉" : "NT$" + shipping} → 總計 NT$${Math.floor(combinedTotal).toLocaleString()}`;
  totalEl.classList.remove("hidden");
}

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
  window._cartSubtotal = 0;

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
  const FREE_AMOUNT   = 5000;  // 免手續費門檻（台幣）
  const DISCOUNT_MIN  = 3000;  // 折扣門檻
  const DISCOUNT_AMT  = 200;   // 折扣金額

  // 滿 3000 折 200（hinamecute 不適用）
  const discount      = (!appliedCoupon && subtotal >= DISCOUNT_MIN) ? DISCOUNT_AMT : 0;
  const afterDiscount = subtotal - discount;

  window._cartSubtotal = subtotal;
  const isFreeShipping = appliedCoupon ? true : afterDiscount >= FREE_AMOUNT;
  const shipping       = isFreeShipping ? 0 : FLAT_SHIPPING;
  const grandTotal     = afterDiscount + shipping;

  const amountLeft   = FREE_AMOUNT - afterDiscount;
  const shippingHint = appliedCoupon
    ? `<div class="flex items-center gap-1.5 text-xs text-blue-500 font-medium">
         <span>✨</span><span>已套用hiname折扣碼，價格為商品總價，商品運費請找咩咩另計</span>
       </div>`
    : isFreeShipping
    ? `<div class="flex items-center gap-1.5 text-xs text-green-600 font-medium">
         <span>✅</span><span>已達 NT$5,000，免出貨手續費！</span>
       </div>`
    : `<div class="flex items-center gap-1.5 text-xs text-gray-400">
         <span>🚚</span>
         <span>再買 <span class="font-medium text-gray-600">NT$${Math.ceil(amountLeft).toLocaleString()}</span> 即可免出貨手續費</span>
       </div>`;

  el.innerHTML = `
    ${rows}

    <div class="sticky bottom-0 bg-white pt-3 pb-2 border-t mt-2 space-y-2">

      ${shippingHint}

      <!-- 小計 -->
      <div class="flex justify-between items-center text-sm text-gray-500 pt-1">
        <span>商品小計</span>
        <span id="cart-subtotal-val" data-val="${subtotal}">${formatPrice(subtotal)}</span>
      </div>

      ${!appliedCoupon && discount > 0 ? `
      <div class="flex justify-between items-center text-sm text-green-600">
        <span>🎉 滿NT$3,000折扣</span>
        <span>- NT$200</span>
      </div>` : !appliedCoupon && subtotal > 0 && subtotal < DISCOUNT_MIN ? `
      <div class="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
        <span>🎁</span>
        <span>再買 <span class="font-medium text-gray-600">NT$${(DISCOUNT_MIN - subtotal).toLocaleString()}</span> 可折 NT$200</span>
      </div>` : ""}

      <!-- 運費明細 -->
      <div class="flex justify-between items-center text-sm ${isFreeShipping ? 'text-green-600' : 'text-gray-500'}">
        <span>出貨手續費</span>
        <span>${isFreeShipping ? '免費' : formatPrice(shipping)}</span>
      </div>

      <!-- 總計 -->
      <div class="border-t pt-2 flex justify-between items-center">
        <span class="text-gray-700 font-medium">總計</span>
        <span class="text-xl sm:text-2xl font-bold">${formatPrice(grandTotal)}</span>
      </div>

      <!-- 集運選項 -->
      <div class="border rounded-xl p-3 mb-3">
        <label class="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" id="bundleCheck" onchange="toggleBundle(this.checked)"
            class="w-4 h-4 accent-black">
          <div>
            <div class="text-sm font-medium">集運合併</div>
            <div class="text-xs text-gray-400">與其他待處理訂單合併計算出貨手續費</div>
          </div>
        </label>
        <div id="bundleHint" class="hidden text-xs text-orange-500 mt-2"></div>
        <div id="bundleSection" class="hidden mt-3">
          <div class="text-xs text-gray-500 mb-2">輸入 Email 查詢可合併的訂單</div>
          <div class="flex gap-2">
            <input id="bundleEmail" type="email" placeholder="your@email.com"
              class="flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              onkeydown="if(event.key==='Enter') searchBundleOrders()">
            <button onclick="searchBundleOrders()"
              class="px-3 py-2 border rounded-xl text-sm hover:bg-gray-50 transition shrink-0">
              查詢
            </button>
          </div>
          <div id="bundleOrderList" class="mt-2 space-y-2"></div>
          <div id="bundleTotal" class="hidden mt-2 text-xs text-green-600 font-medium"></div>
        </div>
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
