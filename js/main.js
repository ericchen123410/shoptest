import { renderCard } from "./cardUtils.js";

const API_URL = "https://shop-project-azure.vercel.app/api/products";
const el = document.getElementById("list");
const tabsEl = document.getElementById("tabs");

let allData = [];
let activeCategory = "全部";

async function init() {
  el.innerHTML = `<div class="col-span-2 text-center text-gray-400 py-10">載入中...</div>`;

  const res = await fetch(API_URL);
  allData = await res.json();

  allData.sort((a, b) =>
    new Date(b.update || b.createdTime) -
    new Date(a.update || a.createdTime)
  );

  renderTabs();
  renderList();
}

function renderTabs() {
  // 動態抓取所有分類（有填才算）
  const categories = ["全部", ...new Set(
    allData.map(p => p.category).filter(Boolean)
  )];

  tabsEl.innerHTML = categories.map(cat => `
    <button
      onclick="setCategory('${cat}')"
      data-cat="${cat}"
      class="shrink-0 px-4 py-1.5 rounded-full text-sm border transition
             ${cat === activeCategory
               ? "bg-black text-white border-black"
               : "bg-white text-gray-600 border-gray-300 active:bg-gray-100"
             }">
      ${cat}
    </button>
  `).join("");
}

function renderList() {
  const filtered = activeCategory === "全部"
    ? allData
    : allData.filter(p => p.category === activeCategory);

  el.innerHTML = filtered.length
    ? filtered.map(renderCard).join("")
    : `<div class="col-span-2 text-center text-gray-400 py-10">此分類沒有商品</div>`;
}

window.setCategory = (cat) => {
  activeCategory = cat;

  // 更新 Tab 樣式
  document.querySelectorAll("[data-cat]").forEach(btn => {
    const isActive = btn.dataset.cat === cat;
    btn.className = `shrink-0 px-4 py-1.5 rounded-full text-sm border transition ${
      isActive
        ? "bg-black text-white border-black"
        : "bg-white text-gray-600 border-gray-300 active:bg-gray-100"
    }`;
  });

  renderList();
};

init();
