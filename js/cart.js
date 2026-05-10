import { formatPrice } from "./utils.js";

const API_URL = "/api/products";
const el = document.getElementById("cart");

async function init() {
  try {
    const cart = JSON.parse(localStorage.getItem("cart") || "{}");

    const res = await fetch(API_URL);
    const products = await res.json();

    let total = 0;

    const html = Object.entries(cart).map(([id, qty]) => {
      const p = products.find(x => x.id === id);

      if (!p) return "";

      const sub = p.price * qty;
      total += sub;

      const img =
        p.image ||
        p.images?.[0] ||
        "https://via.placeholder.com/80";

      return `
        <div class="flex items-center gap-4 border-b py-3">

          <img src="${img}"
            class="w-16 aspect-square object-cover rounded">

          <div class="flex-1">
            <div class="font-bold">${p.name}</div>

            <div class="text-sm text-gray-500">
              ${formatPrice(p.price)}
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              onclick="updateQty('${id}', -1)"
              class="px-2 border">
              -
            </button>

            <span>${qty}</span>

            <button
              onclick="updateQty('${id}', 1)"
              class="px-2 border">
              +
            </button>
          </div>

          <div class="w-24 text-right">
            ${formatPrice(sub)}
          </div>

          <button
            onclick="removeItem('${id}')"
            class="text-red-500">
            ✕
          </button>

        </div>
      `;
    }).join("");

    el.innerHTML = `
      ${html || "<div>購物車是空的</div>"}

      <div class="text-right mt-4 font-bold text-xl">
        Total: ${formatPrice(total)}
      </div>
    `;

  } catch (err) {
    console.error(err);

    el.innerHTML = `
      <div class="text-red-500">
        購物車載入失敗
      </div>
    `;
  }
}

window.updateQty = (id, change) => {
  const cart = JSON.parse(localStorage.getItem("cart") || "{}");

  cart[id] = (cart[id] || 0) + change;

  if (cart[id] <= 0) {
    delete cart[id];
  }

  localStorage.setItem("cart", JSON.stringify(cart));

  init();
};

window.removeItem = (id) => {
  const cart = JSON.parse(localStorage.getItem("cart") || "{}");

  delete cart[id];

  localStorage.setItem("cart", JSON.stringify(cart));

  init();
};

init();        </div>

        <div class="w-24 text-right">${formatPrice(sub)}</div>

        <button onclick="removeItem('${id}')" class="text-red-500">✕</button>

      </div>
    `;
  }).join("");

  el.innerHTML = `
    ${html || "購物車是空a的"}
    <div class="text-right mt-4 font-bold text-xl">
      Total: ${formatPrice(total)}
    </div>
  `;
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
