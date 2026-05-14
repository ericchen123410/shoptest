import { formatPrice } from "./utils.js";

const API_URL = "https://shop-project-azure.vercel.app/api/products";
const el = document.getElementById("cart");

async function init() {
  const cart = JSON.parse(localStorage.getItem("cart") || "{}");
  const ids = Object.keys(cart);

  if (!ids.length) {
    el.innerHTML = `
      <div class="flex flex-col items-center justify-center py-20 text-gray-400">
        <div class="text-5xl mb-4">🛒</div>
        <div class="text-base">購物車是空的</div>
        <a href="index.html" class="mt-4 text-sm text-black underline">繼續逛逛</a>
      </div>`;
    return;
  }

  const res = await fetch(API_URL);
  const products = await res.json();

  let total = 0;

  const rows = ids.map(id => {
    const qty = cart[id];
    const p = products.find(x => x.id === id);
    if (!p) return "";

    const sub = p.price * qty;
    total += sub;
    const img = p.image || p.images?.[0] || "https://via.placeholder.com/80";

    return `
      <div class="flex items-center gap-3 py-4 border-b">
        <img src="${img}" class="w-20 h-20 shrink-0 object-cover rounded-xl">

        <div class="flex-1 min-w-0">
          <div class="text-sm font-semibold leading-snug line-clamp-2 text-gray-800">${p.name}</div>
          <div class="text-red-500 text-sm mt-1 font-medium">${formatPrice(p.price)}</div>

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

  el.innerHTML = `
    ${rows}
    <div class="sticky bottom-0 bg-white pt-4 pb-2 border-t mt-2">
      <div class="flex justify-between items-center mb-3">
        <span class="text-gray-500 text-sm">合計</span>
        <span class="text-xl font-bold">${formatPrice(total)}</span>
      </div>
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
