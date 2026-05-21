import { renderCard } from "./cardUtils.js";

const API_URL = "https://shop-project-azure.vercel.app/api/products";
const el = document.getElementById("list");

async function init() {
  try {
    const res = await fetch(API_URL);
    let data = await res.json();

    data = data.filter(p => p.isNew === true);
    // ⭐ 固定「日本好市多」在第一位
    const mainOrder = ["日本好市多"];
    data.forEach(p => {
      if (p.mainCategory && !mainOrder.includes(p.mainCategory))
        mainOrder.push(p.mainCategory);
    });
    data.sort((a, b) => {
      const mi = mainOrder.indexOf(a.mainCategory ?? "");
      const mj = mainOrder.indexOf(b.mainCategory ?? "");
      if (mi !== mj) return mi - mj;
      const sa = a.sort || 9999;
      const sb = b.sort || 9999;
      if (sa !== sb) return sa - sb;
      return new Date(b.update || b.createdTime) - new Date(a.update || a.createdTime);
    });

    el.innerHTML = data.length
      ? data.map(renderCard).join("")
      : `<div class="col-span-2 text-center text-gray-400 py-10">沒有新商品</div>`;
  } catch (err) {
    el.innerHTML = `<div class="col-span-2 text-center text-red-400 py-10">載入失敗</div>`;
  }
}

init();
