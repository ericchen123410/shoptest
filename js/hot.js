import { formatPrice } from "./utils.js";

const API_URL = "https://shoptest-chi.vercel.app/api/products";
const el = document.getElementById("list");

async function init() {
  const res = await fetch(API_URL);
  let data = await res.json();

  console.log("API資料：", data); // ⭐ 先確認資料

  // ⭐ 只保留 isHot
  data = data.filter(p => p.isHot);

  console.log("Hot商品：", data); // ⭐ 看這裡是不是空

  // ⭐ 排序
  data.sort((a, b) =>
    new Date(b.update || b.createdTime) -
    new Date(a.update || a.createdTime)
  );

  render(data);
}

function render(data) {
  if (!data.length) {
    el.innerHTML = `<div class="text-gray-500">沒有熱賣商品</div>`;
    return;
  }

  el.innerHTML = data.map(p => {
    const img =
      p.image ||
      p.images?.[0] ||
      "https://via.placeholder.com/400";

    return `
      <a href="product.html?id=${p.id}" class="block border p-2 bg-white">
        <img src="${img}" class="w-full aspect-square object-cover">

        <div class="mt-2 font-bold">${p.name}</div>

        <div class="text-red-500">
          ${formatPrice(p.price)}
          ${
            p.isSale
              ? `<span class="line-through text-gray-400 text-sm">
                   ${formatPrice(p.originalPrice)}
                 </span>`
              : ""
          }
        </div>
      </a>
    `;
  }).join("");
}

init();
