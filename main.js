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
    const cartEl2 = document.getElementById("cartBody") || el;
    cartEl2.innerHTML = `
      <div style="padding:80px 20px;text-align:center;color:var(--gray-400)">
        <div style="font-size:60px;margin-bottom:16px">🛒</div>
        <div style="font-size:18px;font-weight:500;margin-bottom:16px">購物車是空的</div>
        <a href="index.html" class="btn-primary" style="display:inline-block;text-decoration:none;padding:14px 32px;width:auto">繼續逛逛</a>
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
      <div style="display:flex;gap:12px;padding:16px;border-bottom:1px solid var(--gray-200);background:var(--white)">
        <img src="${img}" style="width:80px;height:80px;object-fit:cover;border-radius:var(--radius);flex-shrink:0;background:var(--gray-100)">
        <div style="flex:1;min-width:0">
          <div style="font-size:15px;font-weight:600;line-height:1.4;margin-bottom:4px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${p.name}</div>
          ${variant ? `<div style="font-size:13px;color:var(--gray-400);margin-bottom:4px">規格：${variant}</div>` : ""}
          <div style="font-size:16px;font-weight:700;margin-bottom:8px">${formatPrice(unitPrice)}${appliedCoupon && p.jprice ? `<span style="font-size:12px;color:var(--gray-400);text-decoration:line-through;margin-left:6px">${formatPrice(p.price)}</span>` : ""}</div>
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div style="display:flex;align-items:center;border:1.5px solid var(--gray-200);border-radius:var(--radius-sm);overflow:hidden">
              <button onclick="updateQty('${cartKey}',-1)" style="width:36px;height:36px;background:var(--gray-50);border:none;font-size:20px;cursor:pointer">−</button>
              <span style="width:40px;height:36px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:600;border-left:1px solid var(--gray-200);border-right:1px solid var(--gray-200)">${qty}</span>
              <button onclick="updateQty('${cartKey}',1)"  style="width:36px;height:36px;background:var(--gray-50);border:none;font-size:20px;cursor:pointer">＋</button>
            </div>
            <div style="display:flex;align-items:center;gap:12px">
              <span style="font-size:16px;font-weight:700">${formatPrice(sub)}</span>
              <button onclick="removeItem('${cartKey}')" style="background:none;border:none;cursor:pointer;color:var(--gray-400);font-size:20px;padding:4px">✕</button>
            </div>
          </div>
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

  const cartEl = document.getElementById("cartBody") || el;
  cartEl.innerHTML = `
    <div style="background:var(--white)">${rows}</div>

    <div style="margin:12px;background:var(--white);border-radius:var(--radius-lg);padding:16px">
      ${shippingHint.replace(/class="[^"]*"/g, 'style="font-size:13px;display:flex;align-items:center;gap:6px;margin-bottom:12px"')}
      <div style="display:flex;justify-content:space-between;font-size:14px;color:var(--gray-600);padding:6px 0">
        <span>商品小計</span>
        <span id="cart-subtotal-val" data-val="${subtotal}">${formatPrice(subtotal)}</span>
      </div>
      ${!appliedCoupon && discount > 0 ? `
      <div style="display:flex;justify-content:space-between;font-size:14px;color:var(--green);padding:6px 0">
        <span>🎉 滿NT$3,000折扣</span><span>- NT$200</span>
      </div>` : !appliedCoupon && subtotal > 0 && subtotal < DISCOUNT_MIN ? `
      <div style="font-size:13px;color:var(--gray-400);padding:4px 0">
        再買 <strong>NT$${(DISCOUNT_MIN - subtotal).toLocaleString()}</strong> 可折 NT$200
      </div>` : ""}
      <div style="display:flex;justify-content:space-between;font-size:14px;color:${isFreeShipping?'var(--green)':'var(--gray-600)'};padding:6px 0">
        <span>出貨手續費</span><span>${isFreeShipping ? "免費" : formatPrice(shipping)}</span>
      </div>
      <div style="border-top:1px solid var(--gray-200);margin-top:8px;padding-top:12px;display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:16px;font-weight:600">總計</span>
        <span style="font-size:26px;font-weight:700">${formatPrice(grandTotal)}</span>
      </div>
    </div>

    <!-- 集運 -->
    <div style="margin:0 12px 12px;background:var(--white);border-radius:var(--radius-lg);padding:14px">
      <label style="display:flex;align-items:center;gap:12px;cursor:pointer">
        <input type="checkbox" id="bundleCheck" onchange="toggleBundle(this.checked)" style="width:20px;height:20px;accent-color:var(--black)">
        <div>
          <div style="font-size:15px;font-weight:600">集運合併</div>
          <div style="font-size:13px;color:var(--gray-400)">與其他訂單合併計算出貨手續費</div>
        </div>
      </label>
      <div id="bundleHint" style="display:none;font-size:13px;color:orange;margin-top:8px"></div>
      <div id="bundleSection" style="display:none;margin-top:12px">
        <div style="display:flex;gap:8px">
          <input id="bundleEmail" type="email" placeholder="輸入 Email 查詢訂單"
            style="flex:1;padding:10px 12px;font-size:15px"
            onkeydown="if(event.key==='Enter') searchBundleOrders()">
          <button onclick="searchBundleOrders()" class="btn-secondary" style="width:auto;padding:10px 16px;white-space:nowrap">查詢</button>
        </div>
        <div id="bundleOrderList" style="margin-top:8px"></div>
        <div id="bundleTotal" style="display:none;margin-top:8px;font-size:13px;color:var(--green);font-weight:600"></div>
      </div>
    </div>

    <!-- 優惠碼 -->
    <div style="margin:0 12px 12px;background:var(--white);border-radius:var(--radius-lg);padding:14px">
      <div style="display:flex;gap:8px">
        <input id="couponInput" type="text" placeholder="輸入優惠碼"
          style="flex:1;padding:10px 12px;font-size:15px"
          onkeydown="if(event.key==='Enter') applyCoupon()">
        <button onclick="applyCoupon()" class="btn-secondary" style="width:auto;padding:10px 16px">套用</button>
      </div>
      <div id="couponStatus" style="display:none;font-size:13px;margin-top:8px"></div>
    </div>

    <div style="padding:0 12px 12px">
      <a href="checkout.html" class="btn-primary" style="display:block;text-align:center;text-decoration:none;padding:18px;font-size:17px">
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
