import { renderCard } from "./cardUtils.js";

const API_URL = "https://shoptest-chi.vercel.app/api/products";
const el = document.getElementById("saleList");

(async () => {
  el.innerHTML = `<div style="padding:40px;text-align:center;color:#aaa">載入中...</div>`;
  try {
    const res  = await fetch(API_URL, { cache: "no-store" });
    const all  = await res.json();
    const data = all.filter(p => p.isSale === true && p.isView !== false);
    data.sort((a, b) => (a.sort || 9999) - (b.sort || 9999));
    el.innerHTML = data.length
      ? `<div class="product-grid">${data.map(renderCard).join("")}</div>`
      : `<div style="padding:60px 0;text-align:center;color:#aaa;font-size:16px">目前沒有特價商品</div>`;
  } catch(e) {
    el.innerHTML = `<div style="padding:60px 0;text-align:center;color:#aaa">載入失敗，請重新整理</div>`;
  }
})();
