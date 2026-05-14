import { formatPrice } from "./utils.js";

const API_URL = "https://shoptest-chi.vercel.app/api/products";
const el = document.getElementById("list");

async function init() {
  try {
    const res = await fetch(API_URL);
    let data = await res.json();

    console.log("全部商品：", data);

    // ⭐ 檢查 isNew 狀態
    console.log("isNew狀態：", data.map(p => p.isNew));

    // ⭐ 篩選新商品
    data = data.filter(p => p.isNew === true);

    console.log("新商品：", data);

    // ⭐ 排序（新到舊）
    data.sort((a, b) =>
      new Date(b.update || b.createdTime) -
      new Date(a.update || a.createdTime)
    );

    render(data);
  } catch (err) {
    console.error("錯誤：", err);
    el.innerHTML = `<div class="text-red-500">載入失敗</div>`;
  }
}

function render(data) {
  if (!data.length) {
    el.innerHTML = `<div class="text-gray-500">沒有新商品</div>`;
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
