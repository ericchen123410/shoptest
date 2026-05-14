import { renderCard } from "./cardUtils.js";

const API_URL = "https://shop-project-azure.vercel.app/api/products";
const el = document.getElementById("list");

async function init() {
  const res = await fetch(API_URL);
  let data = await res.json();

  data = data.filter(p => p.isSale);
  data.sort((a, b) =>
    new Date(b.update || b.createdTime) - new Date(a.update || a.createdTime)
  );

  el.innerHTML = data.length
    ? data.map(renderCard).join("")
    : `<div class="col-span-2 text-center text-gray-400 py-10">沒有特價商品</div>`;
}

init();
