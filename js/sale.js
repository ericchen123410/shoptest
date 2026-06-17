import { renderCard } from "./cardUtils.js";

const API_URL = "https://shoptest-chi.vercel.app/api/products";
const el = document.getElementById("list");

async function init() {
  el.innerHTML = `<div style="padding:60px 0;text-align:center;color:var(--gray-400)">載入中...</div>`;
  try {
    const res  = await fetch(API_URL, { cache: "no-store" });
    let data   = await res.json();

    // isSale = true（含 API 自動判斷 saleEnd）
    data = data.filter(p => p.isSale && p.isView !== false);

    data.sort((a, b) => (a.sort || 9999) - (b.sort || 9999));

    el.innerHTML = data.length
      ? `<div class="product-grid">${data.map(renderCard).join("")}</div>`
      : `<div style="padding:60px 0;text-align:center;color:var(--gray-400)">目前沒有特價商品</div>`;
  } catch {
    el.innerHTML = `<div style="padding:60px 0;text-align:center;color:var(--gray-400)">載入失敗，請重新整理</div>`;
  }
}

init();
