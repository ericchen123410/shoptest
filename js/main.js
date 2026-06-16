import { renderCard } from "./cardUtils.js";

const API_URL  = "https://shoptest-chi.vercel.app/api/products";
const mainTabs = document.getElementById("mainTabs");
const subTabs  = document.getElementById("subTabs");
const subWrap  = document.getElementById("subTabsWrap");
const listWrap = document.getElementById("listWrap");

let allData    = [];
let activeMain = "全部";
let activeSub  = "全部";

(async () => {
  listWrap.innerHTML = `<div style="padding:60px 0;text-align:center;color:var(--gray-400);font-size:15px">載入中...</div>`;
  try {
    const res = await fetch(API_URL);
    allData = (await res.json()).filter(p => p.isView !== false);
  } catch {
    listWrap.innerHTML = `<div style="padding:60px 0;text-align:center;color:var(--gray-400)">載入失敗，請重新整理</div>`;
    return;
  }

  const urlParams = new URLSearchParams(location.search);
  const urlMain   = urlParams.get("main");
  const urlQ      = urlParams.get("q");
  if (urlQ) { location.replace("search.html?q=" + encodeURIComponent(urlQ)); return; }

  renderMainTabs();

  if (urlMain && allData.some(p => p.mainCategory === urlMain)) {
    activeMain = urlMain;
    activeSub  = "全部";
    renderSubTabs();
    renderList();
    history.replaceState(null, "", "index.html");
  } else {
    renderSubTabs();
    renderList();
  }
})();

function makeTab(label, isActive, isSub) {
  const btn = document.createElement("button");
  btn.className = "cat-chip" + (isActive ? " active" : "");
  btn.textContent = label;
  return btn;
}

function renderMainTabs() {
  const cats = ["全部", ...new Set(allData.map(p => p.mainCategory).filter(Boolean))];
  mainTabs.innerHTML = "";
  cats.forEach(cat => {
    const btn = makeTab(cat, cat === activeMain, false);
    btn.addEventListener("click", () => {
      activeMain = cat; activeSub = "全部";
      renderMainTabs(); renderSubTabs(); renderList();
    });
    mainTabs.appendChild(btn);
  });
}

function renderSubTabs() {
  if (activeMain === "全部") { subWrap.style.display = "none"; return; }
  const pool = allData.filter(p => p.mainCategory === activeMain);
  const subs = ["全部", ...new Set(pool.map(p => p.category).filter(Boolean))];
  if (subs.length <= 1) { subWrap.style.display = "none"; return; }
  subWrap.style.display = "block";
  subTabs.innerHTML = "";
  subs.forEach(cat => {
    const btn = makeTab(cat, cat === activeSub, true);
    btn.addEventListener("click", () => {
      activeSub = cat; renderSubTabs(); renderList();
    });
    subTabs.appendChild(btn);
  });
}

function renderList() {
  let data = [...allData];
  if (activeMain !== "全部") data = data.filter(p => p.mainCategory === activeMain);
  if (activeSub  !== "全部") data = data.filter(p => p.category === activeSub);

  if (activeMain === "全部") {
    // 大分類分列顯示
    const cats = [...new Set(allData.map(p => p.mainCategory).filter(Boolean))];
    let html = "";
    cats.forEach(cat => {
      const items = allData.filter(p => p.mainCategory === cat && p.isView !== false);
      if (!items.length) return;
      const show = items.slice(0, 4);
      const hasMore = items.length > 4;
      html += `<div class="section-title">${cat}</div>`;
      html += `<div class="product-grid">`;
      show.forEach(p => { html += renderCard(p); });
      if (hasMore) {
        html += `<a href="index.html?main=${encodeURIComponent(cat)}" class="product-card" style="display:flex;align-items:center;justify-content:center;min-height:120px;color:var(--gray-600);font-size:15px;font-weight:500;text-decoration:none;background:var(--gray-50)">查看全部 ${items.length} 件 →</a>`;
      }
      html += `</div>`;
    });
    listWrap.innerHTML = html || `<div style="padding:60px 0;text-align:center;color:var(--gray-400)">暫無商品</div>`;
  } else {
    if (!data.length) {
      listWrap.innerHTML = `<div style="padding:60px 0;text-align:center;color:var(--gray-400)">暫無商品</div>`;
      return;
    }
    listWrap.innerHTML = `<div class="product-grid">${data.map(renderCard).join("")}</div>`;
  }
}
